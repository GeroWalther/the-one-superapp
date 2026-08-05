import SwiftUI

/// The web palette, carried across so the app and the site read as one product.
enum Theme {
    static let ink = Color(red: 0.016, green: 0.027, blue: 0.039)
    static let panel = Color(red: 0.043, green: 0.075, blue: 0.098)
    static let gold = Color(red: 0.812, green: 0.710, blue: 0.510)
    static let goldSoft = Color(red: 0.886, green: 0.812, blue: 0.643)
    static let teal = Color(red: 0.310, green: 0.820, blue: 0.753)
    static let mist = Color(red: 0.914, green: 0.945, blue: 0.945)
    static let mistDim = Color(red: 0.616, green: 0.690, blue: 0.698)
    static let mistFaint = Color(red: 0.392, green: 0.471, blue: 0.486)

    static let display = "Cormorant Garamond"
}

extension View {
    /// The frosted panel used throughout the app.
    func glassCard(padding: CGFloat = 18) -> some View {
        self
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Color.white.opacity(0.045))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(Color.white.opacity(0.09), lineWidth: 1)
                    )
            )
    }

    func inkBackground() -> some View {
        background(
            ZStack {
                Theme.ink
                // A single soft bloom rather than the web's animated aurora:
                // a continuously animating gradient behind a scroll view is a
                // measurable battery cost for decoration nobody looks at.
                RadialGradient(
                    colors: [Theme.teal.opacity(0.16), .clear],
                    center: .topLeading,
                    startRadius: 10,
                    endRadius: 520
                )
                RadialGradient(
                    colors: [Theme.gold.opacity(0.10), .clear],
                    center: .bottomTrailing,
                    startRadius: 10,
                    endRadius: 460
                )
            }
            .ignoresSafeArea()
        )
    }
}

struct GoldButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(Theme.ink)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                Capsule().fill(
                    LinearGradient(
                        colors: [Theme.goldSoft, Theme.gold],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
            )
            .opacity(configuration.isPressed ? 0.85 : 1)
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct GhostButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 15, weight: .medium))
            .foregroundStyle(Theme.mist)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 13)
            .background(
                Capsule()
                    .fill(Color.white.opacity(configuration.isPressed ? 0.12 : 0.06))
                    .overlay(Capsule().stroke(Color.white.opacity(0.16), lineWidth: 1))
            )
    }
}

/// Wordmark, matching the site.
struct Wordmark: View {
    var size: CGFloat = 22

    var body: some View {
        HStack(spacing: 0) {
            Text("The").font(.system(size: size, weight: .light, design: .serif))
                .foregroundStyle(Theme.mist)
            Text("ONE").font(.system(size: size, weight: .semibold, design: .serif))
                .foregroundStyle(Theme.gold)
        }
    }
}
