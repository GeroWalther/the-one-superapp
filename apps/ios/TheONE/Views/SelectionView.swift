import SwiftUI

/// TheONE SELECTION: what TheONE has chosen, area by area, and above it what
/// it has chosen for this member. Never a market: two or three partners per
/// area and city, each with the exact things they offer.
struct SelectionView: View {
    /// Which TheONE area this shows; SELECTION itself is products only.
    var area: Area = .selection

    @Environment(Greeter.self) private var greeter
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

                    if area == .longevity {
                        longevityCheckCard
                        courseCard
                    }
                    if area == .health { mentalCard }

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
                                .font(.system(size: 15, design: .serif))
                                .multilineTextAlignment(.center)
                                .foregroundStyle(Theme.inkSoft)
                                .frame(maxWidth: .infinity)
                                .padding(.horizontal, 30)
                        }

                        if area == .selection {
                        Button { showAllPartners = true } label: {
                            Label(tr("All business partners"), systemImage: "magnifyingglass")
                                .font(.system(size: 15, weight: .medium))
                                .foregroundStyle(Theme.aqua)
                                .frame(maxWidth: .infinity)
                        }
                        .padding(.bottom, 30)
                        }
                    } else if let error {
                        Text(error)
                            .font(.system(size: 14))
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
                .font(.system(size: 13, weight: .semibold))
                .tracking(1.6)
                .foregroundStyle(Theme.aqua)
            Text(tr("Eight lessons with POWER AI, personal to you, each with one task for your week."))
                .font(.system(size: 14))
                .foregroundStyle(Theme.inkSoft)
            Text(tr("%lld of 8 done", completedLessons.count))
                .font(.system(size: 12, weight: .medium))
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
                            .font(.system(size: 15))
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

    /// In TheONE HEALTH: a way to POWER AI when the member does not feel good.
    private var mentalCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text(tr("Not feeling good?"))
                .font(.system(size: 20, weight: .light, design: .serif))
                .foregroundStyle(Theme.ink)
            Text(tr("POWER AI is here for you: someone to talk to, calm advice and the next small step."))
                .font(.system(size: 14))
                .foregroundStyle(Theme.inkSoft)
            Button {
                greeter.talk(tr("I am not feeling so good right now. Can you help me?"))
            } label: {
                Label(tr("Talk to POWER AI"), systemImage: "heart.circle")
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(Theme.onAccent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Capsule().fill(Theme.aqua))
            }
            .accessibilityIdentifier("health.talk")
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Theme.panel.opacity(0.88))
                .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Theme.line, lineWidth: 1))
        )
        .padding(.horizontal, 20)
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
                                .font(.system(size: 16, weight: .medium))
                                .foregroundStyle(Theme.ink)
                            Text(tr("See your plan"))
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.aqua)
                        }
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(Theme.inkFaint)
                    }
                }
                .buttonStyle(.plain)
            }
            Button { showCheck = true } label: {
                Label(tr("Start TheONE LONGEVITY CHECK"), systemImage: "hourglass")
                    .font(.system(size: 16, weight: .medium))
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
                .font(.system(size: 24, weight: .regular, design: .serif))
                .tracking(2.5)
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.ink)
            Text(area.line)
                .font(.system(size: 15, weight: .light, design: .serif))
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
            .font(.system(size: 12, weight: .medium))
            .tracking(MemberLanguage.spacing(2.4))
            .foregroundStyle(Theme.aqua)
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
                .font(.system(size: 22, weight: .regular, design: .serif))
                .foregroundStyle(.white)
                .padding(16)
        }
        .frame(height: 120)
        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
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
                            .font(.system(size: 17, weight: .medium))
                            .foregroundStyle(Theme.ink)
                        Text(partner.city)
                            .font(.system(size: 12.5))
                            .foregroundStyle(Theme.inkFaint)
                    }
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundStyle(Theme.inkFaint)
                }
            }
            .buttonStyle(.plain)
            .padding(.horizontal, 20)

            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(partner.offerings) { offering in
                        NavigationLink(value: offering) {
                            OfferingCard(offering: offering, width: 190, showReason: false)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 20)
            }
        }
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

