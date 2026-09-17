import SwiftUI

/// La portada, con la misma estructura que la web: saludo, qué toca hoy, la
/// semana, los objetivos, las rutinas y los accesos.
///
/// Reemplaza a la portada anterior, que era una grilla de widgets con una foto
/// de gimnasio arriba. Los números salen todos del store, igual que antes.
struct HomeScreen: View {
    @Environment(\.tema) private var tema
    let store: GymStore
    @State private var workout: WorkoutTarget?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 0) {
                    encabezado
                    titular
                    SemanaCard(trainedDayKeys: store.trainedDayKeys, streak: store.streak)
                        .padding(.top, 20)
                    objetivos
                    rutinas
                    espacio

                    if let error = store.loadError {
                        Text(error)
                            .font(.system(size: 13))
                            .foregroundStyle(tema.texto2)
                            .padding(.top, 16)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background { Backdrop() }
            .bottomNavInset()
            .scrollIndicators(.hidden)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar(.hidden, for: .navigationBar)
            .fullScreenCover(item: $workout) { target in
                WorkoutView(store: store, routine: target.routine)
            }
        }
    }

    // MARK: - Encabezado

    private var encabezado: some View {
        HStack(spacing: 14) {
            avatar
            VStack(alignment: .leading, spacing: 5) {
                Text("Hola, \(store.profile?.displayName ?? "atleta")")
                    .font(.system(size: 21, weight: .medium))
                    .tracking(-0.5)
                    .foregroundStyle(tema.texto)
                    .lineLimit(1)
                HStack(spacing: 7) {
                    Image(systemName: "bolt.fill")
                        .font(.system(size: 12))
                        .foregroundStyle(tema.texto)
                    Text("Meta semanal: \(store.calories.pct)%")
                        .font(.system(size: 14))
                        .foregroundStyle(tema.texto2)
                }
            }
            Spacer(minLength: 8)
        }
    }

    private var avatar: some View {
        Group {
            if let url = store.profile?.photoURL {
                AsyncImage(url: url) { image in
                    image.resizable().aspectRatio(contentMode: .fill).grayscale(1).opacity(0.85)
                } placeholder: {
                    inicial
                }
            } else {
                inicial
            }
        }
        .frame(width: 58, height: 58)
        .clipShape(.circle)
        .overlay { Circle().strokeBorder(tema.borde, lineWidth: 1) }
    }

    private var inicial: some View {
        ZStack {
            tema.vidrio(2)
            Text(String(store.profile?.displayName?.first ?? "T"))
                .font(.system(size: 24, weight: .medium))
                .foregroundStyle(tema.texto)
        }
    }

    // MARK: - Qué toca hoy

    private var titular: some View {
        HStack(alignment: .bottom, spacing: 14) {
            VStack(alignment: .leading, spacing: 0) {
                Text("Hoy toca")
                    .font(.system(size: 29, weight: .medium))
                    .foregroundStyle(tema.texto)
                Text(store.featuredRoutine?.name ?? "entrenar libre")
                    .font(.system(size: 29, weight: .heavy))
                    .italic()
                    .foregroundStyle(tema.texto)
                    .lineLimit(2)
                    .minimumScaleFactor(0.7)
            }
            .tracking(-0.6)
            .frame(maxWidth: .infinity, alignment: .leading)

            // El botón grande: empezar lo que toca hoy.
            Button {
                workout = WorkoutTarget(routine: store.featuredRoutine)
            } label: {
                Image(systemName: "play.fill")
                    .font(.system(size: 20))
                    .foregroundStyle(tema.sobreSolido)
                    .frame(width: 56, height: 56)
                    .background(tema.solido, in: .circle)
            }
            .accessibilityLabel("Empezar entrenamiento")
        }
        .padding(.top, 34)
    }

    // MARK: - Objetivos

    private var objetivos: some View {
        VStack(alignment: .leading, spacing: 0) {
            encabezadoSeccion("Tus objetivos")

            ScrollView(.horizontal) {
                HStack(spacing: 14) {
                    ObjetivoCard(
                        titulo: "Esta semana",
                        valor: formatoKg(store.weeklyVolumeKg),
                        insignia: "volumen",
                        progreso: min(store.weeklyVolumeKg / 10000, 1),
                        icono: "dumbbell.fill"
                    )
                    ObjetivoCard(
                        titulo: "Calorías",
                        valor: "\(store.calories.kcal) kcal",
                        insignia: store.calories.usesDefaultWeight ? "Estimado" : "Medido",
                        progreso: Double(store.calories.pct) / 100,
                        icono: "clock.fill"
                    )
                    ObjetivoCard(
                        titulo: "Series",
                        valor: "\(store.completion.pct) %",
                        insignia: "\(store.completion.completed) de \(store.completion.total)",
                        progreso: Double(store.completion.pct) / 100,
                        icono: "checkmark"
                    )
                }
                .padding(.vertical, 2)
            }
            .scrollIndicators(.hidden)
            .padding(.top, 16)
        }
        .padding(.top, 15)
    }

    // MARK: - Rutinas

    private var rutinas: some View {
        VStack(alignment: .leading, spacing: 0) {
            encabezadoSeccion("Las rutinas")

            if store.routines.isEmpty {
                GlassCard(padding: 24) {
                    Text("Todavía no tenés rutinas.")
                        .font(.system(size: 14))
                        .foregroundStyle(tema.texto2)
                }
                .padding(.top, 14)
            } else {
                VStack(spacing: 0) {
                    ForEach(Array(store.routines.prefix(3).enumerated()), id: \.element.id) { indice, rutina in
                        if indice > 0 {
                            Rectangle().fill(tema.borde).frame(height: 1)
                        }
                        NavigationLink {
                            RoutineDetailScreen(routine: rutina, store: store) { elegida in
                                workout = WorkoutTarget(routine: elegida)
                            }
                        } label: {
                            FilaRutina(rutina: rutina, store: store)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .background(tema.vidrio(1), in: .rect(cornerRadius: 24))
                .overlay { RoundedRectangle(cornerRadius: 24).strokeBorder(tema.borde, lineWidth: 1) }
                .padding(.top, 14)
            }
        }
        .padding(.top, 17)
    }

    // MARK: - Accesos

    private var espacio: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel("Tu espacio")
                .padding(.top, 24)
                .padding(.bottom, 10)

            GlassCard(padding: 0) {
                VStack(spacing: 0) {
                    FilaAcceso(nombre: "Historial", detalle: "Todo lo que entrenaste")
                    Rectangle().fill(tema.borde).frame(height: 1)
                    FilaAcceso(nombre: "Progreso", detalle: "Volumen y marcas")
                }
            }
        }
    }

    private func encabezadoSeccion(_ titulo: String) -> some View {
        Text(titulo)
            .font(.system(size: 20, weight: .medium))
            .tracking(-0.4)
            .foregroundStyle(tema.texto2)
            .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func formatoKg(_ kg: Double) -> String {
        kg >= 1000 ? String(format: "%.1f t", kg / 1000).replacingOccurrences(of: ".", with: ",")
                   : "\(Int(kg.rounded())) kg"
    }
}

// MARK: - Piezas

/// Tarjeta de objetivo con su anillo, igual a las de la web.
private struct ObjetivoCard: View {
    @Environment(\.tema) private var tema
    let titulo: String
    let valor: String
    let insignia: String
    /// 0...1
    let progreso: Double
    let icono: String

    var body: some View {
        GlassCard(padding: 14, radius: 30) {
            VStack(alignment: .leading, spacing: 0) {
                Text(titulo)
                    .font(.system(size: 14))
                    .foregroundStyle(tema.texto2)
                    .lineLimit(1)

                Text(valor)
                    .font(.system(size: 18, weight: .semibold))
                    .tracking(-0.6)
                    .foregroundStyle(tema.texto)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
                    .padding(.top, 6)

                Spacer(minLength: 14)

                HStack(alignment: .bottom) {
                    Text(insignia)
                        .font(.system(size: 9))
                        .foregroundStyle(tema.texto2)
                        .lineLimit(1)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 6)
                        .background(tema.vidrio(1), in: .capsule)
                        .overlay { Capsule().strokeBorder(tema.borde, lineWidth: 1) }

                    Spacer(minLength: 4)
                    Anillo(progreso: progreso, icono: icono)
                }
            }
            .frame(height: 124)
        }
        .frame(width: 168)
    }
}

