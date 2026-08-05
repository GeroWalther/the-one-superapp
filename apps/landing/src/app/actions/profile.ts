"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";
import {
  MemberProfileSchema,
  PartnerProfileSchema,
  type FormState,
} from "@/lib/domain";
import {
  getPartnerProfileFor,
  setPartnerImages,
  updateMemberProfile,
  updatePartnerProfile,
} from "@/lib/profile/service";
import {
  MAX_IMAGES_PER_PARTNER,
  deletePartnerImage,
  uploadPartnerImage,
} from "@/lib/storage/images";
import { getCurrentAccount } from "@/lib/auth/dal";

export async function updateMemberProfileAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) return { message: "notSignedIn" };
  if (account.role !== "member") return { message: "forbidden" };

  const parsed = MemberProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    country: formData.get("country"),
    city: formData.get("city"),
    focusAreas: formData.getAll("focusAreas"),
    goal: formData.get("goal"),
    context: formData.get("context") ?? "",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const saved = await updateMemberProfile(account.id, parsed.data);
  if (!saved) return { message: "serverError" };

  revalidatePath("/[locale]/account", "page");
  return { ok: true, message: "profileSaved" };
}

export async function updatePartnerProfileAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) return { message: "notSignedIn" };
  if (account.role !== "partner") return { message: "forbidden" };

  const parsed = PartnerProfileSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    description: formData.get("description"),
    targetClientele: formData.get("targetClientele") ?? "",
    street: formData.get("street"),
    postalCode: formData.get("postalCode"),
    city: formData.get("city"),
    country: formData.get("country"),
    website: formData.get("website") ?? "",
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone"),
    published: formData.get("published") === "on",
  });

  if (!parsed.success) {
    return { errors: z.flattenError(parsed.error).fieldErrors };
  }

  const saved = await updatePartnerProfile(account.id, parsed.data);
  if (!saved) return { message: "serverError" };

  revalidatePath("/[locale]/account", "page");
  return { ok: true, message: "profileSaved" };
}

export async function uploadPartnerImageAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const account = await getCurrentAccount();
  if (!account) return { message: "notSignedIn" };
  if (account.role !== "partner") return { message: "forbidden" };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { message: "noFile" };
  }

  const profile = await getPartnerProfileFor(account.id);
  if (!profile) return { message: "serverError" };

  if (profile.images.length >= MAX_IMAGES_PER_PARTNER) {
    return { message: "tooManyImages" };
  }

  const result = await uploadPartnerImage({ accountId: account.id, file });
  if (!result.ok) {
    return {
      message:
        result.reason === "not_configured"
          ? "storageNotConfigured"
          : result.reason === "too_large"
            ? "imageTooLarge"
            : result.reason === "unsupported_type"
              ? "imageUnsupported"
              : "serverError",
    };
  }

  await setPartnerImages(account.id, [...profile.images, result.url]);
  revalidatePath("/[locale]/account", "page");
  return { ok: true, message: "imageUploaded" };
}

export async function deletePartnerImageAction(formData: FormData): Promise<void> {
  const account = await getCurrentAccount();
  if (!account || account.role !== "partner") return;

  const url = String(formData.get("url") ?? "");
  const profile = await getPartnerProfileFor(account.id);
  if (!profile) return;

  /* Ownership check: without it, a partner could pass any blob URL and delete
     another partner's photograph. */
  if (!profile.images.includes(url)) return;

  await setPartnerImages(
    account.id,
    profile.images.filter((image) => image !== url),
  );
  await deletePartnerImage(url);

  revalidatePath("/[locale]/account", "page");
}