/// One product, treatment, programme or stay, as a card.
struct OfferingCard: View {
    let offering: Offering
    let width: CGFloat
    let showReason: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            OfferingImage(offering: offering)
                .frame(width: width, height: width * 0.62)
                .clipped()
            VStack(alignment: .leading, spacing: 5) {
                Text(offering.title)
                    .font(.system(size: 14.5, weight: .medium))
                    .foregroundStyle(Theme.ink)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)
                Text(offering.partner.name)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.inkFaint)
                    .lineLimit(1)
                if showReason, let reason = offering.reason, !reason.isEmpty {
                    Text(reason)
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.inkSoft)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)
                } else if showReason, offering.basis == "skin" {
                    Label(tr("Fits your TheONE SKIN SCAN"), systemImage: "face.smiling")
                        .font(.system(size: 11.5))
                        .foregroundStyle(Theme.aqua)
                }
                Text(offering.priceText)
                    .font(.system(size: 13.5, weight: .semibold))
                    .foregroundStyle(Theme.aqua)
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
                image.resizable().scaledToFill()
            } placeholder: {
                Theme.aquaTint
            }
        } else {
            AreaPicture(path: SelectionSection.image(for: key), symbol: SelectionSection.symbol(for: key))
        }
    }
}

/// The area's website picture, or a petrol surface with a symbol.
struct AreaPicture: View {
    let path: String?
    let symbol: String?

    var body: some View {
        if let path {
            AsyncImage(url: Site.url(path)) { image in
                image.resizable().scaledToFill()
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
                    .frame(height: 230)
                    .frame(maxWidth: .infinity)
                    .clipped()

                VStack(alignment: .leading, spacing: 14) {
                    Text(offering.title)
                        .font(.system(size: 26, weight: .light, design: .serif))
                        .foregroundStyle(Theme.ink)
                    NavigationLink {
                        PartnerDetailView(partnerId: offering.partner.id)
                    } label: {
                        Label("\(offering.partner.name) · \(offering.partner.city)", systemImage: "building.2")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.aqua)
                    }
                    Text(offering.priceText)
                        .font(.system(size: 20, weight: .medium))
                        .foregroundStyle(Theme.ink)

                    if let reason = offering.reason, !reason.isEmpty {
                        HStack(alignment: .top, spacing: 10) {
                            Image(systemName: "sparkles").foregroundStyle(Theme.aqua)
                            Text(reason)
                                .font(.system(size: 14.5))
                                .foregroundStyle(Theme.ink)
                        }
                        .padding(14)
                        .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Theme.aquaTint))
                    }

                    Text(offering.description)
                        .font(.system(size: 15.5))
                        .lineSpacing(3)
                        .foregroundStyle(Theme.inkSoft)

                    if !offering.concerns.isEmpty {
                        Text(tr("Helps with"))
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(Theme.inkFaint)
                        FlowLayout(spacing: 8) {
                            ForEach(offering.concerns, id: \.self) { concern in
                                Text(SkinWords.label(concern))
                                    .font(.system(size: 13))
                                    .foregroundStyle(Theme.aqua)
                                    .padding(.horizontal, 11)
                                    .padding(.vertical, 6)
                                    .background(Capsule().fill(Theme.aquaTint))
                            }
                        }
                    }

                    if let error {
                        Text(error).font(.system(size: 13)).foregroundStyle(.red)
                    }

                    Button {
                        Task { await request() }
                    } label: {
                        HStack {
                            if sending { ProgressView().tint(Theme.onAccent) }
                            Text(offering.actionTitle)
                        }
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(Theme.onAccent)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(Capsule().fill(Theme.aqua))
                    }
                    .disabled(sending)
                    .accessibilityIdentifier("offering.request")

                    Text(tr("Your request goes straight to the business partner, who will reply in Messages."))
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.inkFaint)
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
