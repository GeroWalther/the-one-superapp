import SwiftUI

/// TheONE LONGEVITY CHECK wire type. Field names match the API exactly.
struct LongevityCheck: Codable, Sendable, Hashable, Identifiable {
    struct Pillar: Codable, Sendable, Hashable {
        let key: String
        let score: Int
        let note: String
    }
    struct Week: Codable, Sendable, Hashable {
        let week: Int
        let steps: [String]
    }
    let id: String
    let createdAt: String
    let score: Int
    let pillars: [Pillar]
    let summary: String
    let focus: [String]
    let plan: [Week]
    let picks: [Offering]
    let seeDoctor: Bool
    let doctorNote: String
}

/// Thirteen quick questions, one at a time, then POWER AI's reading:
/// a longevity score, six pillars, a four week plan and what fits.
struct LongevityCheckView: View {
    /// Called with the result when the member wants to talk it through.
    let onDiscuss: (LongevityCheck) -> Void

    @Environment(\.dismiss) private var dismiss

    private struct Question {
        let key: String
        let text: String
        let options: [(String, String)]
    }

    private var questions: [Question] {
        [
            Question(key: "age", text: tr("How old are you?"), options: [
                ("under35", tr("Under 35")), ("35to44", tr("35 to 44")),
                ("45to54", tr("45 to 54")), ("55to64", tr("55 to 64")), ("65plus", tr("65 or older")),
            ]),
            Question(key: "sleepHours", text: tr("How many hours do you sleep on a usual night?"), options: [
                ("under6", tr("Under 6 hours")), ("6to7", tr("6 to 7 hours")), ("7to8", tr("7 to 8 hours")), ("over8", tr("More than 8 hours")),
            ]),
            Question(key: "rested", text: tr("How often do you wake up rested?"), options: [
                ("often", tr("Often")), ("sometimes", tr("Sometimes")), ("rarely", tr("Rarely")),
            ]),
            Question(key: "stress", text: tr("How stressed do you feel most days?"), options: [
                ("low", tr("Low")), ("medium", tr("Medium")), ("high", tr("High")), ("veryHigh", tr("Very high")),
            ]),
            Question(key: "activeDays", text: tr("On how many days a week do you move for at least 30 minutes?"), options: [
                ("0to1", tr("0 to 1 days")), ("2to3", tr("2 to 3 days")), ("4to5", tr("4 to 5 days")), ("6to7", tr("6 to 7 days")),
            ]),
            Question(key: "strength", text: tr("Do you train your strength every week?"), options: [
                ("yes", tr("Yes")), ("no", tr("No")),
            ]),
            Question(key: "food", text: tr("How do you mostly eat?"), options: [
                ("wholeFoods", tr("Mostly fresh, whole foods")), ("mixed", tr("A mix")), ("processed", tr("Often quick or processed")),
            ]),
            Question(key: "alcohol", text: tr("How many alcoholic drinks do you have in a week?"), options: [
                ("none", tr("None")), ("1to3", tr("1 to 3")), ("4to7", tr("4 to 7")), ("8plus", tr("8 or more")),
            ]),
            Question(key: "smoking", text: tr("Do you smoke?"), options: [
                ("never", tr("Never")), ("former", tr("I used to")), ("current", tr("Yes")),
            ]),
            Question(key: "connection", text: tr("How connected do you feel to the people close to you?"), options: [
                ("strong", tr("Very connected")), ("some", tr("Somewhat")), ("lonely", tr("Often alone")),
            ]),
            Question(key: "checkup", text: tr("When was your last full health check-up?"), options: [
                ("withinYear", tr("Within the last year")), ("1to3Years", tr("1 to 3 years ago")), ("longer", tr("Longer ago")), ("never", tr("Never")),
            ]),
            Question(key: "energy", text: tr("How is your energy during the day?"), options: [
                ("high", tr("High")), ("moderate", tr("Moderate")), ("low", tr("Low")),
            ]),
            Question(key: "goal", text: tr("What matters most to you right now?"), options: [
                ("energy", tr("More energy")), ("sleep", tr("Better sleep")), ("weight", tr("A healthy weight")),
                ("mind", tr("A sharper mind")), ("younger", tr("Looking younger")), ("healthspan", tr("Living longer in good health")),
            ]),
        ]
    }

    private enum Step: Equatable { case intro, question(Int), note, analysing, result(LongevityCheck), failed(String) }

    @State private var step: Step = .intro
    @State private var answers: [String: String] = [:]
    @State private var note = ""

