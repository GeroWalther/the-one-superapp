import Charts
import Observation
import SwiftUI

/// TheONE AGE wire type. Field names match the API exactly.
struct TheONEAge: Decodable, Sendable, Equatable {
    struct Lever: Decodable, Sendable, Equatable, Hashable {
        let key: String
        let years: Double
    }
    struct Point: Decodable, Sendable, Equatable, Hashable {
        let at: String
        let theoneAge: Int
    }
    struct Longevity: Decodable, Sendable, Equatable { let score: Int; let at: String }
    struct Skin: Decodable, Sendable, Equatable { let overall: Int; let at: String }

    let status: String
    let birthYear: Int?
    let age: Int?
    let theoneAge: Int?
    let difference: Int?
    let longevity: Longevity?
    let skin: Skin?
    let levers: [Lever]?
    let target: Int?
    let history: [Point]?

    var isReady: Bool { status == "ready" && theoneAge != nil && age != nil }
}

/// The member's TheONE AGE, shared by the start screen card and the full view.
@MainActor
@Observable
final class TheONEAgeModel {
    private(set) var value: TheONEAge?
    private(set) var failed = false

    private struct Response: Decodable { let age: TheONEAge }

    func load() async {
        do {
            let response: Response = try await APIClient.shared.send("/age")
            value = response.age
            failed = false
        } catch {
            failed = value == nil
        }
    }

    func setBirthYear(_ year: Int) async -> Bool {
        do {
            let response: Response = try await APIClient.shared.send("/age", method: "PUT", body: ["birthYear": year])
            value = response.age
            return true
        } catch {
            return false
        }
    }

    /// "6 years younger", "One year older", "Exactly your age".
    static func differenceText(_ difference: Int) -> String {
        switch difference {
        case 0: tr("Exactly your age")
        case 1: tr("One year younger")
        case -1: tr("One year older")
        case let d where d > 0: tr("%lld years younger", d)
        default: tr("%lld years older", -difference)
        }
    }
}

/// On the start screen: the number itself once it is known, an invitation before.
struct TheONEAgeCard: View {
    let model: TheONEAgeModel
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(verbatim: "TheONE AGE")
                        .font(.theone(12, weight: .semibold))
                        .tracking(MemberLanguage.spacing(2))
                        .foregroundStyle(Theme.accentText)
                    if let age = model.value, age.isReady, let years = age.theoneAge, let difference = age.difference {
                        Text(TheONEAgeModel.differenceText(difference))
                            .font(.theoneHeading(16, medium: true))
                            .foregroundStyle(Theme.heading)
                        Text(tr("Your biological age in one number"))
                            .font(.theone(12.5))
                            .foregroundStyle(Theme.inkSoft)
                            .accessibilityLabel("TheONE AGE \(years)")
                    } else {
                        Text(tr("Your biological age in one number"))
                            .font(.theoneHeading(16, medium: true))
                            .foregroundStyle(Theme.heading)
                            .fixedSize(horizontal: false, vertical: true)
                        Text(tr("Discover how young you really are"))
                            .font(.theone(12.5))
                            .foregroundStyle(Theme.inkSoft)
                    }
                }
                Spacer(minLength: 0)
                ZStack {
                    Circle().fill(
                        LinearGradient(colors: [Vortex.aqua700, Vortex.abyss], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    if let age = model.value, age.isReady, let years = age.theoneAge {
                        Text("\(years)")
                            .font(.theone(30, weight: .light))
                            .foregroundStyle(.white)
                    } else {
                        Image(systemName: "hourglass")
                            .font(.system(size: 24, weight: .light))
                            .foregroundStyle(.white)
                    }
                }
                .frame(width: 66, height: 66)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(.white.opacity(0.86))
                    .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Vortex.aqua700.opacity(0.15), lineWidth: 1))
            )
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("home.age")
    }
}

/// TheONE AGE: the biological age in one number, what moves it, and where
/// the member can win years back.
struct TheONEAgeView: View {
    let model: TheONEAgeModel
    /// Called with the member's words when they want to talk it through.
    let onDiscuss: (String) -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var birthYear = Calendar.current.component(.year, from: .now) - 45
    @State private var editingBirthYear = false
    @State private var saving = false
    @State private var showCheck = false
    @State private var showScan = false

