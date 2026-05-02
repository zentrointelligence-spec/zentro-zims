"""Excel file validation + flexible column mapping + row normalisation.

Designed to be tolerant of spreadsheets produced by humans: any casing, any
spacing / punctuation in headers, mixed date formats, currency symbols, etc.
"""
from __future__ import annotations

import io
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation
from typing import Any

import pandas as pd

from app.core.config import settings

# ---------------------------------------------------------------------------
# File validation
# ---------------------------------------------------------------------------

XLSX_CONTENT_TYPES: set[str] = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream",  # some browsers send this for xlsx
    # Fall back when the client sends no content-type at all
    "",
}


class ExcelValidationError(Exception):
    """Raised for any pre-parse validation failure (size, type, corrupt file)."""


def validate_file(filename: str, content_type: str | None, size: int) -> None:
    """Validate basics before we bother reading the file."""
    name = (filename or "").lower().strip()
    if not name.endswith(".xlsx"):
        raise ExcelValidationError(
            "Only .xlsx files are supported. Please re-export your sheet as XLSX."
        )

    ct = (content_type or "").lower().strip().split(";")[0]
    if ct not in XLSX_CONTENT_TYPES:
        raise ExcelValidationError(
            f"Invalid content-type '{content_type}'. Expected an .xlsx file."
        )

    max_bytes = settings.max_import_file_size_mb * 1024 * 1024
    if size > max_bytes:
        raise ExcelValidationError(
            f"File too large ({size / 1_048_576:.1f} MB). "
            f"Limit is {settings.max_import_file_size_mb} MB."
        )


# ---------------------------------------------------------------------------
# Column mapping
# ---------------------------------------------------------------------------

# Every canonical key → list of accepted header aliases (normalised: lower+a-z0-9)
_COLUMN_ALIASES: dict[str, list[str]] = {
    "customer_name": [
        "customername", "customer", "name", "clientname", "client",
        "fullname", "holdername", "policyholder",
    ],
    "policy_number": [
        "policynumber", "policyno", "policyid", "policy", "number", "policycode",
    ],
    "policy_type": [
        "policytype", "type", "insurancetype", "coveragetype", "product",
    ],
    "start_date": [
        "startdate", "start", "issuedate", "effectivedate", "fromdate",
    ],
    "expiry_date": [
        "expirydate", "expiry", "enddate", "expirationdate", "validtill",
        "validuntil", "todate", "renewaldate",
    ],
    "premium": ["premium", "amount", "price", "cost", "annualpremium"],
    "phone": ["phone", "mobile", "contact", "phonenumber", "mobilenumber"],
    "email": ["email", "emailaddress", "mail"],
}


def _normalise_header(header: Any) -> str:
    """Lower-case + strip anything that isn't a-z0-9 (so 'Policy #' → 'policy')."""
    if header is None:
        return ""
    return re.sub(r"[^a-z0-9]", "", str(header).lower())


def _build_header_map(columns: list[Any]) -> dict[str, str]:
    """Return {canonical_key: actual_column_label_in_df}. Missing keys are omitted."""
    norm_to_actual = {_normalise_header(c): c for c in columns}
    mapping: dict[str, str] = {}
    for canonical, aliases in _COLUMN_ALIASES.items():
        for alias in [canonical.replace("_", ""), *aliases]:
            if alias in norm_to_actual:
                mapping[canonical] = norm_to_actual[alias]
                break
    return mapping


# ---------------------------------------------------------------------------
# Value normalisation
# ---------------------------------------------------------------------------


def _clean_str(value: Any, *, max_len: int | None = None) -> str | None:
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    s = str(value).strip()
    if not s or s.lower() in {"nan", "none", "null"}:
        return None
    if max_len is not None and len(s) > max_len:
        s = s[:max_len]
    return s


