import "server-only";
import { ObjectId } from "mongodb";
import type Anthropic from "@anthropic-ai/sdk";
import { appointmentRequests, partnerProfiles } from "../db/collections";
import type { PublicAccount } from "../auth/accounts";
import { getPartner, searchPartners, setSaved } from "../api/partners";
import { getMemberProfile } from "../profile/service";
import { openConversation, sendMessage } from "../api/chat";
import { listSkinScans } from "../skin/service";
import { offeringsForAdvice } from "../selection/service";
import { startPropertySale, listPropertySales, startPropertySearch, PROPERTY_TYPES } from "../realestate/service";
import { COURSE, completeLesson, courseProgress, listLongevityChecks } from "../longevity/service";

/**
 * The assistant's tools.
 *
 * These are what separate a chatbot from something useful: every answer is
 * grounded in the real partner directory and the member's own enrolment
 * answers, and it can act — save a partner, or actually request an appointment
 * — rather than telling the member to go and do it.
 *
 * Descriptions state *when* to call, not only what the tool does. Recent models
 * are conservative about reaching for tools, and trigger conditions in the
 * description measurably raise the should-call rate.
 */

export const ASSISTANT_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_member_profile",
    description:
      "Retrieve this member's own profile: the focus areas, goal, timing, and free-text context they gave when they applied, plus their city and country. Call this at the start of any conversation where personal fit matters — recommendations, health or lifestyle advice, or anything phrased as 'for me'. Do not ask the member to repeat information this returns.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "search_partners",
    description:
      "Search TheONE's verified partner directory. Call this whenever the member needs a service, professional, clinic, hotel, resort, or property — including implicit needs like 'my teeth hurt' or 'I need somewhere to stay in Zurich'. Never recommend a provider from general knowledge: only partners returned by this tool are verified and contactable through the platform.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Free text describing the need, always in English whatever language the member speaks, e.g. 'dentist', 'longevity clinic', 'spa'. The directory is written in English and German.",
        },
        focusArea: {
          type: "string",
          enum: [
            "health",
            "hotels",
            "property",
            "lifestyle",
            "beauty",
            "wellness",
            "insurance",
          ],
          description: "Narrow to one vertical when the need clearly fits one.",
        },
        city: {
          type: "string",
          description:
            "Restrict to a city, spelled in Latin letters as locals write it (Zurich, Munich, Vienna). Use the member's own city for 'near me' requests.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_partner_details",
    description:
      "Full details for one partner, including phone, email, website, and address. Call this before giving a member contact details or proposing an appointment, so the details you pass on are the current ones.",
    input_schema: {
      type: "object",
      properties: {
        partnerId: { type: "string", description: "The partner's id from search_partners." },
      },
      required: ["partnerId"],
      additionalProperties: false,
    },
  },
  {
    name: "save_partner",
    description:
      "Bookmark a partner to the member's saved list. Call this when the member says to save, keep, or remember one.",
    input_schema: {
      type: "object",
      properties: {
        partnerId: { type: "string" },
      },
      required: ["partnerId"],
      additionalProperties: false,
    },
  },
  {
    name: "search_selection",
    description:
      "TheONE MARKETPLACE: the exact products, treatments, programmes and stays that TheONE's business partners offer, with prices. Use it to recommend one specific item rather than a brand. Filter by kind and by the TheONE SKIN SCAN keys an item helps with (hydration, lines, pigmentation, redness, pores, evenness, radiance).",
    input_schema: {
      type: "object",
      properties: {
        kinds: {
          type: "array",
          items: { type: "string", enum: ["product", "treatment", "program", "stay", "flight", "property", "service"] },
        },
        concerns: {
          type: "array",
          items: {
            type: "string",
            enum: ["hydration", "lines", "pigmentation", "redness", "pores", "evenness", "radiance"],
          },
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "sell_property",
    description:
      "TheONE REAL ESTATE: sends the member's home for sale to the two or three best TheONE brokers for its city, each in a conversation of its own, written in the broker's language. Call it once the member has said they want to sell and you know at least the type, city and country; ask for rooms, living area, plot, price idea and timing in one natural question, but never insist. Read the details back in one sentence and get their yes before you call it.",
    input_schema: {
      type: "object",
      properties: {
        propertyType: { type: "string", enum: [...PROPERTY_TYPES] },
        city: { type: "string" },
        country: { type: "string", description: "In English, e.g. Switzerland, Spain, United Arab Emirates." },
        rooms: { type: "number" },
        livingArea: { type: "number", description: "Square metres." },
        plotArea: { type: "number", description: "Square metres." },
        priceIdea: { type: "number", description: "Whole currency units, e.g. 4500000." },
        currency: { type: "string", description: "ISO code, e.g. CHF, EUR, GBP, AED." },
        description: { type: "string", description: "What makes the home special, in the member's words, translated to English." },
        timing: { type: "string", enum: ["now", "months", "exploring"] },
        offMarket: { type: "boolean", description: "True when the member wants a discreet sale." },
      },
      required: ["propertyType", "city", "country"],
      additionalProperties: false,
    },
  },
  {
    name: "find_property",
    description:
      "TheONE REAL ESTATE, buying: sends what the member is looking for to the two or three best TheONE brokers for that place, who answer in the member's Messages with matching properties from their portfolio, off market ones too. Call it when the member wants a home and the estates shown by search_selection do not already fit, once you know at least the place and country; ask in one natural question for type, rooms, size, budget and what matters most, never insist. Read it back in one sentence and get their yes first.",
    input_schema: {
      type: "object",
      properties: {
        propertyTypes: { type: "array", items: { type: "string", enum: [...PROPERTY_TYPES] } },
        city: { type: "string", description: "City or area, e.g. Küsnacht, Mayfair, Palm Jumeirah." },
        country: { type: "string", description: "In English, e.g. Switzerland, United Kingdom." },
        minRooms: { type: "number" },
        minLivingArea: { type: "number", description: "Square metres." },
        budget: { type: "number", description: "Upper limit in whole currency units." },
        currency: { type: "string", description: "ISO code, e.g. CHF, EUR, GBP, AED." },
        description: { type: "string", description: "What matters to the member, in their words, translated to English." },
        timing: { type: "string", enum: ["now", "months", "exploring"] },
      },
      required: ["city", "country"],
      additionalProperties: false,
    },
  },
  {
    name: "get_property_sales",
    description:
      "The member's homes for sale through TheONE REAL ESTATE and which brokers each went to. Call it when they ask how their sale is going or mention selling again.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "complete_course_lesson",
    description:
      "Marks one TheONE LONGEVITY COURSE lesson as done for the member, after you have taught it and given its task. Lessons: mindset, sleep, nutrition, movement, stress, supplements, connection, prevention.",
    input_schema: {
      type: "object",
      properties: {
        lesson: {
          type: "string",
          enum: ["mindset", "sleep", "nutrition", "movement", "stress", "supplements", "connection", "prevention"],
        },
      },
      required: ["lesson"],
      additionalProperties: false,
    },
  },
  {
    name: "get_longevity_check",
    description:
      "The member's latest TheONE LONGEVITY CHECK results: longevity score and six pillars (sleep, stress, movement, nutrition, connection, prevention) 0 to 100 where higher is better, focus, a four week plan, and the exact clinic programmes and products picked for them. Call this whenever the member talks about energy, sleep, stress, ageing, health or living longer, or has just done the check.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "get_skin_analysis",
    description:
      "The member's latest TheONE SKIN SCAN results (face scans): scores 0 to 100 where higher is better, focus areas, routine, and the business partners suggested with them. Call this whenever the member talks about their skin, looking younger or more radiant, or has just done a scan.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "request_appointment",
    description:
      "Request an appointment with a partner on the member's behalf. This opens an in-app conversation and messages the partner directly. Only call this after the member has clearly agreed to being put in touch — never speculatively, and never without naming which partner you are contacting.",
    input_schema: {
      type: "object",
      properties: {
        partnerId: { type: "string" },
        summary: {
          type: "string",
          description:
            "What the member needs, in one or two sentences, written for the partner to read. Write it in the partner's language (German for a partner in a German-speaking country, otherwise English), never in the member's language if that differs, and if the member speaks another language, say which, so the partner can prepare.",
        },
        preferredTiming: {
          type: "string",
          description:
            "The member's stated availability, if they gave any, in the partner's language (German or English), like the summary.",
        },
        memberLanguage: {
          type: "string",
          description:
            "The language the member speaks with you, named in English (\"Japanese\"), so the partner can prepare.",
        },
      },
      required: ["partnerId", "summary"],
      additionalProperties: false,
    },
  },
  {
    name: "draft_email",
    description:
      "Show the member an email you wrote for them, as a card they can edit and then send from their own phone with their own email address. Call it whenever the member asks you to write, answer, reply to or send an email to anyone, straight away and without announcing it first. You never send it yourself: the member reads it, changes it if they like, and sends it. Write it in their voice and sign it with their first name. Write it in the language the recipient reads; when you do not know, use the member's language. If the member wants changes, call this tool again with the full revised email.",
    input_schema: {
      type: "object",
      properties: {
        toName: {
          type: "string",
          description: "The recipient's name as the member said it (\"Anna\", \"Dr. Weber\"). The app looks it up in the member's contacts.",
        },
        toEmail: {
          type: "string",
          description:
            "The recipient's email address, only if the member gave it or it is in this conversation. Never guess or invent an address; leave it out instead.",
        },
        subject: { type: "string", description: "A short, natural subject line." },
        body: {
          type: "string",
          description: "The full email text, from greeting to signature, as plain text with line breaks. No markdown.",
        },
      },
      required: ["subject", "body"],
      additionalProperties: false,
    },
  },
];

/** The fields of an email the assistant drafted, as the app receives them. */
export type EmailDraft = { toName?: string; toEmail?: string; subject: string; body: string };

const EMAIL_ADDRESS = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/;

/**
 * Cleans the draft_email input. The assistant's own text has dashes swapped
 * for commas while it streams; the email is written for the member to send,
 * so it gets the same treatment, and an address that is not one is dropped
 * rather than prefilled.
 */
export function emailDraftFrom(input: Record<string, unknown>): EmailDraft | null {
  const text = (value: unknown, max: number) =>
    typeof value === "string" ? value.replace(/\s*[–—]\s*/g, ", ").trim().slice(0, max) : "";
  const subject = text(input.subject, 200);
  const body = text(input.body, 6000);
  if (!subject || !body) return null;
  const toName = text(input.toName, 120);
  const toEmail = typeof input.toEmail === "string" ? input.toEmail.trim() : "";
  return {
    subject,
    body,
    ...(toName ? { toName } : {}),
    ...(EMAIL_ADDRESS.test(toEmail) && toEmail.length <= 254 ? { toEmail } : {}),
  };
}

export type ToolResult = { content: string; isError?: boolean };

/** Partner countries whose businesses read German; everyone else gets English. */
const GERMAN_SPEAKING = new Set([
  "germany", "deutschland", "austria", "österreich", "switzerland", "schweiz",
  "liechtenstein", "luxembourg", "luxemburg",
]);

/** Latin letters, digits, punctuation, symbols and spaces only. */
const LATIN_ONLY = /^[\p{Script=Latin}\p{N}\p{P}\p{S}\p{Z}\s]*$/u;

export async function runAssistantTool(
  name: string,
  input: Record<string, unknown>,
  account: PublicAccount,
): Promise<ToolResult> {
  const accountId = new ObjectId(account.id);

  try {
    switch (name) {
      case "get_member_profile": {
        /* Prefers what the member has since edited over what they wrote at
           enrolment. Someone who moves to Munich and updates their profile must
           not keep being sent to clinics in Zurich. */
        const profile = await getMemberProfile(account.id);

        if (!profile) {
          return {
            content: JSON.stringify({
              displayName: account.displayName,
              note: "No profile on file for this account.",
            }),
          };
        }

        return {
          content: JSON.stringify({
            displayName: profile.displayName,
            city: profile.city || null,
            country: profile.country || null,
            focusAreas: profile.focusAreas,
            goal: profile.goal,
            context: profile.context || null,
            source: profile.edited ? "profile" : "enrolment answers",
          }),
        };
      }

      case "search_partners": {
        const partners = await searchPartners({
          accountId,
          query: typeof input.query === "string" ? input.query : undefined,
          focusArea:
            typeof input.focusArea === "string" ? input.focusArea : undefined,
          city: typeof input.city === "string" ? input.city : undefined,
          limit: 12,
        });

        if (partners.length === 0) {
          return {
            content:
              "No verified partners matched. Tell the member plainly that TheONE has no verified partner for this need yet rather than suggesting one from outside the network.",
          };
        }

        return { content: JSON.stringify(partners) };
      }

      case "get_partner_details": {
        const partner = await getPartner({
          accountId,
          partnerId: String(input.partnerId ?? ""),
        });
        if (!partner) {
          return {
            content:
              "No partner with that id. The id may be from an earlier turn, which is not preserved. Call search_partners now and use the exact `id` it returns.",
            isError: true,
          };
        }
        return { content: JSON.stringify(partner) };
      }

      case "save_partner": {
        const ok = await setSaved({
          accountId,
          partnerId: String(input.partnerId ?? ""),
          saved: true,
        });
        return ok
          ? { content: "Saved to the member's list." }
          : { content: "No such partner.", isError: true };
      }

      case "search_selection": {
        const items = await offeringsForAdvice({
          accountId: account.id,
          kinds: Array.isArray(input.kinds) ? (input.kinds as never[]) : undefined,
          concerns: Array.isArray(input.concerns) ? (input.concerns as string[]) : undefined,
          limit: 30,
        });
        if (items.length === 0) return { content: "Nothing in TheONE MARKETPLACE matches yet." };
        return {
          content: JSON.stringify(
            items.map((o) => ({
              id: o.id,
              kind: o.kind,
              title: o.title,
              partner: o.partner,
              helpsWith: o.concerns,
              boughtIn: o.url ? "the brand's own shop, from the product page in TheONE MARKETPLACE" : "a request to the business partner",
              price: o.priceCents === null ? "on request" : `${(o.priceCents / 100).toFixed(0)} ${o.currency}${o.priceNote ? " " + o.priceNote : ""}`,
              about: o.description,
            })),
          ),
        };
      }

      case "sell_property": {
        const result = await startPropertySale({
          accountId: account.id,
          displayName: account.displayName,
          property: input as never,
        });
        if (!result.ok) {
          const why = {
            invalid: "Missing or unclear type, city or country. Ask the member for it.",
            limit: "Five sales a day is the limit; it can be sent again tomorrow.",
            no_brokers: "TheONE has no broker for this place yet. Tell the member plainly and offer to look again soon.",
          }[result.reason];
          return { content: why, isError: result.reason === "invalid" };
        }
        return {
          content: `Sent. Brokers reached, each with its own chat in the member's Messages: ${result.sale.brokers
            .map((b) => `${b.name} (${b.city})`)
            .join(", ")}. Tell the member who they are and that they will reply there.`,
        };
      }

      case "find_property": {
        const result = await startPropertySearch({
          accountId: account.id,
          displayName: account.displayName,
          wish: input as never,
        });
        if (!result.ok) {
          const why = {
            invalid: "Missing place or country. Ask the member for it.",
            limit: "Five searches a day is the limit; it can be sent again tomorrow.",
            no_brokers: "TheONE has no broker for this place yet. Tell the member plainly and offer to look again soon.",
          }[result.reason];
          return { content: why, isError: result.reason === "invalid" };
        }
        return {
          content: `Sent. Brokers reached, each with its own chat in the member's Messages: ${result.search.brokers
            .map((b) => `${b.name} (${b.city})`)
            .join(", ")}. Tell the member they will send matching properties from their portfolio there.`,
        };
      }

      case "get_property_sales": {
        const sales = await listPropertySales(account.id);
        if (sales.length === 0) return { content: "No home for sale yet." };
        return { content: JSON.stringify(sales.slice(0, 5)) };
      }

      case "complete_course_lesson": {
        const done = await completeLesson(account.id, String(input.lesson ?? ""));
        if (!done) return { content: "Unknown lesson.", isError: true };
        return { content: `Recorded. Lessons done: ${done.join(", ")} (of 8).` };
      }

      case "get_longevity_check": {
        const checks = await listLongevityChecks(account.id, 3);
        const course = { lessons: COURSE, completed: await courseProgress(account.id) };
        if (checks.length === 0) {
          return {
            content:
              "No TheONE LONGEVITY CHECK yet. Offer one: the member finds it in TheONE LONGEVITY on the start screen, thirteen quick questions.",
          };
        }
        return { content: JSON.stringify({ checks, course }) };
      }

      case "get_skin_analysis": {
        const scans = await listSkinScans(account.id, 3);
        if (scans.length === 0) {
          return {
            content:
              "No TheONE SKIN SCAN yet. Offer one: the member taps the face scan button next to the microphone in the assistant.",
          };
        }
        return { content: JSON.stringify(scans) };
      }

      case "request_appointment": {
        const partner = await getPartner({
          accountId,
          partnerId: String(input.partnerId ?? ""),
        });
        /* The likeliest cause is an ID carried over from an earlier turn, which
           the thread does not preserve. Say what to do about it — a bare "no
           such partner" reads as "this partner does not exist" and has been
           enough to make the assistant retract a correct recommendation. */
        if (!partner) {
          return {
            content:
              "No partner with that id. The id may be from an earlier turn, which is not preserved. Call search_partners now and use the exact `id` it returns.",
            isError: true,
          };
        }

        const summary = String(input.summary ?? "").trim();
        if (!summary) {
          return { content: "A summary is required.", isError: true };
        }

        const preferredTiming =
          typeof input.preferredTiming === "string" && input.preferredTiming
            ? input.preferredTiming
            : null;

        /* A member abroad may speak no English, but the clinic reading this
           has to understand it. Partners work in German or English, so text
           in another script is turned back to be written again. */
        const partnerLanguage = GERMAN_SPEAKING.has(partner.country.trim().toLowerCase())
          ? "German"
          : "English";
        if (!LATIN_ONLY.test(summary) || (preferredTiming && !LATIN_ONLY.test(preferredTiming))) {
          return {
            content: `Nothing was sent. The partner reads ${partnerLanguage}: write summary and preferredTiming in ${partnerLanguage}, set memberLanguage, and call request_appointment again. Keep talking to the member in their own language.`,
            isError: true,
          };
        }
        const memberLanguage =
          typeof input.memberLanguage === "string" ? input.memberLanguage.trim().slice(0, 40) : "";

        await (
          await appointmentRequests()
        ).insertOne({
          _id: new ObjectId(),
          accountId,
          partnerProfileId: new ObjectId(partner.id),
          summary,
          preferredTiming,
          status: "requested",
          createdAt: new Date(),
        });

        /* Reach the partner where they already are — an in-app message they
           will see, rather than a record only we can read. */
        const conversationId = await openConversation({
          accountId,
          counterpartId: partner.accountId,
        });

        if (conversationId) {
          await sendMessage({
            conversationId,
            accountId,
            body: [
              `Appointment request from ${account.displayName}:`,
              summary,
              preferredTiming ? `Preferred timing: ${preferredTiming}` : null,
              memberLanguage && !/^(english|german|deutsch)$/i.test(memberLanguage)
                ? `The member speaks ${memberLanguage}.`
                : null,
            ]
              .filter(Boolean)
              .join("\n\n"),
          });
        }

        return {
          content: `Request sent to ${partner.name}. They have been messaged in the app and will reply there. Their direct line is ${partner.contactPhone}.`,
        };
      }

      case "draft_email": {
        const draft = emailDraftFrom(input);
        if (!draft) {
          return { content: "The email needs a subject and a body.", isError: true };
        }
        return {
          content: JSON.stringify({
            shown: true,
            note:
              "The member now sees this email as a card with buttons to change it or open it in their mail app, where they send it themselves. Do not repeat the email text. Say in one short sentence that it is ready and that they can change it or send it." +
              (draft.toEmail ? "" : " No address was given: the app looks the name up in their contacts, or they type it in."),
          }),
        };
      }

      default:
        return { content: `Unknown tool: ${name}`, isError: true };
    }
  } catch (error) {
    console.error(`[assistant] tool ${name} failed:`, error);
    return { content: "That lookup failed. Try again.", isError: true };
  }
}

/** Also used to record partner listings the assistant has verified. */
export async function partnerCount(): Promise<number> {
  return (await partnerProfiles()).countDocuments({ published: true });
}
