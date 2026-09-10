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

    init(store: GymStore) {
        _store = State(initialValue: store)
    }

    var body: some View {
        TabView {
            Tab("Home", systemImage: "house.fill") {
                HomeView(store: store)
            }
            Tab("Rutinas", systemImage: "list.bullet.rectangle.fill") {
                RoutinesView(store: store)
            }
            Tab("Historial", systemImage: "clock.arrow.circlepath") {
                HistoryView(store: store)
            }
            Tab("Progreso", systemImage: "chart.line.uptrend.xyaxis") {
                ProgressScreen(store: store)
            }
            Tab("Perfil", systemImage: "person.fill") {
                ProfileView(store: store)
            }
        }
        .task { if !store.hasLoaded { await store.load() } }
    }
}
