import SwiftUI

struct ProfileView: View {
    @Environment(SessionStore.self) private var session
    @State private var tip: String?
    @State private var loadingTip = false

    private let accountURL = URL(string: "https://theone-superapp.vercel.app/en/account")!

    var body: some View {
        NavigationStack {
            ScrollView {
                if let account = session.account {
                    VStack(spacing: 16) {
                        VStack(spacing: 8) {
                            Circle()
                                .fill(Theme.aqua.opacity(0.18))
                                .frame(width: 68, height: 68)
                                .overlay(
                                    Text(String(account.firstName.prefix(1)))
                                        .font(.system(size: 26, weight: .semibold))
                                        .foregroundStyle(Theme.aqua)
                                )
                            Text(account.displayName)
                                .font(.system(size: 22, weight: .light, design: .serif))
                                .foregroundStyle(Theme.ink)
                            Text("@\(account.username) · \(account.role.capitalized)")
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.inkFaint)
                        }
                        .padding(.top, 12)

                        if let tip {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("TODAY")
                                    .font(.system(size: 10, weight: .semibold))
                                    .tracking(2)
                                    .foregroundStyle(Theme.aqua)
                                Text(tip)
                                    .font(.system(size: 15))
                                    .foregroundStyle(Theme.ink)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .glassCard()
                        } else if loadingTip {
                            ProgressView().tint(Theme.aqua).padding(.vertical, 12)
                        }

                        VStack(spacing: 0) {
                            detailRow("Email", account.email)
                            Divider().overlay(Theme.line)
                            detailRow("Status", account.status.replacingOccurrences(of: "_", with: " ").capitalized)
                            if account.successfulReferrals > 0 {
                                Divider().overlay(Theme.line)
                                detailRow("Referrals", "\(account.successfulReferrals)")
                            }
                            if account.freeMonthsGranted > 0 {
                                Divider().overlay(Theme.line)
                                detailRow("Free months", "\(account.freeMonthsGranted)")
                            }
                        }
                        .glassCard(padding: 0)

                        // Billing, referrals, and profile edits live on the web,
                        // where they already exist and where Stripe's flows run.
                        Link(destination: accountURL) {
                            Text("Manage account & billing")
                        }
                        .buttonStyle(GhostButtonStyle())

                        Button {
                            Task { await session.signOut() }
                        } label: {
                            Text("Sign out")
                        }
                        .buttonStyle(GhostButtonStyle())
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 30)
                }
            }
            .paperBackground()
            .navigationTitle("Profile")
        }
        .task { await loadTip() }
    }

    private func detailRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(.system(size: 13))
                .foregroundStyle(Theme.inkFaint)
            Spacer()
            Text(value)
                .font(.system(size: 14))
                .foregroundStyle(Theme.ink)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 13)
    }

    private func loadTip() async {
        loadingTip = true
        defer { loadingTip = false }
        // A missing tip is not worth an error banner — the assistant may simply
        // not be configured on this deployment.
        let response: TipResponse? = try? await APIClient.shared.send("/tips/daily")
        tip = response?.tip
    }

    private struct TipResponse: Decodable { let tip: String }
}
