import SwiftUI

/// The first screen of the app, the same piece the website's phone mockup shows:
/// the lockup, the line under it, and the POWER AI storm.
///
/// Two ways in: the avatar top right leads to the account, the storm to the
/// assistant. Signed out, either one asks for the sign-in first and then
/// carries on to where the tap meant to go.
struct HomeView: View {
    @Environment(SessionStore.self) private var session
    @Environment(Greeter.self) private var greeter

    /// Where a tap on the start screen leads: a tab of the member area, one
    /// of TheONE's own areas, or TheONE SKIN SCAN.
    enum Target: Equatable {
        case tab(MainTabs.Tab)
        case area(Area)
        case skin
        case age
        case wish
    }

    @State private var showLogin = false
    @State private var weather = WeatherModel()
    @State private var areaCover: Area?
    @State private var skinCover = false
    @State private var ageCover = false
    @State private var age = TheONEAgeModel()
    /// The member area shown over the start screen, opened on this tab.
    @State private var destination: MainTabs.Tab?
    /// Where a tap made while signed out was headed, once the sign-in is done.
    @State private var afterLogin: Target = .tab(.profile)
    /// A tap made in the moment after launch, while the stored session is
    /// still being checked; it goes through as soon as the answer is in.
    @State private var waiting: Target?

    var body: some View {
        GeometryReader { proxy in
            ScrollView {
                VStack(spacing: 0) {
                    Image("Lockup")
                        .resizable()
                        .interpolation(.high)
                        .scaledToFit()
                        .frame(height: 170)
                        .accessibilityLabel("TheONE Super App")
                        .padding(.top, 28)

                    // The brand's claim, in English in every language.
                    Text(verbatim: "THE POWER AI\nTHAT UNDERSTANDS YOU")
                        .font(.theoneHeading(15.5, medium: true))
                        .tracking(1.4)
                        .lineSpacing(4)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(Self.headline)
                        .padding(.top, 26)

                    Button { open(.tab(.assistant)) } label: {
                        VortexView {
                            Text(verbatim: "POWER AI")
                                .font(.theoneHeading(16, medium: true))
                                .tracking(3.6)
                                .foregroundStyle(Self.eyeInk)
                        }
                        // The storm is drawn from gradients that change every
                        // frame; a fixed shape keeps the whole disc pressable.
                        .contentShape(Circle())
                    }
                    .buttonStyle(StormPress())
                    .accessibilityLabel("POWER AI")
                    .accessibilityHint("Opens the assistant")
                    .accessibilityIdentifier("home.storm")
                    .frame(width: min(proxy.size.width - 32, 420))
                    .padding(.top, 30)

                    // What the app just said aloud, so it can be read too,
                    // and so it is there for anyone with the sound off.
                    if let words = greeter.text, session.account != nil {
                        Text(words)
                            .font(.theoneHeading(16.5))
                            .lineSpacing(3)
                            .multilineTextAlignment(.center)
                            .foregroundStyle(Self.headline)
                            .padding(.horizontal, 32)
                            .padding(.top, 22)
                            .transition(.opacity)
                            .accessibilityIdentifier("home.greeting")
                    }

                    // The weather where the member is, and what to wear.
                    if session.account != nil {
                        WeatherCard(model: weather)
                            .padding(.horizontal, 20)
                            .padding(.top, 22)
                    }

                    // TheONE AGE: the biological age in one number.
                    if session.account != nil {
                        TheONEAgeCard(model: age) { open(.age) }
                            .padding(.horizontal, 20)
                            .padding(.top, 14)
                    }

                    // TheONE WISH: one sentence, everything arranged.
                    if session.account != nil {
                        TheONEWishCard { open(.wish) }
                            .padding(.horizontal, 20)
                            .padding(.top, 12)
                    }

                    functions
                        .padding(.top, 30)

                    Spacer(minLength: 32)
                }
                .frame(maxWidth: .infinity)
            }
            .fullScreenCover(item: $areaCover) { area in
                SelectionView(area: area)
                    .environment(\.closeToHome) { areaCover = nil }
            }
            .fullScreenCover(isPresented: $skinCover) {
                SkinScanView { _ in
                    // Talk it through in the assistant, as from inside it.
                    greeter.talk(tr("I have just done my TheONE SKIN SCAN. What do you recommend for me?"))
                }
            }
            .fullScreenCover(isPresented: $ageCover, onDismiss: { Task { await age.load() } }) {
                TheONEAgeView(model: age) { words in greeter.talk(words) }
            }
            .scrollBounceBehavior(.basedOnSize)
            .task(id: session.account?.id) {
                if session.account != nil {
                    async let forecast: Void = weather.load()
                    async let biological: Void = age.load()
                    _ = await (forecast, biological)
                }
            }
            .animation(.easeIn(duration: 0.6), value: greeter.text)
        }
        .background(HomeBackground())
        .overlay(alignment: .topTrailing) {
            AvatarButton(signedIn: session.account != nil) { open(.tab(.profile)) }
            .padding(.trailing, 20)
            .padding(.top, 8)
        }
        .sheet(isPresented: $showLogin) {
            LoginView()
                .presentationDragIndicator(.visible)
        }
        // A successful sign-in from here goes straight on, so the tap that
        // started it ends where the member meant to go.
        .onChange(of: session.account?.id) { _, id in
            guard id != nil, showLogin else { return }
            showLogin = false
            Task {
                // Let the sheet finish leaving before the cover arrives;
                // presenting both in one pass drops the second.
                try? await Task.sleep(for: .milliseconds(450))
                go(afterLogin)
            }
        }
        .fullScreenCover(item: $destination) { tab in
            MainTabs(initialTab: tab)
                .environment(\.closeToHome) { destination = nil }
        }
        // A result to talk through: close whatever is open over the start
        // screen and bring up the assistant, which sends the member's words.
        .onChange(of: greeter.wantsAssistant) { _, _ in openAssistant() }
        .onChange(of: session.state) { _, _ in
            guard let target = waiting else { return }
            waiting = nil
            open(target)
        }
        // Signing out inside the member area returns here rather than leaving
        // an empty member area on screen.
        .onChange(of: session.account == nil) { _, signedOut in
            if signedOut {
                destination = nil
                areaCover = nil
                skinCover = false
                ageCover = false
            }
        }
    }

