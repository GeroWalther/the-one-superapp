import SwiftUI

/// Every skin analysis so far, newest first, with how the skin score moved,
/// and a before and after when the member kept photos on this phone.
struct SkinHistoryView: View {
    let onNewScan: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var scans: [SkinScan] = []
    @State private var loading = true

    private struct Response: Decodable { let scans: [SkinScan] }

    var body: some View {
        NavigationStack {
            Group {
                if loading && scans.isEmpty {
                    ProgressView().tint(Theme.aqua)
                } else if scans.isEmpty {
                    VStack(spacing: 14) {
                        Text(tr("No TheONE SKIN SCAN yet"))
                            .font(.theoneHeading(19))
                            .foregroundStyle(Theme.heading)
                        Button(tr("Start TheONE SKIN SCAN"), action: onNewScan)
                            .font(.theone(16, weight: .medium))
                    }
                } else {
                    List {
                        if let comparison {
                            Section { comparison }
                                .listRowBackground(Color.clear)
                        }
                        Section {
                            ForEach(Array(scans.enumerated()), id: \.element.id) { index, scan in
                                NavigationLink {
                                    SkinResultView(scan: scan, freshPhoto: nil, onDiscuss: nil)
                                        .background(HomeBackground())
                                } label: {
                                    row(scan, previous: scans[safe: index + 1])
                                }
                                .listRowBackground(Theme.panel.opacity(0.85))
                            }
                            .onDelete(perform: delete)
                        }
                    }
                    .scrollContentBackground(.hidden)
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(HomeBackground())
            .navigationTitle(tr("TheONE SKIN SCAN: my results"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: { Image(systemName: "xmark") }
                        .accessibilityLabel(tr("Close"))
                }
                ToolbarItem(placement: .primaryAction) {
                    Button(action: onNewScan) { Image(systemName: "plus") }
                        .accessibilityLabel(tr("Start TheONE SKIN SCAN"))
                }
            }
            .task { await load() }
        }
        .tint(Theme.aqua)
    }

    /// First and latest kept photo side by side, with the score change.
    private var comparison: AnyView? {
        let withPhotos = scans.filter { SkinPhotoStore.image(for: $0.id) != nil }
        guard let latest = withPhotos.first, let first = withPhotos.last, latest.id != first.id,
              let before = SkinPhotoStore.image(for: first.id),
              let after = SkinPhotoStore.image(for: latest.id)
        else { return nil }
        return AnyView(
            HStack(spacing: 16) {
                portrait(before, title: tr("Before"), scan: first)
                portrait(after, title: tr("Now"), scan: latest)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
        )
    }

    private func portrait(_ image: UIImage, title: String, scan: SkinScan) -> some View {
        VStack(spacing: 6) {
            Image(uiImage: image)
                .resizable()
                .scaledToFill()
                .frame(width: 130, height: 170)
                .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
            Text("\(title) · \(scan.overall)")
                .font(.theone(13, weight: .medium))
                .foregroundStyle(Theme.ink)
            Text(scan.date.formatted(date: .abbreviated, time: .omitted))
                .font(.theone(11))
                .foregroundStyle(Theme.inkFaint)
        }
    }

    private func row(_ scan: SkinScan, previous: SkinScan?) -> some View {
        HStack(spacing: 14) {
            ScoreRing(score: scan.overall, size: 50, label: "")
            VStack(alignment: .leading, spacing: 3) {
                Text(scan.date.formatted(date: .long, time: .shortened))
                    .font(.theone(15, weight: .medium))
                    .foregroundStyle(Theme.ink)
                if let previous {
                    let delta = scan.overall - previous.overall
                    Text(delta == 0 ? tr("Unchanged") : (delta > 0 ? "+\(delta)" : "\(delta)"))
                        .font(.theone(13, weight: .semibold))
                        .foregroundStyle(delta >= 0 ? Theme.aqua : Theme.inkSoft)
                }
            }
        }
        .padding(.vertical, 4)
    }

    private func load() async {
        if let response: Response = try? await APIClient.shared.send("/skin/scans") {
            scans = response.scans
        }
        loading = false
    }

    private func delete(at offsets: IndexSet) {
        let removed = offsets.map { scans[$0] }
        scans.remove(atOffsets: offsets)
        for scan in removed {
            SkinPhotoStore.delete(scan.id)
            Task { _ = try? await APIClient.shared.sendRaw("/skin/scans?id=\(scan.id)", method: "DELETE") }
        }
    }
}

extension Array {
    subscript(safe index: Int) -> Element? { indices.contains(index) ? self[index] : nil }
}
