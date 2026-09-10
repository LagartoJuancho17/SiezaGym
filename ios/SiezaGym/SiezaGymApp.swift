import FirebaseCore
import GoogleSignIn
import SwiftUI

@main
struct SiezaGymApp: App {
    @State private var auth: AuthService?

    init() {
        // El orden importa: el valor por defecto de una propiedad se evalua
        // antes del cuerpo del init, asi que `AuthService()` no puede declararse
        // como default -- tocaria `Auth.auth()` antes de configurar Firebase y
        // la app crashearia al abrir.
        guard Self.hasFirebaseConfig else { return }
        FirebaseApp.configure()
        _auth = State(initialValue: AuthService())
    }

    /// El plist no esta en el repo (es publico). Sin el, `FirebaseApp.configure()`
    /// tira una excepcion de ObjC que Swift no puede atrapar, asi que se
    /// comprueba antes y se explica que hacer.
    static var hasFirebaseConfig: Bool {
        Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil
    }

    var body: some Scene {
        WindowGroup {
            Group {
                if let auth {
                    RootView().environment(auth)
                } else {
                    MissingConfigView()
                }
            }
            // Google vuelve del navegador por el esquema de URL de la app.
            .onOpenURL { GIDSignIn.sharedInstance.handle($0) }
            // La app es bordo siempre: no tiene modo claro alternativo.
            .preferredColorScheme(.dark)
            .tint(Theme.accent)
        }
    }
}

private struct MissingConfigView: View {
    var body: some View {
        ZStack {
            Theme.background.ignoresSafeArea()
            VStack(alignment: .leading, spacing: 14) {
                Label("Falta GoogleService-Info.plist", systemImage: "exclamationmark.triangle.fill")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundStyle(Theme.accent)

                Text("No está en el repo porque es público. Generalo desde la raíz del proyecto:")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.onDarkMuted)

                Text("node --env-file=.env --env-file=.env.local \\\nios/scripts/fetch-google-service-info.mjs")
                    .font(.system(size: 12, design: .monospaced))
                    .foregroundStyle(Theme.onDark)
                    .padding(12)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.white.opacity(0.08), in: .rect(cornerRadius: Theme.radius))
            }
            .padding(24)
        }
    }
}
