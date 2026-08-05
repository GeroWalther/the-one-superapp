/**
 * Seeds always-live test accounts.
 *
 *   node --env-file=.env.local scripts/seed-test-users.mjs
 *
 * These accounts skip the application, approval, activation and payment steps
 * entirely and land straight in `active`, which is the only status the iOS app
 * will sign in. They exist so the product can be exercised before Stripe and a
 * mail provider are wired up.
 *
 * Every account is flagged `isTestAccount: true` so they stay findable and can
 * be removed in one query. A seeded account must never be mistaken for someone
 * who actually applied and paid.
 *
 * Re-running is safe: accounts are matched on username and overwritten.
 */
import { createHash } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { hash } from "bcryptjs";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("\n✖ MONGODB_URI is not set. Run with `node --env-file=.env.local`.\n");
  process.exit(1);
}

const dbName = process.env.MONGODB_DB ?? "theone";
const secret = process.env.HASH_SECRET ?? process.env.SESSION_SECRET;
if (!secret) {
  console.error("\n✖ HASH_SECRET (or SESSION_SECRET) must be set.\n");
  process.exit(1);
}

const keyed = (value) =>
  createHash("sha256").update(`${secret}:${value}`).digest("hex");

const PASSWORD = process.env.TEST_PASSWORD ?? "TestPassword2026!";

/* Two members and three partners. The partners deliberately span different
   categories and cities so Discover's filters and the assistant's
   `search_partners` tool have something to actually discriminate between —
   five identical clinics would make a broken filter look like it works. */
const MEMBERS = [
  {
    username: "testmember",
    email: "member@theone.test",
    displayName: "Alexandra Reinhardt",
    city: "Zurich",
    focusAreas: ["health", "wellness"],
  },
  {
    username: "testmember2",
    email: "member2@theone.test",
    displayName: "Jonas Brenner",
    city: "Munich",
    focusAreas: ["property", "insurance"],
  },
];

const PARTNERS = [
  {
    username: "testclinic",
    email: "clinic@theone.test",
    displayName: "Alpine Longevity Clinic",
    tier: "large",
    profile: {
      category: "clinic",
      focusArea: "health",
      description:
        "Full diagnostic workups, hormone optimisation, and multi-year preventive programmes supervised by board-certified physicians.",
      targetClientele: "Members seeking long-term, evidence-led care.",
      city: "Zurich",
      country: "Switzerland",
      street: "Bahnhofstrasse 1",
      postalCode: "8001",
      website: "https://example.com",
      contactPhone: "+41 44 111 22 33",
    },
  },
  {
    username: "testdental",
    email: "dental@theone.test",
    displayName: "Zurich Dental Institute",
    tier: "small",
    profile: {
      category: "practice",
      focusArea: "health",
      description:
        "Same-week emergency appointments, implantology, and aesthetic dentistry in the city centre.",
      targetClientele: "Members needing urgent or complex dental work.",
      city: "Zurich",
      country: "Switzerland",
      street: "Seefeldstrasse 40",
      postalCode: "8008",
      website: "https://example.com",
      contactPhone: "+41 44 222 33 44",
    },
  },
  {
    username: "testresort",
    email: "resort@theone.test",
    displayName: "Lakeside Wellness Resort",
    tier: "large",
    profile: {
      category: "resort",
      focusArea: "wellness",
      description:
        "Lakefront retreat with medical spa, thermal circuit, and structured recovery programmes.",
      targetClientele: "Members recovering from surgery or sustained stress.",
      city: "Lucerne",
      country: "Switzerland",
      street: "Seestrasse 12",
      postalCode: "6006",
      website: "https://example.com",
      contactPhone: "+41 41 333 44 55",
    },
  },
];

const mongo = await new MongoClient(uri).connect();
const db = mongo.db(dbName);
const now = new Date();

async function upsertAccount({ username, email, displayName, role, tier }) {
  const passwordHash = await hash(PASSWORD, 12);

  const result = await db.collection("accounts").findOneAndUpdate(
    { username },
    {
      $set: {
        role,
        status: "active",
        username,
        email,
        emailHash: keyed(email),
        phone: null,
        displayName,
        locale: "en",
        passwordHash,
        partnerTier: tier ?? null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodEnd: null,
        freeMonthsGranted: 0,
        freeUntil: null,
        successfulReferrals: 0,
        referralFreeMonthsGranted: 0,
        invitedByAccountId: null,
        referralCreditedAt: null,
        applicationId: null,
        isTestAccount: true,
        updatedAt: now,
      },
      /* Cleared, not just overwritten: an edited profile takes precedence over
         enrolment answers, so leaving one behind means re-seeding does not
         actually restore the state the script claims to. */
      $unset: { profile: "" },
      $setOnInsert: { _id: new ObjectId(), createdAt: now, lastLoginAt: null },
    },
    { upsert: true, returnDocument: "after" },
  );

  return result._id;
}

for (const member of MEMBERS) {
  const id = await upsertAccount({ ...member, role: "member" });

  /* The assistant reads enrolment answers to personalise advice, so a seeded
     member with no application would get generic output and look broken. */
  await db.collection("applications").updateOne(
    { email: member.email },
    {
      $set: {
        type: "member",
        status: "approved",
        email: member.email,
        phone: null,
        emailHash: keyed(member.email),
        phoneHash: null,
        displayName: member.displayName,
        locale: "en",
        data: {
          type: "member",
          fullName: member.displayName,
          email: member.email,
          phone: "+41 79 000 00 00",
          dateOfBirth: "1985-01-01",
          country: "Switzerland",
          city: member.city,
          focusAreas: member.focusAreas,
          goal: "clarity",
          horizon: "now",
          referralSource: "search",
          context: "Seeded test account.",
          inviteCode: "",
          consent: "on",
        },
        invitationId: null,
        inviterAccountId: null,
        partnerTier: null,
        grantedFreeMonths: 0,
        reviewedAt: now,
        reviewedByAccountId: null,
        internalReason: null,
        isTestAccount: true,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );

  console.log(`member   ${member.username.padEnd(14)} ${member.email}  (${id})`);
}

for (const partner of PARTNERS) {
  const id = await upsertAccount({ ...partner, role: "partner" });

  await db.collection("partnerProfiles").updateOne(
    { accountId: id },
    {
      $set: {
        accountId: id,
        name: partner.displayName,
        ...partner.profile,
        contactEmail: partner.email,
        images: [],
        published: true,
        isTestAccount: true,
        updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), createdAt: now },
    },
    { upsert: true },
  );

  console.log(`partner  ${partner.username.padEnd(14)} ${partner.email}  (${id})`);
}

console.log(`\n✔ Seeded ${MEMBERS.length} members and ${PARTNERS.length} partners.`);
console.log(`  Password for all of them: ${PASSWORD}`);
console.log(`  Remove later with: db.accounts.deleteMany({ isTestAccount: true })\n`);

await mongo.close();
