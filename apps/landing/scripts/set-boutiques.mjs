/**
 * Sets what each brand shows on its TheONE MARKETPLACE boutique window: the
 * line under its name (the brand's own claim, as it states it), the words on
 * the window in German and English, and optionally its cover picture.
 *
 *   node --env-file=.env.local scripts/set-boutiques.mjs scripts/brands/boutiques.json
 */
import { readFileSync } from "node:fs";
import { MongoClient } from "mongodb";

const config = JSON.parse(readFileSync(process.argv[2], "utf8"));
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const profiles = client.db(process.env.MONGODB_DB || undefined).collection("partnerProfiles");

for (const brand of config) {
  const set = {
    labels: brand.labels ?? [],
    labelsEn: brand.labelsEn ?? [],
    ...(brand.tagline !== undefined ? { tagline: brand.tagline } : {}),
    ...(brand.cover ? { "images.0": brand.cover } : {}),
    updatedAt: new Date(),
  };
  const result = await profiles.updateOne({ name: brand.name }, { $set: set });
  console.log(`${brand.name}: ${result.matchedCount ? "updated" : "NOT FOUND"}`);
}
await client.close();
