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
                            .font(.system(size: 27, weight: .light, design: .serif))
                            .foregroundStyle(Theme.ink)
                        Text([partner.street, partner.postalCode, partner.city, partner.country]
                            .compactMap { $0 }
                            .joined(separator: ", "))
                            .font(.system(size: 13))
                            .foregroundStyle(Theme.inkFaint)
                    }

                    Text(partner.description)
                        .font(.system(size: 15))
                        .foregroundStyle(Theme.inkSoft)

                    if let clientele = partner.targetClientele, !clientele.isEmpty {
                        VStack(alignment: .leading, spacing: 5) {
                            Text("TYPICAL CLIENTS")
                                .font(.system(size: 10, weight: .semibold))
                                .tracking(2)
                                .foregroundStyle(Theme.aqua)
                            Text(clientele)
                                .font(.system(size: 14))
                                .foregroundStyle(Theme.inkSoft)
                        }
                    }

                    // Contact details are the point of the directory, so they
                    // are actionable rather than text to copy out by hand.
                    VStack(spacing: 10) {
                        contactRow("phone.fill", partner.contactPhone, url: URL(string: "tel://\(partner.contactPhone.filter { $0.isNumber || $0 == "+" })"))
                        contactRow("envelope.fill", partner.contactEmail, url: URL(string: "mailto:\(partner.contactEmail)"))
                        if let website = partner.website, let url = URL(string: website) {
                            contactRow("safari.fill", website, url: url)
                        }
                    }
                    .glassCard()

                    Button {
                        Task { await openChat(with: partner) }
                    } label: {
                        Text(openingChat ? "Opening…" : "Message this partner")
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(openingChat)

                    if let error {
                        Text(error)
                            .font(.system(size: 13))
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
            ConversationView(conversationId: id, title: partner?.name ?? "Partner")
        }
        .task { await load() }
    }

    private func contactRow(_ icon: String, _ label: String, url: URL?) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 13))
                .foregroundStyle(Theme.aqua)
                .frame(width: 22)
            Text(label)
                .font(.system(size: 14.5))
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
            self.error = (error as? APIError)?.errorDescription ?? "Could not load this partner."
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
            self.error = (error as? APIError)?.errorDescription ?? "Could not open the conversation."
        }
    }

    private struct DetailResponse: Decodable { let partner: PartnerDetail }
    private struct ConversationResponse: Decodable { let conversationId: String }
}
