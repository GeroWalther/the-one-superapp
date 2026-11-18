/**
 * Adds TheONE personalcare (www.theone-personalcare.com) to TheONE SELECTION
 * as a business partner: its three products with prices, pictures and the
 * shop's own texts, word for word, each linking to its page in the shop,
 * where it is bought. Like BEAUTY5, no address: everything is bought online.
 *
 *   node --env-file=.env.local scripts/add-partner-theone-personalcare.mjs
 *
 * The copy is the German shop copy (the-one-prodshop src/messages/de.json).
 * The partner account gets no usable password until a password reset.
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
const SITE = "https://www.theone-personalcare.com";
const NOTE = "* Herstellerangaben auf Basis von Wirkstoff- bzw. In-vivo-Studien.";

const PRODUCTS = [
  {
    title: "TheONE Women",
    priceCents: 12900,
    image: `${SITE}/images/theone/theonesuccess-1024x1024-1.png`,
    url: `${SITE}/de/boutique/theone-women`,
    concerns: [],
    lines: [
      "10 ml · geruchlos",
      "Für mehr Selbstbewusstsein und eine Ausstrahlung, die andere spüren. Laut In-vivo-Studie steigert TheONE die Anziehungskraft um 269 %.*",
      "\nIhre Vorteile",
      "• +269 % Anziehungskraft, bestätigt in einer In-vivo-Studie*",
      "• Weckt die natürliche Wirkung der Pheromone um ein Vielfaches*",
      "• Mehr Wohlbefinden, Selbstbewusstsein und innere Stärke",
      "• Kein Parfum: geruchlos und mit jedem Duft kombinierbar",
    ],
  },
  {
    title: "TheONE Men",
    priceCents: 11900,
    image: `${SITE}/images/theone/The_ONE_men-600x600.jpg`,
    url: `${SITE}/de/boutique/theone-men`,
    concerns: [],
    lines: [
      "10 ml · geruchlos",
      "Mehr Fokus, innere Stärke und Präsenz. Für einen souveränen Auftritt im Business und in der Beziehung. Das Gefühl: Nichts kann mich aufhalten.",
      "\nIhre Vorteile",
      "• „Turbo-Effekt“ bei der Testosteronbildung, laut In-vivo-Studie des Herstellers*",
      "• Attraktivität und Kraft um bis zu 300 % gesteigert*",
      "• Mehr Fokus, Selbstvertrauen und Selbstbewusstsein",
      "• Kein Parfum: geruchlos und mit jedem Duft kombinierbar",
    ],
  },
  {
    title: "JOYSKIN Cream",
    priceCents: 9900,
    image: `${SITE}/images/theone/JOYSKIN-1-1-600x600.jpg`,
    url: `${SITE}/de/boutique/joyskin`,
    concerns: ["lines", "hydration"],
    lines: [
      "100 ml Gesichtspflege",
      "Sieht nicht nur gut aus, fühlt sich auch gut an. Weniger Krähenfüße (−28,4 %) und spürbar mehr positive Stimmung.*",
      "\nIhre Vorteile",
      "• Krähenfüße −28,4 %, Nasolabialfalten −24 %*",
      "• Steigert das Glückshormon Dopamin für mehr Ausgeglichenheit*",
      "• Bis zu +50 % positive Stimmung, −50 % emotionaler Stress*",
      "• Spendet intensive Feuchtigkeit, fördert Kollagen und ein jüngeres Aussehen",
    ],
  },
];

const mongo = await new MongoClient(uri).connect();
const db = mongo.db(process.env.MONGODB_DB ?? "theone");
const now = new Date();
const username = "theonepersonalcare";
const email = "info@theone-personalcare.com";

const existing = await db.collection("accounts").findOne({ username });
const account = await db.collection("accounts").findOneAndUpdate(
  { username },
  {
    $set: { role: "partner", status: "active", username, email, emailHash: keyed(email), displayName: "TheONE personalcare", locale: "de", updatedAt: now },
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
      accountId: account._id, name: "TheONE personalcare", category: "beauty", focusArea: "beauty",
      description: "Mehr Anziehungskraft durch Ihre Pheromone: TheONE verstärkt ihre natürliche Wirkung um ein Vielfaches. Vegan, Halal, geruchlos. Dazu JOYSKIN Cream, Longevity-Skincare mit Award-Winner-Wirkstoff. Ligne GOLF AL MAR healthcare laboratories, Familienunternehmen seit 35 Jahren.",
      targetClientele: "Frauen und Männer, die mehr Ausstrahlung, Selbstbewusstsein und Anziehungskraft möchten, im Business und in der Beziehung.",
      // No address: everything is bought in the online shop.
      city: "", country: "", street: null, postalCode: null,
      website: SITE, contactEmail: email, contactPhone: "",
      images: [`${SITE}/images/theone/TheONE_yourSuccess.jpg`],
      sortOrder: 2, published: true, isTestAccount: false, updatedAt: now,
    },
    $setOnInsert: { _id: new ObjectId(), createdAt: now },
  },
  { upsert: true },
);
const profile = await db.collection("partnerProfiles").findOne({ accountId: account._id });

await db.collection("offerings").deleteMany({ partnerProfileId: profile._id });
const docs = PRODUCTS.map((p, i) => ({
  _id: new ObjectId(),
  partnerProfileId: profile._id,
  kind: "product",
  title: p.title,
  description: [...p.lines, "", NOTE].join("\n"),
  priceCents: p.priceCents,
  currency: "EUR",
  priceNote: null,
  imageUrl: p.image,
  concerns: p.concerns,
  url: p.url,
  published: true,
  isTestAccount: false,
  createdAt: new Date(now.getTime() + i),
  updatedAt: now,
}));
await db.collection("offerings").insertMany(docs);
console.log(`TheONE personalcare: ${docs.length} products`);
await mongo.close();
