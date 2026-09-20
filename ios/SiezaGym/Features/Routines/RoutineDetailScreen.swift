import SwiftUI

/// El detalle de una rutina, igual que `/rutinas/<id>` en la web: los tres
/// números, la lista de ejercicios que se despliega de a uno, el reparto
/// muscular, y abajo el botón de empezar.
struct RoutineDetailScreen: View {
    @Environment(\.tema) private var tema
    let routine: Routine
    let store: GymStore
    let onStart: (Routine) -> Void

    @State private var abierto: String?

    private var minutos: Int { RoutineSummary.estimatedMinutes(routine, catalog: store.catalog) }
    private var reparto: [RoutineSummary.MuscleShare] {
        RoutineSummary.muscleDistribution(routine, catalog: store.catalog)
    }
    private var hayGifs: Bool {
        routine.exercises.contains { store.exercise($0.exerciseID)?.mediaURL != nil }
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Pantalla(titulo: routine.name, rotulo: routine.isAssigned ? "Rutina del coach" : nil, volver: true) {
                StatsCard(datos: [
                    ("\(routine.exercises.count)", routine.exercises.count == 1 ? "ejercicio" : "ejercicios"),
                    ("\(routine.totalSets)", routine.totalSets == 1 ? "serie" : "series"),
                    // Es una cuenta sobre las series prescritas, no un tiempo
                    // medido: la pantalla lo dice.
                    ("\(minutos)", "min estimados"),
                ])
                .padding(.top, 20)
                .overlay(alignment: .top) {
                    Capsule()
                        .fill(tema.solido)
                        .frame(height: 4)
                        .padding(.horizontal, 28)
                        .padding(.top, 21)
                }

                SectionLabel("Ejercicios · \(routine.exercises.count)")
                    .padding(.top, 24)
                    .padding(.bottom, 10)

                if routine.exercises.isEmpty {
                    Vacio(texto: "Esta rutina no tiene ejercicios.")
                } else {
                    PanelLista {
                        ForEach(Array(routine.exercises.enumerated()), id: \.offset) { indice, item in
                            if indice > 0 {
                                Rectangle().fill(tema.borde).frame(height: 1)
                            }
                            FilaEjercicio(
                                item: item,
                                ejercicio: store.exercise(item.exerciseID),
                                nombre: store.name(of: item.exerciseID),
                                abierto: abierto == clave(indice, item),
                                alTocar: {
                                    abierto = abierto == clave(indice, item) ? nil : clave(indice, item)
                                }
                            )
                        }
                    }
                }

                if !reparto.isEmpty {
                    SectionLabel("Músculos que trabaja")
                        .padding(.top, 24)
                        .padding(.bottom, 10)

                    GlassCard(padding: 16) {
                        VStack(spacing: 11) {
                            ForEach(reparto.prefix(5)) { fila in
                                VStack(spacing: 5) {
                                    HStack {
                                        Text(fila.muscle.label)
                                            .font(.system(size: 12))
                                            .foregroundStyle(tema.texto)
                                        Spacer()
                                        Text("\(Int((fila.pct * 100).rounded()))%")
                                            .font(.system(size: 12))
                                            .foregroundStyle(tema.solido)
                                    }
                                    WidgetMeter(value: fila.pct)
                                }
                            }
                        }
                    }
                }

                if hayGifs { CreditoGifs() }

                // Aire para que el último ejercicio no quede abajo del botón.
                Color.clear.frame(height: 90)
            }

            boton
        }
        .bottomNavInset()
    }

    private func clave(_ indice: Int, _ item: RoutineExercise) -> String {
        "\(indice)-\(item.exerciseID)"
    }

    private var boton: some View {
        Button { onStart(routine) } label: {
            Label("Comenzar entrenamiento", systemImage: "play.fill")
        }
        .buttonStyle(SolidButtonStyle())
        .disabled(routine.exercises.isEmpty)
        .padding(.horizontal, 18)
        .padding(.bottom, 12)
    }
}

