import SwiftUI

/// The website's palette and type, carried across so the app and the site
/// read as one product.
///
/// Light throughout. The app deliberately does not follow the system dark mode:
/// partner photography is colour-graded for a paper background, and a dark
/// variant would need a second grade nobody is going to maintain.
enum Theme {
    static let paper = Color(red: 1.000, green: 1.000, blue: 1.000)
    static let paperSoft = Color(red: 0.961, green: 0.969, blue: 0.973)   // #f5f7f8
    static let paperTint = Color(red: 0.933, green: 0.949, blue: 0.957)   // #eef2f4
    /// The site's page ground, a pale petrol rather than neutral grey.
    static let ground = Color(red: 0.933, green: 0.953, blue: 0.953)      // #eef3f3
    static let panel = Color(red: 1.000, green: 1.000, blue: 1.000)

    static let ink = Color(red: 0.169, green: 0.204, blue: 0.251)         // #2b3440
    static let inkSoft = Color(red: 0.353, green: 0.396, blue: 0.447)     // #5a6572
    static let inkFaint = Color(red: 0.545, green: 0.584, blue: 0.631)    // #8b95a1
    /// The site's darkest heading colour, near-black with a petrol cast.
    static let inkDeep = Color(red: 0.020, green: 0.133, blue: 0.149)     // #052226

    /// The accent family. Named "aqua" from the app's first palette; it now
    /// carries the site's petrol tones, so every accent across the app moved
    /// with this one change.
    static let aqua = Color(red: 0.102, green: 0.384, blue: 0.420)        // #1a626b
    static let aquaSoft = Color(red: 0.133, green: 0.494, blue: 0.537)    // #227e89
    static let aquaTint = Color(red: 0.902, green: 0.953, blue: 0.961)    // #e6f3f5

    static let petrol = Color(red: 0.000, green: 0.322, blue: 0.322)      // #005252
    /// The deep petrol of the site's buttons ("Start application").
    static let petrolDeep = Color(red: 0.000, green: 0.208, blue: 0.231)  // #00353b

    /// The footer's mirror gold ("TheONE SUPER APP").
    static let mirrorGold = LinearGradient(
        colors: [
            Color(red: 0.722, green: 0.569, blue: 0.290),  // #b8914a
            Color(red: 0.890, green: 0.749, blue: 0.447),  // #e3bf72
            Color(red: 0.949, green: 0.867, blue: 0.643),  // #f2dda4
        ],
        startPoint: .leading,
        endPoint: .trailing
    )

    static let line = Color(red: 0.886, green: 0.910, blue: 0.918)

    /// Text and icons sitting *on* a petrol fill.
    static let onAccent = Color.white

    static let display = "Cormorant Garamond"
}

extension Font {
    /// Cormorant Garamond, the site's display face, for headings and names.
    /// Bundled in TheONE/Fonts and registered in Info.plist.
    static func serif(_ size: CGFloat, _ weight: Font.Weight = .regular, italic: Bool = false) -> Font {
        if italic { return .custom("CormorantGaramond-BoldItalic", size: size) }
        let name: String
        switch weight {
        case .ultraLight, .thin, .light: name = "CormorantGaramond-Light"
        case .medium: name = "CormorantGaramond-Medium"
        case .semibold: name = "CormorantGaramond-SemiBold"
        case .bold, .heavy, .black: name = "CormorantGaramond-Bold"
        default: name = "CormorantGaramond-Regular"
        }
        return .custom(name, size: size)
    }

    /// Inter, the site's body face, for everything that is read rather than
    /// displayed.
    static func sans(_ size: CGFloat, _ weight: Font.Weight = .regular) -> Font {
        let name: String
        switch weight {
        case .medium: name = "Inter-Medium"
        case .semibold: name = "Inter-SemiBold"
        case .bold, .heavy, .black: name = "Inter-Bold"
        default: name = "Inter-Regular"
        }
        return .custom(name, size: size)
    }
}

extension View {
    /// The card used throughout the app. On paper the separation comes from a
    /// hairline and a shadow rather than a translucent fill.
    func glassCard(padding: CGFloat = 18) -> some View {
        self
            .padding(padding)
            .background(
                RoundedRectangle(cornerRadius: 22, style: .continuous)
                    .fill(Theme.panel)
                    .overlay(
                        RoundedRectangle(cornerRadius: 22, style: .continuous)
                            .stroke(Theme.line, lineWidth: 1)
                    )
                    .shadow(color: Theme.petrolDeep.opacity(0.07), radius: 14, y: 5)
            )
    }

    /// The site's ground: pale petrol with a petrol wash from the top, the
    /// same treatment as the phone mockup on the website.
    func paperBackground() -> some View {
        background(
            ZStack {
                Theme.ground
                LinearGradient(
                    colors: [Theme.petrol.opacity(0.16), Theme.petrol.opacity(0.06), .clear],
                    startPoint: .top,
                    endPoint: UnitPoint(x: 0.5, y: 0.5)
                )
                // A single soft wash rather than the web's animated ribbons: a
                // continuously animating background behind a scroll view is a
                // measurable battery cost for decoration nobody looks at.
                RadialGradient(
                    colors: [Color.white.opacity(0.7), .clear],
                    center: .bottomTrailing,
                    startRadius: 10,
                    endRadius: 460
                )
            }
            .ignoresSafeArea()
        )
    }
}

/// The site's primary button: deep petrol, white type, softened corners.
struct PrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.sans(16, .semibold))
            .foregroundStyle(Theme.onAccent)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous).fill(
                    LinearGradient(
                        colors: [Theme.aqua, Theme.petrolDeep],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .shadow(color: Theme.petrolDeep.opacity(0.35), radius: 10, y: 5)
            )
            .opacity(configuration.isPressed ? 0.85 : 1)
            .scaleEffect(configuration.isPressed ? 0.985 : 1)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

/// White with a hairline, as on the site.
struct GhostButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.sans(15, .medium))
            .foregroundStyle(Theme.inkDeep)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 13)
            .background(
                RoundedRectangle(cornerRadius: 12, style: .continuous)
                    .fill(configuration.isPressed ? Theme.paperTint : Theme.paper)
                    .overlay(
                        RoundedRectangle(cornerRadius: 12, style: .continuous)
                            .stroke(Theme.line, lineWidth: 1)
                    )
            )
    }
}

/// Wordmark, matching the site.
struct Wordmark: View {
    var size: CGFloat = 22

    var body: some View {
        HStack(spacing: 0) {
            Text("The").font(.serif(size, .light))
                .foregroundStyle(Theme.ink)
            Text("ONE").font(.serif(size, .semibold))
                .foregroundStyle(Theme.aqua)
        }
    }
}

/// The app icon's mark: the white O on its teal square.
struct BrandMark: View {
    var size: CGFloat = 30

    var body: some View {
        Image("BrandMark")
            .resizable()
            .interpolation(.high)
            .frame(width: size, height: size)
            .accessibilityLabel("TheONE")
    }
}

/// Launch screen size of the mark. The loading state draws it at the same size
/// in the same place, so launch hands over to the app without a jump.
let launchMarkSize: CGFloat = 140

extension View {
    /// Puts the mark in the middle of the navigation bar. A large title, where
    /// a screen has one, still sits underneath.
    func brandedNavigationBar() -> some View {
        toolbar {
            ToolbarItem(placement: .principal) {
                // Near the most a 44pt bar holds without crowding its edges.
                BrandMark(size: 38)
            }
        }
    }
}
