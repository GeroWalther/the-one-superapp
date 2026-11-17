import SwiftUI

/// TheONE SELECTION: what TheONE has chosen, area by area, and above it what
/// it has chosen for this member. Never a market: two or three partners per
/// area and city, each with the exact things they offer.
struct SelectionView: View {
    /// Which TheONE area this shows; SELECTION itself is products only.
    var area: Area = .selection

    @Environment(Greeter.self) private var greeter
    @Environment(SessionStore.self) private var session
    @State private var showSell = false
    @State private var showFind = false
    @State private var showCheck = false
    @State private var lastCheck: LongevityCheck?
    @State private var completedLessons: Set<String> = []

    @State private var feed: SelectionFeed?
    @State private var error: String?
    @State private var showAllPartners = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 30) {
                    header

                    // Every area begins with POWER AI asking, aloud.
                    opener

                    if area == .longevity {
                        longevityCheckCard
                        courseCard
                    }
                    if area == .realestate {
                        findCard
                        sellCard
                    }

                    if let feed {
                        if !feed.forYou.isEmpty {
                            VStack(alignment: .leading, spacing: 12) {
                                sectionTitle(tr("Chosen for you"))
                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: 14) {
                                        ForEach(feed.forYou) { offering in
                                            NavigationLink(value: offering) {
                                                OfferingCard(offering: offering, width: 230, showReason: true)
                                            }
                                            .buttonStyle(.plain)
                                            .accessibilityIdentifier("offering.card")
                                        }
                                    }
                                    .padding(.horizontal, 20)
                                }
                            }
                        }

                        ForEach(feed.sections) { section in
                            VStack(alignment: .leading, spacing: 14) {
                                sectionBanner(section)
                                ForEach(section.partners) { partner in
                                    partnerBlock(partner, sectionKey: section.key)
                                }
                            }
                        }

                        if feed.sections.isEmpty {
                            Text(tr("TheONE is choosing the best partners in your city. They will appear here."))
                                .font(.theoneHeading(15))
                                .multilineTextAlignment(.center)
                                .foregroundStyle(Theme.inkSoft)
                                .frame(maxWidth: .infinity)
                                .padding(.horizontal, 30)
                        }

                        if area == .selection {
                        Button { showAllPartners = true } label: {
                            Label(tr("All business partners"), systemImage: "magnifyingglass")
                                .font(.theone(15, weight: .medium))
                                .foregroundStyle(Theme.accentText)
                                .frame(maxWidth: .infinity)
                        }
                        .padding(.bottom, 30)
                        }
                    } else if let error {
                        Text(error)
                            .font(.theone(14))
                            .foregroundStyle(Theme.inkSoft)
                            .frame(maxWidth: .infinity)
                            .padding(.top, 40)
                    } else {
                        ProgressView().tint(Theme.aqua)
                            .frame(maxWidth: .infinity)
                            .padding(.top, 60)
                    }
                }
            }
            .background(HomeBackground())
            .navigationTitle(Text(verbatim: area.name))
            .navigationBarTitleDisplayMode(.inline)
            .brandedNavigationBar()
            .homeButton()
            .navigationDestination(for: Offering.self) { OfferingDetailView(offering: $0) }
            .refreshable { await load() }
            .task { if feed == nil { await load() } }
            .fullScreenCover(isPresented: $showCheck) {
                LongevityCheckView { check in
                    lastCheck = check
                    showCheck = false
                    greeter.talk(tr("I have just done my TheONE LONGEVITY CHECK. What do you recommend for me?"))
                }
            }
            .task {
                guard area == .longevity else { return }
                struct Checks: Decodable { let checks: [LongevityCheck] }
                if let response: Checks = try? await APIClient.shared.send("/longevity/checks") {
                    lastCheck = response.checks.first
                }
            }
            .sheet(isPresented: $showAllPartners) {
                DiscoverView()
                    // In a sheet the house would close the whole member area.
                    .environment(\.closeToHome, nil)
            }
        }
    }

    /// TheONE LONGEVITY COURSE: eight lessons POWER AI teaches in conversation.
    private var courseCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(verbatim: "TheONE LONGEVITY COURSE")
                .font(.theone(13, weight: .semibold))
                .tracking(1.6)
                .foregroundStyle(Theme.accentText)
            Text(tr("Eight lessons with POWER AI, personal to you, each with one task for your week."))
                .font(.theone(14))
                .foregroundStyle(Theme.inkSoft)
            Text(tr("%lld of 8 done", completedLessons.count))
                .font(.theone(12, weight: .medium))
                .foregroundStyle(Theme.inkFaint)
            ForEach(Self.lessons, id: \.0) { lesson in
                let done = completedLessons.contains(lesson.0)
                Button {
                    greeter.talk(tr("Teach me the lesson \"%@\" of TheONE LONGEVITY COURSE.", lesson.1))
                } label: {
                    HStack(spacing: 12) {
                        Image(systemName: done ? "checkmark.circle.fill" : lesson.2)
                            .font(.system(size: 18, weight: .light))
                            .foregroundStyle(done ? Theme.aqua : Vortex.aqua700)
                            .frame(width: 26)
                        Text(lesson.1)
                            .font(.theone(15))
                            .foregroundStyle(Theme.ink)
                        Spacer()
                        Image(systemName: "play.circle")
                            .foregroundStyle(Theme.aqua)
                    }
                    .padding(.vertical, 6)
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("course.\(lesson.0)")
            }
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Theme.panel.opacity(0.88))
                .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Theme.line, lineWidth: 1))
        )
        .padding(.horizontal, 20)
        .task {
            struct Course: Decodable { let completed: [String] }
            if let course: Course = try? await APIClient.shared.send("/longevity/course") {
                completedLessons = Set(course.completed)
            }
        }
    }

    private static var lessons: [(String, String, String)] {
        [
            ("mindset", tr("The longevity mindset"), "sparkles"),
            ("sleep", tr("Deep sleep"), "moon.stars"),
            ("nutrition", tr("Eating for a long life"), "leaf"),
            ("movement", tr("Strength and movement"), "figure.walk"),
            ("stress", tr("Calm and resilience"), "wind"),
            ("supplements", tr("Supplements that matter"), "pills"),
            ("connection", tr("Connection and purpose"), "person.2"),
            ("prevention", tr("Check-ups and prevention"), "stethoscope"),
        ]
    }

    /// POWER AI's greeting for this area, with what only this area has.
    @ViewBuilder private var opener: some View {
        if area == .health {
            // TheONE HEALTH: POWER AI as a good friend, for the body and the mind.
            PowerAIOpener(
                line: area.opener,
                detail: tr("Like a good friend, POWER AI listens to you, then connects you with a trusted doctor, a wellness clinic or a five star sanatorium, and stays at your side until you feel well again.")
            ) {
                Button {
                    greeter.talk(tr("I am not feeling so good right now. Can you help me?"))
                } label: {
                    Label(tr("I don't feel good mentally"), systemImage: "heart.circle")
                        .font(.theone(16, weight: .medium))
                        .foregroundStyle(Theme.accentText)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Capsule().stroke(Theme.aqua, lineWidth: 1.2))
                }
                .accessibilityIdentifier("health.talk")
            }
        } else {
            PowerAIOpener(line: area.opener)
        }
    }

    /// TheONE REAL ESTATE, buying: the brokers have the portfolio and look for
    /// clients; the member says once what they are looking for.
    private var findCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(tr("Find your property with TheONE"))
                .font(.theoneHeading(19))
                .foregroundStyle(Theme.heading)
            Text(tr("Tell TheONE what you are looking for. The two or three best brokers for that place send you the right properties from their portfolio, including those never publicly listed."))
                .font(.theone(14))
                .foregroundStyle(Theme.inkSoft)
            Button {
                greeter.talk(tr("I am looking for a property."))
            } label: {
                Label(tr("Tell POWER AI"), systemImage: "mic")
                    .font(.theone(16, weight: .medium))
                    .foregroundStyle(Theme.onAccent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Capsule().fill(Theme.aqua))
            }
            .accessibilityIdentifier("realestate.find.voice")
            Button { showFind = true } label: {
                Label(tr("Describe your wishes"), systemImage: "square.and.pencil")
                    .font(.theone(16, weight: .medium))
                    .foregroundStyle(Theme.accentText)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Capsule().stroke(Theme.aqua, lineWidth: 1.2))
            }
            .accessibilityIdentifier("realestate.find.form")
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Theme.panel.opacity(0.88))
                .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Theme.line, lineWidth: 1))
        )
        .padding(.horizontal, 20)
        .sheet(isPresented: $showFind) { PropertyRequestView(mode: .find) }
    }

    /// TheONE REAL ESTATE: selling a home, by voice with POWER AI or in a
    /// short form; either way it goes to the best brokers for its place.
    private var sellCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(tr("Sell your property with TheONE"))
                .font(.theoneHeading(19))
                .foregroundStyle(Theme.heading)
            Text(tr("Tell TheONE about your property once. It goes to the two or three best brokers for its place, discreetly if you wish, and they reply to you directly in your messages."))
                .font(.theone(14))
                .foregroundStyle(Theme.inkSoft)
            Button {
                greeter.talk(tr("I would like to sell my property."))
            } label: {
                Label(tr("Tell POWER AI"), systemImage: "mic")
                    .font(.theone(16, weight: .medium))
                    .foregroundStyle(Theme.onAccent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Capsule().fill(Theme.aqua))
            }
            .accessibilityIdentifier("realestate.sell.voice")
            Button { showSell = true } label: {
                Label(tr("Describe your property"), systemImage: "square.and.pencil")
                    .font(.theone(16, weight: .medium))
                    .foregroundStyle(Theme.accentText)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Capsule().stroke(Theme.aqua, lineWidth: 1.2))
            }
            .accessibilityIdentifier("realestate.sell.form")
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Theme.panel.opacity(0.88))
                .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Theme.line, lineWidth: 1))
        )
        .padding(.horizontal, 20)
        .sheet(isPresented: $showSell) { PropertyRequestView(mode: .sell) }
    }

    /// TheONE LONGEVITY's own check, with the latest result when there is one.
    private var longevityCheckCard: some View {
        VStack(spacing: 14) {
            if let lastCheck {
                NavigationLink {
                    LongevityResultView(check: lastCheck, onDiscuss: nil)
                        .background(HomeBackground())
                } label: {
                    HStack(spacing: 16) {
                        ScoreRing(score: lastCheck.score, size: 64, label: "")
                        VStack(alignment: .leading, spacing: 4) {
                            Text(tr("Your longevity score"))
                                .font(.theone(16, weight: .medium))
                                .foregroundStyle(Theme.ink)
                            Text(tr("See your plan"))
                                .font(.theone(13))
                                .foregroundStyle(Theme.accentText)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(Theme.inkFaint)
                    }
                }
                .buttonStyle(.plain)
            }
            Button { showCheck = true } label: {
                Label(tr("Start TheONE LONGEVITY CHECK"), systemImage: "hourglass")
                    .font(.theone(16, weight: .medium))
                    .foregroundStyle(Theme.onAccent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Capsule().fill(Theme.aqua))
            }
            .accessibilityIdentifier("longevity.open")
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Theme.panel.opacity(0.88))
                .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Theme.line, lineWidth: 1))
        )
        .padding(.horizontal, 20)
    }

    private var header: some View {
        VStack(spacing: 10) {
            Text(verbatim: area.name)
                .font(.theoneHeading(21))
                .tracking(2.5)
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.heading)
            Text(area.line)
                .font(.theoneHeading(15))
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.inkSoft)
        }
        .frame(maxWidth: .infinity)
        .padding(.horizontal, 24)
        .padding(.vertical, 22)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Theme.aquaTint.opacity(0.92))
                .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Theme.aqua.opacity(0.3), lineWidth: 1))
        )
        .padding(.horizontal, 20)
        .padding(.top, 16)
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text.uppercased().replacingOccurrences(of: "THEONE", with: "TheONE"))
            .font(.theone(12, weight: .medium))
            .tracking(MemberLanguage.spacing(2.4))
            .foregroundStyle(Theme.accentText)
            .padding(.horizontal, 20)
    }

    private func sectionBanner(_ section: SelectionSection) -> some View {
        ZStack(alignment: .bottomLeading) {
            AreaPicture(path: section.imagePath, symbol: SelectionSection.symbol(for: section.key))
            .frame(height: 120)
            .frame(maxWidth: .infinity)
            .clipped()
            LinearGradient(colors: [.clear, Vortex.abyss.opacity(0.65)], startPoint: .top, endPoint: .bottom)
            Text(section.title)
                .font(.theoneHeading(19))
                .foregroundStyle(.white)
                .padding(16)
        }
        .frame(height: 120)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        // Only the visible banner takes touches, never the picture's overflow.
        .contentShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
        .padding(.horizontal, 20)
    }

    private func partnerBlock(_ partner: SelectionPartner, sectionKey: String) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            NavigationLink {
                PartnerDetailView(partnerId: partner.id)
            } label: {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(partner.name)
                            .font(.theone(17, weight: .medium))
                            .foregroundStyle(Theme.ink)
                        if partner.category != "beauty" {
                            Text(partner.city)
                                .font(.theone(12.5))
                                .foregroundStyle(Theme.inkFaint)
                        }
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.inkFaint)
                }
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)

            // The whole range at a glance, not only what fits in one row.
            if partner.offerings.count > 2 {
                NavigationLink {
                    PartnerRangeView(partner: partner)
                } label: {
                    Label(tr("See all %lld", partner.offerings.count), systemImage: "square.grid.2x2")
                        .font(.theone(13.5, weight: .medium))
                        .foregroundStyle(Theme.accentText)
                }
                .buttonStyle(.plain)
                .padding(.horizontal, 20)
                .accessibilityIdentifier("partner.range")
            }

            // TheONE REAL ESTATE: each broker's office, to call or write to.
            if area == .realestate, let office = partner.office {
                officeCard(office, city: partner.city)
            }

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(partner.offerings) { offering in
                        // Narrow enough that a third card peeks in: the row goes on.
                        NavigationLink(value: offering) {
                            OfferingCard(offering: offering, width: 158, showReason: false)
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("offering.card")
                    }
                }
                .padding(.horizontal, 20)
            }
        }
    }

    private func officeCard(_ office: SelectionPartner.Office, city: String) -> some View {
        let address = [office.street, [office.postalCode, city].compactMap { $0 }.joined(separator: " ")]
            .compactMap { $0 }
            .filter { !$0.isEmpty }
            .joined(separator: ", ")
        let phoneURL = URL(string: "tel://\(office.phone.filter { $0.isNumber || $0 == "+" })")
        let mailURL = URL(string: "mailto:\(office.email)")
        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 10) {
                Image(systemName: "building.2")
                    .font(.system(size: 14, weight: .light))
                    .foregroundStyle(Theme.aqua)
                    .frame(width: 20)
                VStack(alignment: .leading, spacing: 2) {
                    Text(tr("Office").uppercased())
                        .font(.theone(11, weight: .medium))
                        .tracking(MemberLanguage.spacing(1.6))
                        .foregroundStyle(Theme.accentText)
                    Text(address)
                        .font(.theone(14))
                        .foregroundStyle(Theme.ink)
                    if !office.phone.isEmpty {
                        Text(office.phone)
                            .font(.theone(13))
                            .foregroundStyle(Theme.inkSoft)
                    }
                }
            }
            HStack(spacing: 10) {
                if let phoneURL, !office.phone.isEmpty {
                    Link(destination: phoneURL) {
                        Label(tr("Call"), systemImage: "phone")
                            .font(.theone(14, weight: .medium))
                            .foregroundStyle(Theme.accentText)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Capsule().stroke(Theme.aqua, lineWidth: 1))
                    }
                    .accessibilityIdentifier("office.call")
                }
                if let mailURL {
                    Link(destination: mailURL) {
                        Label(tr("Email"), systemImage: "envelope")
                            .font(.theone(14, weight: .medium))
                            .foregroundStyle(Theme.accentText)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 10)
                            .background(Capsule().stroke(Theme.aqua, lineWidth: 1))
                    }
                }
            }
        }
        .padding(14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Theme.panel.opacity(0.85))
                .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Theme.line, lineWidth: 1))
        )
        .padding(.horizontal, 20)
    }

    private func load() async {
        do {
            feed = try await APIClient.shared.send("/selection?area=\(area.rawValue)")
            error = nil
        } catch {
            self.error = (error as? APIError)?.errorDescription ?? tr("Could not load business partners.")
        }
    }
}

