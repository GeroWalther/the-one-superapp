import SwiftUI
import CoreText

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

    static let ink = Color(red: 0.090, green: 0.114, blue: 0.141)
    static let inkSoft = Color(red: 0.165, green: 0.196, blue: 0.231)
    static let inkFaint = Color(red: 0.271, green: 0.306, blue: 0.345)

    static let aqua = Color(red: 0.180, green: 0.612, blue: 0.659)
    static let aquaSoft = Color(red: 0.310, green: 0.702, blue: 0.749)
    static let aquaTint = Color(red: 0.902, green: 0.953, blue: 0.961)

    static let line = Color(red: 0.886, green: 0.910, blue: 0.918)

    /// Text and icons sitting *on* an aqua fill.
    static let onAccent = Color.white

    static let display = "Cormorant Garamond"

    /// Headings, deep petrol like the headings of TheONE Business Information.
    static let heading = Color(red: 0.051, green: 0.247, blue: 0.271)

    /// Text that used to be aqua (labels, prices, links): deep petrol, so it
    /// reads as well as the rest. Aqua stays for symbols, fills and lines.
    /// Champagne gold, only in TheONE MARKETPLACE: fine lines, small labels,
    /// prices. The rest of the app stays without gold.
    static let gold = Color(red: 0.659, green: 0.529, blue: 0.290)
    static let goldLine = Color(red: 0.788, green: 0.671, blue: 0.431)
    static let goldTint = Color(red: 0.969, green: 0.953, blue: 0.918)

    static let accentText = Color(red: 0.039, green: 0.208, blue: 0.231)
}

/// TheONE's typeface, Inter, as in TheONE Business Information: one face
/// for everything, headings and text alike. Scripts it lacks (Arabic,
/// Chinese) fall back to the system's own.
extension Font {
    /// A heading: Inter for display sizes, regular, deep petrol in use.
    static func theoneHeading(_ size: CGFloat, medium: Bool = false) -> Font {
        .custom(medium ? "TheONEInter-Medium" : "TheONEInter-Regular", size: size)
    }

    /// Any other text: Inter cut for reading sizes, in the weight asked for.
    static func theone(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        let face: String
        switch weight {
        case .ultraLight, .thin, .light: face = "Light"
        case .medium: face = "Medium"
        case .semibold: face = "SemiBold"
        case .bold, .heavy, .black: face = "Bold"
        default: face = "Regular"
        }
        return .custom("TheONEInterText-\(face)", size: size)
    }
}

/// Makes the bundled fonts known to the app, once, at launch.
enum TheONEFonts {
    static func register() {
        let urls = Bundle.main.urls(forResourcesWithExtension: "ttf", subdirectory: nil) ?? []
        let nested = Bundle.main.urls(forResourcesWithExtension: "ttf", subdirectory: "Fonts") ?? []
        for url in urls + nested {
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
        }
    }
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
            .font(.theone(16, weight: .semibold))
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
            .font(.theone(15, weight: .medium))
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

/// The "TheONE" lettering, cut from the logo artwork itself.
///
/// Never re-set in a font: the owner wants the name to look exactly like the
/// logo everywhere. As an image it also reads left to right in Arabic, where
/// two text pieces side by side would swap into "ONEThe".
struct Wordmark: View {
    /// Roughly the cap height of the text it replaces.
    var size: CGFloat = 22

    var body: some View {
        Image("WordmarkTheONE")
            .resizable()
            .interpolation(.high)
            .scaledToFit()
            .frame(height: size * 1.05)
            .accessibilityLabel(Text(verbatim: "TheONE"))
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
