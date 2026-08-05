import SwiftUI

/// The web palette, carried across so the app and the site read as one product.
///
/// Light throughout. The app deliberately does not follow the system dark mode:
/// partner photography is colour-graded for a paper background, and a dark
/// variant would need a second grade nobody is going to maintain.
enum Theme {
    static let paper = Color(red: 1.000, green: 1.000, blue: 1.000)
    static let paperSoft = Color(red: 0.961, green: 0.969, blue: 0.973)
    static let paperTint = Color(red: 0.933, green: 0.949, blue: 0.957)
    static let panel = Color(red: 1.000, green: 1.000, blue: 1.000)

    static let ink = Color(red: 0.169, green: 0.204, blue: 0.251)
    static let inkSoft = Color(red: 0.353, green: 0.396, blue: 0.447)
    static let inkFaint = Color(red: 0.545, green: 0.584, blue: 0.631)

    static let aqua = Color(red: 0.180, green: 0.612, blue: 0.659)
    static let aquaSoft = Color(red: 0.310, green: 0.702, blue: 0.749)
    static let aquaTint = Color(red: 0.902, green: 0.953, blue: 0.961)

    static let line = Color(red: 0.886, green: 0.910, blue: 0.918)

    /// Text and icons sitting *on* an aqua fill.
    static let onAccent = Color.white

    static let display = "Cormorant Garamond"
}

extension View {
    /// The card used throughout the app. On paper the separation comes from a
    /// hairline and a shadow rather than a translucent fill.
    func glassCard(padding: CGFloat = 18) -> some View {
        self
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(Theme.panel)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20, style: .continuous)
                            .stroke(Theme.line, lineWidth: 1)
                    )
                    .shadow(color: Theme.ink.opacity(0.05), radius: 12, y: 4)
            )
    }

    func paperBackground() -> some View {
        background(
            ZStack {
                Theme.paper
                // A single soft wash rather than the web's animated silk: a
                // continuously animating gradient behind a scroll view is a
                // measurable battery cost for decoration nobody looks at.
                RadialGradient(
                    colors: [Theme.aquaTint.opacity(0.9), .clear],
                    center: .topLeading,
                    startRadius: 10,
                    endRadius: 520
                )
                RadialGradient(
                    colors: [Theme.aquaTint.opacity(0.7), .clear],
                    center: .bottomTrailing,
                    startRadius: 10,
                    endRadius: 460
                )
            }
            .ignoresSafeArea()
        )
    }
}

struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .semibold))
            .foregroundStyle(Theme.onAccent)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                Capsule().fill(
                    LinearGradient(
                        colors: [Theme.aquaSoft, Theme.aqua],
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
            .foregroundStyle(Theme.ink)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 13)
            .background(
                Capsule()
                    .fill(configuration.isPressed ? Theme.paperTint : Theme.paper)
                    .overlay(Capsule().stroke(Theme.line, lineWidth: 1))
            )
    }
}

/// Wordmark, matching the site.
struct Wordmark: View {
    var size: CGFloat = 22

    var body: some View {
        HStack(spacing: 0) {
            Text("The").font(.system(size: size, weight: .light, design: .serif))
                .foregroundStyle(Theme.ink)
            Text("ONE").font(.system(size: size, weight: .semibold, design: .serif))
                .foregroundStyle(Theme.aqua)
        }
    }
}
