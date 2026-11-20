import SwiftUI
import UIKit

/// TheONE MARKETPLACE as a street of private boutiques: every brand has its
/// own window on the overview and its own boutique inside. Champagne gold is
/// used here, and only here, as a fine accent next to TheONE's petrol.

/// A brand's window on the overview: its picture, name, line and words, and
/// a gold invitation to step inside.
struct BoutiqueStorefront: View {
    let partner: SelectionPartner

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ZStack(alignment: .bottomLeading) {
                Color.clear
                    .frame(height: 170)
                    .frame(maxWidth: .infinity)
                    .overlay {
                        CoverImage(url: partner.images.first.flatMap(URL.init(string:)), fill: true)
                    }
                    .clipped()
                LinearGradient(colors: [.clear, Vortex.abyss.opacity(0.72)], startPoint: .center, endPoint: .bottom)
                    .allowsHitTesting(false)
                VStack(alignment: .leading, spacing: 4) {
                    Text(verbatim: partner.name)
                        .font(.theoneHeading(20))
                        .tracking(3.5)
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    if let tagline = partner.tagline, !tagline.isEmpty {
                        Text(verbatim: tagline)
                            .font(.theone(12.5))
                            .foregroundStyle(.white.opacity(0.92))
                            .lineLimit(2)
                    }
                }
                .padding(14)
            }
            .overlay(alignment: .topTrailing) { BoutiqueSeals(badges: partner.badges ?? [], size: 58) }

            Rectangle().fill(Theme.goldLine).frame(height: 1)

            HStack(spacing: 6) {
                // Two words when they fit whole, otherwise the first one:
                // a word is never cut off.
                ViewThatFits(in: .horizontal) {
                    HStack(spacing: 6) {
                        ForEach(partner.windowLabels.prefix(2), id: \.self) { BoutiqueChip(text: $0).fixedSize() }
                    }
                    HStack(spacing: 6) {
                        ForEach(partner.windowLabels.prefix(1), id: \.self) { BoutiqueChip(text: $0).fixedSize() }
                    }
                }
                Spacer(minLength: 8)
                HStack(spacing: 5) {
                    Text(tr("Enter boutique"))
                    Image(systemName: "arrow.right")
                }
                .font(.theone(12.5, weight: .medium))
                .foregroundStyle(Theme.gold)
                .fixedSize()
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 11)
            .background(Theme.panel)
        }
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .stroke(Theme.goldLine.opacity(0.75), lineWidth: 0.8)
        )
        .contentShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .padding(.horizontal, 20)
    }
}

/// Inside a brand's boutique: its picture across the whole width, its story,
/// the one product POWER AI picks for this member, the signature piece and
/// the whole collection.
struct BoutiqueView: View {
    let partner: SelectionPartner
    /// POWER AI's pick from this brand for the member, with its reason.
    let pick: Offering?

