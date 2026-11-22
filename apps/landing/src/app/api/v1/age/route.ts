import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { getTheoneAge, isValidBirthYear, setBirthYear } from "@/lib/age/service";

/** The member's TheONE AGE, computed fresh from their checks and scans. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ age: await getTheoneAge(auth.account.id) });
}

/** The birth year TheONE AGE starts from: `{ birthYear }`. */
export async function PUT(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  let body: { birthYear?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", 400);
  }
  if (!isValidBirthYear(body.birthYear)) return apiError("invalid_birth_year", 422);

  await setBirthYear(auth.account.id, body.birthYear);
  return NextResponse.json({ age: await getTheoneAge(auth.account.id) });
}
