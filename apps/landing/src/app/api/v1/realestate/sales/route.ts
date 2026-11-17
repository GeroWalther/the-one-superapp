import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { listPropertySales, startPropertySale, type PropertySaleInput } from "@/lib/realestate/service";

/** The member's homes for sale through TheONE REAL ESTATE, latest first. */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ sales: await listPropertySales(auth.account.id) });
}

/** Sends the member's home to the two or three best brokers for its place. */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;

  let body: PropertySaleInput;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", 400);
  }
  const result = await startPropertySale({
    accountId: auth.account.id,
    displayName: auth.account.displayName,
    property: body,
  });
  if (!result.ok) {
    const status = result.reason === "limit" ? 429 : result.reason === "invalid" ? 400 : 404;
    return apiError(result.reason, status);
  }
  return NextResponse.json({ sale: result.sale }, { status: 201 });
}