    var body: some View {
        GeometryReader { proxy in
            let width = (proxy.size.width - 20 * 2 - 14) / 2
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    hero(width: proxy.size.width)

                    VStack(alignment: .leading, spacing: 12) {
                        kicker(tr("Boutique"))
                        Text(verbatim: partner.name)
                            .font(.theoneHeading(26))
                            .tracking(4)
                            .foregroundStyle(Theme.heading)
                        if let tagline = partner.tagline, !tagline.isEmpty {
                            Text(verbatim: tagline)
                                .font(.theone(15))
                                .foregroundStyle(Theme.inkSoft)
                        }
                        Rectangle().fill(Theme.goldLine).frame(width: 46, height: 1)
                        if !partner.windowLabels.isEmpty {
                            HStack(spacing: 6) {
                                ForEach(partner.windowLabels, id: \.self) { BoutiqueChip(text: $0) }
                            }
                        }
                        if !story.isEmpty {
                            Text(story)
                                .font(.theone(15))
                                .foregroundStyle(Theme.ink)
                                .fixedSize(horizontal: false, vertical: true)
                                .padding(.top, 4)
                        }
                    }
                    .padding(.horizontal, 20)

                    if let pick { powerAIPick(pick) }

                    if let signature = partner.offerings.first {
                        VStack(alignment: .leading, spacing: 10) {
                            kicker(tr("Signature"))
                            signatureCard(signature)
                        }
                        .padding(.horizontal, 20)
                    }

                    let collection = Array(partner.offerings.dropFirst())
                    if !collection.isEmpty {
                        VStack(alignment: .leading, spacing: 12) {
                            kicker(tr("Collection"))
                            LazyVGrid(
                                columns: [GridItem(.fixed(width), spacing: 14), GridItem(.fixed(width))],
                                alignment: .leading,
                                spacing: 14
                            ) {
                                ForEach(collection) { offering in
                                    // Pushed from a pushed view: a destination
                                    // link, since a value link would not push.
                                    NavigationLink {
                                        OfferingDetailView(offering: offering)
                                    } label: {
                                        OfferingCard(offering: offering, width: width, showReason: false)
                                    }
                                    .buttonStyle(.plain)
                                    .accessibilityIdentifier("offering.card")
                                }
                            }
                        }
                        .padding(.horizontal, 20)
                    }

                    if let site = partner.office?.website.flatMap(URL.init(string:)) {
                        Link(destination: site) {
                            HStack(spacing: 6) {
                                Text(tr("Visit the brand's shop"))
                                Image(systemName: "arrow.up.right")
                            }
                            .font(.theone(14.5, weight: .medium))
                            .foregroundStyle(Theme.gold)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .overlay(Capsule().stroke(Theme.goldLine, lineWidth: 1))
                        }
                        .padding(.horizontal, 20)
                    }
                }
                .padding(.bottom, 40)
            }
        }
        .background(HomeBackground())
        .navigationBarTitleDisplayMode(.inline)
        .accessibilityIdentifier("boutique.\(partner.name)")
    }

    /// The brand's story, without its line when it opens with it.
    private var story: String {
        var text = partner.description.trimmingCharacters(in: .whitespaces)
        if let line = partner.tagline, !line.isEmpty, text.lowercased().hasPrefix(line.lowercased()) {
            text = String(text.dropFirst(line.count)).trimmingCharacters(in: CharacterSet(charactersIn: " .:,"))
        }
        return text
    }

    private func hero(width: CGFloat) -> some View {
        CoverImage(url: partner.images.first.flatMap(URL.init(string:)), fill: false, width: width)
            .overlay(alignment: .topTrailing) { BoutiqueSeals(badges: partner.badges ?? [], size: 76) }
            .overlay(alignment: .bottom) { Rectangle().fill(Theme.goldLine).frame(height: 1) }
    }

    private func kicker(_ text: String) -> some View {
        Text(text.uppercased())
            .font(.theone(11.5, weight: .medium))
            .tracking(MemberLanguage.spacing(2.6))
            .foregroundStyle(Theme.gold)
    }

    private func powerAIPick(_ offering: Offering) -> some View {
        NavigationLink {
            OfferingDetailView(offering: offering)
        } label: {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "sparkles")
                    .font(.system(size: 16))
                    .foregroundStyle(Theme.gold)
                VStack(alignment: .leading, spacing: 4) {
                    Text(verbatim: "POWER AI")
                        .font(.theone(11, weight: .medium))
                        .tracking(MemberLanguage.spacing(1.8))
                        .foregroundStyle(Theme.gold)
                    Text(offering.title)
                        .font(.theone(14.5, weight: .medium))
                        .foregroundStyle(Theme.ink)
                    if let reason = offering.reason, !reason.isEmpty {
                        Text(reason)
                            .font(.theone(13.5))
                            .foregroundStyle(Theme.inkSoft)
                            .fixedSize(horizontal: false, vertical: true)
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .fill(Theme.goldTint)
                    .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Theme.goldLine.opacity(0.6), lineWidth: 0.8))
            )
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 20)
        .accessibilityIdentifier("boutique.pick")
    }

    private func signatureCard(_ offering: Offering) -> some View {
        HStack(alignment: .top, spacing: 14) {
            OfferingImage(offering: offering)
                .frame(width: 120, height: 120)
                .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
            VStack(alignment: .leading, spacing: 6) {
                Text(offering.title)
                    .font(.theone(15.5, weight: .medium))
                    .foregroundStyle(Theme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Text(offering.priceText)
                    .font(.theone(15, weight: .medium))
                    .foregroundStyle(Theme.gold)
                Spacer(minLength: 4)
                if let shop = offering.shopURL {
                    Link(destination: shop) { buyLabel }
                        .accessibilityIdentifier("boutique.buy")
                } else {
                    NavigationLink { OfferingDetailView(offering: offering) } label: { buyLabel }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("boutique.buy")
                }
            }
            Spacer(minLength: 0)
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 18, style: .continuous)
                .fill(Theme.panel)
                .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(Theme.goldLine, lineWidth: 1))
        )
    }

    private var buyLabel: some View {
        Text(tr("Buy"))
            .font(.theone(14, weight: .medium))
            .foregroundStyle(Theme.onAccent)
            .padding(.horizontal, 18)
            .padding(.vertical, 8)
            .background(Capsule().fill(Theme.heading))
            .overlay(Capsule().stroke(Theme.goldLine, lineWidth: 0.8))
    }
}

