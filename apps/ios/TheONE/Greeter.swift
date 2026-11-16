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

    private var greetedAccountId: String?
    private let speech = SpeechController()

    /// Greets `account` unless this launch has already greeted them.
    func greet(_ account: Account) async {
        guard greetedAccountId != account.id else { return }
        greetedAccountId = account.id

        let hour = Calendar.current.component(.hour, from: Date())
        let words = await fetch(hour: hour) ?? Self.fallback(for: account, hour: hour)

        // Signed out while waiting: say nothing to whoever holds the phone now.
        guard greetedAccountId == account.id else { return }
        text = words
        speech.speak(words, locale: account.locale, respectSilentSwitch: true)
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

    private func fetch(hour: Int) async -> String? {
        struct Response: Decodable { let greeting: String }
        // A greeting that arrives after the member has moved on is worse than
        // the plain one, so the wait is capped.
        return await withTaskGroup(of: String?.self) { group in
            group.addTask {
                let response: Response? = try? await APIClient.shared.send(
                    "/assistant/greeting",
                    method: "POST",
                    body: ["hour": hour]
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
        if account.locale == "de" {
            let time = hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend"
            return "\(time), \(name). Wie geht es Ihnen heute?"
        }
        let time = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
        return "\(time), \(name). How are you today?"
    }
}
