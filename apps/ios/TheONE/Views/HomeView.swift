import SwiftUI

/// The first screen of the app, the same piece the website's phone mockup shows:
/// the lockup, the line under it, and the POWER AI storm.
///
/// The avatar top right is the way in. Signed out it opens the sign-in; signed
/// in it opens the member area.
struct HomeView: View {
    @Environment(SessionStore.self) private var session

    @State private var showLogin = false
    @State private var showAccount = false

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

                    Text("THE POWER AI\nTHAT UNDERSTANDS YOU")
                        .font(.system(size: 17, weight: .bold, design: .serif))
                        .tracking(1.4)
                        .lineSpacing(4)
                        .multilineTextAlignment(.center)
                        .foregroundStyle(Self.headline)
                        .padding(.top, 26)

                    VortexView {
                        Text("POWER AI")
                            .font(.system(size: 18, weight: .bold, design: .serif))
                            .tracking(3.6)
                            .foregroundStyle(Self.eyeInk)
                    }
                    .frame(width: min(proxy.size.width - 32, 420))
                    .padding(.top, 30)
                    .padding(.bottom, 32)
                }
                .frame(maxWidth: .infinity)
            }
            .scrollBounceBehavior(.basedOnSize)
        }
        .background(HomeBackground())
        .overlay(alignment: .topTrailing) {
            AvatarButton(signedIn: session.account != nil) {
                switch session.state {
                // The stored session is still being checked; a tap now would
                // open the sign-in for a member who is about to be signed in.
                case .loading: break
                case .signedIn: showAccount = true
                case .signedOut: showLogin = true
                }
            }
            .padding(.trailing, 20)
            .padding(.top, 8)
        }
        .sheet(isPresented: $showLogin) {
            LoginView()
                .presentationDragIndicator(.visible)
        }
        // A successful sign-in from here goes straight on to the account, so
        // the tap that started it ends where the member meant to go.
        .onChange(of: session.account?.id) { _, id in
            guard id != nil, showLogin else { return }
            showLogin = false
            Task {
                // Let the sheet finish leaving before the cover arrives;
                // presenting both in one pass drops the second.
                try? await Task.sleep(for: .milliseconds(450))
                showAccount = true
            }
        }
        .fullScreenCover(isPresented: $showAccount) {
            MainTabs(initialTab: .profile)
                .environment(\.closeToHome) { showAccount = false }
        }
        // Signing out inside the account returns here rather than leaving an
        // empty member area on screen.
        .onChange(of: session.account == nil) { _, signedOut in
            if signedOut { showAccount = false }
        }
    }

    private static let headline = Color(red: 0.020, green: 0.133, blue: 0.149)
    private static let eyeInk = Color(red: 0.039, green: 0.184, blue: 0.204)
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
/// and three soft ribbons across the middle.
private struct HomeBackground: View {
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
