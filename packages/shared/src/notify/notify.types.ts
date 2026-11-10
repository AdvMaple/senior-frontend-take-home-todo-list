export type NotifyKind = "success" | "error";

export interface NotifyToastProps {
  kind: NotifyKind;
  message: string;
  onDismiss: () => void;
}
