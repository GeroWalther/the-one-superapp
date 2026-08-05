import SwiftUI

@MainActor
@Observable
final class DiscoverModel {
    var partners: [PartnerSummary] = []
    var query = ""
    var focus: String?
    var savedOnly = false
    var isLoading = false
    var error: String?

    static let focusAreas = [
        ("health", "Health"), ("hotels", "Hotels"), ("property", "Property"),
        ("lifestyle", "Lifestyle"), ("beauty", "Beauty"),
        ("wellness", "Wellness"), ("insurance", "Insurance"),
    ]

    func load() async {
        isLoading = true
        defer { isLoading = false }
        error = nil

        var parts: [String] = []
        let trimmed = query.trimmingCharacters(in: .whitespaces)
        if !trimmed.isEmpty {
            parts.append("q=\(trimmed.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "")")
        }
        if let focus { parts.append("focus=\(focus)") }
        if savedOnly { parts.append("saved=1") }

        let path = "/partners" + (parts.isEmpty ? "" : "?" + parts.joined(separator: "&"))

        do {
            let response: PartnersResponse = try await APIClient.shared.send(path)
            partners = response.partners
        } catch {
            self.error = (error as? APIError)?.errorDescription ?? "Could not load partners."
        }
    }

    func toggleSaved(_ partner: PartnerSummary) async {
        // Flip locally first: a bookmark that waits on the network feels broken.
        guard let index = partners.firstIndex(where: { $0.id == partner.id }) else { return }
        let nowSaved = !partners[index].saved
        partners[index] = mutate(partners[index], saved: nowSaved)

        do {
            try await APIClient.shared.sendRaw(
                "/partners/\(partner.id)/save",
                method: nowSaved ? "POST" : "DELETE"
            )
            if savedOnly, !nowSaved { partners.remove(at: index) }
        } catch {
            partners[index] = mutate(partners[index], saved: !nowSaved)
        }
    }

    private func mutate(_ partner: PartnerSummary, saved: Bool) -> PartnerSummary {
        PartnerSummary(
            id: partner.id, name: partner.name, category: partner.category,
            focusArea: partner.focusArea, city: partner.city, country: partner.country,
            description: partner.description, images: partner.images, saved: saved
        )
    }

    private struct PartnersResponse: Decodable { let partners: [PartnerSummary] }
}

struct DiscoverView: View {
    @State private var model = DiscoverModel()

    var body: some View {
        NavigationStack {
            ScrollView {
                LazyVStack(spacing: 10) {
                    filters

                    if model.isLoading && model.partners.isEmpty {
                        ProgressView().tint(Theme.aqua).padding(.top, 40)
                    } else if model.partners.isEmpty {
                        Text(model.savedOnly
                             ? "Nothing saved yet."
                             : "No partners match this search.")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.inkSoft)
                            .padding(.top, 40)
                    }

                    ForEach(model.partners) { partner in
                        NavigationLink(value: partner) {
                            PartnerRow(partner: partner) {
                                Task { await model.toggleSaved(partner) }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 20)
            }
            .paperBackground()
            .navigationTitle("Discover")
            .navigationDestination(for: PartnerSummary.self) { partner in
                PartnerDetailView(partnerId: partner.id)
            }
            .searchable(text: $model.query, prompt: "Search partners")
            .onSubmit(of: .search) { Task { await model.load() } }
        }
        .task { await model.load() }
    }

    private var filters: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                chip("Saved", active: model.savedOnly) {
                    model.savedOnly.toggle()
                    Task { await model.load() }
                }

                ForEach(DiscoverModel.focusAreas, id: \.0) { value, label in
                    chip(label, active: model.focus == value) {
                        model.focus = model.focus == value ? nil : value
                        Task { await model.load() }
                    }
                }
            }
            .padding(.vertical, 4)
        }
    }

    private func chip(_ label: String, active: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 13, weight: active ? .semibold : .regular))
                .foregroundStyle(active ? Theme.onAccent : Theme.inkSoft)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(
                    Capsule()
                        .fill(active ? AnyShapeStyle(Theme.aquaSoft) : AnyShapeStyle(Theme.paperSoft))
                )
        }
    }
}

struct PartnerRow: View {
    let partner: PartnerSummary
    let onToggleSaved: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(partner.name)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(Theme.ink)

                Text("\(partner.city), \(partner.country)")
                    .font(.system(size: 12.5))
                    .foregroundStyle(Theme.inkFaint)

                Text(partner.description)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.inkSoft)
                    .lineLimit(2)
                    .padding(.top, 2)
            }

            Spacer(minLength: 8)

            Button(action: onToggleSaved) {
                Image(systemName: partner.saved ? "bookmark.fill" : "bookmark")
                    .font(.system(size: 16))
                    .foregroundStyle(partner.saved ? Theme.aqua : Theme.inkFaint)
            }
            .buttonStyle(.plain)
            .accessibilityLabel(partner.saved ? "Remove bookmark" : "Save partner")
        }
        .glassCard()
    }
}