    /// TheONE's functions, each with its own area, under the storm.
    private var functions: some View {
        let items: [(String, String, Target)] = [
            ("TheONE SKIN SCAN", "face.smiling", .skin),
            ("TheONE MATCH", "person.2", .tab(.match)),
            (Area.selection.name, Area.selection.symbol, .tab(.selection)),
            (Area.longevity.name, Area.longevity.symbol, .area(.longevity)),
            (Area.health.name, Area.health.symbol, .area(.health)),
            (Area.hotels.name, Area.hotels.symbol, .area(.hotels)),
            (Area.travel.name, Area.travel.symbol, .area(.travel)),
            (Area.realestate.name, Area.realestate.symbol, .area(.realestate)),
        ]
        return LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
            ForEach(items, id: \.0) { item in
                Button { open(item.2) } label: {
                    HStack(spacing: 10) {
                        Image(systemName: item.1)
                            .font(.system(size: 16, weight: .light))
                            .foregroundStyle(.white)
                            .frame(width: 34, height: 34)
                            .background(
                                Circle().fill(
                                    LinearGradient(colors: [Vortex.aqua700, Vortex.abyss], startPoint: .topLeading, endPoint: .bottomTrailing)
                                )
                            )
                        Text(verbatim: item.0)
                            .font(.theone(12.5, weight: .semibold))
                            .tracking(0.3)
                            .foregroundStyle(Self.headline)
                            .multilineTextAlignment(.leading)
                            .lineLimit(2)
                            .minimumScaleFactor(0.85)
                        Spacer(minLength: 0)
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 10)
                    .frame(maxWidth: .infinity, minHeight: 58)
                    .background(
                        RoundedRectangle(cornerRadius: 16, style: .continuous)
                            .fill(.white.opacity(0.82))
                            .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Vortex.aqua700.opacity(0.15), lineWidth: 1))
                    )
                }
                .buttonStyle(StormPress())
                .accessibilityIdentifier("home.fn.\(item.0)")
            }
        }
        .padding(.horizontal, 20)
    }

    /// Closes whatever is open over the start screen and brings up the
    /// assistant, where POWER AI's question or the member's words wait.
    private func openAssistant() {
        areaCover = nil
        skinCover = false
        ageCover = false
        Task {
            try? await Task.sleep(for: .milliseconds(450))
            destination = .assistant
        }
    }

    /// Goes where `target` leads, the member being signed in.
    private func go(_ target: Target) {
        switch target {
        case .tab(let tab): destination = tab
        case .area(let area): areaCover = area
        case .skin: skinCover = true
        case .age: ageCover = true
        case .wish:
            // POWER AI asks, aloud and in writing; the member answers in one sentence.
            greeter.say(TheONEWishCard.question)
            greeter.ask(TheONEWishCard.question)
            greeter.wishMode = true
        }
    }

    /// Opens `target`, or the sign-in first when signed out.
    private func open(_ target: Target) {
        switch session.state {
        // The stored session is still being checked; deciding now would open
        // the sign-in for a member who is about to be signed in.
        case .loading: waiting = target
        case .signedIn: go(target)
        case .signedOut:
            afterLogin = target
            showLogin = true
        }
    }

    private static let headline = Color(red: 0.020, green: 0.133, blue: 0.149)
    private static let eyeInk = Color(red: 0.039, green: 0.184, blue: 0.204)
}