/// A partner's whole range as a grid, two cards per row.
struct PartnerRangeView: View {
    let partner: SelectionPartner

    var body: some View {
        GeometryReader { proxy in
            let width = (proxy.size.width - 20 * 2 - 14) / 2
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(partner.name)
                            .font(.theoneHeading(24))
                            .foregroundStyle(Theme.heading)
                        Text(tr("%lld products", partner.offerings.count))
                            .font(.theone(13))
                            .foregroundStyle(Theme.inkFaint)
                    }
                    LazyVGrid(columns: [GridItem(.fixed(width), spacing: 14), GridItem(.fixed(width))], alignment: .leading, spacing: 14) {
                        ForEach(partner.offerings) { offering in
                            // Pushed from a pushed view: a destination link,
                            // since a value link would not push from here.
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
                .padding(20)
            }
        }
        .background(HomeBackground())
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// One product, treatment, programme or stay, as a card.
struct OfferingCard: View {
    let offering: Offering
    let width: CGFloat
    let showReason: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // A product photographed by the partner is square: shown whole,
            // so a jar is never cut off at the lid.
            OfferingImage(offering: offering)
                .frame(width: width, height: offering.ownProductPhoto ? width : width * 0.62)
                .clipped()
                .contentShape(Rectangle())
            VStack(alignment: .leading, spacing: 5) {
                Text(offering.title)
                    .font(.theone(14.5, weight: .medium))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Text(offering.partner.name)
                    .font(.theone(12))
                    .foregroundStyle(Theme.inkFaint)
                    .lineLimit(1)
                if showReason, let reason = offering.reason, !reason.isEmpty {
                    Text(reason)
                        .font(.theone(12))
                        .foregroundStyle(Theme.inkSoft)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)
                } else if showReason, offering.basis == "skin" {
                    Label(tr("Fits your TheONE SKIN SCAN"), systemImage: "face.smiling")
                        .font(.theone(11.5))
                        .foregroundStyle(Theme.accentText)
                }
                Text(offering.priceText)
                    .font(.theone(13.5, weight: .semibold))
                    .foregroundStyle(Theme.accentText)
                    .padding(.top, 2)
            }
            .padding(12)
            .frame(width: width, alignment: .leading)
        }
        .background(Theme.panel)
        .clipShape(RoundedRectangle(cornerRadius: 18, style: .continuous))
        .overlay(RoundedRectangle(cornerRadius: 18, style: .continuous).stroke(Theme.line, lineWidth: 1))
        .shadow(color: Vortex.abyss.opacity(0.08), radius: 8, y: 4)
    }
}

