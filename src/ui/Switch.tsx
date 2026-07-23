import { type ButtonHTMLAttributes } from "react";

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange?: () => void;
  disabled?: boolean;
}

/** Minimal ARIA switch, no Radix. Renders `role="switch"` on a native
 * button so it's keyboard- and screen-reader-accessible without a
 * dependency. */
export function Switch({ checked, onCheckedChange, disabled, className, ...rest }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={disabled ? undefined : onCheckedChange}
      data-state={checked ? "checked" : "unchecked"}
      className={["ccb-switch", disabled ? "ccb-switch--disabled" : "", className]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <span className="ccb-switch__thumb" data-state={checked ? "checked" : "unchecked"} />
    </button>
  );
}
