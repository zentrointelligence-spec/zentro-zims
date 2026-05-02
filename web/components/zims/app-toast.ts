import { toast } from "sonner";

/** Standard destructive toast for failed mutations (API detail as description). */
export function toastMutationError(detail?: string | null) {
  const d =
    detail && String(detail).trim()
      ? String(detail).trim()
      : "Please try again.";
  toast.error("Something went wrong", { description: d });
}
