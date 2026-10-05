"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Cookieless page-view tracking. Nothing is written to the visitor's device:
 * the first page's referrer and campaign tags live in memory for as long as
 * the tab keeps this app loaded, which is exactly one visit.
 */

type FirstTouch = {
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landingPath: string;
};

let firstTouch: FirstTouch | null = null;
/* Separate from `firstTouch`: the application form reads the first touch
   too, and its effect can run before this one does. */
let entrySent = false;

function captureFirstTouch(pathname: string): FirstTouch {
  if (!firstTouch) {
    const params = new URLSearchParams(window.location.search);
    firstTouch = {
      referrer: document.referrer || null,
      utmSource: params.get("utm_source") ?? params.get("ref"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
      utmContent: params.get("utm_content"),
      utmTerm: params.get("utm_term"),
      landingPath: pathname,
    };
  }
  return firstTouch;
}

/** Account, admin and token pages are private; they are never counted. */
const PRIVATE = /^\/(de|en)\/(admin|account|activate|reset-password)(\/|$)/;

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || PRIVATE.test(pathname)) return;

    const entry = !entrySent;
    entrySent = true;
    const touch = captureFirstTouch(pathname);
    const locale = pathname.split("/")[1] === "en" ? "en" : "de";

    // Only the path is sent, never the query string: activation and reset
    // links carry tokens there.
    const body = JSON.stringify({
      path: pathname,
      locale,
      entry,
      referrer: touch.referrer,
      utmSource: touch.utmSource,
      utmMedium: touch.utmMedium,
      utmCampaign: touch.utmCampaign,
      utmContent: touch.utmContent,
      utmTerm: touch.utmTerm,
    });

    const blob = new Blob([body], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/track", blob)) {
      fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  }, [pathname]);

  return null;
}

/**
 * Carries the visit's source into an application form, so the dashboard can
 * say which channels bring applicants, not just visitors.
 */
export function AttributionField() {
  const pathname = usePathname();
  const marker = useRef<HTMLInputElement>(null);

  /* Added at the moment the browser assembles the form's data, rather than
     kept in the input's value: React re-renders the form between steps and
     resets a hidden input to its rendered value, which silently emptied it. */
  useEffect(() => {
    const form = marker.current?.form;
    if (!form) return;
    const add = (event: FormDataEvent) => {
      event.formData.set("attribution", JSON.stringify(captureFirstTouch(pathname ?? "/")));
    };
    form.addEventListener("formdata", add);
    return () => form.removeEventListener("formdata", add);
  }, [pathname]);

  return <input ref={marker} type="hidden" name="attribution" value="" readOnly />;
}
