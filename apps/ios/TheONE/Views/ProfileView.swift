import SwiftUI

struct ProfileView: View {
    @Environment(SessionStore.self) private var session
    @State private var tip: String?
    @State private var loadingTip = false
    @State private var profile: MemberProfile?
    @State private var editing = false
    @State private var webPage: WebPage?

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
                                        .font(.sans(26, .semibold))
                                        .foregroundStyle(Theme.aqua)
                                )
                            Text(account.displayName)
                                .font(.serif(22, .light))
                                .foregroundStyle(Theme.ink)
                            Text("@\(account.username) · \(account.role == "partner" ? "Business partner" : account.role.capitalized)")
                                .font(.sans(13))
                                .foregroundStyle(Theme.inkFaint)
                        }
                        .padding(.top, 12)

                        if let tip {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("TODAY")
                                    .font(.sans(10, .semibold))
                                    .tracking(2)
                                    .foregroundStyle(Theme.aqua)
                                Text(tip)
                                    .font(.sans(15))
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

                        if let profile {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("YOUR PROFILE")
                                    .font(.sans(10, .semibold))
                                    .tracking(2)
                                    .foregroundStyle(Theme.aqua)

                                Text("\(profile.city), \(profile.country)")
                                    .font(.sans(14))
                                    .foregroundStyle(Theme.ink)

                                if !profile.focusAreas.isEmpty {
                                    Text(profile.focusAreas.map(ProfileOptions.label).joined(separator: " · "))
                                        .font(.sans(13))
                                        .foregroundStyle(Theme.inkSoft)
                                }

                                if let context = profile.context, !context.isEmpty {
                                    Text(context)
                                        .font(.sans(13))
                                        .foregroundStyle(Theme.inkSoft)
                                }

                                Button {
                                    editing = true
                                } label: {
                                    Text("Edit profile")
                                }
                                .buttonStyle(GhostButtonStyle())
                                .padding(.top, 4)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .glassCard()
                        }

                        // Billing stays on the website and is neither shown nor
                        // linked here: a route to an outside purchase inside
                        // the app runs into App Store Guideline 3.1.

                        // Reachable in the app as App Store review expects.
                        VStack(spacing: 0) {
                            legalRow("Imprint", WebLinks.imprint)
                            Divider().overlay(Theme.line)
                            legalRow("Privacy Policy", WebLinks.privacy)
                        }
                        .glassCard(padding: 0)

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
            .brandedNavigationBar()
            .sheet(item: $webPage) { page in
                SafariView(url: page.url).ignoresSafeArea()
            }
        }
        .task {
            await loadTip()
            await loadProfile()
        }
        .sheet(isPresented: $editing) {
            if let profile {
                EditProfileView(initial: profile) { updated in
                    self.profile = updated
                    // The header shows the display name, so a rename has to
                    // reach the session too or the two disagree on screen.
                    Task { await session.refreshAccount() }
                }
            }
        }
    }

    private func detailRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label)
                .font(.sans(13))
                .foregroundStyle(Theme.inkFaint)
            Spacer()
            Text(value)
                .font(.sans(14))
                .foregroundStyle(Theme.ink)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 13)
    }

    private func legalRow(_ label: String, _ url: URL) -> some View {
        Button {
            webPage = WebPage(url: url)
        } label: {
            HStack {
                Text(label)
                    .font(.sans(14))
                    .foregroundStyle(Theme.ink)
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.sans(12, .semibold))
                    .foregroundStyle(Theme.inkFaint)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 13)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func loadTip() async {
        loadingTip = true
        defer { loadingTip = false }
        // A missing tip is not worth an error banner — the assistant may simply
        // not be configured on this deployment.
        let response: TipResponse? = try? await APIClient.shared.send("/tips/daily")
        tip = response?.tip
    }

    private func loadProfile() async {
        let response: MeResponse? = try? await APIClient.shared.send("/me")
        profile = response?.profile
    }

    private struct TipResponse: Decodable { let tip: String }
}