/// A light give under the finger, so the storm reads as something to press.
private struct StormPress: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

/// The profile disc in the corner: the storm's dark green with a soft shadow.
private struct AvatarButton: View {
    let signedIn: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: "person")
                .font(.system(size: 19, weight: .medium))
                .foregroundStyle(.white)
                .frame(width: 48, height: 48)
                .background(
                    Circle().fill(
                        LinearGradient(
                            colors: [Vortex.aqua700, Vortex.abyss],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                )
                .shadow(color: Vortex.abyss.opacity(0.45), radius: 7, y: 4)
        }
        // Never "Sign in": the sign-in sheet's own button carries that label,
        // and the two would collide for VoiceOver and the UI tests alike.
        .accessibilityLabel("Account")
        .accessibilityHint(signedIn ? "Opens your account" : "Opens the sign-in")
        .accessibilityIdentifier("home.avatar")
    }
}

/// The site's ground behind the phone: pale paper, a petrol wash from the top
/// and three soft ribbons across the middle. Shared with MATCH, so the two
/// feel like one place.
struct HomeBackground: View {
    var body: some View {
        ZStack {
            Color(red: 0.933, green: 0.953, blue: 0.953)
            LinearGradient(
                stops: [
                    .init(color: Vortex.petrol500.opacity(0.30), location: 0),
                    .init(color: Vortex.petrol500.opacity(0.14), location: 0.24),
                    .init(color: Vortex.petrol500.opacity(0), location: 0.48),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            Canvas { context, size in
                let ribbon = Gradient(colors: [
                    .white.opacity(0.95),
                    Color(red: 0.522, green: 0.675, blue: 0.675).opacity(0.22),
                    Color(red: 0.839, green: 0.890, blue: 0.890).opacity(0.10),
                ])
                // The mockup's 260×540 viewBox, stretched to the screen.
                let sx = size.width / 260, sy = size.height / 540
                for offset in [0.0, 40, 80] {
                    var path = Path()
                    path.move(to: CGPoint(x: -30 * sx, y: (250 + offset) * sy))
                    path.addCurve(
                        to: CGPoint(x: 290 * sx, y: (220 + offset) * sy),
                        control1: CGPoint(x: 70 * sx, y: (190 + offset) * sy),
                        control2: CGPoint(x: 170 * sx, y: (320 + offset) * sy)
                    )
                    context.opacity = 0.5
                    context.stroke(
                        path,
                        with: .linearGradient(ribbon, startPoint: .zero, endPoint: CGPoint(x: size.width, y: size.height)),
                        lineWidth: 34 * sx
                    )
                }
            }
        }
        .ignoresSafeArea()
    }
}

// MARK: - Returning home from the member area

private struct CloseToHomeKey: EnvironmentKey {
    static let defaultValue: (() -> Void)? = nil
}

extension EnvironmentValues {
    /// Set while the member area is shown over the start screen; closes it.
    var closeToHome: (() -> Void)? {
        get { self[CloseToHomeKey.self] }
        set { self[CloseToHomeKey.self] = newValue }
    }
}

private struct HomeButton: ViewModifier {
    @Environment(\.closeToHome) private var closeToHome

    func body(content: Content) -> some View {
        content.toolbar {
            if let closeToHome {
                ToolbarItem(placement: .topBarLeading) {
                    Button(action: closeToHome) {
                        Image(systemName: "house")
                    }
                    .accessibilityLabel("Start")
                    .accessibilityIdentifier("home.button")
                }
            }
        }
    }
}

extension View {
    /// A house button, top left, back to the start screen. Shows only while
    /// the member area sits over it.
    func homeButton() -> some View {
        modifier(HomeButton())
    }
}
