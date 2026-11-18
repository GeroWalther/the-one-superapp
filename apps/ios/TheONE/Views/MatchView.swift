import SwiftUI

/// TheONE MATCH.
///
/// Deliberately not a stack of faces to swipe through. TheONE only ever
/// connects two people who fit each other completely, so each suggestion is
/// handled like a personal introduction: one at a time, with the reasons the
/// two belong together, and two calm answers instead of a flick of the thumb.
struct MatchView: View {
    @Environment(SessionStore.self) private var session
    @Environment(Greeter.self) private var greeter

    private enum Phase { case loading, noProfile, ready, failed }

    @State private var phase: Phase = .loading
    @State private var profile: MatchProfile?
    @State private var suggestions: [MatchCard] = []
    @State private var position = 0
    @State private var deciding = false
    @State private var error: String?

    @State private var editing = false
    @State private var showConnections = false
    @State private var justMatched: MatchSummary?
    @State private var chat: MatchSummary?

    private var words: MatchWords { MatchWords() }

    var body: some View {
        NavigationStack {
            Group {
                switch phase {
                case .loading:
                    ProgressView().tint(Theme.aqua)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                case .noProfile:
                    welcome
                case .ready:
                    if suggestions.indices.contains(position), let profile {
                        Introduction(
                            card: suggestions[position],
                            seeking: profile.seeking,
                            myIntention: profile.intention,
                            count: (position + 1, suggestions.count),
                            deciding: deciding,
                            words: words,
                            onAnswer: answer
                        )
                        .id(suggestions[position].id)
                        .transition(.opacity)
                    } else {
                        waiting
                    }
                case .failed:
                    VStack(spacing: 14) {
                        Text(error ?? words("Etwas ist schiefgelaufen.", "Something went wrong."))
                            .font(.theone(15))
                            .foregroundStyle(Theme.inkSoft)
                        Button(words("Noch einmal versuchen", "Try again")) { Task { await load() } }
                            .tint(Theme.aqua)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
            }
            .animation(.easeInOut(duration: 0.45), value: position)
            .background(HomeBackground())
            .navigationTitle(Text(verbatim: "TheONE MATCH"))
            .navigationBarTitleDisplayMode(.inline)
            .brandedNavigationBar()
            .homeButton()
            .toolbar {
                if profile != nil {
                    ToolbarItemGroup(placement: .topBarTrailing) {
                        Button { showConnections = true } label: {
                            Image(systemName: "person.2")
                        }
                        .accessibilityLabel(words("Deine Verbindungen", "Your connections"))

                        Button { editing = true } label: {
                            Image(systemName: "slider.horizontal.3")
                        }
                        .accessibilityLabel(words("Mein Profil und meine Wünsche", "My profile and wishes"))
                    }
                }
            }
            .navigationDestination(isPresented: $showConnections) {
                ConnectionsView(words: words)
            }
            .navigationDestination(item: $chat) { match in
                if let id = match.conversationId {
                    ConversationView(conversationId: id, title: match.firstName)
                }
            }
        }
        .powerAIGreeting(tr("Shall we find the one person who truly fits you, one hundred percent, both ways?"))
        .task { await load() }
        .sheet(isPresented: $editing) {
            MatchProfileForm(
                existing: profile,
                words: words,
                onSaved: { saved in
                    profile = saved
                    Task { await loadSuggestions() }
                },
                onDeleted: {
                    profile = nil
                    suggestions = []
                    phase = .noProfile
                }
            )
        }
        .sheet(item: $justMatched) { match in
            MatchMoment(match: match, words: words) {
                justMatched = nil
                Task {
                    try? await Task.sleep(for: .milliseconds(400))
                    chat = match
                }
            }
            .presentationDetents([.medium, .large])
        }
    }

    // MARK: - States

    private var welcome: some View {
        ScrollView {
            VStack(spacing: 0) {
                VStack(spacing: 16) {
                    // English in every language, like all of TheONE's claims.
                    Text(verbatim: "FIND YOUR MATCH")
                        .font(.theoneHeading(23))
                        .tracking(3)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(Theme.ink)
                        .accessibilityAddTraits(.isHeader)

                    Text(words(
                        "Du wirst mit dem einen einzigen Menschen verbunden, der dein MATCH ist.",
                        "You will be connected with the one and only person who is your MATCH."
                    ))
                    .font(.theoneHeading(17))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.heading)
                }
                .padding(.horizontal, 24)
                .padding(.vertical, 28)
                .frame(maxWidth: .infinity)
                .background(
                    // Light petrol, the start screen's wash in a box.
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(Theme.aquaTint.opacity(0.92))
                        .overlay(
                            RoundedRectangle(cornerRadius: 22, style: .continuous)
                                .stroke(Theme.aqua.opacity(0.30), lineWidth: 1)
                        )
                )
                .padding(.horizontal, 20)
                .padding(.top, 24)

                VStack(alignment: .leading, spacing: 18) {
                    Promise(
                        symbol: "checkmark.seal",
                        title: words("100 % Übereinstimmung", "100 % fit"),
                        text: words(
                            "Jeder deiner Wünsche ist erfüllt, und du erfüllst jeden Wunsch deines Gegenübers.",
                            "Every wish of yours is met, and you meet every wish of theirs."
                        )
                    )
                    Promise(
                        symbol: "lock",
                        title: words("Diskret", "Discreet"),
                        text: words(
                            "Dein Profil sieht nur, wer vollkommen zu dir passt. Niemand blättert durch Gesichter.",
                            "Only someone who fits you completely ever sees your profile. Nobody browses faces."
                        )
                    )
                    Promise(
                        symbol: "person.2",
                        title: words("Gegenseitig", "Mutual"),
                        text: words(
                            "Kontakt entsteht erst, wenn ihr beide Ja sagt.",
                            "Contact opens only when you both say yes."
                        )
                    )
                }
                .padding(22)
                .background(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(Theme.panel.opacity(0.85))
                        .overlay(
                            RoundedRectangle(cornerRadius: 22, style: .continuous)
                                .stroke(Theme.line, lineWidth: 1)
                        )
                )
                .padding(.horizontal, 20)
                .padding(.top, 16)

                Button { editing = true } label: {
                    Text(words("Mein Profil anlegen", "Create my profile"))
                        .font(.theone(16, weight: .medium))
                        .foregroundStyle(Theme.onAccent)
                        .padding(.horizontal, 30)
                        .padding(.vertical, 15)
                        .background(Capsule().fill(Theme.aqua))
                }
                .accessibilityIdentifier("match.create")
                .padding(.top, 30)
                .padding(.bottom, 40)
            }
            .frame(maxWidth: .infinity)
        }
    }

    private var waiting: some View {
        VStack(spacing: 16) {
            Image(systemName: "sparkles")
                .font(.system(size: 30, weight: .light))
                .foregroundStyle(Theme.aqua)
            Text(words("Wir suchen für dich.", "We are looking for you."))
                .font(.theoneHeading(22))
                .foregroundStyle(Theme.heading)
            Text(words(
                "Im Moment passt niemand in allem zu dir. Sobald es jemanden gibt, der jeden deiner Wünsche erfüllt, verbinden wir dich.",
                "Nobody fits you in every way just now. As soon as someone meets every wish of yours, we will connect you."
            ))
            .font(.theone(15))
            .multilineTextAlignment(.center)
            .foregroundStyle(Theme.inkSoft)
            .padding(.horizontal, 34)

            if profile?.photos.isEmpty == true {
                Button(words("Foto hinzufügen", "Add a photo")) { editing = true }
                    .font(.theone(15, weight: .medium))
                    .tint(Theme.aqua)
                    .padding(.top, 6)
            }
            Button(words("Wünsche ansehen", "Review my wishes")) { editing = true }
                .font(.theone(15))
                .tint(Theme.aqua)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    // MARK: - Loading and answering

    private struct ProfileResponse: Decodable { let profile: MatchProfile? }
    private struct SuggestionsResponse: Decodable { let suggestions: [MatchCard] }
    private struct DecisionResponse: Decodable {
        let matched: Bool
        let match: MatchSummary?
    }

    private func load() async {
        do {
            let response: ProfileResponse = try await APIClient.shared.send("/match/profile")
            profile = response.profile
            if response.profile == nil {
                phase = .noProfile
            } else {
                await loadSuggestions()
            }
        } catch {
            self.error = (error as? APIError)?.errorDescription
            phase = .failed
        }
    }

    private func loadSuggestions() async {
        do {
            let response: SuggestionsResponse = try await APIClient.shared.send("/match/suggestions")
            suggestions = response.suggestions
            position = 0
            phase = .ready
        } catch {
            self.error = (error as? APIError)?.errorDescription
            phase = .failed
        }
    }

    private func answer(_ yes: Bool) {
        guard suggestions.indices.contains(position), !deciding else { return }
        let card = suggestions[position]
        deciding = true

        Task {
            defer { deciding = false }
            do {
                let response: DecisionResponse = try await APIClient.shared.send(
                    "/match/decision",
                    method: "POST",
                    body: ["targetId": card.id, "decision": yes ? "like" : "pass"]
                )
                position += 1
                if response.matched, let match = response.match {
                    justMatched = match
                    if let account = session.account {
                        greeter.announce(match, to: account)
                    }
                }
            } catch {
                self.error = (error as? APIError)?.errorDescription
            }
        }
    }
}

// MARK: - One introduction

private struct Introduction: View {
    let card: MatchCard
    /// What the viewer is looking for; decides "he" or "she" in the letter.
    let seeking: String
    let myIntention: String
    let count: (Int, Int)
    let deciding: Bool
    let words: MatchWords
    let onAnswer: (Bool) -> Void

    private var he: Bool { seeking == "man" }

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Text(words("DEINE VERBINDUNG", "YOUR CONNECTION"))
                    .font(.theone(11, weight: .medium))
                    .tracking(MemberLanguage.spacing(3))
                    .foregroundStyle(Theme.accentText)
                    .padding(.top, 26)
                if count.1 > 1 {
                    Text(words.german ? "\(count.0) von \(count.1)" : tr("%1$lld of %2$lld", count.0, count.1))
                        .font(.theone(12))
                        .foregroundStyle(Theme.inkFaint)
                        .padding(.top, 4)
                }

                Portrait(url: card.photos.first, initial: String(card.firstName.prefix(1)), size: 156)
                    .padding(.top, 22)

                Text(verbatim: "\(card.firstName), \(card.age)")
                    .font(.theoneHeading(28))
                    .foregroundStyle(Theme.heading)
                    .padding(.top, 18)
                    .accessibilityIdentifier("match.name")

                Text(verbatim: "\(card.profession) · \(card.city)")
                    .font(.theone(15))
                    .foregroundStyle(Theme.inkSoft)
                    .padding(.top, 4)

                Label(words("100 % Übereinstimmung", "100 % fit"), systemImage: "checkmark.seal")
                    .font(.theone(13, weight: .medium))
                    .foregroundStyle(Theme.accentText)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 7)
                    .background(
                        Capsule()
                            .fill(Theme.aquaTint)
                            .overlay(Capsule().stroke(Theme.aqua.opacity(0.35), lineWidth: 1))
                    )
                    .padding(.top, 14)

                Text(letter)
                    .font(.theoneHeading(16.5))
                    .lineSpacing(4)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.ink)
                    .padding(.horizontal, 30)
                    .padding(.top, 24)

                if !card.about.isEmpty {
                    VStack(spacing: 8) {
                        Text(he ? words("IN SEINEN WORTEN", "IN HIS WORDS") : words("IN IHREN WORTEN", "IN HER WORDS"))
                            .font(.theone(10.5, weight: .medium))
                            .tracking(MemberLanguage.spacing(2.4))
                            .foregroundStyle(Theme.inkFaint)
                        Text(words.german ? "„\(card.about)“" : tr("“%@”", card.about))
                            .font(.theone(15))
                            .multilineTextAlignment(.center)
                            .foregroundStyle(Theme.inkSoft)
                    }
                    .padding(.horizontal, 30)
                    .padding(.top, 24)
                }

                details
                    .padding(.horizontal, 20)
                    .padding(.top, 26)

                VStack(spacing: 6) {
                    Button { onAnswer(true) } label: {
                        Text(words("Gern kennenlernen", "I would like to meet"))
                            .font(.theone(16, weight: .medium))
                            .foregroundStyle(Theme.onAccent)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(Capsule().fill(Theme.aqua))
                    }
                    .accessibilityIdentifier("match.yes")

                    Button { onAnswer(false) } label: {
                        Text(words("Nicht jetzt", "Not now"))
                            .font(.theone(15))
                            .foregroundStyle(Theme.inkSoft)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                    }
                    .accessibilityIdentifier("match.no")
                }
                .disabled(deciding)
                .opacity(deciding ? 0.6 : 1)
                .padding(.horizontal, 32)
                .padding(.top, 28)
                .padding(.bottom, 36)
            }
            .frame(maxWidth: .infinity)
        }
    }

    /// Written like a note from a concierge, not a list of attributes.
    private var letter: String {
        let name = card.firstName
        guard words.german else { return translatedLetter }
        var text = "Wir möchten dich mit \(name) verbinden. \(he ? "Er" : "Sie") erfüllt jeden deiner Wünsche, und du erfüllst jeden \(he ? "seiner" : "ihrer")."

        let bond: String = switch myIntention {
        case "relationship": words("eine feste Beziehung", "a lasting relationship")
        case "friendship": words("eine Freundschaft", "a friendship")
        default: words("schöne Begegnungen", "lovely encounters")
        }
        text += " Ihr beide wünscht euch \(bond)"
        text += card.sharedHobbies.isEmpty
            ? "."
            : " und teilt eure Freude an \(words.spokenList(card.sharedHobbies))."
        return text
    }

    /// The same letter in every other language, built from whole translated
    /// sentences so each language keeps its own word order.
    private var translatedLetter: String {
        let opening = tr(
            he
                ? "We would like to connect you with %@. He meets every wish of yours, and you meet every one of his."
                : "We would like to connect you with %@. She meets every wish of yours, and you meet every one of hers.",
            card.firstName
        )
        let bond: String = switch myIntention {
        case "relationship": tr("a lasting relationship")
        case "friendship": tr("a friendship")
        default: tr("lovely encounters")
        }
        let together = card.sharedHobbies.isEmpty
            ? tr("You both hope for %@.", bond)
            : tr("You both hope for %1$@ and share a love of %2$@.", bond, words.spokenList(card.sharedHobbies))
        return opening + tr(" ") + together
    }

    private var details: some View {
        VStack(alignment: .leading, spacing: 14) {
            Grid(alignment: .leading, horizontalSpacing: 18, verticalSpacing: 10) {
                row(words("Größe", "Height"), "\(card.heightCm) cm", fits: card.fitsWishes.contains("height"))
                row(words("Haare", "Hair"), words.label(card.hairColor), fits: card.fitsWishes.contains("hair"))
                row(words("Augen", "Eyes"), words.label(card.eyeColor), fits: card.fitsWishes.contains("eyes"))
                row(words("Figur", "Figure"), words.label(card.figure), fits: card.fitsWishes.contains("figure"))
            }

            Divider().overlay(Theme.line)

            Text(words("FREIZEIT", "PASTIMES"))
                .font(.theone(10.5, weight: .medium))
                .tracking(MemberLanguage.spacing(2.4))
                .foregroundStyle(Theme.inkFaint)
            FlowLayout(spacing: 8) {
                ForEach(card.hobbies, id: \.self) { hobby in
                    let shared = card.sharedHobbies.contains(hobby)
                    Text(words.label(hobby))
                        .font(.theone(13.5))
                        .foregroundStyle(shared ? Theme.aqua : Theme.inkSoft)
                        .padding(.horizontal, 12)
                        .padding(.vertical, 7)
                        .background(
                            Capsule()
                                .fill(shared ? Theme.aquaTint : Theme.paperSoft)
                                .overlay(Capsule().stroke(shared ? Theme.aqua.opacity(0.35) : Theme.line, lineWidth: 1))
                        )
                }
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Theme.panel.opacity(0.85))
                .overlay(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .stroke(Theme.line, lineWidth: 1)
                )
        )
    }

    @ViewBuilder
    private func row(_ title: String, _ value: String, fits: Bool) -> some View {
        GridRow {
            Text(title)
                .font(.theone(14))
                .foregroundStyle(Theme.inkFaint)
            HStack(spacing: 6) {
                Text(value)
                    .font(.theone(15))
                    .foregroundStyle(Theme.ink)
                if fits {
                    Image(systemName: "checkmark")
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(Theme.aqua)
                        .accessibilityLabel(words("Dein Wunsch", "Your wish"))
                }
            }
        }
    }
}

