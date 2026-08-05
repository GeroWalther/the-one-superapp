import "server-only";
import { del, put } from "@vercel/blob";

/**
 * Partner image uploads, on Vercel Blob.
 *
 * An upload endpoint is the most attacker-facing surface in the product, so
 * nothing the client says about a file is trusted: not its Content-Type, not
 * its extension, not its declared size. The type is decided by reading the
 * leading bytes, and the size by counting what actually arrived.
 */

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES_PER_PARTNER = 8;

export function isImageStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

type Detected = { extension: string; contentType: string };

/**
 * Identifies a format from its magic bytes.
 *
 * Only formats a browser will render inline are allowed. SVG is deliberately
 * excluded: it is a document format that can carry script, and serving one from
 * our own origin would hand an attacker stored XSS against every viewer.
 */
function detectImage(bytes: Uint8Array): Detected | null {
  const startsWith = (...signature: number[]) =>
    signature.every((byte, index) => bytes[index] === byte);

  if (startsWith(0xff, 0xd8, 0xff)) {
    return { extension: "jpg", contentType: "image/jpeg" };
  }
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) {
    return { extension: "png", contentType: "image/png" };
  }
  if (startsWith(0x47, 0x49, 0x46, 0x38)) {
    return { extension: "gif", contentType: "image/gif" };
  }
  // RIFF....WEBP
  if (
    startsWith(0x52, 0x49, 0x46, 0x46) &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { extension: "webp", contentType: "image/webp" };
  }
  // ftypheic / ftypheix / ftypmif1 — what an iPhone camera produces.
  if (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70) {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    if (["heic", "heix", "hevc", "mif1", "msf1"].includes(brand)) {
      return { extension: "heic", contentType: "image/heic" };
    }
  }

  return null;
}

export type UploadOutcome =
  | { ok: true; url: string }
  | { ok: false; reason: "not_configured" | "too_large" | "unsupported_type" | "error" };

export async function uploadPartnerImage(input: {
  accountId: string;
  file: File;
}): Promise<UploadOutcome> {
  if (!isImageStorageConfigured()) return { ok: false, reason: "not_configured" };

  const bytes = new Uint8Array(await input.file.arrayBuffer());

  // Measured, not declared: `file.size` is whatever the client claimed.
  if (bytes.byteLength === 0 || bytes.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, reason: "too_large" };
  }

  const detected = detectImage(bytes);
  if (!detected) return { ok: false, reason: "unsupported_type" };

  try {
    const blob = await put(
      `partners/${input.accountId}/${crypto.randomUUID()}.${detected.extension}`,
      Buffer.from(bytes),
      {
        access: "public",
        contentType: detected.contentType,
        /* The path already carries a UUID; without this the SDK appends a
           second random suffix and the URL stops matching the key we store. */
        addRandomSuffix: false,
      },
    );

    return { ok: true, url: blob.url };
  } catch (error) {
    console.error("[storage] upload failed:", error);
    return { ok: false, reason: "error" };
  }
}

/**
 * Deletes a previously uploaded image.
 *
 * The caller must confirm the URL belongs to this partner — the ownership check
 * lives with the caller because only it knows the current image list. Failure
 * is swallowed: an orphaned blob is a tidiness problem, while a failed removal
 * that blocks the profile save is a user-facing one.
 */
export async function deletePartnerImage(url: string): Promise<void> {
  if (!isImageStorageConfigured()) return;
  try {
    await del(url);
  } catch (error) {
    console.error("[storage] delete failed, leaving orphan:", error);
  }
}
