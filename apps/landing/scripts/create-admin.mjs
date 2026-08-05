/**
 * Seeds an administrator account.
 *
 *   pnpm admin:create <email> <username> <password>
 *
 * Administrators are not self-service — there is no "sign up as admin" path
 * anywhere in the product, so this script is the only way one comes into
 * existence. The address must appear in ADMIN_EMAILS, so obtaining the
 * database alone is not enough; you also need the deployment's configuration.
 *
 * Runs outside Next, so it talks to MongoDB directly rather than importing the
 * app's `server-only` modules.
 */
import { createHash } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { hash } from "bcryptjs";

const [email, username, password] = process.argv.slice(2);

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

if (!email || !username || !password) {
  fail("Usage: pnpm admin:create <email> <username> <password>");
}

const uri = process.env.MONGODB_URI;
if (!uri) fail("MONGODB_URI is not set. Run with `node --env-file=.env.local`.");

const allowlist = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

const normalisedEmail = email.trim().toLowerCase();
const normalisedUsername = username.trim().toLowerCase();

if (allowlist.length === 0) {
  fail("ADMIN_EMAILS is empty. Add the address to it before seeding an admin.");
}
if (!allowlist.includes(normalisedEmail)) {
  fail(`${normalisedEmail} is not in ADMIN_EMAILS.`);
}
if (!/^[a-z0-9_.]{3,24}$/.test(normalisedUsername)) {
  fail("Username must be 3–24 characters of a–z, 0–9, underscore, or dot.");
}
if (password.length < 10) {
  fail("Use a password of at least 10 characters.");
}

const hashSecret = process.env.HASH_SECRET ?? process.env.SESSION_SECRET ?? "";
const keyedHash = (value) =>
  createHash("sha256").update(`${hashSecret}:${value}`).digest("hex");

const client = await new MongoClient(uri).connect();
const db = client.db(process.env.MONGODB_DB || "theone");
const accounts = db.collection("accounts");

await accounts.createIndex({ username: 1 }, { unique: true });
await accounts.createIndex({ email: 1 }, { unique: true });

const now = new Date();

try {
  const existing = await accounts.findOne({ email: normalisedEmail });

  if (existing) {
    // Re-running should reset the password rather than fail — this is the
    // recovery path when an admin is locked out.
    await accounts.updateOne(
      { _id: existing._id },
      {
        $set: {
          role: "admin",
          status: "active",
          passwordHash: await hash(password, 12),
          updatedAt: now,
        },
      },
    );
    console.log(`\n✔ Updated existing admin ${normalisedEmail} (password reset).\n`);
  } else {
    await accounts.insertOne({
      _id: new ObjectId(),
      applicationId: null,
      role: "admin",
      status: "active",
      username: normalisedUsername,
      email: normalisedEmail,
      emailHash: keyedHash(normalisedEmail),
      phone: null,
      displayName: normalisedUsername,
      locale: "de",
      passwordHash: await hash(password, 12),
      partnerTier: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodEnd: null,
      freeMonthsGranted: 0,
      freeUntil: null,
      successfulReferrals: 0,
      referralFreeMonthsGranted: 0,
      invitedByAccountId: null,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    });
    console.log(`\n✔ Created admin ${normalisedEmail} (username: ${normalisedUsername}).\n`);
  }
} catch (error) {
  if (error?.code === 11000) {
    fail(`That username is already taken by another account.`);
  }
  throw error;
} finally {
  await client.close();
}