// MARK: - The moment both said yes

private struct MatchMoment: View {
    let match: MatchSummary
    let words: MatchWords
    let onWrite: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        VStack(spacing: 0) {
            Portrait(url: match.photo, initial: String(match.firstName.prefix(1)), size: 120)
                .padding(.top, 40)

            Text(words("Ihr beide sagt Ja.", "You both said yes."))
                .font(.theoneHeading(26))
                .foregroundStyle(Theme.heading)
                .padding(.top, 22)

            Text(words.german
                ? "\(match.firstName) möchte dich auch kennenlernen. Schreib ein paar persönliche Zeilen."
                : tr("%@ would like to meet you too. Write a few personal lines.", match.firstName))
            .font(.theone(16))
            .multilineTextAlignment(.center)
            .foregroundStyle(Theme.inkSoft)
            .padding(.horizontal, 34)
            .padding(.top, 10)

            Button(action: onWrite) {
                Text(words("Nachricht schreiben", "Write a message"))
                    .font(.theone(16, weight: .medium))
                    .foregroundStyle(Theme.onAccent)
                    .padding(.horizontal, 30)
                    .padding(.vertical, 15)
                    .background(Capsule().fill(Theme.aqua))
            }
            .padding(.top, 28)
            .disabled(match.conversationId == nil)

            Button(words("Später", "Later")) { dismiss() }
                .font(.theone(15))
                .tint(Theme.inkSoft)
                .padding(.top, 12)

            Spacer(minLength: 20)
        }
        .frame(maxWidth: .infinity)
        .background(HomeBackground())
    }
}

