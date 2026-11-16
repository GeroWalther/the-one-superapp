/**
 * Seeds TheONE SELECTION test offerings for the seeded test partners, plus a
 * test hotel in Zurich, so every area has something to show.
 *
 *   node --env-file=.env.local scripts/seed-selection.mjs
 *
 * Run seed-test-users.mjs and seed-skin-partners.mjs first. Everything is
 * flagged `isTestAccount: true` and shown to test accounts only. Re-running
 * replaces the test offerings.
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

const mongo = await new MongoClient(uri).connect();
const db = mongo.db(process.env.MONGODB_DB ?? "theone");
const now = new Date();

// A test hotel in Zurich, so "stays" has a city partner.
{
  const username = "testhotel";
  const email = `${username}@theone.test`;
  const account = await db.collection("accounts").findOneAndUpdate(
    { username },
    {
      $set: {
        role: "partner", status: "active", username, email, emailHash: keyed(email), phone: null,
        displayName: "Grand Hotel Seeblick Zurich", locale: "en",
        passwordHash: await hash(process.env.TEST_PASSWORD ?? "TestPassword2026!", 12),
        partnerTier: "large", stripeCustomerId: null, stripeSubscriptionId: null, currentPeriodEnd: null,
        freeMonthsGranted: 0, freeUntil: null, successfulReferrals: 0, referralFreeMonthsGranted: 0,
        invitedByAccountId: null, referralCreditedAt: null, applicationId: null, isTestAccount: true, updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), createdAt: now, lastLoginAt: null },
    },
    { upsert: true, returnDocument: "after" },
  );
  await db.collection("partnerProfiles").updateOne(
    { accountId: account._id },
    {
      $set: {
        accountId: account._id, name: "Grand Hotel Seeblick Zurich", category: "hotel", focusArea: "hotels",
        description: "Lakefront grand hotel with suites over Lake Zurich, a private spa and a chef's table; partner stays with Alpine Longevity Clinic.",
        targetClientele: "Members who want the city's quietest suite with the lake at their feet.",
        city: "Zurich", country: "Switzerland", street: "Utoquai 1", postalCode: "8008",
        website: "https://example.com", contactEmail: email, contactPhone: "+41 44 555 30 30",
        images: [], published: true, isTestAccount: true, updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), createdAt: now },
    },
    { upsert: true },
  );
}

const CATALOGUE = {
  testskincare: [
    ["product", "Vitamin C Radiance Serum, 30 ml", "15 % stabilised vitamin C with ferulic acid: brighter, more even skin and visible glow in four weeks.", 14500, null, ["radiance", "pigmentation", "evenness"]],
    ["product", "Hyaluronic Deep Hydration Serum, 30 ml", "Three molecular sizes of hyaluronic acid with panthenol: plumper skin, softer fine lines.", 12500, null, ["hydration", "lines"]],
    ["product", "Retinal Renewal Night Cream, 50 ml", "0.05 % retinal in a ceramide base: smoother lines, finer pores, gentle enough to start with.", 16500, null, ["lines", "evenness", "pores"]],
    ["product", "Mineral Shield SPF 50, 50 ml", "Zinc oxide sunscreen with niacinamide: protects against dark spots and calms redness, no white cast.", 6900, null, ["pigmentation", "redness"]],
    ["product", "Peptide Eye Contour, 15 ml", "Peptides and caffeine for the eye area: smoother crow's feet, less puffiness.", 9500, null, ["lines", "hydration"]],
  ],
  testaesthetic: [
    ["treatment", "Skin Booster", "Injectable hyaluronic skin quality treatment, two sessions four weeks apart: deep hydration, firmer, glowing skin.", 65000, "from", ["lines", "hydration", "radiance"]],
    ["treatment", "Collagen Microneedling", "Medical microneedling with growth factors: refines pores and texture, softens fine lines.", 48000, "from", ["pores", "evenness", "lines"]],
    ["treatment", "Laser Toning", "Gentle laser for pigmentation and redness, little downtime: a clearer, more even tone.", 39000, "from", ["pigmentation", "redness", "evenness"]],
  ],
  testclinic: [
    ["program", "Longevity Check-up", "One day of full diagnostics: blood panel, epigenetic age, cardiovascular and body composition, with a personal plan.", 290000, null, []],
    ["program", "Skin and Cell Longevity Programme", "Three months: nutrition, hormones, sleep and skin protocols from the inside out, with follow-ups.", 480000, "from", ["radiance", "lines"]],
  ],
  testdental: [
    ["treatment", "Smile Aesthetics Consultation", "Bleaching, veneers or alignment: a precise plan for a naturally brighter smile.", 25000, null, []],
  ],
  testresort: [
    ["stay", "Recovery Week", "Seven nights with medical spa, thermal circuit and a personal recovery plan.", 390000, "from", []],
    ["stay", "Spa Weekend", "Two nights by the lake with two signature treatments and the thermal circuit.", 120000, "from", []],
  ],
  testhotel: [
    ["stay", "Lake View Suite", "A suite over Lake Zurich with private spa access and breakfast on the terrace.", 95000, "per_night", []],
    ["stay", "Longevity Stay", "Two nights in a lake suite with the Longevity Check-up at Alpine Longevity Clinic.", 520000, "from", ["radiance"]],
  ],
};

for (const [username, items] of Object.entries(CATALOGUE)) {
  const account = await db.collection("accounts").findOne({ username });
  if (!account) { console.log(`  ! ${username} missing, skipped`); continue; }
  const profile = await db.collection("partnerProfiles").findOne({ accountId: account._id });
  if (!profile) { console.log(`  ! ${username} has no profile, skipped`); continue; }

  await db.collection("offerings").deleteMany({ partnerProfileId: profile._id, isTestAccount: true });
  await db.collection("offerings").insertMany(
    items.map(([kind, title, description, priceCents, priceNote, concerns], i) => ({
      _id: new ObjectId(),
      partnerProfileId: profile._id,
      kind, title, description, priceCents, currency: "CHF", priceNote,
      imageUrl: null, concerns, published: true, isTestAccount: true,
      createdAt: new Date(now.getTime() + i), updatedAt: now,
    })),
  );
  console.log(`  ✓ ${profile.name}: ${items.length}`);
}
await mongo.close();
