"use client";

import { useCallback, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { InlineSpinner } from "@/components/zims/loading-spinner";
import { type ImportResult, ImportResult as ImportResultSchema } from "@/lib/schemas";
import { cn } from "@/lib/utils";

export function Step2ImportData({
  onContinue,
  onSkipToDashboard,
}: {
  onContinue: () => void;
  onSkipToDashboard: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, startImport] = useTransition();
  const [continuing, startContinue] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const pickFile = useCallback((f: File | null) => {
    setError(null);
    setResult(null);
    if (!f) {
      setFile(null);
      return;
    }
    if (!f.name.toLowerCase().endsWith(".xlsx")) {
      setError("Please choose an .xlsx file.");
      setFile(null);
      return;
    }
    setFile(f);
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }

  function runImport() {
    if (!file) {
      setError("Select an Excel file first.");
      return;
    }
    setError(null);
    startImport(async () => {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("dry_run", "false");
      const res = await fetch("/api/zims/policies/import", {
        method: "POST",
        body: fd,
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof payload.error === "string"
            ? payload.error
            : "Import failed",
        );
        return;
      }
      const parsed = ImportResultSchema.safeParse(payload);
      if (!parsed.success) {
        setError("Unexpected response from import.");
        return;
      }
      setResult(parsed.data);
    });
  }

  function continueNext() {
    startContinue(async () => {
      await Promise.resolve();
      onContinue();
    });
  }

  const shownErrors = result?.errors?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6 transition-opacity duration-150 ease-in-out">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Import your existing data
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload an Excel file with your customers and policies. Most agencies
          import in under 5 minutes.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          "flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/40 bg-muted/20 px-4 py-8 text-center transition-all duration-150 ease-in-out",
          dragOver &&
            "border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/30",
          "hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20",
        )}
      >
        <span className="text-sm font-medium text-foreground">
          Drop your Excel file here
        </span>
        <span className="mt-1 text-xs text-muted-foreground">
          or click to browse · .xlsx only
        </span>
        {file ? (
          <span className="mt-3 truncate text-xs font-medium text-indigo-700 dark:text-indigo-300">
            {file.name}
          </span>
        ) : null}
      </button>

      <Button
        type="button"
        className="h-11 w-full bg-indigo-600 text-base text-white transition-all duration-150 ease-in-out hover:bg-indigo-700"
        disabled={importing || !file}
        onClick={() => runImport()}
      >
        {importing ? (
          <span className="inline-flex items-center gap-2">
            <InlineSpinner className="text-white" />
            Importing…
          </span>
        ) : (
          "Import"
        )}
      </Button>

      {error ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {result ? (
        <div
          className="rounded-lg border border-emerald-200 px-4 py-3 text-sm transition-all duration-150 ease-in-out"
          style={{ backgroundColor: "#dcfce7", color: "#15803d" }}
        >
          <p className="font-medium">
            ✓ {result.imported} policies imported, {result.skipped} skipped
          </p>
          <p className="mt-1 text-xs opacity-90">
            {result.total_rows} rows processed
            {result.errors.length > 0
              ? ` · ${result.errors.length} row error(s)`
              : ""}
          </p>
          {result.errors.length > 0 ? (
            <div className="mt-3 max-h-28 overflow-y-auto rounded-md border border-emerald-300/60 bg-white/60 p-2 text-left text-xs text-emerald-900">
              {shownErrors.map((rowErr) => (
                <div key={rowErr.row} className="py-0.5">
                  Row {rowErr.row}: {rowErr.error}
                </div>
              ))}
              {result.errors.length > 5 ? (
                <div className="pt-1 text-[11px] text-emerald-800/80">
                  +{result.errors.length - 5} more (see API / full export)
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        className="h-11 w-full transition-all duration-150 ease-in-out"
        disabled={continuing}
        onClick={() => continueNext()}
      >
        {continuing ? (
          <span className="inline-flex items-center gap-2">
            <InlineSpinner />
            Continue
          </span>
        ) : (
          "Continue"
        )}
      </Button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => onSkipToDashboard()}
          className="text-sm text-muted-foreground underline-offset-4 transition-colors duration-150 ease-in-out hover:text-foreground hover:underline"
        >
          Skip this step
        </button>
      </div>
    </div>
  );
}
