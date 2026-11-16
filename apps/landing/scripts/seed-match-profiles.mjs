/**
 * Seeds TheONE MATCH test profiles, so suggestions have someone to show.
 *
 *   node --env-file=.env.local scripts/seed-match-profiles.mjs
 *
 * Creates test members (flagged `isTestAccount: true`, like the other seeded
 * accounts) with match profiles flagged `isTest: true`. Test profiles are only
 * ever suggested to test accounts, never to a real member.
 *
 * Two of the men have already said yes to `testmember`, so a yes from her side
 * turns into a match straight away and the whole path can be tried.
 *
 * Re-running is safe: accounts are matched on username, profiles on account.
 * Remove later with:
 *   db.matchProfiles.deleteMany({ isTest: true })
 *   db.matchDecisions.deleteMany({})   // test-only data so far
 *   db.accounts.deleteMany({ username: /^matchtest/ })
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
const keyed = (value) => createHash("sha256").update(`${secret}:${value}`).digest("hex");
const PASSWORD = process.env.TEST_PASSWORD ?? "TestPassword2026!";
const year = new Date().getUTCFullYear();

const anyWishes = (ageMin, ageMax, extra = {}) => ({
  ageMin,
  ageMax,
  heightMin: null,
  heightMax: null,
  hairColors: [],
  eyeColors: [],
  figures: [],
  ...extra,
});

const PEOPLE = [
  {
    username: "matchtest-maximilian",
    displayName: "Maximilian Berger",
    likesTestmember: true,
    profile: {
      gender: "man", seeking: "woman", birthYear: year - 46, heightCm: 186,
      hairColor: "brown", eyeColor: "blue", figure: "athletic",
      profession: "Unternehmer", city: "Zurich",
      hobbies: ["golf", "sailing", "travel", "wine"], intention: "relationship",
      about: "Ich segle am Wochenende auf dem Zürichsee und koche gern für Freunde.",
      wishes: anyWishes(32, 50, { figures: ["slim", "athletic"] }),
    },
  },
  {
    username: "matchtest-alexander",
    displayName: "Alexander König",
    likesTestmember: true,
    profile: {
      gender: "man", seeking: "woman", birthYear: year - 52, heightCm: 182,
      hairColor: "grey", eyeColor: "green", figure: "average",
      profession: "Arzt", city: "Zurich",
      hobbies: ["art", "culture", "travel", "wellness"], intention: "relationship",
      about: "Kunst, gute Gespräche und lange Spaziergänge am See.",
      wishes: anyWishes(35, 55),
    },
  },
  {
    username: "matchtest-julian",
    displayName: "Julian Hofmann",
    profile: {
      gender: "man", seeking: "woman", birthYear: year - 41, heightCm: 179,
      hairColor: "blonde", eyeColor: "blue", figure: "athletic",
      profession: "Architekt", city: "Munich",
      hobbies: ["skiing", "tennis", "fitness", "music"], intention: "dating",
      about: "Im Winter auf der Piste, im Sommer auf dem Tennisplatz.",
      wishes: anyWishes(30, 48),
    },
  },
  {
    username: "matchtest-constantin",
    displayName: "Constantin Weber",
    profile: {
      gender: "man", seeking: "woman", birthYear: year - 58, heightCm: 188,
      hairColor: "grey", eyeColor: "brown", figure: "strong",
      profession: "Anwalt", city: "Vienna",
      hobbies: ["riding", "culture", "wine", "reading"], intention: "relationship",
      about: "Oper, Pferde und ein gutes Glas Wein.",
      wishes: anyWishes(40, 60),
    },
  },
  {
    username: "matchtest-leon",
    displayName: "Leon Fischer",
    profile: {
      gender: "man", seeking: "woman", birthYear: year - 37, heightCm: 191,
      hairColor: "black", eyeColor: "brown", figure: "athletic",
      profession: "Pilot", city: "Zurich",
      hobbies: ["travel", "fitness", "cooking", "nature"], intention: "relationship",
      about: "Viel unterwegs, aber auf der Suche nach einem Zuhause.",
      wishes: anyWishes(28, 45),
    },
  },
  {
    username: "matchtest-sophie",
    displayName: "Sophie Lang",
    profile: {
      gender: "woman", seeking: "man", birthYear: year - 39, heightCm: 168,
      hairColor: "blonde", eyeColor: "green", figure: "slim",
      profession: "Designerin", city: "Munich",
      hobbies: ["fashion", "art", "yoga", "travel"], intention: "relationship",
      about: "Kreativ, neugierig und gern am Meer.",
      wishes: anyWishes(35, 52),
    },
  },
  {
    username: "matchtest-valentina",
    displayName: "Valentina Rossi",
    profile: {
      gender: "woman", seeking: "man", birthYear: year - 44, heightCm: 172,
      hairColor: "brown", eyeColor: "brown", figure: "curvy",
      profession: "Hotelière", city: "Lucerne",
      hobbies: ["cooking", "wine", "dancing", "wellness"], intention: "dating",
      about: "Gastgeberin aus Leidenschaft.",
      wishes: anyWishes(38, 58),
    },
  },
];

const mongo = await new MongoClient(uri).connect();
const db = mongo.db(dbName);
const now = new Date();
const passwordHash = await hash(PASSWORD, 12);

const testmember = await db.collection("accounts").findOne({ username: "testmember" });
if (!testmember) {
  console.error("\n✖ testmember not found. Run scripts/seed-test-users.mjs first.\n");
  process.exit(1);
}

for (const person of PEOPLE) {
  const email = `${person.username}@theone.test`;
  const account = await db.collection("accounts").findOneAndUpdate(
    { username: person.username },
    {
      $set: {
        role: "member", status: "active", username: person.username, email,
        emailHash: keyed(email), phone: null, displayName: person.displayName,
        locale: "de", passwordHash, partnerTier: null,
        stripeCustomerId: null, stripeSubscriptionId: null, currentPeriodEnd: null,
        freeMonthsGranted: 0, freeUntil: null, successfulReferrals: 0,
        referralFreeMonthsGranted: 0, invitedByAccountId: null,
        referralCreditedAt: null, applicationId: null, isTestAccount: true,
        updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), createdAt: now, lastLoginAt: null },
    },
    { upsert: true, returnDocument: "after" },
  );

  await db.collection("matchProfiles").updateOne(
    { accountId: account._id },
    {
      $set: {
        ...person.profile,
        firstName: person.displayName.split(" ")[0],
        photos: [],
        visible: true,
        isTest: true,
        updatedAt: now,
      },
      $setOnInsert: { _id: new ObjectId(), accountId: account._id, createdAt: now },
    },
    { upsert: true },
  );

  if (person.likesTestmember) {
    await db.collection("matchDecisions").updateOne(
      { fromId: account._id, toId: testmember._id },
      {
        $set: { decision: "like" },
        $setOnInsert: { _id: new ObjectId(), createdAt: now },
      },
      { upsert: true },
    );
  }

  console.log(`  ✓ ${person.displayName} (${person.profile.gender}, ${person.profile.city})`);
}

await mongo.close();
console.log(`\n${PEOPLE.length} MATCH test profiles ready. Password: TEST_PASSWORD or the default.\n`);
