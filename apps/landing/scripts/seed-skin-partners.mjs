/**
 * Seeds two test business partners for the skin analysis: a skincare brand
 * and an aesthetic medicine practice, both in Zurich, next to the seeded
 * Alpine Longevity Clinic.
 *
 *   node --env-file=.env.local scripts/seed-skin-partners.mjs
 *
 * Flagged `isTestAccount: true`; the skin analysis offers them to test
 * accounts only. Remove with db.accounts / db.partnerProfiles deleteMany on
 * the usernames below.
 */
import { createHash } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { hash } from "bcryptjs";

const uri = process.env.MONGODB_URI;
const secret = process.env.HASH_SECRET ?? process.env.SESSION_SECRET;
if (!uri || !secret) {
  console.error("\n✖ MONGODB_URI and HASH_SECRET must be set. Run with `node --env-file=.env.local`.\n");
  process.exit(1);
}
const keyed = (v) => createHash("sha256").update(`${secret}:${v}`).digest("hex");
const PASSWORD = process.env.TEST_PASSWORD ?? "TestPassword2026!";

const PARTNERS = [
  {
    username: "testskincare",
    displayName: "Lumière Skin Atelier",
    profile: {
      category: "beauty",
      focusArea: "beauty",
      description:
        "Swiss high tech skincare: vitamin C and peptide serums, retinal night care, hyaluronic hydration and mineral SPF 50, formulated for visible radiance and firmer skin.",
      targetClientele: "Members who want a clear, effective routine for brighter, younger looking skin.",
      city: "Zurich", country: "Switzerland", street: "Rennweg 10", postalCode: "8001",
      website: "https://example.com", contactPhone: "+41 44 555 10 10",
    },
  },
  {
    username: "testaesthetic",
    displayName: "Dr. Elena Varga Aesthetic Medicine",
    profile: {
      category: "practice",
      focusArea: "beauty",
      description:
        "Board certified aesthetic doctor: skin boosters, microneedling, laser for pigmentation and redness, and natural looking anti aging treatments planned around each face.",
      targetClientele: "Members looking for medical grade treatments for lines, pigmentation and skin quality.",
      city: "Zurich", country: "Switzerland", street: "Dufourstrasse 22", postalCode: "8008",
      website: "https://example.com", contactPhone: "+41 44 555 20 20",
    },
  },
];

const mongo = await new MongoClient(uri).connect();
const db = mongo.db(process.env.MONGODB_DB ?? "theone");
const now = new Date();
const passwordHash = await hash(PASSWORD, 12);

for (const p of PARTNERS) {
  const email = `${p.username}@theone.test`;
  const account = await db.collection("accounts").findOneAndUpdate(
    { username: p.username },
    {
      $set: {
        role: "partner", status: "active", username: p.username, email, emailHash: keyed(email),
        phone: null, displayName: p.displayName, locale: "en", passwordHash, partnerTier: "small",
        stripeCustomerId: null, stripeSubscriptionId: null, currentPeriodEnd: null,
        freeMonthsGranted: 0, freeUntil: null, successfulReferrals: 0, referralFreeMonthsGranted: 0,
        invitedByAccountId: null, referralCreditedAt: null, applicationId: null,
        isTestAccount: true, updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), createdAt: now, lastLoginAt: null },
    },
    { upsert: true, returnDocument: "after" },
  );
  await db.collection("partnerProfiles").updateOne(
    { accountId: account._id },
    {
      $set: {
        accountId: account._id, name: p.displayName, ...p.profile, contactEmail: email,
        images: [], published: true, isTestAccount: true, updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), createdAt: now },
    },
    { upsert: true },
  );
  console.log(`  ✓ ${p.displayName}`);
}
await mongo.close();