/// The partner's own picture, or the area's picture until they add one.
struct OfferingImage: View {
    let offering: Offering

    var body: some View {
        let key = SelectionSection.key(for: offering)
        if let url = offering.imageUrl.flatMap(URL.init(string:)) {
            AsyncImage(url: url) { image in
                image.resizable().scaledToFill().allowsHitTesting(false)
            } placeholder: {
                Theme.aquaTint
            }
        } else {
            // No photo of its own: TheONE's lettering, never a borrowed picture
            // repeated card after card (the owner asked for no doubled images).
            OfferingLettering(label: offering.areaLabel, title: offering.partner.city)
        }
    }
}

/// An offering without its own photo: TheONE's lettering from the logo
/// artwork, the area beneath ("REAL ESTATE", "HEALTH"), and the city, on the
/// website's pale ground.
struct OfferingLettering: View {
    let label: String
    let title: String

    var body: some View {
        ZStack {
            LinearGradient(colors: [Theme.aquaTint, Theme.paperSoft], startPoint: .topLeading, endPoint: .bottomTrailing)
            VStack(spacing: 7) {
                Wordmark(size: 17)
                Text(verbatim: label)
                    .font(.theone(12, weight: .medium))
                    .multilineTextAlignment(.center)
                    .tracking(4)
                    .foregroundStyle(Theme.heading)
                Rectangle()
                    .fill(Theme.aqua.opacity(0.5))
                    .frame(width: 26, height: 1)
                    .padding(.vertical, 2)
                Text(title.uppercased())
                    .font(.theone(10.5))
                    .tracking(MemberLanguage.spacing(2.4))
                    .foregroundStyle(Theme.inkSoft)
            }
            .padding(12)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel(Text(verbatim: "TheONE \(label), \(title)"))
    }
}

/// The area's website picture, or a petrol surface with a symbol.
struct AreaPicture: View {
    let path: String?
    let symbol: String?

