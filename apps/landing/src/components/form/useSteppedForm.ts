"use client";

import { useMemo, useState } from "react";
import type { FormState } from "@/lib/domain";

/**
 * Step navigation, client-side validation, and server-error reconciliation for
 * the multi-step intake forms.
 *
 * All steps stay mounted (hidden with `display: none`) so every field is present
 * in the submitted FormData. That rules out `required` attributes — a hidden
 * required input makes the browser refuse to submit with an unfocusable-control
 * error — so validation is done here and again on the server.
 */

export type Errors = Record<string, string>;

export function useSteppedForm(options: {
  state: FormState;
  totalSteps: number;
  /** Which step owns each field, so a server rejection lands on the right screen. */
  fieldStep: Record<string, number>;
  validateStep: (step: number) => Errors;
}) {
  const { state, totalSteps, fieldStep, validateStep } = options;

  const [step, setStep] = useState(1);
  const [clientErrors, setClientErrors] = useState<Errors>({});
  const [dismissed, setDismissed] = useState<string[]>([]);

  const serverErrors = useMemo<Errors>(() => {
    const raw = state?.errors ?? {};
    const result: Errors = {};
    for (const [field, messages] of Object.entries(raw)) {
      if (dismissed.includes(field)) continue;
      const first = messages?.[0];
      if (first) result[field] = first;
    }
    return result;
  }, [state, dismissed]);

  /* A new server verdict supersedes anything the user dismissed by editing, and
     sends them back to the step that owns the earliest rejected field.
     Adjusting state during render rather than in an effect avoids showing the
     wrong step for a frame. */
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    const fields = Object.keys(state?.errors ?? {});
    if (fields.length > 0) {
      setDismissed([]);
      setClientErrors({});
      setStep(
        Math.min(...fields.map((field) => fieldStep[field] ?? totalSteps)),
      );
    }
  }

  function errorFor(field: string): string | undefined {
    return clientErrors[field] ?? serverErrors[field];
  }

  function clearError(field: string) {
    setClientErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setDismissed((prev) => (prev.includes(field) ? prev : [...prev, field]));
  }

  function goNext() {
    const errors = validateStep(step);
    setClientErrors(errors);
    if (Object.keys(errors).length === 0) {
      setStep((prev) => Math.min(prev + 1, totalSteps));
    }
  }

  function goBack() {
    setClientErrors({});
    setStep((prev) => Math.max(prev - 1, 1));
  }

  /** Last-chance guard: never post a form the client already knows is invalid. */
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    for (let candidate = 1; candidate <= totalSteps; candidate++) {
      const errors = validateStep(candidate);
      if (Object.keys(errors).length > 0) {
        event.preventDefault();
        setClientErrors(errors);
        setStep(candidate);
        return;
      }
    }
  }

  /** Enter advances rather than submitting, except on the final step. */
  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || step >= totalSteps) return;
    const target = event.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;
    event.preventDefault();
    goNext();
  }

  return {
    step,
    clientErrors,
    errorFor,
    clearError,
    goNext,
    goBack,
    handleSubmit,
    handleKeyDown,
  };
}