    var body: some View {
        NavigationStack {
            ZStack {
                HomeBackground()
                if let age = model.value {
                    if age.status == "needsBirthYear" || editingBirthYear {
                        birthYearStep
                    } else if age.isReady {
                        ready(age)
                    } else {
                        needsData
                    }
                } else if model.failed {
                    VStack(spacing: 16) {
                        Text(tr("Something went wrong. Please try again."))
                            .multilineTextAlignment(.center)
                        Button(tr("Try again")) { Task { await model.load() } }
                    }
                    .padding(30)
                } else {
                    ProgressView().tint(Theme.aqua)
                }
            }
            .navigationTitle(Text(verbatim: "TheONE AGE"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: { Image(systemName: "xmark") }
                        .accessibilityLabel(tr("Close"))
                }
            }
        }
        .tint(Theme.aqua)
        .task { await model.load() }
        .fullScreenCover(isPresented: $showCheck, onDismiss: { Task { await model.load() } }) {
            LongevityCheckView { _ in
                showCheck = false
                onDiscuss(tr("I have just done my TheONE LONGEVITY CHECK. What do you recommend for me?"))
            }
        }
        .fullScreenCover(isPresented: $showScan, onDismiss: { Task { await model.load() } }) {
            SkinScanView { _ in
                showScan = false
                onDiscuss(tr("I have just done my TheONE SKIN SCAN. What do you recommend for me?"))
            }
        }
    }

    // MARK: - Birth year

