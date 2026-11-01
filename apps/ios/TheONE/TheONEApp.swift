import SwiftUI
import UIKit

@main
struct TheONEApp: App {
    init() {
        Self.applyWebsiteTypeToSystemBars()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
        }
    }

    /// Navigation and tab bars are drawn by UIKit, out of reach of SwiftUI's
    /// `.font`, so they get the site's type here: Cormorant Garamond for
    /// titles, as the site sets its headings, and Inter for tab labels.
    private static func applyWebsiteTypeToSystemBars() {
        let titleColor = UIColor(Theme.inkDeep)

        if let large = UIFont(name: "CormorantGaramond-SemiBold", size: 36),
           let inline = UIFont(name: "CormorantGaramond-SemiBold", size: 20) {
            let navigation = UINavigationBar.appearance()
            navigation.largeTitleTextAttributes = [.font: large, .foregroundColor: titleColor]
            navigation.titleTextAttributes = [.font: inline, .foregroundColor: titleColor]
        }

        if let tab = UIFont(name: "Inter-Medium", size: 11) {
            let item = UITabBarItem.appearance()
            item.setTitleTextAttributes([.font: tab], for: .normal)
            item.setTitleTextAttributes([.font: tab], for: .selected)
        }
    }
}