/// Anillo de progreso con el icono en el centro.
private struct Anillo: View {
    @Environment(\.tema) private var tema
    let progreso: Double
    let icono: String

    var body: some View {
        ZStack {
            Circle().strokeBorder(tema.texto3.opacity(0.4), lineWidth: 3)
            Circle()
                .trim(from: 0, to: max(0.01, min(progreso, 1)))
                .stroke(tema.solido, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                .rotationEffect(.degrees(-90))
            Image(systemName: icono)
                .font(.system(size: 13))
                .foregroundStyle(tema.texto)
        }
        .frame(width: 52, height: 52)
    }
}

private struct FilaRutina: View {
    @Environment(\.tema) private var tema
    let rutina: Routine
    let store: GymStore

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 5) {
                Text(rutina.name)
                    .font(.system(size: 15, weight: .medium))
                    .tracking(-0.2)
                    .foregroundStyle(tema.texto)
                    .lineLimit(1)
                Text(detalle)
                    .font(.system(size: 11))
                    .foregroundStyle(tema.texto2)
            }
            Spacer(minLength: 8)
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(tema.texto3)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 13)
        .contentShape(.rect)
    }

    private var detalle: String {
        let ejercicios = rutina.exercises.count
        let series = rutina.exercises.reduce(0) { $0 + $1.targetSets }
        let minutos = RoutineSummary.estimatedMinutes(rutina, catalog: store.catalog)
        return "\(ejercicios) \(ejercicios == 1 ? "ejercicio" : "ejercicios") · \(series) \(series == 1 ? "serie" : "series") · \(minutos) min"
    }
}

private struct FilaAcceso: View {
    @Environment(\.tema) private var tema
    let nombre: String
    let detalle: String

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(nombre)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(tema.texto)
                Text(detalle)
                    .font(.system(size: 11))
                    .foregroundStyle(tema.texto2)
            }
            Spacer(minLength: 8)
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(tema.texto3)
        }
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
    }
}