// MARK: - Connections

private struct ConnectionsView: View {
    let words: MatchWords

    @State private var matches: [MatchSummary] = []
    @State private var loading = true

    private struct Response: Decodable { let matches: [MatchSummary] }

    var body: some View {
        Group {
            if loading && matches.isEmpty {
                ProgressView().tint(Theme.aqua)
            } else if matches.isEmpty {
                VStack(spacing: 10) {
                    Text(words("Noch keine Verbindungen", "No connections yet"))
                        .font(.theoneHeading(19))
                        .foregroundStyle(Theme.heading)
                    Text(words(
                        "Sobald ihr beide Ja sagt, findest du dein Gegenüber hier.",
                        "Once you both say yes, you will find each other here."
                    ))
                    .font(.theone(14))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.inkSoft)
                    .padding(.horizontal, 40)
                }
            } else {
                List(matches) { match in
                    NavigationLink {
                        if let id = match.conversationId {
                            ConversationView(conversationId: id, title: match.firstName)
                        }
                    } label: {
                        HStack(spacing: 14) {
                            Portrait(url: match.photo, initial: String(match.firstName.prefix(1)), size: 52)
                            VStack(alignment: .leading, spacing: 3) {
                                Text(verbatim: "\(match.firstName), \(match.age)")
                                    .font(.theoneHeading(15))
                                    .foregroundStyle(Theme.heading)
                                Text(match.city)
                                    .font(.theone(13))
                                    .foregroundStyle(Theme.inkFaint)
                            }
                        }
                        .padding(.vertical, 4)
                    }
                    .listRowBackground(Theme.panel.opacity(0.85))
                }
                .scrollContentBackground(.hidden)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(HomeBackground())
        .navigationTitle(words("Deine Verbindungen", "Your connections"))
        .navigationBarTitleDisplayMode(.inline)
        .task {
            if let response: Response = try? await APIClient.shared.send("/match/matches") {
                matches = response.matches
            }
            loading = false
        }
    }
}

// MARK: - Pieces

/// A round portrait, or the first letter on the brand's petrol when there is no photo yet.
struct Portrait: View {
    let url: String?
    let initial: String
    let size: CGFloat

