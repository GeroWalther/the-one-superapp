/**
 * Adds BEAUTY5 (beauty5.shop, Palma de Mallorca) to TheONE SELECTION as a
 * business partner, with its products, prices, texts and pictures taken from
 * the shop itself (WooCommerce Store API). The texts stay the manufacturer's
 * own, word for word.
 *
 *   node --env-file=.env.local scripts/add-partner-beauty5.mjs
 *
 * Re-running refreshes the products from the shop. The partner account gets
 * no usable password: it is signed into only after a password reset.
 */
import { createHash, randomBytes } from "node:crypto";
import { MongoClient, ObjectId } from "mongodb";
import { hash } from "bcryptjs";

const uri = process.env.MONGODB_URI;
const secret = process.env.HASH_SECRET ?? process.env.SESSION_SECRET;
if (!uri || !secret) {
  console.error("MONGODB_URI and HASH_SECRET must be set.");
  process.exit(1);
}
const keyed = (v) => createHash("sha256").update(`${secret}:${v}`).digest("hex");

// Which TheONE SKIN SCAN readings each product helps with, so the skin scan
// and POWER AI can recommend it. Supplements and hair care have none.
const CONCERNS = {
  113: ["pores"],
  124: ["pores", "hydration"],
  128: ["redness"],
  193: ["radiance", "evenness"],
  196: ["hydration", "lines"],
  197: ["redness", "pores"],
  236: ["hydration"],
  257: ["lines", "radiance"],
  262: ["lines"],
  269: [],
  289: ["lines"],
  332: ["hydration", "pores"],
  455: [],
  470: ["radiance", "hydration"],
};

// The serums and bottles first, the powders in jars (SKIN GLOW, WELLBEING
// ENERGY) last: the owner wants bottles to lead, not two jars side by side.
const ORDER = [289, 196, 262, 128, 193, 257, 124, 113, 197, 332, 269, 236, 470, 455];
const rank = (id) => (ORDER.includes(id) ? ORDER.indexOf(id) : ORDER.length);

const decode = (s) =>
  s.replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#8211;|&#8212;/g, ",").replace(/&#8217;/g, "’")
    .replace(/&#8220;|&#8222;/g, "„").replace(/&#8221;/g, "“").replace(/&quot;/g, '"');

/** The shop's short description as plain text: size, promise, benefits. */
function text(html) {
  const lines = [];
  for (const m of html.matchAll(/<(p|h4|li)[^>]*>([\s\S]*?)<\/\1>/g)) {
    const t = decode(m[2].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
    if (!t) continue;
    lines.push(m[1] === "li" ? `• ${t}` : m[1] === "h4" ? `\n${t}` : t);
  }
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const response = await fetch("https://beauty5.shop/wp-json/wc/store/v1/products?per_page=50");
if (!response.ok) throw new Error(`beauty5.shop answered ${response.status}`);
const products = (await response.json()).sort((a, b) => rank(a.id) - rank(b.id));

const mongo = await new MongoClient(uri).connect();
const db = mongo.db(process.env.MONGODB_DB ?? "theone");
const now = new Date();
const username = "beauty5";
const email = "shop@beauty5.shop";

const existing = await db.collection("accounts").findOne({ username });
const account = await db.collection("accounts").findOneAndUpdate(
  { username },
  {
    $set: { role: "partner", status: "active", username, email, emailHash: keyed(email), displayName: "BEAUTY5", locale: "de", updatedAt: now },
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
      accountId: account._id, name: "BEAUTY5", category: "beauty", focusArea: "beauty",
      description: "High Tech Nature Skincare: biologische, hochwertige Pflege mit Callus-Stammzellen und ausgewählten Pflanzenwirkstoffen, entwickelt mit einem französischen Labor. Dazu Beauty from Within und Longevity für jeden Tag. Luxus für jeden Tag.",
      targetClientele: "Alle, die hochwertige, natürliche Hautpflege mit nachgewiesener Wirkung suchen.",
      city: "", country: "", street: null, postalCode: null, // no address or place: bought in the online shop (owner's wish)
      website: "https://beauty5.shop", contactEmail: email, contactPhone: "",
      images: ["https://beauty5.shop/wp-content/uploads/2026/11/skin-glow-frau-strand.jpg"],
      sortOrder: 1, published: true, isTestAccount: false, updatedAt: now,
    },
    $setOnInsert: { _id: new ObjectId(), createdAt: now },
  },
  { upsert: true },
);
const profile = await db.collection("partnerProfiles").findOne({ accountId: account._id });

await db.collection("offerings").deleteMany({ partnerProfileId: profile._id });
const docs = products.map((p, i) => ({
  _id: new ObjectId(),
  partnerProfileId: profile._id,
  kind: "product",
  title: decode(p.name),
  description: text(p.short_description),
  priceCents: Number(p.prices.price),
  currency: p.prices.currency_code,
  priceNote: null,
  imageUrl: p.images[0]?.src ?? null,
  concerns: CONCERNS[p.id] ?? [],
  url: p.permalink,
  published: true,
  isTestAccount: false,
  createdAt: new Date(now.getTime() + i),
  updatedAt: now,
}));
await db.collection("offerings").insertMany(docs);
console.log(`BEAUTY5: ${docs.length} products`);
for (const d of docs) console.log(`  ${d.title}, ${(d.priceCents / 100).toFixed(2)} ${d.currency}, ${d.concerns.join("/") || "-"}`);
await mongo.close();
