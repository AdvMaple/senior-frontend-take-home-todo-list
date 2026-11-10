import { XIcon } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "../ui/alert";
import { Button } from "../ui/button";
import type { NotifyKind, NotifyToastProps } from "./notify.types";

const DURATION_MS: Record<NotifyKind, number> = {
  success: 5000,
  error: 8000,
};

function NotifyToast({ kind, message, onDismiss }: NotifyToastProps) {
  const content = (
    <>
      <AlertDescription className="text-foreground">{message}</AlertDescription>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="absolute top-2 right-2"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <XIcon />
      </Button>
    </>
  );
  if (kind === "error") {
    return (
      <Alert variant="destructive" className="w-80 pr-10 shadow-md">
        {content}
      </Alert>
    );
  }
  return (
    <div
      role="status"
      className="relative grid w-80 grid-cols-[0_1fr] items-start rounded-lg border bg-card px-4 py-3 pr-10 text-sm text-card-foreground shadow-md"
    >
      {content}
    </div>
  );
}

function show(kind: NotifyKind, message: string): string | number {
  return toast.custom(
    (id) => (
      <NotifyToast
        kind={kind}
        message={message}
        onDismiss={() => {
          toast.dismiss(id);
        }}
      />
    ),
    { duration: DURATION_MS[kind] }
  );
}

/** N-8 / X-4: failures use `role="alert"`, successes `role="status"`; both dismissible. */
export const notify = {
  success: (message: string) => show("success", message),
  error: (message: string) => show("error", message),
  dismissAll: () => {
    toast.dismiss();
  },
};
