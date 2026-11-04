import SwiftUI

struct RootView: View {
    @State private var session = SessionStore()

    var body: some View {
        Group {
            switch session.state {
            case .loading:
                // Centred exactly like the launch screen's image, so the hand-over
                // from launch to app is invisible; the spinner hangs below it.
                BrandMark(size: launchMarkSize)
                    .overlay(alignment: .bottom) {
                        ProgressView()
                            .tint(Theme.aqua)
                            .offset(y: 64)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Theme.paper.ignoresSafeArea())

            // The start screen for everyone; its avatar leads on to the
            // sign-in or, once signed in, the member area.
            case .signedOut, .signedIn:
                HomeView()
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
    enum Tab: Hashable { case assistant, discover, messages, profile }

    @State private var selection: Tab

    init(initialTab: Tab = .assistant) {
        _selection = State(initialValue: initialTab)
    }

    var body: some View {
        // `.tabItem` rather than `Tab`: the latter is iOS 18 only, and the app
        // supports iOS 17.
        TabView(selection: $selection) {
            AssistantView()
                .tabItem { Label("Assistant", systemImage: "sparkles") }
                .tag(Tab.assistant)
            DiscoverView()
                .tabItem { Label("Discover", systemImage: "magnifyingglass") }
                .tag(Tab.discover)
            MessagesView()
                .tabItem { Label("Messages", systemImage: "bubble.left.and.bubble.right") }
                .tag(Tab.messages)
            ProfileView()
                .tabItem { Label("Profile", systemImage: "person") }
                .tag(Tab.profile)
        }
        .tint(Theme.aqua)
    }
}
