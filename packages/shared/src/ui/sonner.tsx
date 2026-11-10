import { useAtomValue } from "jotai";
import { Toaster as SonnerToaster, type ToasterProps } from "sonner";
import { themeAtom } from "../state/atoms";

/** shadcn `sonner` Toaster; follows `themeAtom` instead of `next-themes`. */
function Toaster(props: ToasterProps) {
  const theme = useAtomValue(themeAtom);
  return (
    <SonnerToaster
      theme={theme}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