def _parse_date(value: Any) -> date | None:
    """Parse many formats → ``date``. Returns None for empty, raises ValueError
    for malformed input so the row can be reported as an error."""
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    if isinstance(value, pd.Timestamp):
        return value.to_pydatetime().date()

    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "null"}:
        return None

    # Try pandas (handles a huge range of formats + serial numbers)
    try:
        ts = pd.to_datetime(text, dayfirst=False, errors="raise")
        if isinstance(ts, pd.Timestamp):
            return ts.to_pydatetime().date()
    except Exception:
        pass

    try:
        ts = pd.to_datetime(text, dayfirst=True, errors="raise")
        if isinstance(ts, pd.Timestamp):
            return ts.to_pydatetime().date()
    except Exception as exc:
        raise ValueError(f"Invalid date format: {text!r}") from exc

    raise ValueError(f"Invalid date format: {text!r}")


def _parse_decimal(value: Any) -> Decimal | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    if isinstance(value, Decimal):
        return value
    if isinstance(value, (int, float)):
        return Decimal(str(value))
    text = str(value).strip()
    if not text:
        return None
    # strip currency symbols and thousands separators; keep digits, ., -
    cleaned = re.sub(r"[^0-9.\-]", "", text)
    if not cleaned or cleaned in {"-", ".", "-."}:
        raise ValueError(f"Invalid numeric value: {value!r}")
    try:
        return Decimal(cleaned)
    except InvalidOperation as exc:
        raise ValueError(f"Invalid numeric value: {value!r}") from exc


# ---------------------------------------------------------------------------
# Public parser entry points
# ---------------------------------------------------------------------------


def read_xlsx(content: bytes) -> pd.DataFrame:
    """Load an xlsx byte-blob into a DataFrame. Raises `ExcelValidationError`."""
    try:
        df = pd.read_excel(
            io.BytesIO(content), engine="openpyxl", dtype=object
        )
    except Exception as exc:
        raise ExcelValidationError(f"Could not read Excel file: {exc}") from exc

    if df.empty:
        raise ExcelValidationError("Excel file contains no rows.")
    return df


def normalise_row(
    raw: dict[str, Any], header_map: dict[str, str]
) -> dict[str, Any]:
    """Apply the header-map, strip strings, parse dates + premium.

    Raises ``ValueError`` if any required field is missing or malformed —
    the caller catches it and records a row-level error.
    """
    def _get(key: str) -> Any:
        col = header_map.get(key)
        return raw.get(col) if col else None

    customer_name = _clean_str(_get("customer_name"), max_len=255)
    policy_number = _clean_str(_get("policy_number"), max_len=128)
    expiry_raw = _get("expiry_date")

    missing: list[str] = []
    if not customer_name:
        missing.append("customer_name")
    if not policy_number:
        missing.append("policy_number")
    if expiry_raw is None or (
        isinstance(expiry_raw, float) and pd.isna(expiry_raw)
    ):
        missing.append("expiry_date")
    if missing:
        raise ValueError(f"Missing required field(s): {', '.join(missing)}")

    expiry_date = _parse_date(expiry_raw)
    if expiry_date is None:
        raise ValueError("Missing required field(s): expiry_date")

    start_date = _parse_date(_get("start_date")) or expiry_date
    if start_date > expiry_date:
        # Common cause: wrong column order; be strict so users fix it.
        raise ValueError(
            f"start_date ({start_date.isoformat()}) must be on or before "
            f"expiry_date ({expiry_date.isoformat()})"
        )

    premium = _parse_decimal(_get("premium")) or Decimal("0")
    if premium < 0:
        raise ValueError("premium cannot be negative")

    return {
        "customer_name": customer_name,
        "policy_number": policy_number,
        "policy_type": _clean_str(_get("policy_type"), max_len=64) or "general",
        "start_date": start_date,
        "expiry_date": expiry_date,
        "premium": premium,
        "phone": _clean_str(_get("phone"), max_len=32),
        "email": _clean_str(_get("email"), max_len=255),
    }
