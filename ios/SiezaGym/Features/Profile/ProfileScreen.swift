import SwiftUI

/// Perfil: la identidad, tres números, el progreso con los días entrenados y
/// los músculos a la vista (más accesos a Volumen, Empuje y tracción y Por
/// ejercicio), y dos botones a pantallas propias: "Tus datos" y el tema.
/// Distinto de `/perfil` en la web: ahí Progreso sigue siendo `/progreso`.
struct ProfileScreen: View {
    @Environment(\.tema) private var tema
    @Environment(AuthService.self) private var auth
    let store: GymStore

    private var totalSeries: Int { store.sessions.reduce(0) { $0 + $1.totalSetsCompleted } }

    var body: some View {
        NavigationStack {
            Pantalla(titulo: "Perfil") {
                identidad.padding(.top, 20)

                StatsCard(datos: [
                    ("\(store.sessions.count)", store.sessions.count == 1 ? "entrenamiento" : "entrenamientos"),
                    ("\(totalSeries)", totalSeries == 1 ? "serie" : "series"),
                    ("\(store.streak)", store.streak == 1 ? "día seguido" : "días seguidos"),
                ])
                .padding(.top, 14)

                SectionLabel("Tu progreso").padding(.top, 24).padding(.bottom, 10)
                progreso

                datos.padding(.top, 24)

                SectionLabel("Configuración").padding(.top, 24).padding(.bottom, 10)
                configuracion

                Button("Cerrar sesión") { auth.signOut() }
                    .buttonStyle(GhostButtonStyle())
                    .frame(maxWidth: .infinity)
                    .padding(.top, 24)
            }
            .bottomNavInset()
        }
    }

    // MARK: - Identidad

    private var identidad: some View {
        GlassCard(padding: 16, radius: 26) {
            HStack(spacing: 14) {
                Group {
                    if let url = store.profile?.photoURL {
                        AsyncImage(url: url) { $0.resizable().aspectRatio(contentMode: .fill) } placeholder: { inicial }
                    } else {
                        inicial
                    }
                }
                .frame(width: 58, height: 58)
                .clipShape(.circle)
                .overlay { Circle().strokeBorder(tema.borde, lineWidth: 1) }

                VStack(alignment: .leading, spacing: 4) {
                    Text(store.profile?.displayName ?? "Sin nombre")
                        .font(.system(size: 18, weight: .medium))
                        .foregroundStyle(tema.texto)
                        .lineLimit(1)
                    if let email = store.profile?.email {
                        Text(email)
                            .font(.system(size: 12))
                            .foregroundStyle(tema.texto2)
                            .lineLimit(1)
                    }
                    Text(store.profile?.isCoach == true ? "Entrenador" : "Atleta")
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto3)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }
        }
    }

    private var inicial: some View {
        ZStack {
            tema.vidrio(2)
            Text(store.profile?.initial ?? "T")
                .font(.system(size: 24, weight: .medium))
                .foregroundStyle(tema.texto)
        }
    }

    // MARK: - Progreso

