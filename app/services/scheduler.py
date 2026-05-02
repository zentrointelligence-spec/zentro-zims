"""APScheduler setup — daily renewal job + birthday sweep."""
from __future__ import annotations

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.logging import get_logger
from app.services.birthday_service import run_birthday_sweep
from app.services.renewal_service import run_renewal_check

logger = get_logger(__name__)

_scheduler: BackgroundScheduler | None = None


def _renewal_job() -> None:
    logger.info("Starting scheduled renewal check...")
    try:
        run_renewal_check()
    except Exception:
        logger.exception("Scheduled renewal check failed")


def run_birthday_sweep_job() -> None:
    """Open a DB session and run the birthday sweep (scheduled wrapper)."""
    logger.info("Starting scheduled birthday sweep...")
    db = SessionLocal()
    try:
        count = run_birthday_sweep(db)
        logger.info("Birthday sweep finished: %s customers", count)
    except Exception:
        logger.exception("Scheduled birthday sweep failed")
    finally:
        db.close()


def start_scheduler() -> BackgroundScheduler:
    """Start the background scheduler (idempotent)."""
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        return _scheduler

    scheduler = BackgroundScheduler(timezone="UTC")
    scheduler.add_job(
        _renewal_job,
        trigger=CronTrigger(
            hour=settings.renewal_job_hour,
            minute=settings.renewal_job_minute,
        ),
        id="renewal_check",
        name="Daily renewal check",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.add_job(
        run_birthday_sweep_job,
        trigger=CronTrigger(hour=8, minute=0),
        id="birthday_sweep",
        name="Daily birthday sweep (UTC 08:00)",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    _scheduler = scheduler
    logger.info(
        "Scheduler started (renewal %02d:%02d UTC, birthday 08:00 UTC, window=%sd)",
        settings.renewal_job_hour,
        settings.renewal_job_minute,
        settings.renewal_window_days,
    )
    return scheduler


def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("Scheduler stopped.")
    _scheduler = None
