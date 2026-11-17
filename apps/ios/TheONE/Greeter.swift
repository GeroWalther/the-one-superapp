import Foundation
import Observation

/// Says hello, once each time the app is opened by a signed-in member.
///
/// The words come from the server, which knows the member's profile and what
/// they last talked about; if it cannot answer in time, a plain greeting by
/// name and time of day is said instead, so the moment is never silent.
@MainActor
@Observable
final class Greeter {
    /// What was said, shown under the storm and carried into the assistant
    /// so its first reply reads the member's answer with the greeting in mind.
    private(set) var text: String?

    /// A message the member chose to talk through after TheONE SKIN SCAN or
    /// TheONE LONGEVITY CHECK, sent by the assistant as soon as it opens.
    var pendingTalk: String?
    /// Bumped to ask the start screen to open the assistant for that talk.
    var wantsAssistant = 0

    /// Opens the assistant with `message` as the member's first words.
    func talk(_ message: String) {
        pendingTalk = message
        wantsAssistant += 1
    }

    private var greetedAccountId: String?
    private let speech = SpeechController()

    /// Greets `account` unless this launch has already greeted them.
    func greet(_ account: Account) async {
        guard greetedAccountId != account.id else { return }
        greetedAccountId = account.id

        let hour = Calendar.current.component(.hour, from: Date())
        // Someone said yes back while the member was away: the voice tells
        // them first thing, as part of the hello, in the member's language.
        let matches = await unannouncedMatches(for: account.id)
        var words: String
        if let fetched = await fetch(hour: hour, matches: matches.map(\.firstName)) {
            words = fetched
        } else {
            words = Self.fallback(for: account, hour: hour)
            if !matches.isEmpty { words += " " + Self.matchNews(matches) }
        }

        // Signed out while waiting: say nothing to whoever holds the phone now.
        guard greetedAccountId == account.id else { return }
        text = words
        speech.speak(words, respectSilentSwitch: true)
        markAnnounced(matches.map(\.id), for: account.id)
    }

    /// Says it the moment both have said yes inside MATCH.
    func announce(_ match: MatchSummary, to account: Account) {
        speech.speak(MemberLanguage.matchAnnouncement(match.firstName), respectSilentSwitch: true)
        markAnnounced([match.id], for: account.id)
    }

    // MARK: - Matches

    private func announcedKey(_ accountId: String) -> String { "match.announced.\(accountId)" }

    private func markAnnounced(_ ids: [String], for accountId: String) {
        guard !ids.isEmpty else { return }
        let key = announcedKey(accountId)
        let known = Set(UserDefaults.standard.stringArray(forKey: key) ?? [])
        UserDefaults.standard.set(Array(known.union(ids)), forKey: key)
    }

    /// Matches this phone has not yet told the member about. Partners have
    /// no MATCH, so their request fails quietly and this stays empty.
    private func unannouncedMatches(for accountId: String) async -> [MatchSummary] {
        struct Response: Decodable { let matches: [MatchSummary] }
        let response: Response? = await capped(seconds: 3) {
            try? await APIClient.shared.send("/match/matches")
        }
        let known = Set(UserDefaults.standard.stringArray(forKey: announcedKey(accountId)) ?? [])
        return (response?.matches ?? []).filter { !known.contains($0.id) }
    }

    static func matchNews(_ matches: [MatchSummary]) -> String {
        if MemberLanguage.isGerman {
            return matches.count == 1
                ? "Und eine schöne Nachricht: Du hast ein Match mit \(matches[0].firstName)."
                : "Und eine schöne Nachricht: Du hast \(matches.count) Matches."
        }
        return matches.count == 1
            ? tr("And some lovely news: you have a match with %@.", matches[0].firstName)
            : tr("And some lovely news: you have %lld matches.", matches.count)
    }

    private func capped<T: Sendable>(seconds: Double, _ work: @escaping @Sendable () async -> T?) async -> T? {
        await withTaskGroup(of: T?.self) { group in
            group.addTask { await work() }
            group.addTask {
                try? await Task.sleep(for: .seconds(seconds))
                return nil
            }
            let first = await group.next() ?? nil
            group.cancelAll()
            return first
        }
    }

    /// Stops the greeting, as soon as the member starts talking or typing.
    func stop() {
        speech.stopSpeaking()
    }

    /// Forgets the greeting when the member signs out.
    func reset() {
        stop()
        text = nil
        greetedAccountId = nil
    }

    private func fetch(hour: Int, matches: [String]) async -> String? {
        struct Response: Decodable { let greeting: String }
        // A greeting that arrives after the member has moved on is worse than
        // the plain one, so the wait is capped.
        return await withTaskGroup(of: String?.self) { group in
            group.addTask {
                let response: Response? = try? await APIClient.shared.send(
                    "/assistant/greeting",
                    method: "POST",
                    body: ["hour": hour, "language": MemberLanguage.tag, "matches": matches]
                )
                return response?.greeting
            }
            group.addTask {
                try? await Task.sleep(for: .seconds(6))
                return nil
            }
            let first = await group.next() ?? nil
            group.cancelAll()
            return first
        }
    }

    static func fallback(for account: Account, hour: Int) -> String {
        let name = account.firstName.isEmpty ? account.displayName : account.firstName
        if MemberLanguage.isGerman {
            let time = hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend"
            return "\(time), \(name). Wie geht es dir heute?"
        }
        return hour < 12
            ? tr("Good morning, %@. How are you today?", name)
            : hour < 18
                ? tr("Good afternoon, %@. How are you today?", name)
                : tr("Good evening, %@. How are you today?", name)
    }
}
