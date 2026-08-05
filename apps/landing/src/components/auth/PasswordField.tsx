"use client";

import { useState } from "react";
import { Check, Eye, EyeOff, X } from "lucide-react";
import { ErrorText } from "@/components/form/Fields";

/**
 * Password entry with live rule feedback.
 *
 * The rules are shown as they are met rather than only on submit — a password
 * field that rejects you after the fact, without saying which rule you missed,
 * is where people give up.
 */
export function PasswordField({
  name = "password",
  label,
  value,
  onChange,
  error,
  rules,
  autoComplete = "new-password",
}: {
  name?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  rules: { label: string; met: boolean }[];
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-[13px] font-medium text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          aria-invalid={Boolean(error)}
          onChange={(event) => onChange(event.target.value)}
          className="field pr-12"
        />
        <button
          type="button"
          onClick={() => setShow((current) => !current)}
          aria-label={label}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-faint transition-colors hover:text-ink"
        >
          {show ? (
            <EyeOff className="h-4 w-4" strokeWidth={1.6} />
          ) : (
            <Eye className="h-4 w-4" strokeWidth={1.6} />
          )}
        </button>
      </div>

      <ul className="mt-2.5 space-y-1">
        {rules.map((rule) => (
          <li
            key={rule.label}
            className={`flex items-center gap-2 text-[11.5px] ${
              rule.met ? "text-aqua-500" : "text-ink-faint"
            }`}
          >
            {rule.met ? (
              <Check className="h-3 w-3 shrink-0" strokeWidth={2.5} />
            ) : (
              <X className="h-3 w-3 shrink-0 opacity-50" strokeWidth={2} />
            )}
            {rule.label}
          </li>
        ))}
      </ul>

      <ErrorText error={error} />
    </div>
  );
}