    var body: some View {
        if let path {
            AsyncImage(url: Site.url(path)) { image in
                image.resizable().scaledToFill().allowsHitTesting(false)
            } placeholder: {
                Theme.aquaTint
            }
        } else {
            ZStack {
                LinearGradient(colors: [Vortex.aqua700, Vortex.abyss], startPoint: .topLeading, endPoint: .bottomTrailing)
                if let symbol {
                    Image(systemName: symbol)
                        .font(.system(size: 34, weight: .ultraLight))
                        .foregroundStyle(.white.opacity(0.85))
                }
            }
        }
    }
}

/// One offering in full, and the way to ask the partner for it.
struct OfferingDetailView: View {
    let offering: Offering

    @State private var sending = false
    @State private var chat: (id: String, name: String)?
    @State private var error: String?

    private struct Response: Decodable { let conversationId: String; let partnerName: String }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                OfferingImage(offering: offering)
                    .frame(maxWidth: .infinity)
                    .frame(height: offering.ownProductPhoto ? nil : 230)
                    .aspectRatio(offering.ownProductPhoto ? 1 : nil, contentMode: .fit)
                    .clipped()

                VStack(alignment: .leading, spacing: 14) {
                    Text(offering.title)
                        .font(.theoneHeading(22))
                        .foregroundStyle(Theme.heading)
                    NavigationLink {
                        PartnerDetailView(partnerId: offering.partner.id)
                    } label: {
                        Label(offering.partner.category == "beauty" ? offering.partner.name : "\(offering.partner.name) · \(offering.partner.city)", systemImage: "building.2")
                            .font(.theone(14))
                            .foregroundStyle(Theme.accentText)
                    }
                    Text(offering.priceText)
                        .font(.theone(20, weight: .medium))
                        .foregroundStyle(Theme.ink)

                    if let reason = offering.reason, !reason.isEmpty {
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: "sparkles").foregroundStyle(Theme.aqua)
                            Text(reason)
                                .font(.theone(14.5))
                                .foregroundStyle(Theme.ink)
                        }
                        .padding(14)
                        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Theme.aquaTint))
                    }

                    Text(offering.description)
                        .font(.theone(15.5))
                        .lineSpacing(3)
                        .foregroundStyle(Theme.inkSoft)

                    // No "helps with" chips of TheONE's own: the page shows the
                    // partner's texts only. The skin keys stay for recommendations.

                    if let error {
                        Text(error).font(.theone(13)).foregroundStyle(.red)
                    }

                    if let shop = offering.shopURL {
                        // A partner with its own shop: bought there, directly.
                        Link(destination: shop) {
                            Label(tr("Buy in the shop"), systemImage: "bag")
                                .font(.theone(16, weight: .medium))
                                .foregroundStyle(Theme.onAccent)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 15)
                                .background(Capsule().fill(Theme.aqua))
                        }
                        .accessibilityIdentifier("offering.shop")

                        Text(tr("You buy directly in the business partner's own shop."))
                            .font(.theone(12))
                            .foregroundStyle(Theme.inkFaint)
                    } else {
                        Button {
                            Task { await request() }
                        } label: {
                            HStack {
                                if sending { ProgressView().tint(Theme.onAccent) }
                                Text(offering.actionTitle)
                            }
                            .font(.theone(16, weight: .medium))
                            .foregroundStyle(Theme.onAccent)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(Capsule().fill(Theme.aqua))
                        }
                        .disabled(sending)
                        .accessibilityIdentifier("offering.request")

                        Text(tr("Your request goes straight to the business partner, who will reply in Messages."))
                            .font(.theone(12))
                            .foregroundStyle(Theme.inkFaint)
                    }
                }
                .padding(.horizontal, 20)
                .padding(.bottom, 30)
            }
        }
        .background(HomeBackground())
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(isPresented: Binding(get: { chat != nil }, set: { if !$0 { chat = nil } })) {
            if let chat { ConversationView(conversationId: chat.id, title: chat.name) }
        }
    }

    private func request() async {
        sending = true
        error = nil
        defer { sending = false }
        do {
            let response: Response = try await APIClient.shared.send(
                "/selection/request", method: "POST", body: ["offeringId": offering.id]
            )
            chat = (response.conversationId, response.partnerName)
        } catch {
            self.error = (error as? APIError)?.errorDescription ?? tr("Something went wrong. Please try again.")
        }
    }
}
