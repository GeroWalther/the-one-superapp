import SafariServices
import SwiftUI

/// Pages that live on the website and open inside the app: the imprint and the
/// privacy policy. Kept on the web so there is one copy of each text, and so
/// they can change without an App Store release.
enum WebLinks {
    /// Simulator talks to the dev server; a real build points at production,
    /// the same split as `APIClient`.
    #if targetEnvironment(simulator)
    static let site = URL(string: "http://localhost:5656")!
    #else
    static let site = URL(string: "https://www.theone-superapp.com")!
    #endif

    /// The site has German and English; anything other than German gets
    /// English.
    static var language: String {
        Locale.preferredLanguages.first?.hasPrefix("de") == true ? "de" : "en"
    }

    static var imprint: URL { page("imprint") }
    static var privacy: URL { page("privacy") }

    private static func page(_ path: String) -> URL {
        site.appendingPathComponent(language).appendingPathComponent(path)
    }
}

/// A URL that can drive `.sheet(item:)`.
struct WebPage: Identifiable {
    let url: URL
    var id: URL { url }
}

/// Safari inside the app, so a member reading these pages never leaves TheONE.
struct SafariView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> SFSafariViewController {
        let controller = SFSafariViewController(url: url)
        controller.preferredControlTintColor = UIColor(Theme.petrol)
        return controller
    }

    func updateUIViewController(_ controller: SFSafariViewController, context: Context) {}
}
