import SwiftUI

/// How every TheONE area begins: POWER AI asks, aloud, how the member is and
/// says it is there for them, then what it can do here. The member simply
/// answers, by voice, the way they would answer a friend.
struct PowerAIOpener<Extra: View>: View {
    /// The area's own sentence, said after the greeting.
    let line: String
    /// A word on what POWER AI does here, under the question.
    var detail: String?
    @ViewBuilder var extra: () -> Extra

    @Environment(Greeter.self) private var greeter
    @Environment(SessionStore.self) private var session
    @State private var spoken = false

    private var question: String { PowerAIWords.question(session.account?.firstName) }

    /// Everything POWER AI says as the area opens.
    private var words: String { question + tr(" ") + line }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(alignment: .top, spacing: 12) {
                Image(systemName: "waveform")
                    .font(.system(size: 18, weight: .light))
                    .foregroundStyle(.white)
                    .frame(width: 38, height: 38)
                    .background(Circle().fill(LinearGradient(colors: [Vortex.aqua700, Vortex.abyss], startPoint: .topLeading, endPoint: .bottomTrailing)))
                    .accessibilityHidden(true)
                VStack(alignment: .leading, spacing: 6) {
                    Text(question)
                        .font(.theoneHeading(19))
                        .foregroundStyle(Theme.heading)
                    Text(line)
                        .font(.theone(15))
                        .foregroundStyle(Theme.ink)
                }
            }
            if let detail {
                Text(detail)
                    .font(.theone(14))
                    .foregroundStyle(Theme.inkSoft)
            }
            Button {
                greeter.ask(words)
            } label: {
                Label(tr("Answer"), systemImage: "mic")
                    .font(.theone(16, weight: .medium))
                    .foregroundStyle(Theme.onAccent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 14)
                    .background(Capsule().fill(Theme.aqua))
            }
            .accessibilityIdentifier("opener.answer")
            extra()
        }
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Theme.panel.opacity(0.88))
                .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Theme.line, lineWidth: 1))
        )
        .padding(.horizontal, 20)
        .task {
            // Once each time the area is opened, not on every redraw.
            guard !spoken else { return }
            spoken = true
            greeter.say(words)
        }
    }
}

extension PowerAIOpener where Extra == EmptyView {
    init(line: String, detail: String? = nil) {
        self.init(line: line, detail: detail) { EmptyView() }
    }
}

/// POWER AI's first words in an area.
enum PowerAIWords {
    static func question(_ firstName: String?) -> String {
        let name = firstName ?? ""
        return name.isEmpty ? tr("How are you? I am here for you.") : tr("Hello %@, how are you? I am here for you.", name)
    }
}

/// For screens with their own first picture (TheONE SKIN SCAN, TheONE
/// MATCH): POWER AI greets aloud as they open, without a card.
private struct SpokenGreeting: ViewModifier {
    let line: String
    @Environment(Greeter.self) private var greeter
    @Environment(SessionStore.self) private var session
    @State private var spoken = false

    func body(content: Content) -> some View {
        content.task {
            guard !spoken else { return }
            spoken = true
            greeter.say(PowerAIWords.question(session.account?.firstName) + tr(" ") + line)
        }
    }
}

extension View {
    func powerAIGreeting(_ line: String) -> some View { modifier(SpokenGreeting(line: line)) }
}