    /// Los días entrenados y los músculos se ven acá mismo, sin entrar a otra
    /// pantalla. Volumen, Empuje y tracción y Por ejercicio tienen más detalle
    /// y siguen como accesos.
    @ViewBuilder private var progreso: some View {
        if store.sessions.isEmpty {
            Vacio(texto: "Todavía no terminaste ningún entrenamiento. Cuando termines el primero, acá vas a ver tus días entrenados, tus músculos y tu volumen.")
        } else {
            VStack(spacing: 12) {
                GrillaDiasEntrenados(store: store)
                RepartoMusculos(store: store, limite: 5)

                LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                    NavigationLink { VolumeScreen(store: store) } label: {
                        TarjetaProgreso(icono: "chart.bar.fill", titulo: "Volumen", valor: "\(ProgressMetrics.formatKg(store.weeklyVolumeKg)) esta semana")
                    }
                    NavigationLink { PushPullScreen(store: store) } label: {
                        TarjetaProgreso(icono: "arrow.left.arrow.right", titulo: "Empuje y tracción", valor: store.pushPull.label)
                    }
                    NavigationLink { ExerciseHistoryScreen(store: store) } label: {
                        TarjetaProgreso(icono: "list.bullet", titulo: "Por ejercicio", valor: "\(ProgressMetrics.byExercise(store.sessions, limit: 99).count) entrenados")
                    }
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Datos

    /// Un botón con el resumen; el formulario completo está en `DatosScreen`.
    private var datos: some View {
        NavigationLink { DatosScreen(store: store) } label: {
            FilaBoton(
                icono: "person.text.rectangle",
                titulo: "Tus datos",
                detalle: BodyMetrics.resumen(
                    pesoKg: store.profile?.bodyWeightKg,
                    alturaCm: store.profile?.heightCm,
                    nivel: store.profile?.experienceLevel?.label
                )
            )
        }
        .buttonStyle(.plain)
    }

    // MARK: - Configuración

    private var configuracion: some View {
        GlassCard(padding: 16) {
            VStack(alignment: .leading, spacing: 16) {
                // El tema se elige en su pantalla, con vistas previas grandes.
                NavigationLink { TemasScreen() } label: {
                    HStack(spacing: 12) {
                        muestra(tema)
                        VStack(alignment: .leading, spacing: 3) {
                            Text("Tema").font(.system(size: 14, weight: .medium)).foregroundStyle(tema.texto)
                            Text(tema.nombre).font(.system(size: 11)).foregroundStyle(tema.texto2)
                        }
                        Spacer(minLength: 12)
                        Image(systemName: "chevron.right")
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(tema.texto3)
                    }
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)

                Rectangle().fill(tema.borde).frame(height: 1)

                // Armada a mano y no con `FilaLista`: ese componente trae su
                // propio padding horizontal y encima del de esta tarjeta
                // quedaba corrido respecto a la fila de arriba.
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("Entrenador").font(.system(size: 14, weight: .medium)).foregroundStyle(tema.texto)
                        Text("Quien te asigna rutinas").font(.system(size: 11)).foregroundStyle(tema.texto2)
                    }
                    Spacer(minLength: 12)
                    Text(store.profile?.isCoach == true ? "Sos entrenador" : "Sin vincular")
                        .font(.system(size: 12))
                        .foregroundStyle(tema.texto2)
                }
            }
        }
    }
}

/// El fondo del tema en un cuadradito, con un punto de su sólido.
private func muestra(_ opcion: Theme) -> some View {
    ZStack {
        LinearGradient(stops: opcion.fondo, startPoint: opcion.fondoInicio, endPoint: opcion.fondoFin)
        if let obra = opcion.obra {
            Image(obra).resizable().aspectRatio(contentMode: .fill)
        }
        Circle().fill(opcion.solido).frame(width: 12, height: 12)
    }
    .frame(width: 34, height: 34)
    .clipShape(.rect(cornerRadius: 10))
    .overlay { RoundedRectangle(cornerRadius: 10).strokeBorder(opcion.bordeFuerte, lineWidth: 1) }
}

/// Una tarjeta que es un botón a otra pantalla: ícono, título, detalle y
/// chevron.
private struct FilaBoton: View {
    @Environment(\.tema) private var tema
    let icono: String
    let titulo: String
    let detalle: String

    var body: some View {
        GlassCard(padding: 16) {
            HStack(spacing: 12) {
                Image(systemName: icono)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(tema.solido)
                    .frame(width: 34, height: 34)
                    .background(tema.vidrio(2), in: .rect(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 3) {
                    Text(titulo).font(.system(size: 14, weight: .medium)).foregroundStyle(tema.texto)
                    Text(detalle)
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto2)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(tema.texto3)
            }
            .contentShape(.rect)
        }
    }
}

/// Una tarjeta de acceso a una vista de progreso: ícono, título y el dato más
/// importante de esa vista, para que la grilla sirva como resumen y no solo
/// como menú.
private struct TarjetaProgreso: View {
    @Environment(\.tema) private var tema
    let icono: String
    let titulo: String
    let valor: String

    var body: some View {
        GlassCard(padding: 14) {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Image(systemName: icono)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(tema.solido)
                    Spacer()
                    Image(systemName: "chevron.right")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(tema.texto3)
                }
                VStack(alignment: .leading, spacing: 2) {
                    Text(titulo)
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(tema.texto)
                        .lineLimit(1)
                    Text(valor)
                        .font(.system(size: 11))
                        .foregroundStyle(tema.texto2)
                        .lineLimit(1)
                        .minimumScaleFactor(0.85)
                }
            }
        }
    }
}

#if DEBUG
#Preview("Perfil") {
    ProfileScreen(store: PreviewData.store())
        .previewSieza()
}
#endif
