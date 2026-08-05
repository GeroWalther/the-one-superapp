import { NextResponse } from "next/server";
import * as z from "zod";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import { PartnerProfileSchema } from "@/lib/domain";
import {
  getPartnerProfileFor,
  setPartnerImages,
  updatePartnerProfile,
} from "@/lib/profile/service";
import {
  MAX_IMAGES_PER_PARTNER,
  deletePartnerImage,
  uploadPartnerImage,
} from "@/lib/storage/images";

/**
 * A partner's own listing.
 *
 * Distinct from `/partners/[id]`, which is the read-only view members browse.
 * This one is scoped to the caller, so a partner can never address another
 * partner's listing by guessing an id.
 */

function serialise(doc: NonNullable<Awaited<ReturnType<typeof getPartnerProfileFor>>>) {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    category: doc.category,
    description: doc.description,
    targetClientele: doc.targetClientele,
    street: doc.street,
    postalCode: doc.postalCode,
    city: doc.city,
    country: doc.country,
    website: doc.website,
    contactEmail: doc.contactEmail,
    contactPhone: doc.contactPhone,
    images: doc.images,
    published: doc.published,
  };
}

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (auth.account.role !== "partner") return apiError("forbidden", 403);

  const doc = await getPartnerProfileFor(auth.account.id);
  if (!doc) return apiError("not_found", 404);

  return NextResponse.json({ profile: serialise(doc) });
}

export async function PATCH(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (auth.account.role !== "partner") return apiError("forbidden", 403);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("invalid_json", 400);
  }

  const parsed = PartnerProfileSchema.safeParse(body);
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

  const saved = await updatePartnerProfile(auth.account.id, parsed.data);
  if (!saved) return apiError("not_found", 404);

  const doc = await getPartnerProfileFor(auth.account.id);
  return NextResponse.json({ profile: doc ? serialise(doc) : null });
}

/** Multipart image upload, one file per request. */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (auth.account.role !== "partner") return apiError("forbidden", 403);

  const doc = await getPartnerProfileFor(auth.account.id);
  if (!doc) return apiError("not_found", 404);
  if (doc.images.length >= MAX_IMAGES_PER_PARTNER) {
    return apiError("too_many_images", 409);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("invalid_form", 400);
  }

  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return apiError("no_file", 400);
  }

  const result = await uploadPartnerImage({ accountId: auth.account.id, file });
  if (!result.ok) {
    const status = result.reason === "not_configured" ? 503 : 400;
    return apiError(result.reason, status);
  }

  const images = [...doc.images, result.url];
  await setPartnerImages(auth.account.id, images);
  return NextResponse.json({ images });
}

export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (auth.account.role !== "partner") return apiError("forbidden", 403);

  const url = new URL(request.url).searchParams.get("url");
  if (!url) return apiError("missing_url", 400);

  const doc = await getPartnerProfileFor(auth.account.id);
  if (!doc) return apiError("not_found", 404);

  // Ownership, not just authentication: any blob URL would otherwise be fair game.
  if (!doc.images.includes(url)) return apiError("not_found", 404);

  const images = doc.images.filter((image) => image !== url);
  await setPartnerImages(auth.account.id, images);
  await deletePartnerImage(url);

  return NextResponse.json({ images });
}