/// A word on a boutique window, framed in fine gold.
struct BoutiqueChip: View {
    let text: String

    var body: some View {
        Text(verbatim: text)
            .font(.theone(11.5))
            .foregroundStyle(Color(red: 0.49, green: 0.39, blue: 0.19))
            .padding(.horizontal, 9)
            .padding(.vertical, 4)
            .overlay(Capsule().stroke(Theme.goldLine, lineWidth: 0.8))
            .lineLimit(1)
    }
}

/// A brand's seals (award, quality), top right on its picture.
struct BoutiqueSeals: View {
    let badges: [String]
    let size: CGFloat

    var body: some View {
        HStack(spacing: 10) {
            ForEach(badges.prefix(2), id: \.self) { badge in
                AsyncImage(url: URL(string: badge)) { image in
                    image.resizable().scaledToFit()
                } placeholder: {
                    Color.clear
                }
                .frame(width: size, height: size)
            }
        }
        .padding(12)
        .allowsHitTesting(false)
    }
}

/// A brand's picture. In the boutique it is shown whole across the width when
/// it is a wide picture (like BIOPLANTPHARMA's row of pictures), and filled to a
/// generous height otherwise; on a window it always fills.
struct CoverImage: View {
    let url: URL?
    var fill: Bool
    var width: CGFloat = 0
    @State private var image: UIImage?

    private static let cache = NSCache<NSURL, UIImage>()

    var body: some View {
        Group {
            if let image {
                if fill {
                    // A very wide picture (a row of pictures) shows its start,
                    // not its middle, so lettering in it never meets the name.
                    let wide = image.size.width / max(image.size.height, 1) > 2.6
                    Color.clear.overlay(alignment: wide ? .leading : .center) {
                        Image(uiImage: image).resizable().scaledToFill()
                    }
                } else {
                    let ratio = image.size.width / max(image.size.height, 1)
                    let height = ratio > 1.6 ? width / ratio : 250
                    Image(uiImage: image)
                        .resizable()
                        .scaledToFill()
                        .frame(width: width, height: height)
                        .clipped()
                }
            } else {
                Theme.aquaTint
                    .frame(width: fill ? nil : width, height: fill ? nil : 200)
            }
        }
        .allowsHitTesting(false)
        .task(id: url) { await load() }
    }

    private func load() async {
        guard let url else { return }
        if let cached = Self.cache.object(forKey: url as NSURL) {
            image = cached
            return
        }
        guard let (data, _) = try? await URLSession.shared.data(from: url),
              let loaded = UIImage(data: data)
        else { return }
        Self.cache.setObject(loaded, forKey: url as NSURL)
        image = loaded
    }
}
