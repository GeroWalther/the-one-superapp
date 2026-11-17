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

// More test partners so every TheONE area has something: a nutrition
// brand (TheONE SELECTION), a prevention clinic (TheONE HEALTH) and a broker
// (TheONE REAL ESTATE).
async function upsertPartner(username, name, profile) {
  const email = `${username}@theone.test`;
  const account = await db.collection("accounts").findOneAndUpdate(
    { username },
    {
      $set: {
        role: "partner", status: "active", username, email, emailHash: keyed(email), phone: null,
        displayName: name, locale: "en",
        passwordHash: await hash(process.env.TEST_PASSWORD ?? "TestPassword2026!", 12),
        partnerTier: "small", stripeCustomerId: null, stripeSubscriptionId: null, currentPeriodEnd: null,
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
        accountId: account._id, name, ...profile, website: "https://example.com", contactEmail: email,
        images: [], published: true, isTestAccount: true, updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), createdAt: now },
    },
    { upsert: true },
  );
}
await upsertPartner("testnutrition", "Vitalis Longevity Nutrition", {
  category: "other", focusArea: "health",
  description: "Swiss made longevity nutrition: NMN, omega 3, vitamin D3 with K2 and marine collagen, tested in independent labs.",
  targetClientele: "Members who want evidence based supplements for energy, skin and healthy ageing.",
  city: "Zug", country: "Switzerland", street: "Baarerstrasse 8", postalCode: "6300", contactPhone: "+41 41 555 40 40",
});
await upsertPartner("testprevention", "Seefeld Prevention Clinic", {
  category: "wellness", focusArea: "health",
  description: "Prevention and wellbeing clinic: annual check-ups, vitamin infusions, sleep and stress programmes with physicians and therapists.",
  targetClientele: "Members who want to stay healthy, not only get well.",
  city: "Zurich", country: "Switzerland", street: "Seefeldstrasse 120", postalCode: "8008", contactPhone: "+41 44 555 50 50",
});
await upsertPartner("testestate", "Zurich Prime Estates", {
  category: "realEstate", focusArea: "property",
  description: "Discreet brokerage for lake view homes, villas and penthouses in Zurich and on the Gold Coast; buying and selling, also off market.",
  targetClientele: "Members buying or selling exceptional property around Lake Zurich.",
  city: "Zurich", country: "Switzerland", street: "Bahnhofstrasse 45", postalCode: "8001", contactPhone: "+41 44 555 60 60",
});

await upsertPartner("testairline", "Alpine Air First", {
  category: "other", focusArea: "lifestyle",
  description: "First class and private jet travel from Zurich: lounges, chauffeur to the aircraft, and a crew that knows your name.",
  targetClientele: "Members who fly first or private.",
  city: "Zurich", country: "Switzerland", street: "Flughafenstrasse 1", postalCode: "8058", contactPhone: "+41 44 555 70 70",
});

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
  testnutrition: [
    ["product", "NMN 500, 60 capsules", "Nicotinamide mononucleotide for cellular energy and healthy ageing.", 8900, null, ["radiance"]],
    ["product", "Marine Collagen Peptides, 300 g", "Type I collagen with vitamin C for skin elasticity and hydration from within.", 6900, null, ["lines", "hydration"]],
    ["product", "Omega 3 Ultra, 90 capsules", "High dose EPA and DHA from wild fish oil, for heart, brain and calm skin.", 5400, null, ["redness"]],
    ["product", "Vitamin D3 and K2 Drops", "For bones, immunity and energy, especially in the darker months.", 3200, null, []],
  ],
  testprevention: [
    ["program", "Annual Prevention Check-up", "Half a day: blood panel, heart, metabolism and skin check, with a physician's plan.", 145000, null, []],
    ["treatment", "Vitamin Infusion", "Personalised infusion with vitamin C, B complex and minerals, 45 minutes.", 29000, "from", ["radiance"]],
    ["program", "Sleep and Stress Reset", "Six weeks with sleep diagnostics, coaching and a personal plan.", 180000, null, []],
    ["product", "Prevention Starter Kit", "The clinic's own vitamins, sleep tea and magnesium, for daily care.", 9800, null, []],
  ],
  testestate: [
    ["property", "Lake View Villa, Küsnacht", "Seven rooms, 320 m², private lake access, garden and pool.", 1250000000, null, []],
    ["property", "Penthouse, Zurich Seefeld", "Five and a half rooms, 210 m², terrace over the lake, two parking spaces.", 680000000, null, []],
    ["service", "Sell your property", "A discreet valuation and sale, also off market, to qualified buyers.", null, null, []],
  ],
  testairline: [
    ["flight", "Zurich to Dubai, First Class", "Daily evening departure, private suite with a flat bed, chauffeur at both ends.", 790000, "from", []],
    ["flight", "Zurich to New York, First Class", "Morning departure, lounge and fast track, arrival the same afternoon.", 950000, "from", []],
    ["flight", "Private Jet, Zurich to Nice", "Light jet for up to six guests, departure at the time you choose.", 1800000, "from", []],
    ["service", "Private Travel Concierge", "One person for your whole journey: flights, transfers, hotels, tables and tickets, arranged and changed at any hour.", null, null, []],
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
