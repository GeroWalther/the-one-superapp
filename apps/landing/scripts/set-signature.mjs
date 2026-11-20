/**
 * Makes one product a brand's signature in its TheONE MARKETPLACE boutique:
 * the boutique shows a brand's products oldest first, so the chosen one is
 * dated just before the others. Product ids stay the same, so nothing that
 * points at them (saved items, TheONE SKIN SCAN picks) breaks.
 *
 *   node --env-file=.env.local scripts/set-signature.mjs "BIOPLANTPHARMA" "DOLOArthritis"
 */
import { MongoClient } from "mongodb";

const [brand, titleStart] = process.argv.slice(2);
const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db(process.env.MONGODB_DB || undefined);
const profile = await db.collection("partnerProfiles").findOne({ name: brand });
if (!profile) throw new Error(`No brand called ${brand}`);
const offerings = db.collection("offerings");
const all = await offerings.find({ partnerProfileId: profile._id }).sort({ createdAt: 1 }).toArray();
const chosen = all.find((o) => o.title.toLowerCase().startsWith(titleStart.toLowerCase()));
if (!chosen) throw new Error(`No product of ${brand} starting with ${titleStart}`);
const first = all[0].createdAt;
await offerings.updateOne({ _id: chosen._id }, { $set: { createdAt: new Date(first.getTime() - 1000) } });
console.log(`${brand}: signature is now ${chosen.title}`);
await client.close();
