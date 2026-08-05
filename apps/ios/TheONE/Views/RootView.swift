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
        TabView {
            Tab("Assistant", systemImage: "sparkles") {
                AssistantView()
            }
            Tab("Discover", systemImage: "magnifyingglass") {
                DiscoverView()
            }
            Tab("Messages", systemImage: "bubble.left.and.bubble.right") {
                MessagesView()
            }
            Tab("Profile", systemImage: "person") {
                ProfileView()
            }
        }
        .tint(Theme.aqua)
    }
}
