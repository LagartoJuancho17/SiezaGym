import SwiftUI

struct RootView: View {
    @Environment(AuthService.self) private var auth

    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()

            switch auth.state {
            case .loading:
                ProgressView().tint(Theme.accent)
            case .signedOut:
                LoginView()
            case let .signedIn(uid, _):
                MainTabView(store: GymStore(uid: uid))
                    // Cambiar de cuenta tiene que rearmar todas las pantallas,
                    // si no queda data del usuario anterior en pantalla.
                    .id(uid)
            }
        }
        .animation(.smooth(duration: 0.3), value: auth.state)
    }
}

struct MainTabView: View {
    /// Un solo store para las cinco pantallas. Si cada tab creara el suyo
    /// pagariamos las mismas lecturas cinco veces y podrian mostrar numeros
    /// distintos entre si.
    @State private var store: GymStore
    @State private var tab: AppTab = .home

    init(store: GymStore) {
        _store = State(initialValue: store)
    }

    var body: some View {
        // TabView y no un switch: asi cada seccion conserva su pila de
        // navegacion al ir y volver. La barra del sistema se esconde porque la
        // de la app es la de `BottomNav`, igual a la de la web.
        TabView(selection: $tab) {
            HomeView(store: store)
                .tag(AppTab.home)
                .toolbar(.hidden, for: .tabBar)
            RoutinesView(store: store)
                .tag(AppTab.routines)
                .toolbar(.hidden, for: .tabBar)
            HistoryView(store: store)
                .tag(AppTab.history)
                .toolbar(.hidden, for: .tabBar)
            ProgressScreen(store: store)
                .tag(AppTab.progress)
                .toolbar(.hidden, for: .tabBar)
            ProfileView(store: store)
                .tag(AppTab.profile)
                .toolbar(.hidden, for: .tabBar)
        }
        .overlay(alignment: .bottom) {
            BottomNav(selection: $tab)
                .padding(.bottom, BottomNav.bottomGap)
        }
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .task { if !store.hasLoaded { await store.load() } }
    }
}
