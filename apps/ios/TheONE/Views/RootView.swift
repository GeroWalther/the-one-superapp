import SwiftUI

struct RootView: View {
    @State private var session = SessionStore()

    var body: some View {
        Group {
            switch session.state {
            case .loading:
                VStack(spacing: 18) {
                    Wordmark(size: 30)
                    ProgressView().tint(Theme.aqua)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .paperBackground()

            case .signedOut:
                LoginView()

            case .signedIn:
                MainTabs()
            }
        }
        .environment(session)
        // Pinned rather than adaptive: the palette is a single light set, so a
        // system dark mode would recolour the chrome and leave the content light.
        .preferredColorScheme(.light)
        .task { await session.restore() }
        .animation(.easeInOut(duration: 0.25), value: session.state)
    }
}

struct MainTabs: View {
    var body: some View {
        // `.tabItem` rather than `Tab`: the latter is iOS 18 only, and the app
        // supports iOS 17.
        TabView {
            AssistantView()
                .tabItem { Label("Assistant", systemImage: "sparkles") }
            DiscoverView()
                .tabItem { Label("Discover", systemImage: "magnifyingglass") }
            MessagesView()
                .tabItem { Label("Messages", systemImage: "bubble.left.and.bubble.right") }
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person") }
        }
        .tint(Theme.aqua)
    }
}
