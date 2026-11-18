import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import {
  analyseSkin,
  deleteSkinScan,
  isSkinConfigured,
  listSkinScans,
} from "@/lib/skin/service";

/** The member's skin analyses, newest first. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ scans: await listSkinScans(auth.account.id) });
}

/**
 * One scan: multipart with the photo as `image` and the phone's language as
 * `language`. The photo is analysed and dropped; only the result is kept.
 */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (!isSkinConfigured()) return apiError("assistant_not_configured", 503);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("invalid_form", 400);
  }

  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return apiError("no_file", 400);

  const result = await analyseSkin({
    account: auth.account,
    bytes: new Uint8Array(await file.arrayBuffer()),
    language: form.get("language"),
  });

  if (!result.ok) {
    const status =
      result.reason === "too_many" ? 429
      : result.reason === "not_configured" ? 503
      : result.reason === "error" ? 502
      : 422;
    return NextResponse.json(
      { error: result.reason, code: result.reason, message: result.message ?? null },
      { status },
    );
  }

  return NextResponse.json({ scan: result.scan });
}

/** Removes one analysis from the member's history: `?id=`. */
export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return apiError("missing_id", 400);
  if (!(await deleteSkinScan(auth.account.id, id))) return apiError("not_found", 404);
  return NextResponse.json({ ok: true });
}
