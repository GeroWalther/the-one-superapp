import "server-only";
import { ObjectId } from "mongodb";
import type Anthropic from "@anthropic-ai/sdk";
import {
  appointmentRequests,
  partnerProfiles,
  applications,
} from "../db/collections";
import type { PublicAccount } from "../auth/accounts";
import type { MemberApplicationInput } from "../domain";
import { getPartner, searchPartners, setSaved } from "../api/partners";
import { openConversation, sendMessage } from "../api/chat";

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
            "Free text describing the need, e.g. 'dentist', 'longevity clinic', 'spa'.",
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
            "Restrict to a city. Use the member's own city for 'near me' requests.",
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
            "What the member needs, in one or two sentences, written for the partner to read.",
        },
        preferredTiming: {
          type: "string",
          description: "The member's stated availability, if they gave any.",
        },
      },
      required: ["partnerId", "summary"],
      additionalProperties: false,
    },
  },
];

export type ToolResult = { content: string; isError?: boolean };

export async function runAssistantTool(
  name: string,
  input: Record<string, unknown>,
  account: PublicAccount,
): Promise<ToolResult> {
  const accountId = new ObjectId(account.id);

  try {
    switch (name) {
      case "get_member_profile": {
        const collection = await applications();
        const application = await collection.findOne({
          email: account.email,
          type: "member",
        });

        if (!application) {
          return {
            content: JSON.stringify({
              displayName: account.displayName,
              note: "No enrolment answers on file for this account.",
            }),
          };
        }

        const data = application.data as MemberApplicationInput;
        return {
          content: JSON.stringify({
            displayName: account.displayName,
            city: data.city,
            country: data.country,
            focusAreas: data.focusAreas,
            goal: data.goal,
            horizon: data.horizon,
            context: data.context || null,
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
        if (!partner) return { content: "No such partner.", isError: true };
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

      case "request_appointment": {
        const partner = await getPartner({
          accountId,
          partnerId: String(input.partnerId ?? ""),
        });
        if (!partner) return { content: "No such partner.", isError: true };

        const summary = String(input.summary ?? "").trim();
        if (!summary) {
          return { content: "A summary is required.", isError: true };
        }

        const preferredTiming =
          typeof input.preferredTiming === "string" && input.preferredTiming
            ? input.preferredTiming
            : null;

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
            ]
              .filter(Boolean)
              .join("\n\n"),
          });
        }

        return {
          content: `Request sent to ${partner.name}. They have been messaged in the app and will reply there. Their direct line is ${partner.contactPhone}.`,
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
