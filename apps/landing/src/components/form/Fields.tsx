"use client";

import { Check } from "lucide-react";

/**
 * Form primitives shared by the member and partner intake forms.
 *
 * Callers pass already-translated strings — these components do no lookups, so
 * the same field renders identically wherever it appears.
 */

export function FieldShell({
  label,
  hint,
  error,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-[13px] font-medium text-mist"
      >
        {label}
      </label>
      {children}
      {hint && !error && (
        <span className="mt-1.5 block text-[11.5px] text-mist-faint">
          {hint}
        </span>
      )}
      <ErrorText error={error} />
    </div>
  );
}

export function ErrorText({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <span role="alert" className="mt-1.5 block text-[12px] text-destructive">
      {error}
    </span>
  );
}

export function TextInput({
  name,
  label,
  error,
  hint,
  value,
  onChange,
  ...rest
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "value" | "onChange"
>) {
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={name}>
      <input
        {...rest}
        id={name}
        name={name}
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className="field"
      />
    </FieldShell>
  );
}

export function TextArea({
  name,
  label,
  error,
  hint,
  value,
  onChange,
  rows = 4,
  ...rest
}: {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
} & Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "name" | "value" | "onChange" | "rows"
>) {
  return (
    <FieldShell label={label} hint={hint} error={error} htmlFor={name}>
      <textarea
        {...rest}
        id={name}
        name={name}
        rows={rows}
        value={value}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className="field resize-none"
      />
    </FieldShell>
  );
}

export type Option = { value: string; label: string };

/** Single-select rendered as chips — a native select is hostile on mobile. */
export function ChipRadio({
  name,
  legend,
  hint,
  options,
  selected,
  onSelect,
  error,
}: {
  name: string;
  legend: string;
  hint?: string;
  options: Option[];
  selected: string;
  onSelect: (value: string) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="text-[13.5px] font-medium text-mist">{legend}</legend>
      {hint && <p className="mt-1 text-[12px] text-mist-faint">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <label
              key={option.value}
              data-selected={isSelected}
              className="chip focus-within:ring-2 focus-within:ring-teal-400/40"
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onSelect(option.value)}
                className="sr-only"
              />
              {isSelected && <Check className="h-3 w-3" strokeWidth={2.5} />}
              {option.label}
            </label>
          );
        })}
      </div>
      <ErrorText error={error} />
    </fieldset>
  );
}

export function ChipCheckboxes({
  name,
  legend,
  hint,
  options,
  selected,
  onToggle,
  error,
}: {
  name: string;
  legend: string;
  hint?: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string, checked: boolean) => void;
  error?: string;
}) {
  return (
    <fieldset>
      <legend className="text-[13.5px] font-medium text-mist">{legend}</legend>
      {hint && <p className="mt-1 text-[12px] text-mist-faint">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          return (
            <label
              key={option.value}
              data-selected={isSelected}
              className="chip focus-within:ring-2 focus-within:ring-teal-400/40"
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={(event) => onToggle(option.value, event.target.checked)}
                className="sr-only"
              />
              {isSelected && <Check className="h-3 w-3" strokeWidth={2.5} />}
              {option.label}
            </label>
          );
        })}
      </div>
      <ErrorText error={error} />
    </fieldset>
  );
}

export function ConsentCheckbox({
  name,
  label,
  checked,
  onChange,
  error,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span
          className={`mt-[2px] grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] border transition-colors ${
            checked
              ? "border-gold-300 bg-gold-300"
              : "border-white/30 bg-white/5"
          }`}
        >
          {checked && <Check className="h-3 w-3 text-ink-900" strokeWidth={3} />}
        </span>
        <span className="text-[12.5px] leading-[1.6] text-mist-dim">
          {label}
        </span>
      </label>
      <ErrorText error={error} />
    </div>
  );
}

export function StepProgress({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      {Array.from({ length: total }, (_, index) => (
        <span
          key={index}
          className={`h-[3px] flex-1 rounded-full transition-colors duration-500 ${
            index + 1 <= current
              ? "bg-gradient-to-r from-gold-400 to-gold-200"
              : "bg-white/10"
          }`}
        />
      ))}
    </div>
  );
}

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mt-6 rounded-xl border border-destructive/35 bg-destructive/10 px-4 py-3 text-[13px] text-destructive"
    >
      {message}
    </p>
  );
}
