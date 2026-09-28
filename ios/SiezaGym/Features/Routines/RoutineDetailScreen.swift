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
    @State private var editando = false
    @State private var cambiandoSemana = false

    /// La versión viva de la rutina. La que llegó por navegación es una copia
    /// del momento en que se tocó la fila: después de editar quedó vieja.
    private var actual: Routine {
        store.routines.first { $0.id == routine.id && $0.isAssigned == routine.isAssigned } ?? routine
    }

    /// Las del coach se editan desde su panel, no desde acá.
    private var sePuedeEditar: Bool { !actual.isAssigned }

    private var minutos: Int { RoutineSummary.estimatedMinutes(actual, catalog: store.catalog) }
    private var reparto: [RoutineSummary.MuscleShare] {
        RoutineSummary.muscleDistribution(actual, catalog: store.catalog)
    }
    private var hayGifs: Bool {
        actual.exercises.contains { store.exercise($0.exerciseID)?.mediaURL != nil }
    }

    private var semanaActual: TrainingCalendar.Semana { store.semanaActual }
    private var estaEnLaSemana: Bool { actual.weekKey == semanaActual.clave }

    /// Los ejercicios consecutivos con el mismo grupo, juntos. Igual que
    /// `sections` en `RoutineScreen.js`.
    private var secciones: [RoutineSection<RoutineExercise>] {
        RoutineGrouping.seccionar(actual.exercises, grupo: \.group, colorID: \.groupColor)
    }

    var body: some View {
        ZStack(alignment: .bottom) {
            Pantalla(
                titulo: actual.name,
                rotulo: actual.isAssigned ? "Rutina del coach" : nil,
                volver: true
            ) {
                if sePuedeEditar {
                    Button { editando = true } label: {
                        Image(systemName: "pencil")
                            .font(.system(size: 17, weight: .medium))
                            .foregroundStyle(tema.texto)
                            .frame(width: 44, height: 44)
                            .background(tema.vidrio(1), in: .circle)
                            .overlay { Circle().strokeBorder(tema.borde, lineWidth: 1) }
                    }
                    .accessibilityLabel("Editar la rutina")
                }
            } contenido: {
                StatsCard(datos: [
                    ("\(actual.exercises.count)", actual.exercises.count == 1 ? "ejercicio" : "ejercicios"),
                    ("\(actual.totalSets)", actual.totalSets == 1 ? "serie" : "series"),
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
                }

                if sePuedeEditar {
                    botonSemana
                        .padding(.top, 14)
                }

                SectionLabel("Ejercicios · \(actual.exercises.count)")
                    .padding(.top, 24)
                    .padding(.bottom, 10)

                if actual.exercises.isEmpty {
                    Vacio(
                        texto: "Esta rutina no tiene ejercicios.",
                        accion: sePuedeEditar ? ("Agregar ejercicios", { editando = true }) : nil
                    )
                } else {
                    PanelLista {
                        ForEach(secciones) { seccion in
                            if seccion.agrupada {
                                EncabezadoDeGrupoLectura(seccion: seccion)
                            }

                            ForEach(Array(actual.exercises.enumerated()), id: \.offset) { indice, item in
                                if seccion.items.contains(where: { $0.id == item.id }) {
                                    if item.id != seccion.items.first?.id {
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
        .fullScreenCover(isPresented: $editando) {
            RoutineComposerScreen(store: store, routine: actual)
        }
    }

    private func clave(_ indice: Int, _ item: RoutineExercise) -> String {
        "\(indice)-\(item.exerciseID)"
    }

    /// Sumarla o sacarla de "Septiembre · Semana 4" en la Home. Sólo para las
    /// propias: las del coach se organizan solas por cuándo te las asignaron.
    private var botonSemana: some View {
        Button {
            Task {
                cambiandoSemana = true
                defer { cambiandoSemana = false }
                try? await store.setWeekAssignment(actual, to: estaEnLaSemana ? nil : semanaActual.clave)
            }
        } label: {
            Label(
                estaEnLaSemana ? "En \(semanaActual.texto)" : "Agregar a \(semanaActual.texto)",
                systemImage: estaEnLaSemana ? "checkmark.circle.fill" : "calendar.badge.plus"
            )
            .font(.system(size: 13, weight: .medium))
            .foregroundStyle(estaEnLaSemana ? tema.sobreSolido : tema.texto)
            .frame(maxWidth: .infinity, minHeight: 42)
            .background(estaEnLaSemana ? AnyShapeStyle(tema.solido) : AnyShapeStyle(tema.vidrio(1)), in: .capsule)
            .overlay {
                Capsule().strokeBorder(estaEnLaSemana ? .clear : tema.borde, lineWidth: 1)
            }
            .opacity(cambiandoSemana ? 0.6 : 1)
        }
        .buttonStyle(.plain)
        .disabled(cambiandoSemana)
        .padding(.horizontal, 28)
        .accessibilityHint(estaEnLaSemana ? "Sacar de esta semana" : "Agregar a esta semana")
    }

    private var boton: some View {
        Button { onStart(actual) } label: {
            Label("Comenzar entrenamiento", systemImage: "play.fill")
        }
        .buttonStyle(SolidButtonStyle())
        .disabled(actual.exercises.isEmpty)
        .padding(.horizontal, 18)
        .padding(.bottom, 12)
    }
}

/// La franja de color con el nombre del bloque, de sólo lectura: acá no se
/// edita, se edita desde el armador.
private struct EncabezadoDeGrupoLectura: View {
    @Environment(\.tema) private var tema
    let seccion: RoutineSection<RoutineExercise>

    var body: some View {
        HStack(spacing: 8) {
            Circle().fill(seccion.color?.color ?? tema.texto3).frame(width: 7, height: 7)
            Text(seccion.nombreGrupo)
                .font(.system(size: 12, weight: .bold))
                .tracking(0.4)
                .textCase(.uppercase)
            Spacer()
            Text("\(seccion.items.count) \(seccion.items.count == 1 ? "ejercicio" : "ejercicios")")
                .font(.system(size: 11))
        }
        .foregroundStyle(seccion.color?.color ?? tema.texto)
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .frame(maxWidth: .infinity)
        .background((seccion.color?.color ?? tema.texto3).opacity(0.12))
        .overlay(alignment: .leading) {
            Rectangle().fill(seccion.color?.color ?? tema.texto3).frame(width: 3)
        }
        .accessibilityElement(children: .combine)
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
                    Miniatura(url: ejercicio?.thumbnailURL, lado: 54)
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