    private var birthYearStep: some View {
        let now = Calendar.current.component(.year, from: .now)
        return VStack(spacing: 20) {
            Text(tr("In which year were you born?"))
                .font(.theoneHeading(21))
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.heading)
                .padding(.top, 40)
            Text(tr("TheONE AGE starts from your calendar age."))
                .font(.theone(14))
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.inkSoft)
            Picker(tr("Birth year"), selection: $birthYear) {
                ForEach((now - 100)...(now - 16), id: \.self) { year in
                    Text(verbatim: String(year)).tag(year)
                }
            }
            .pickerStyle(.wheel)
            .frame(height: 180)
            .accessibilityIdentifier("age.birthYear")
            Button {
                Task {
                    saving = true
                    if await model.setBirthYear(birthYear) { editingBirthYear = false }
                    saving = false
                }
            } label: {
                Group {
                    if saving { ProgressView().tint(Theme.onAccent) } else { Text(tr("Continue")) }
                }
                .font(.theone(16, weight: .medium))
                .foregroundStyle(Theme.onAccent)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(Capsule().fill(Theme.aqua))
            }
            .disabled(saving)
            .accessibilityIdentifier("age.saveBirthYear")
            Spacer()
        }
        .padding(.horizontal, 26)
        .onAppear {
            if let known = model.value?.birthYear { birthYear = known }
        }
    }

    // MARK: - No check or scan yet

    private var needsData: some View {
        ScrollView {
            VStack(spacing: 22) {
                ageOrb(text: "?", size: 170)
                    .padding(.top, 30)
                Text(tr("Your biological age in one number"))
                    .font(.theoneHeading(22))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.heading)
                Text(tr("TheONE AGE is computed from how you live and how your skin looks. Do your TheONE LONGEVITY CHECK or your TheONE SKIN SCAN, both together give the most precise number."))
                    .font(.theone(15))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.inkSoft)
                actions(hasCheck: false, hasScan: false)
                footnote
            }
            .padding(.horizontal, 22)
        }
    }

    // MARK: - The number

    private func ready(_ age: TheONEAge) -> some View {
        let years = age.theoneAge ?? 0
        let calendar = age.age ?? 0
        return ScrollView {
            VStack(spacing: 22) {
                ageOrb(text: "\(years)", size: 190)
                    .padding(.top, 26)
                    .accessibilityElement(children: .ignore)
                    .accessibilityLabel("TheONE AGE \(years)")
                    .accessibilityIdentifier("age.value")

                VStack(spacing: 6) {
                    Text(TheONEAgeModel.differenceText(age.difference ?? 0))
                        .font(.theoneHeading(22, medium: true))
                        .foregroundStyle(Theme.heading)
                    Text(tr("Your calendar age: %lld", calendar))
                        .font(.theone(14))
                        .foregroundStyle(Theme.inkSoft)
                }

                HStack(spacing: 12) {
                    source(title: tr("Longevity score"), value: age.longevity.map { "\($0.score)" })
                    source(title: tr("Skin score"), value: age.skin.map { "\($0.overall)" })
                }

                if let levers = age.levers, !levers.isEmpty {
                    panel(tr("Where you win back years")) {
                        VStack(spacing: 12) {
                            ForEach(levers, id: \.self) { lever in
                                HStack {
                                    Text(lever.key == "skin" ? tr("Skin") : LongevityResultView.label(lever.key))
                                        .font(.theone(15, weight: .medium))
                                        .foregroundStyle(Theme.ink)
                                    Spacer()
                                    Text(tr("up to %@ years", Self.years(lever.years)))
                                        .font(.theone(14.5, weight: .semibold))
                                        .foregroundStyle(Theme.accentText)
                                }
                            }
                            if let target = age.target, target < years {
                                Divider()
                                HStack {
                                    Text(tr("Your goal"))
                                        .font(.theone(15, weight: .medium))
                                        .foregroundStyle(Theme.ink)
                                    Spacer()
                                    Text(verbatim: "TheONE AGE \(target)")
                                        .font(.theone(15, weight: .semibold))
                                        .foregroundStyle(Theme.heading)
                                }
                                .accessibilityIdentifier("age.target")
                            }
                        }
                    }
                }

                if let history = age.history, history.count >= 2 {
                    panel(tr("Your TheONE AGE over time")) {
                        historyChart(history)
                    }
                }

                Button {
                    onDiscuss(tr("I have just looked at my TheONE AGE. How do I become younger?"))
                } label: {
                    Label(tr("Talk it through with POWER AI"), systemImage: "sparkles")
                        .font(.theone(16, weight: .medium))
                        .foregroundStyle(Theme.onAccent)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(Capsule().fill(Theme.aqua))
                }
                .accessibilityIdentifier("age.discuss")

                actions(hasCheck: age.longevity != nil, hasScan: age.skin != nil)

                Button(tr("Change birth year")) {
                    if let known = age.birthYear { birthYear = known }
                    editingBirthYear = true
                }
                .font(.theone(13))
                .foregroundStyle(Theme.inkSoft)

                footnote
            }
            .padding(.horizontal, 20)
        }
    }

    private func historyChart(_ history: [TheONEAge.Point]) -> some View {
        let points = history.compactMap { point -> (Date, Int)? in
            guard let date = Self.parse(point.at) else { return nil }
            return (date, point.theoneAge)
        }
        let low = (points.map(\.1).min() ?? 0) - 2
        let high = (points.map(\.1).max() ?? 0) + 2
        return Chart(points, id: \.0) { point in
            LineMark(x: .value("Date", point.0), y: .value("TheONE AGE", point.1))
                .foregroundStyle(Theme.aqua)
                .interpolationMethod(.monotone)
            PointMark(x: .value("Date", point.0), y: .value("TheONE AGE", point.1))
                .foregroundStyle(Vortex.aqua700)
        }
        .chartYScale(domain: low...high)
        .chartXAxis {
            AxisMarks(values: .automatic(desiredCount: 4)) { _ in
                AxisGridLine()
                AxisValueLabel(format: .dateTime.day().month(.abbreviated), centered: false)
            }
        }
        .frame(height: 160)
    }

    private func actions(hasCheck: Bool, hasScan: Bool) -> some View {
        VStack(spacing: 10) {
            Button { showCheck = true } label: {
                actionLabel(hasCheck ? tr("Repeat TheONE LONGEVITY CHECK") : tr("Start TheONE LONGEVITY CHECK"), symbol: "leaf")
            }
            .accessibilityIdentifier("age.check")
            Button { showScan = true } label: {
                actionLabel(hasScan ? tr("Scan my skin again") : tr("Start TheONE SKIN SCAN"), symbol: "face.smiling")
            }
            .accessibilityIdentifier("age.scan")
        }
    }

    private func actionLabel(_ title: String, symbol: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: symbol)
            Text(title)
                .multilineTextAlignment(.leading)
            Spacer()
            Image(systemName: "chevron.right").font(.system(size: 13))
        }
        .font(.theone(15, weight: .medium))
        .foregroundStyle(Theme.heading)
        .padding(.horizontal, 18)
        .padding(.vertical, 14)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Theme.panel.opacity(0.9))
                .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Theme.line, lineWidth: 1))
        )
    }

    private func source(title: String, value: String?) -> some View {
        VStack(spacing: 4) {
            Text(value ?? "–")
                .font(.theone(22, weight: .light))
                .foregroundStyle(Theme.heading)
            Text(title)
                .font(.theone(12))
                .foregroundStyle(Theme.inkFaint)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Theme.panel.opacity(0.85)))
    }

    private func ageOrb(text: String, size: CGFloat) -> some View {
        ZStack {
            Circle()
                .fill(LinearGradient(colors: [Vortex.aqua700, Vortex.abyss], startPoint: .topLeading, endPoint: .bottomTrailing))
                .shadow(color: Vortex.abyss.opacity(0.35), radius: 14, y: 8)
            Circle().stroke(.white.opacity(0.25), lineWidth: 1).padding(10)
            VStack(spacing: 2) {
                Text(text)
                    .font(.theone(size * 0.4, weight: .light))
                    .foregroundStyle(.white)
                Text(verbatim: "TheONE AGE")
                    .font(.theone(size * 0.07, weight: .medium))
                    .tracking(2)
                    .foregroundStyle(.white.opacity(0.85))
            }
        }
        .frame(width: size, height: size)
    }

    private var footnote: some View {
        Text(tr("Lifestyle orientation, not a medical finding."))
            .font(.theone(11.5))
            .foregroundStyle(Theme.inkFaint)
            .padding(.bottom, 30)
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

    /// 1.5 as "1,5" in German, "1.5" in English, 1 as "1".
    private static func years(_ value: Double) -> String {
        value.formatted(.number.precision(.fractionLength(0...1)).locale(Locale(identifier: MemberLanguage.tag)))
    }

    private static func parse(_ iso: String) -> Date? {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: iso) ?? ISO8601DateFormatter().date(from: iso)
    }
}