    var body: some View {
        NavigationStack {
            ZStack {
                HomeBackground()
                switch step {
                case .intro: intro
                case .question(let index): question(index)
                case .note: noteStep
                case .analysing: analysing
                case .result(let check): LongevityResultView(check: check, onDiscuss: { onDiscuss(check) })
                case .failed(let message):
                    VStack(spacing: 16) {
                        Text(message).multilineTextAlignment(.center).padding(.horizontal, 30)
                        Button(tr("Try again")) { Task { await submit() } }
                    }
                }
            }
            .animation(.easeInOut(duration: 0.25), value: step)
            .navigationTitle(Text(verbatim: "TheONE LONGEVITY CHECK"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: { Image(systemName: "xmark") }
                        .accessibilityLabel(tr("Close"))
                }
            }
        }
        .tint(Theme.aqua)
    }

    private var intro: some View {
        ScrollView {
            VStack(spacing: 22) {
                Image("VortexFigure")
                    .resizable()
                    .scaledToFit()
                    .frame(height: 230)
                    .accessibilityHidden(true)
                    .padding(.top, 20)
                Text(tr("How young will you stay?"))
                    .font(.theoneHeading(22))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.heading)
                Text(tr("Thirteen quick questions about how you live. POWER AI turns them into your longevity score, a four week plan and the clinics and products that fit you."))
                    .font(.theone(15))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.inkSoft)
                    .padding(.horizontal, 10)
                Text(tr("Lifestyle and prevention, not a medical diagnosis."))
                    .font(.theone(12))
                    .foregroundStyle(Theme.inkFaint)
                Button { step = .question(0) } label: {
                    Text(tr("Start TheONE LONGEVITY CHECK"))
                        .font(.theone(16, weight: .medium))
                        .foregroundStyle(Theme.onAccent)
                        .padding(.horizontal, 30)
                        .padding(.vertical, 15)
                        .background(Capsule().fill(Theme.aqua))
                }
                .accessibilityIdentifier("longevity.start")
                .padding(.bottom, 30)
            }
            .padding(.horizontal, 22)
        }
    }

    private func question(_ index: Int) -> some View {
        let q = questions[index]
        return VStack(alignment: .leading, spacing: 18) {
            ProgressView(value: Double(index + 1), total: Double(questions.count))
                .tint(Theme.aqua)
                .padding(.top, 16)
            Text("\(index + 1) / \(questions.count)")
                .font(.theone(12, weight: .medium))
                .foregroundStyle(Theme.inkFaint)
            Text(q.text)
                .font(.theoneHeading(21))
                .foregroundStyle(Theme.heading)
                .fixedSize(horizontal: false, vertical: true)
            VStack(spacing: 10) {
                ForEach(q.options, id: \.0) { option in
                    let chosen = answers[q.key] == option.0
                    Button {
                        answers[q.key] = option.0
                        Task {
                            try? await Task.sleep(for: .milliseconds(180))
                            step = index + 1 < questions.count ? .question(index + 1) : .note
                        }
                    } label: {
                        Text(option.1)
                            .font(.theone(16))
                            .foregroundStyle(chosen ? Theme.onAccent : Theme.ink)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 18)
                            .padding(.vertical, 15)
                            .background(
                                RoundedRectangle(cornerRadius: 16, style: .continuous)
                                    .fill(chosen ? Theme.aqua : Theme.panel.opacity(0.9))
                                    .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Theme.line, lineWidth: 1))
                            )
                    }
                    .buttonStyle(.plain)
                    .accessibilityIdentifier("longevity.\(q.key).\(option.0)")
                }
            }
            if index > 0 {
                Button(tr("Back")) { step = .question(index - 1) }
                    .font(.theone(14))
                    .foregroundStyle(Theme.inkSoft)
            }
            Spacer()
        }
        .padding(.horizontal, 22)
    }

    private var noteStep: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text(tr("Anything else POWER AI should know?"))
                .font(.theoneHeading(21))
                .foregroundStyle(Theme.heading)
                .padding(.top, 24)
            TextField(tr("Optional, in your own words"), text: $note, axis: .vertical)
                .lineLimit(3...6)
                .padding(14)
                .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Theme.panel.opacity(0.9)))
            Button { Task { await submit() } } label: {
                Text(tr("See my result"))
                    .font(.theone(16, weight: .medium))
                    .foregroundStyle(Theme.onAccent)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 15)
                    .background(Capsule().fill(Theme.aqua))
            }
            .accessibilityIdentifier("longevity.submit")
            Spacer()
        }
        .padding(.horizontal, 22)
    }

    private var analysing: some View {
        VStack(spacing: 22) {
            ProgressView().controlSize(.large).tint(Theme.aqua).padding(.top, 120)
            Text(tr("POWER AI is reading your answers…"))
                .font(.theoneHeading(17))
                .foregroundStyle(Theme.heading)
            Text(tr("This takes about twenty seconds."))
                .font(.theone(14))
                .foregroundStyle(Theme.inkSoft)
            Spacer()
        }
    }

    private struct Response: Decodable { let check: LongevityCheck }

    private func submit() async {
        step = .analysing
        do {
            let response: Response = try await APIClient.shared.send(
                "/longevity/checks",
                method: "POST",
                body: ["answers": answers, "note": note, "language": MemberLanguage.tag]
            )
            step = .result(response.check)
        } catch {
            step = .failed((error as? APIError)?.errorDescription ?? tr("Something went wrong. Please try again."))
        }
    }
}

