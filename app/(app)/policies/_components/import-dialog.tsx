"use client";

import { FileSpreadsheet, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { importPoliciesAction } from "../actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { toastMutationError } from "@/components/zims/app-toast";
import { InlineSpinner } from "@/components/zims/loading-spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ImportResult } from "@/lib/schemas";

export function ImportDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function reset() {
    setFile(null);
    setResult(null);
    setDryRun(true);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function onSubmit() {
    if (!file) {
      toastMutationError("Please choose an .xlsx file first");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    form.append("dry_run", String(dryRun));

    start(async () => {
      const res = await importPoliciesAction(form);
      if (res.ok) {
        setResult(res.data);
        if (dryRun) {
          toast.success(
            `Dry run: ${res.data.imported}/${res.data.total_rows} rows would import`,
          );
        } else {
          toast.success(
            `${res.data.imported.toLocaleString()} policies imported`,
          );
        }
        if (!dryRun) router.refresh();
      } else {
        toastMutationError(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger render={<Button variant="outline" />}>
        <Upload className="mr-1.5 h-4 w-4" />
        Import Excel
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk import customers + policies</DialogTitle>
          <DialogDescription>
            Upload an .xlsx file. Required columns:
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">
              customer_name, phone, policy_type, policy_number, start_date,
              expiry_date, premium
            </code>
            . Optional: <code className="mx-1 rounded bg-muted px-1.5 py-0.5 text-xs">email, address</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ------------- drop zone ------------- */}
          <label
            htmlFor="import-file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/40 px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-primary/[0.06] dark:bg-muted/25"
          >
            <FileSpreadsheet className="mb-2 h-8 w-8 text-primary" />
            {file ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground">
                  · {(file.size / 1024).toFixed(1)} KB
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    reset();
                  }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <span className="text-sm font-medium">
                  Click to choose an .xlsx file
                </span>
                <span className="text-xs text-muted-foreground mt-1">
                  Max 5 MB
                </span>
              </>
            )}
            <input
              ref={fileRef}
              id="import-file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                setResult(null);
              }}
            />
          </label>

          {/* ------------- dry-run toggle ------------- */}
          <div className="flex items-center gap-3">
            <input
              id="dry-run"
              type="checkbox"
              checked={dryRun}
              onChange={(e) => setDryRun(e.target.checked)}
              className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
            />
            <Label htmlFor="dry-run" className="text-sm font-normal">
              Dry run — validate without saving
            </Label>
          </div>

          {/* ------------- result ------------- */}
          {result ? <ResultPanel result={result} /> : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleClose(false)}>
            Close
          </Button>
          <Button onClick={onSubmit} disabled={pending || !file}>
            {pending ? (
              <>
                <InlineSpinner className="mr-2" />
                {dryRun ? "Validate" : "Import now"}
              </>
            ) : dryRun ? (
              "Validate"
            ) : (
              "Import now"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultPanel({ result }: { result: ImportResult }) {
  const anyErrors = result.errors.length > 0;
  return (
    <Alert
      variant={anyErrors ? "destructive" : "default"}
      className={anyErrors ? "" : "border-emerald-200 bg-emerald-50 text-emerald-900 [&>svg]:text-emerald-600 dark:bg-emerald-950/20"}
    >
      <AlertTitle>
        {result.dry_run ? "Dry run complete" : "Import complete"}
      </AlertTitle>
      <AlertDescription>
        <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm md:grid-cols-3">
          <Stat label="Rows" value={result.total_rows} />
          <Stat label="Imported" value={result.imported} />
          <Stat label="Skipped (dup)" value={result.skipped} />
          <Stat label="New customers" value={result.customers_created} />
          <Stat label="Renewals flagged" value={result.renewals_flagged} />
          <Stat label="Tasks created" value={result.tasks_created} />
        </div>
        {anyErrors ? (
          <div className="mt-3 max-h-40 overflow-y-auto rounded border border-destructive/25 bg-destructive/5 p-2 text-xs">
            <div className="mb-1 font-medium">
              {result.errors.length} row error(s):
            </div>
            <ul className="space-y-0.5">
              {result.errors.map((e) => (
                <li key={`${e.row}-${e.policy_number ?? ""}`}>
                  <span className="font-mono">row {e.row}</span>
                  {e.policy_number ? (
                    <>
                      {" "}
                      · <span className="font-mono">{e.policy_number}</span>
                    </>
                  ) : null}
                  : {e.error}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-medium">{value}</span>
    </div>
  );
}