/// Un ejercicio de la rutina. Cerrado muestra el resumen de lo prescrito;
/// abierto, una fila por serie.
private struct FilaEjercicio: View {
    @Environment(\.tema) private var tema
    let item: RoutineExercise
    let ejercicio: Exercise?
    let nombre: String
    let abierto: Bool
    let alTocar: () -> Void

    /// Las series prescritas en una sola forma, vengan parejas o detalladas.
    private var series: [(numero: Int, reps: Int, peso: Double?, rir: Int?)] {
        if let detalladas = item.sets, !detalladas.isEmpty {
            return detalladas.enumerated().map { (indice, serie) in (indice + 1, serie.reps, serie.weight, serie.rir) }
        }
        return (0..<max(1, item.targetSets)).map {
            ($0 + 1, item.targetReps, item.targetWeight, item.targetRIR)
        }
    }

    private var esDeTiempo: Bool { ejercicio?.registrationType.isTimeBased == true }
    private var llevaPeso: Bool { ejercicio?.registrationType == .pesoReps }
    private var muestraRIR: Bool { series.contains { $0.rir != nil } }

    private var resumen: String {
        let reps = series.map(\.reps)
        let unidad = esDeTiempo ? "s" : ""
        if Set(reps).count == 1 { return "\(reps.count) × \(reps[0])\(unidad)" }
        return reps.map(String.init).joined(separator: " · ") + unidad
    }

    var body: some View {
        VStack(spacing: 0) {
            Button(action: alTocar) {
                HStack(spacing: 12) {
                    Miniatura(url: ejercicio?.mediaURL, lado: 54)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(nombre)
                            .font(.system(size: 14, weight: .medium))
                            .foregroundStyle(tema.texto)
                            .lineLimit(1)
                        Text(ejercicio?.primaryMuscle?.label ?? "Sin datos")
                            .font(.system(size: 11))
                            .foregroundStyle(tema.texto2)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)

                    Text(resumen)
                        .font(.system(size: 12))
                        .foregroundStyle(tema.texto2)
                        .lineLimit(1)

                    Image(systemName: "chevron.down")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(tema.texto3)
                        .rotationEffect(.degrees(abierto ? 180 : 0))
                }
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .contentShape(.rect)
            }
            .buttonStyle(.plain)

            if abierto {
                VStack(spacing: 6) {
                    HStack(spacing: 8) {
                        Text("").frame(width: 22)
                        Text(esDeTiempo ? "Tiempo" : "Reps").frame(maxWidth: .infinity)
                        if llevaPeso { Text("Peso").frame(maxWidth: .infinity) }
                        if muestraRIR { Text("RIR").frame(maxWidth: .infinity) }
                    }
                    .font(.system(size: 10))
                    .foregroundStyle(tema.texto3)

                    ForEach(series, id: \.numero) { serie in
                        HStack(spacing: 8) {
                            Text("\(serie.numero)")
                                .font(.system(size: 11))
                                .foregroundStyle(tema.texto3)
                                .frame(width: 22, alignment: .leading)
                            celda("\(serie.reps)\(esDeTiempo ? "s" : "")")
                            if llevaPeso {
                                celda(serie.peso.map { "\($0.formatted()) kg" })
                            }
                            if muestraRIR {
                                celda(serie.rir.map(String.init))
                            }
                        }
                    }
                }
                .padding(.horizontal, 14)
                .padding(.bottom, 14)
            }
        }
        .background(abierto ? tema.solido.opacity(0.08) : .clear)
        .overlay(alignment: .leading) {
            if abierto {
                RoundedRectangle(cornerRadius: 3)
                    .fill(tema.solido)
                    .frame(width: 3)
                    .padding(.vertical, 10)
            }
        }
        .animation(.snappy(duration: 0.2), value: abierto)
    }

    /// Un valor prescrito. Vacío se muestra como raya, no como cero.
    private func celda(_ texto: String?) -> some View {
        Text(texto ?? "—")
            .font(.system(size: 13))
            .foregroundStyle(texto == nil ? tema.texto3 : tema.solido)
            .frame(maxWidth: .infinity, minHeight: 32)
            .background(texto == nil ? tema.vidrio(1) : tema.solido.opacity(0.08), in: .rect(cornerRadius: 11))
    }
}
