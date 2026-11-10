import {
  Label,
  RadioGroup,
  RadioGroupItem,
  THEME_PREFERENCES,
  themeAtom,
} from "@app/shared";
import { useAtom } from "jotai";
import { useId } from "react";
import type { ThemePreference } from "@app/shared";
import type { ThemeControlProps } from "./theme-control.types";

function isThemePreference(value: string): value is ThemePreference {
  return THEME_PREFERENCES.some((entry) => entry === value);
}

/** U-8/S-3: app-wide light/dark/system theme control bound to `themeAtom`. */
export function ThemeControl({ className }: ThemeControlProps) {
  const [theme, setTheme] = useAtom(themeAtom);
  const baseId = useId();

  return (
    <fieldset className={className}>
      <legend className="sr-only">Theme</legend>
      <RadioGroup
        value={theme}
        onValueChange={(value) => {
          if (!isThemePreference(value)) return;
          setTheme(value);
        }}
        className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-border bg-muted/40 px-3 py-2"
      >
        <div className="flex items-center gap-1.5">
          <RadioGroupItem id={`${baseId}-light`} value="light" />
          <Label htmlFor={`${baseId}-light`}>Light</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <RadioGroupItem id={`${baseId}-dark`} value="dark" />
          <Label htmlFor={`${baseId}-dark`}>Dark</Label>
        </div>
        <div className="flex items-center gap-1.5">
          <RadioGroupItem id={`${baseId}-system`} value="system" />
          <Label htmlFor={`${baseId}-system`}>System</Label>
        </div>
      </RadioGroup>
    </fieldset>
  );
}