    var body: some View {
        ZStack {
            Circle().fill(
                LinearGradient(
                    colors: [Vortex.aqua700, Vortex.abyss],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            Text(initial)
                .font(.theone(size * 0.38, weight: .light))
                .foregroundStyle(.white.opacity(0.92))

            if let url, let link = URL(string: url) {
                AsyncImage(url: link) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Color.clear
                }
                .clipShape(Circle())
            }
        }
        .frame(width: size, height: size)
        .overlay(Circle().stroke(Theme.aqua.opacity(0.45), lineWidth: 1.5).padding(-5))
        .accessibilityHidden(true)
    }
}

private struct Promise: View {
    let symbol: String
    let title: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: symbol)
                .font(.system(size: 18, weight: .light))
                .foregroundStyle(Theme.aqua)
                .frame(width: 26)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.theoneHeading(17))
                    .foregroundStyle(Theme.heading)
                Text(text)
                    .font(.theone(14))
                    .foregroundStyle(Theme.inkSoft)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
    }
}

/// Lays chips out left to right, wrapping onto new lines.
struct FlowLayout: Layout {
    var spacing: CGFloat = 8

    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = arrange(width: proposal.width ?? .infinity, subviews: subviews)
        let height = rows.last.map { $0.y + $0.height } ?? 0
        let width = rows.map(\.width).max() ?? 0
        return CGSize(width: proposal.width ?? width, height: height)
    }

    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = arrange(width: bounds.width, subviews: subviews)
        for row in rows {
            var x = bounds.minX
            for index in row.items {
                let size = subviews[index].sizeThatFits(.unspecified)
                subviews[index].place(at: CGPoint(x: x, y: bounds.minY + row.y), proposal: ProposedViewSize(size))
                x += size.width + spacing
            }
        }
    }

    private struct Row { var items: [Int] = []; var y: CGFloat = 0; var width: CGFloat = 0; var height: CGFloat = 0 }

    private func arrange(width: CGFloat, subviews: Subviews) -> [Row] {
        var rows: [Row] = [Row()]
        for index in subviews.indices {
            let size = subviews[index].sizeThatFits(.unspecified)
            var row = rows[rows.count - 1]
            let needed = row.items.isEmpty ? size.width : row.width + spacing + size.width
            if needed > width, !row.items.isEmpty {
                let y = row.y + row.height + spacing
                rows.append(Row(items: [index], y: y, width: size.width, height: size.height))
                continue
            }
            row.items.append(index)
            row.width = needed
            row.height = max(row.height, size.height)
            rows[rows.count - 1] = row
        }
        return rows
    }
}
