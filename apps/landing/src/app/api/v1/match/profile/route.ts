import { NextResponse } from "next/server";
import * as z from "zod";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import {
  MatchProfileSchema,
  deleteMatchProfile,
  getOwnMatchProfile,
  saveMatchProfile,
} from "@/lib/match/service";

/** TheONE MATCH is for members; partners are businesses, not people dating. */
async function member(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth;
  if (auth.account.role !== "member") {
    return { ok: false as const, response: apiError("forbidden", 403) };
  }
  return auth;
}

export async function GET(request: Request) {
  const auth = await member(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ profile: await getOwnMatchProfile(auth.account.id) });
}

export async function PUT(request: Request) {
  const auth = await member(request);
  if (!auth.ok) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", 400);
  }

  const parsed = MatchProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "validation_failed",
        code: "validation_failed",
        fields: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 422 },
    );
  }

  const profile = await saveMatchProfile(auth.account.id, parsed.data);
  if (!profile) return apiError("not_found", 404);
  return NextResponse.json({ profile });
}

/** Leaves MATCH: profile, photos and every decision, both ways. */
export async function DELETE(request: Request) {
  const auth = await member(request);
  if (!auth.ok) return auth.response;
  await deleteMatchProfile(auth.account.id);
  return NextResponse.json({ ok: true });
}