/// The reading: score, pillars, focus, the four week plan and what fits.
struct LongevityResultView: View {
    let check: LongevityCheck
    let onDiscuss: (() -> Void)?

    var body: some View {
        ScrollView {
            VStack(spacing: 22) {
                ScoreRing(score: check.score, size: 140, label: tr("Longevity score"))
                    .padding(.top, 24)

                Text(check.summary)
                    .font(.theoneHeading(16.5))
                    .lineSpacing(3)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.ink)

                panel(tr("Your six pillars")) {
                    VStack(spacing: 14) {
                        ForEach(check.pillars, id: \.key) { pillar in
                            VStack(alignment: .leading, spacing: 5) {
                                HStack {
                                    Text(Self.label(pillar.key))
                                        .font(.theone(14.5, weight: .medium))
                                        .foregroundStyle(Theme.ink)
                                    Spacer()
                                    Text("\(pillar.score)")
                                        .font(.theone(14.5, weight: .semibold))
                                        .foregroundStyle(Theme.accentText)
                                }
                                GeometryReader { proxy in
                                    ZStack(alignment: .leading) {
                                        Capsule().fill(Theme.aquaTint)
                                        Capsule().fill(Theme.aqua).frame(width: proxy.size.width * CGFloat(pillar.score) / 100)
                                    }
                                }
                                .frame(height: 6)
                                Text(pillar.note)
                                    .font(.theone(13))
                                    .foregroundStyle(Theme.inkSoft)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }

                if !check.focus.isEmpty {
                    panel(tr("What will make the biggest difference")) {
                        VStack(alignment: .leading, spacing: 10) {
                            ForEach(check.focus, id: \.self) { item in
                                Label(item, systemImage: "sparkle")
                                    .font(.theone(14))
                                    .foregroundStyle(Theme.ink)
                            }
                        }
                    }
                }

                panel(tr("Your four week plan")) {
                    VStack(alignment: .leading, spacing: 14) {
                        ForEach(check.plan, id: \.week) { week in
                            VStack(alignment: .leading, spacing: 6) {
                                Text(tr("Week %lld", week.week))
                                    .font(.theone(14, weight: .semibold))
                                    .foregroundStyle(Theme.ink)
                                ForEach(week.steps, id: \.self) { item in
                                    Text("· \(item)")
                                        .font(.theone(14))
                                        .foregroundStyle(Theme.inkSoft)
                                        .fixedSize(horizontal: false, vertical: true)
                                }
                            }
                        }
                    }
                }

                if !check.picks.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(tr("Chosen for you"))
                            .font(.theoneHeading(17))
                            .foregroundStyle(Theme.heading)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(check.picks) { pick in
                                    NavigationLink {
                                        OfferingDetailView(offering: pick)
                                    } label: {
                                        OfferingCard(offering: pick, width: 220, showReason: true)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                if check.seeDoctor, !check.doctorNote.isEmpty {
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "stethoscope").foregroundStyle(Theme.aqua)
                        Text(check.doctorNote).font(.theone(14)).foregroundStyle(Theme.ink)
                    }
                    .padding(16)
                    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Theme.aquaTint))
                }

                if let onDiscuss {
                    Button(action: onDiscuss) {
                        Label(tr("Talk it through with POWER AI"), systemImage: "sparkles")
                            .font(.theone(16, weight: .medium))
                            .foregroundStyle(Theme.onAccent)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(Capsule().fill(Theme.aqua))
                    }
                    .accessibilityIdentifier("longevity.discuss")
                }

                Text(tr("Lifestyle and prevention, not a medical diagnosis."))
                    .font(.theone(11.5))
                    .foregroundStyle(Theme.inkFaint)
                    .padding(.bottom, 30)
            }
            .padding(.horizontal, 20)
        }
    }

    static func label(_ key: String) -> String {
        switch key {
        case "sleep": tr("Sleep")
        case "stress": tr("Stress")
        case "movement": tr("Movement")
        case "nutrition": tr("Nutrition")
        case "connection": tr("Connection")
        default: tr("Prevention")
        }
    }

    private func panel<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(title.uppercased().replacingOccurrences(of: "THEONE", with: "TheONE"))
                .font(.theone(11, weight: .medium))
                .tracking(MemberLanguage.spacing(2.2))
                .foregroundStyle(Theme.accentText)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Theme.panel.opacity(0.88))
                .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.line, lineWidth: 1))
        )
    }
}
