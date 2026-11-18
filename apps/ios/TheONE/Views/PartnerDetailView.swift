import SwiftUI

struct PartnerDetailView: View {
    let partnerId: String

    @State private var partner: PartnerDetail?
    @State private var error: String?
    @State private var openingChat = false
    @State private var conversationId: String?

    var body: some View {
        ScrollView {
            if let partner {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(partner.name)
                            .font(.theoneHeading(23))
                            .foregroundStyle(Theme.heading)
                        // A brand that sells through its own online shop shows
                        // no address: where it sits does not matter to a buyer.
                        if partner.category != "beauty" {
                            Text([partner.street, partner.postalCode, partner.city, partner.country]
                                .compactMap { $0 }
                                .joined(separator: ", "))
                                .font(.theone(13))
                                .foregroundStyle(Theme.inkFaint)
                        }
                    }

                    Text(partner.description)
                        .font(.theone(15))
                        .foregroundStyle(Theme.inkSoft)

                    if let clientele = partner.targetClientele, !clientele.isEmpty {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("TYPICAL CLIENTS")
                                .font(.theone(10, weight: .semibold))
                                .tracking(MemberLanguage.spacing(2))
                                .foregroundStyle(Theme.accentText)
                            Text(clientele)
                                .font(.theone(14))
                                .foregroundStyle(Theme.inkSoft)
                        }
                    }

                    // Contact details are the point of the directory, so they
                    // are actionable rather than text to copy out by hand.
                    VStack(spacing: 10) {
                        if !partner.contactPhone.isEmpty {
                            contactRow("phone.fill", partner.contactPhone, url: URL(string: "tel://\(partner.contactPhone.filter { $0.isNumber || $0 == "+" })"))
                        }
                        contactRow("envelope.fill", partner.contactEmail, url: URL(string: "mailto:\(partner.contactEmail)"))
                        if let website = partner.website, let url = URL(string: website) {
                            contactRow("safari.fill", website, url: url)
                        }
                    }
                    .glassCard()

                    if partner.category == "beauty", let shop = Self.shopURL(partner.website) {
                        // A brand with its own shop: everything is bought there,
                        // so the way to it replaces a message.
                        Link(destination: shop) {
                            Label(tr("Visit the shop"), systemImage: "bag")
                                .font(.theone(16, weight: .medium))
                                .foregroundStyle(Theme.onAccent)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 15)
                                .background(Capsule().fill(Theme.aqua))
                        }
                        .accessibilityIdentifier("partner.shop")
                    } else {
                        Button {
                            Task { await openChat(with: partner) }
                        } label: {
                            Text(tr(openingChat ? "Opening…" : "Message this business partner"))
                        }
                        .buttonStyle(PrimaryButtonStyle())
                        .disabled(openingChat)
                    }

                    if let error {
                        Text(error)
                            .font(.theone(13))
                            .foregroundStyle(Color(red: 0.95, green: 0.45, blue: 0.45))
                    }
                }
                .padding(20)
            } else if error != nil {
                Text(error ?? "").foregroundStyle(Theme.inkSoft).padding(40)
            } else {
                ProgressView().tint(Theme.aqua).padding(60)
            }
        }
        .paperBackground()
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(item: $conversationId) { id in
            ConversationView(conversationId: id, title: partner?.name ?? tr("Business partner"))
        }
        .task { await load() }
    }

    /// The partner's shop, marked as coming from TheONE for their analytics.
    static func shopURL(_ website: String?) -> URL? {
        guard let website, var parts = URLComponents(string: website) else { return nil }
        parts.queryItems = (parts.queryItems ?? []) + [
            URLQueryItem(name: "utm_source", value: "theone"), URLQueryItem(name: "utm_medium", value: "app"),
        ]
        return parts.url
    }

    private func contactRow(_ icon: String, _ label: String, url: URL?) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(Theme.aqua)
                .frame(width: 22)
            Text(label)
                .font(.theone(14.5))
                .foregroundStyle(Theme.ink)
            Spacer()
        }
        .contentShape(Rectangle())
        .onTapGesture { if let url { UIApplication.shared.open(url) } }
    }

    private func load() async {
        do {
            let response: DetailResponse = try await APIClient.shared.send("/partners/\(partnerId)")
            partner = response.partner
        } catch {
            self.error = (error as? APIError)?.errorDescription ?? tr("Could not load this business partner.")
        }
    }

    private func openChat(with partner: PartnerDetail) async {
        openingChat = true
        defer { openingChat = false }

        do {
            let response: ConversationResponse = try await APIClient.shared.send(
                "/conversations",
                method: "POST",
                body: ["counterpartId": partner.accountId]
            )
            conversationId = response.conversationId
        } catch {
            self.error = (error as? APIError)?.errorDescription ?? tr("Could not open the conversation.")
        }
    }

    private struct DetailResponse: Decodable { let partner: PartnerDetail }
    private struct ConversationResponse: Decodable { let conversationId: String }
}
