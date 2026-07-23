import { type ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "ghost" | "solid";
}

/** Minimal button primitive — just enough styling hooks for the banner's
 * three action buttons and the floating reopen button. */
export function Button({ variant = "ghost", className, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={["ccb-button", `ccb-button--${variant}`, className].filter(Boolean).join(" ")}
      {...rest}
    />
  );
}
