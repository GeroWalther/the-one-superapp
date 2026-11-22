import SwiftUI

/// One sentence, everything arranged: the plan POWER AI put together from
/// the member's wish. Wire type; field names match the API exactly.
struct AssistantPlan: Decodable, Sendable, Hashable {
    struct Item: Decodable, Sendable, Hashable {
        let offering: Offering
        let note: String

        private enum Keys: String, CodingKey { case note }

        init(from decoder: Decoder) throws {
            offering = try Offering(from: decoder)
            note = (try? decoder.container(keyedBy: Keys.self).decode(String.self, forKey: .note)) ?? ""
        }
    }
    struct Total: Decodable, Sendable, Hashable {
        let currency: String
        let cents: Int
    }
    struct Sent: Decodable, Sendable, Hashable {
        let partnerName: String
        let conversationId: String
    }

    let id: String
    let title: String
    let when: String
    let status: String
    let items: [Item]
    let totals: [Total]
    let onRequest: Bool
    let conversations: [Sent]

    var isSent: Bool { status == "sent" }

    /// From the stream's JSON object.
    static func from(_ object: Any) -> AssistantPlan? {
        guard JSONSerialization.isValidJSONObject(object),
              let data = try? JSONSerialization.data(withJSONObject: object)
        else { return nil }
        return try? JSONDecoder().decode(AssistantPlan.self, from: data)
    }

    /// "CHF 2,450 + EUR 89", in the member's own number format.
    var totalText: String {
        totals.map { total in
            let formatter = NumberFormatter()
            formatter.numberStyle = .currency
            formatter.currencyCode = total.currency
            formatter.locale = Locale(identifier: MemberLanguage.tag)
            formatter.maximumFractionDigits = total.cents % 100 == 0 ? 0 : 2
            return formatter.string(from: NSNumber(value: Double(total.cents) / 100)) ?? "\(total.cents / 100) \(total.currency)"
        }
        .joined(separator: " + ")
    }
}

/// The plan as a card in the conversation: every item, what it costs, and
/// one button that sends it to every partner at once.
struct PlanCard: View {
    let plan: AssistantPlan
    let sending: Bool
    let onConfirm: () -> Void

    @Environment(\.openURL) private var openURL

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            VStack(alignment: .leading, spacing: 4) {
                Text(tr("Your plan").uppercased())
                    .font(.theone(10.5, weight: .medium))
                    .tracking(MemberLanguage.spacing(2))
                    .foregroundStyle(Theme.accentText)
                Text(plan.title)
                    .font(.theoneHeading(18, medium: true))
                    .foregroundStyle(Theme.heading)
                    .fixedSize(horizontal: false, vertical: true)
                if !plan.when.isEmpty {
                    Label(plan.when, systemImage: "calendar")
                        .font(.theone(13))
                        .foregroundStyle(Theme.inkSoft)
                }
            }

            VStack(spacing: 12) {
                ForEach(plan.items, id: \.offering.id) { item in
                    row(item)
                }
            }

            if !plan.totals.isEmpty || plan.onRequest {
                Divider()
                HStack(alignment: .firstTextBaseline) {
                    Text(tr("Total"))
                        .font(.theone(14, weight: .medium))
                        .foregroundStyle(Theme.ink)
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        if !plan.totals.isEmpty {
                            Text(plan.totalText)
                                .font(.theone(15, weight: .semibold))
                                .foregroundStyle(Theme.heading)
                        }
                        if plan.onRequest {
                            Text(tr("plus prices on request"))
                                .font(.theone(11.5))
                                .foregroundStyle(Theme.inkFaint)
                        }
                    }
                }
            }

            if plan.isSent {
                HStack(alignment: .top, spacing: 10) {
                    Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.aqua)
                    Text(sentText)
                        .font(.theone(13.5))
                        .foregroundStyle(Theme.ink)
                        .fixedSize(horizontal: false, vertical: true)
                }
                .accessibilityIdentifier("plan.sent")
            } else {
                Button(action: onConfirm) {
                    Group {
                        if sending {
                            ProgressView().tint(Theme.onAccent)
                        } else {
                            Label(tr("Request everything"), systemImage: "sparkles")
                        }
                    }
                    .font(.theone(15.5, weight: .medium))
                    .foregroundStyle(Theme.onAccent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Capsule().fill(Theme.aqua))
                }
                .disabled(sending)
                .accessibilityIdentifier("plan.confirm")
                Text(tr("One tap and every partner receives your request in the app."))
                    .font(.theone(11.5))
                    .foregroundStyle(Theme.inkFaint)
            }
        }
        .padding(16)
        .frame(maxWidth: 330, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Theme.panel)
                .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.line, lineWidth: 1))
        )
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("plan.card")
    }

    private var sentText: String {
        let names = plan.conversations.map(\.partnerName)
        return names.isEmpty
            ? tr("Done. Buy the products in the brand's shop.")
            : tr("Sent to %@. They will answer you in the app.", ListFormatter.localizedString(byJoining: names))
    }

    private func row(_ item: AssistantPlan.Item) -> some View {
        HStack(alignment: .top, spacing: 12) {
            OfferingImage(offering: item.offering)
                .frame(width: 54, height: 54)
                .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
            VStack(alignment: .leading, spacing: 3) {
                Text(item.offering.title)
                    .font(.theone(14, weight: .medium))
                    .foregroundStyle(Theme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(item.offering.partner.name)
                    .font(.theone(12))
                    .foregroundStyle(Theme.accentText)
                if !item.note.isEmpty {
                    Text(item.note)
                        .font(.theone(12))
                        .foregroundStyle(Theme.inkSoft)
                        .fixedSize(horizontal: false, vertical: true)
                }
                HStack {
                    Text(item.offering.priceText)
                        .font(.theone(12.5, weight: .semibold))
                        .foregroundStyle(Theme.heading)
                    if item.offering.kind == "product", let url = item.offering.shopURL {
                        Spacer()
                        Button(tr("Buy in the shop")) { openURL(url) }
                            .font(.theone(12, weight: .medium))
                            .foregroundStyle(Theme.aqua)
                    }
                }
            }
            Spacer(minLength: 0)
        }
    }
}
