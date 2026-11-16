import { NextResponse } from "next/server";
import { apiError, authenticateRequest } from "@/lib/api/auth";
import {
  MAX_MATCH_PHOTOS,
  getMatchPhotos,
  setMatchPhotos,
} from "@/lib/match/service";
import { deleteImage, uploadImage } from "@/lib/storage/images";

/** Multipart upload, one photo per request, field `image`. */
export async function POST(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (auth.account.role !== "member") return apiError("forbidden", 403);

  const photos = await getMatchPhotos(auth.account.id);
  if (!photos) return apiError("no_profile", 404);
  if (photos.length >= MAX_MATCH_PHOTOS) return apiError("too_many_images", 409);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("invalid_form", 400);
  }

  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) return apiError("no_file", 400);

  const result = await uploadImage({ folder: "match", ownerId: auth.account.id, file });
  if (!result.ok) {
    return apiError(result.reason, result.reason === "not_configured" ? 503 : 400);
  }

  const next = [...photos, result.url];
  await setMatchPhotos(auth.account.id, next);
  return NextResponse.json({ photos: next });
}

export async function DELETE(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth.ok) return auth.response;
  if (auth.account.role !== "member") return apiError("forbidden", 403);

  const url = new URL(request.url).searchParams.get("url");
  if (!url) return apiError("missing_url", 400);

  const photos = await getMatchPhotos(auth.account.id);
  // Ownership, not just authentication: any blob URL would otherwise be fair game.
  if (!photos || !photos.includes(url)) return apiError("not_found", 404);

  const next = photos.filter((photo) => photo !== url);
  await setMatchPhotos(auth.account.id, next);
  await deleteImage(url);
  return NextResponse.json({ photos: next });
}
