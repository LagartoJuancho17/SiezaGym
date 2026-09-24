import SwiftUI

struct RootView: View {
    @Environment(AuthService.self) private var auth
    /// El tema elegido vive acá arriba y baja por el entorno a toda la app,
    /// igual que `ThemeRoot` en la web.
    @State private var temas = ThemeStore()
    @AppStorage("sieza.onboarding.completed.v1") private var onboardingCompleted = false

    var body: some View {
        ZStack {
            Backdrop()

            if !onboardingCompleted {
                OnboardingView { onboardingCompleted = true }
            } else {
                switch auth.state {
                case .loading:
                    ProgressView().tint(temas.actual.texto)
                case .signedOut:
                    LoginView()
                case let .signedIn(uid, _):
                    MainTabView(store: GymStore(uid: uid))
                        // Cambiar de cuenta tiene que rearmar todas las pantallas,
                        // si no queda data del usuario anterior en pantalla.
                        .id(uid)
                }
            }
        }
        .environment(\.tema, temas.actual)
        .environment(temas)
        .tint(temas.actual.solido)
        .animation(.smooth(duration: 0.3), value: auth.state)
    }
}

struct MainTabView: View {
    @Environment(\.scenePhase) private var scenePhase
    /// Un solo store para las cinco pantallas. Si cada tab creara el suyo
    /// pagariamos las mismas lecturas cinco veces y podrian mostrar numeros
    /// distintos entre si.
    @State private var store: GymStore
    @State private var tab: AppTab = .home
    @State private var resumingWorkout = false

    init(store: GymStore) {
        _store = State(initialValue: store)
    }

    var body: some View {
        // TabView y no un switch: asi cada seccion conserva su pila de
        // navegacion al ir y volver. La barra del sistema se esconde porque la
        // de la app es la de `BottomNav`, igual a la de la web.
        TabView(selection: $tab) {
            HomeScreen(store: store)
                .tag(AppTab.home)
                .toolbar(.hidden, for: .tabBar)
            RoutinesScreen(store: store)
                .tag(AppTab.routines)
                .toolbar(.hidden, for: .tabBar)
            HistoryScreen(store: store)
                .tag(AppTab.history)
                .toolbar(.hidden, for: .tabBar)
            ProgressScreen(store: store)
                .tag(AppTab.progress)
                .toolbar(.hidden, for: .tabBar)
            ProfileScreen(store: store)
                .tag(AppTab.profile)
                .toolbar(.hidden, for: .tabBar)
        }
        .overlay(alignment: .bottom) {
            VStack(spacing: 8) {
                if let active = store.activeWorkout {
                    ActiveWorkoutMiniBar(
                        workout: active,
                        onResume: { resumingWorkout = true },
                        onDiscard: { store.activeWorkout = nil }
                    )
                }
                BottomNav(selection: $tab)
            }
            .padding(.horizontal, 20)
            .padding(.bottom, BottomNav.bottomGap)
        }
        .fullScreenCover(isPresented: $resumingWorkout) {
            if let active = store.activeWorkout {
                WorkoutView(store: store, routine: active.routine, existingDraft: active)
            }
        }
        .ignoresSafeArea(.keyboard, edges: .bottom)
        .task {
            if !store.hasLoaded { await store.load() }
            await store.healthKit.refreshIfConnected()
        }
        .onChange(of: scenePhase) { _, phase in
            guard phase == .active else { return }
            Task { await store.healthKit.refreshIfConnected() }
        }
    }
}

private struct ActiveWorkoutMiniBar: View {
    @Environment(\.tema) private var tema
    let workout: WorkoutDraft
    let onResume: () -> Void
    let onDiscard: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            Circle()
                .fill(tema.solido)
                .frame(width: 8, height: 8)

            VStack(alignment: .leading, spacing: 2) {
                Text(workout.routine?.name ?? "Entrenamiento en curso")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(tema.texto)
                    .lineLimit(1)

                HStack(spacing: 6) {
                    TimelineView(.periodic(from: workout.startedAt, by: 1)) { context in
                        let total = max(0, Int(context.date.timeIntervalSince(workout.startedAt)))
                        Text(String(format: "%02d:%02d", total / 60, total % 60))
                            .monospacedDigit()
                    }
                    Text("•")
                    Text("\(workout.completedSets)/\(workout.totalSets) series")
                }
                .font(.system(size: 11))
                .foregroundStyle(tema.texto2)
            }

            Spacer(minLength: 0)

            Button("Reanudar", action: onResume)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(tema.sobreSolido)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(tema.solido, in: .capsule)

            Button(action: onDiscard) {
                Image(systemName: "xmark")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(tema.texto2)
                    .padding(6)
            }
            .buttonStyle(.plain)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(tema.vidrio(3), in: .rect(cornerRadius: 16))
        .overlay {
            RoundedRectangle(cornerRadius: 16)
                .strokeBorder(tema.solido.opacity(0.35), lineWidth: 1)
        }
        .shadow(color: .black.opacity(tema.plano ? 0 : 0.12), radius: 8, y: 3)
    }
}
