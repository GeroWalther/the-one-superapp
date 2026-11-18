import SwiftUI

@main
struct TheONEApp: App {
    init() {
        TheONEFonts.register()
        // Screen titles in the brochure's heading face, deep petrol.
        let petrol = UIColor(Theme.heading)
        let bar = UINavigationBar.appearance()
        if let title = UIFont(name: "TheONEInter-Medium", size: 17) {
            bar.titleTextAttributes = [.font: title, .foregroundColor: petrol]
        }
        if let large = UIFont(name: "TheONEInter-Regular", size: 32) {
            bar.largeTitleTextAttributes = [.font: large, .foregroundColor: petrol]
        }
        if let tab = UIFont(name: "TheONEInterText-Medium", size: 10) {
            UITabBarItem.appearance().setTitleTextAttributes([.font: tab], for: .normal)
        }
        if let button = UIFont(name: "TheONEInterText-Regular", size: 17) {
            UIBarButtonItem.appearance().setTitleTextAttributes([.font: button], for: .normal)
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                // Inter for every text that does not name its own font.
                .font(.theone(17))
        }
    }
}
