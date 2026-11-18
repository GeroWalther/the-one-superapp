/**
 * Adds a brand with a WooCommerce shop to TheONE SELECTION, as its own
 * section: profile, cover picture, and every product with price, picture and
 * the shop's own text, word for word, each linking to its page in the shop.
 * Brands sold online show no address.
 *
 *   node --env-file=.env.local scripts/add-woo-brand.mjs scripts/brands/<brand>.json
 *
 * Re-running refreshes the products from the shop. The partner account gets
 * no usable password: it is signed into only after a password reset.
 */
import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { hash } from "bcryptjs";

const config = JSON.parse(readFileSync(process.argv[2], "utf8"));
const uri = process.env.MONGODB_URI;
const secret = process.env.HASH_SECRET ?? process.env.SESSION_SECRET;
if (!uri || !secret) {
  console.error("MONGODB_URI and HASH_SECRET must be set.");
  process.exit(1);
}
const keyed = (v) => createHash("sha256").update(`${secret}:${v}`).digest("hex");

const order = config.order ?? [];
const rank = (id) => (order.includes(id) ? order.indexOf(id) : order.length);

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#8211;|&#8212;|–|—/g, ",").replace(/&#8217;/g, "’")
    .replace(/&#8220;|&#8222;/g, "„").replace(/&#8221;/g, "“").replace(/&quot;/g, '"').replace(/&#038;/g, "&");

/** The shop's short description as plain text: size, promise, benefits. */
function text(html) {
  const lines = [];
  for (const m of html.matchAll(/<(p|h[1-6]|li)[^>]*>([\s\S]*?)<\/\1>/g)) {
    const t = decode(m[2].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (!t || lines.at(-1)?.replace(/^• /, "") === t) continue;
    lines.push(m[1] === "li" ? `• ${t}` : m[1].startsWith("h") ? `\n${t}` : t);
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// A WooCommerce shop is read live; a shop without one (Next.js) lists its
// products in the config, with the site's own texts.
let products = [];
if (config.shop) {
  const response = await fetch(`${config.shop}/wp-json/wc/store/v1/products?per_page=100`);
  if (!response.ok) throw new Error(`${config.shop} answered ${response.status}`);
  products = (await response.json())
    .filter((p) => !(config.skip ?? []).includes(p.id))
    .sort((a, b) => rank(a.id) - rank(b.id));
}

const mongo = await new MongoClient(uri).connect();
const db = mongo.db(process.env.MONGODB_DB ?? "theone");
const now = new Date();
const { username, email, name } = config;

const existing = await db.collection("accounts").findOne({ username });
const account = await db.collection("accounts").findOneAndUpdate(
  { username },
  {
    $set: { role: "partner", status: "active", username, email, emailHash: keyed(email), displayName: name, locale: config.locale ?? "en", updatedAt: now },
    $setOnInsert: {
      _id: new ObjectId(), phone: null,
      passwordHash: existing?.passwordHash ?? (await hash(randomBytes(32).toString("hex"), 12)),
      partnerTier: "small", stripeCustomerId: null, stripeSubscriptionId: null, currentPeriodEnd: null,
      freeMonthsGranted: 0, freeUntil: null, successfulReferrals: 0, referralFreeMonthsGranted: 0,
      invitedByAccountId: null, referralCreditedAt: null, applicationId: null, isTestAccount: false,
      createdAt: now, lastLoginAt: null,
    },
  },
  { upsert: true, returnDocument: "after" },
);

await db.collection("partnerProfiles").updateOne(
  { accountId: account._id },
  {
    $set: {
      accountId: account._id, name, category: "beauty", focusArea: "beauty",
      description: config.description, targetClientele: config.targetClientele,
      // No address or place: everything is bought in the online shop.
      city: "", country: "", street: null, postalCode: null,
      website: config.website, contactEmail: email, contactPhone: "",
      images: [config.cover],
      ...(config.sortOrder ? { sortOrder: config.sortOrder } : {}),
      tagline: config.tagline ?? null,
      badges: config.badges ?? [],
      // "published": false in the config hides a brand from the app without
      // deleting anything (e.g. until the brand has paid).
      published: config.published !== false, isTestAccount: false, updatedAt: now,
    },
    $setOnInsert: { _id: new ObjectId(), createdAt: now },
  },
  { upsert: true },
);
const profile = await db.collection("partnerProfiles").findOne({ accountId: account._id });

await db.collection("offerings").deleteMany({ partnerProfileId: profile._id });
const minor = (p) => 10 ** (p.prices.currency_minor_unit ?? 2);
const fromShop = products.map((p, i) => ({
  _id: new ObjectId(),
  partnerProfileId: profile._id,
  kind: "product",
  title: decode(p.name),
  description: text(p.short_description),
  priceCents: Math.round((Number(p.prices.price) / minor(p)) * 100),
  currency: p.prices.currency_code,
  priceNote: null,
  imageUrl: p.images[0]?.src ?? null,
  concerns: config.concerns?.[p.id] ?? [],
  url: p.permalink,
  published: config.published !== false,
  isTestAccount: false,
  createdAt: new Date(now.getTime() + i),
  updatedAt: now,
}));
const listed = (config.products ?? []).map((p, i) => ({
  _id: new ObjectId(),
  partnerProfileId: profile._id,
  kind: "product",
  title: p.title,
  description: p.description,
  priceCents: p.priceCents,
  currency: p.currency ?? "EUR",
  priceNote: p.priceNote ?? null,
  imageUrl: p.image,
  concerns: p.concerns ?? [],
  url: p.url,
  published: config.published !== false,
  isTestAccount: false,
  createdAt: new Date(now.getTime() + i),
  updatedAt: now,
}));
const docs = [...fromShop, ...listed];
await db.collection("offerings").insertMany(docs);
console.log(`${name}: ${docs.length} products`);
for (const d of docs) console.log(`  ${d.title}, ${(d.priceCents / 100).toFixed(2)} ${d.currency}, ${d.concerns.join("/") || "-"}`);
await mongo.close();
