import SwiftUI

/// Armar una rutina nueva, igual que `/rutinas/nueva` en la web: el nombre, los
/// ejercicios con su prescripción, la nota y el reparto muscular de lo que
/// llevás cargado.
struct RoutineComposerScreen: View {
    @Environment(\.tema) private var tema
    @Environment(\.dismiss) private var dismiss
    let store: GymStore

    @State private var nombre = ""
    @State private var nota = ""
    @State private var items: [RoutineDraftExercise] = []
    @State private var abierto: String?
    @State private var eligiendo = false
    @State private var error = ""
    @State private var guardando = false

    /// Los mismos topes que los campos de la web: el nombre es un título de
    /// lista, no un párrafo.
    private static let maxNombre = 60
    private static let maxNota = 2000

    private var agregados: Set<String> { Set(items.map(\.exerciseID)) }

    private var musculos: [RepartoMuscular] {
        Array(RoutineCompose.reparto(items, catalogo: store.catalog).prefix(5))
    }

    var body: some View {
        Pantalla(titulo: "Nueva rutina", volver: true) {
            Button(guardando ? "Guardando…" : "Guardar") { Task { await guardar() } }
                .buttonStyle(SolidButtonStyle(expands: false))
                .disabled(guardando)
        } contenido: {
            campoNombre

            SectionLabel(items.isEmpty ? "Ejercicios" : "Ejercicios · \(items.count)")
                .padding(.top, 24)
                .padding(.bottom, 10)

            if !items.isEmpty { panelEjercicios }

            Button { eligiendo = true } label: {
                Label("Agregar ejercicio", systemImage: "plus")
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(tema.texto)
                    .frame(maxWidth: .infinity, minHeight: 52)
                    .background {
                        RoundedRectangle(cornerRadius: 20)
                            .strokeBorder(tema.bordeFuerte, style: StrokeStyle(lineWidth: 1, dash: [5, 4]))
                    }
            }
            .padding(.top, 12)

            campoNota

            if !musculos.isEmpty { panelMusculos }

            if !error.isEmpty {
                Text(error)
                    .font(.system(size: 13))
                    .foregroundStyle(tema.texto)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(16)
                    .background(tema.vidrio(1), in: .rect(cornerRadius: 18))
                    .padding(.top, 14)
            }
        }
        .tecladoConBotonListo()
        .sheet(isPresented: $eligiendo) {
            ExercisePickerSheet(store: store, yaAgregados: agregados) { elegidos in
                agregar(elegidos)
                eligiendo = false
            }
        }
    }

    // MARK: - Partes

    private var campoNombre: some View {
        TextField("", text: $nombre, prompt: Text("Nombre de la rutina").foregroundStyle(tema.texto3))
            .font(.system(size: 17, weight: .medium))
            .foregroundStyle(tema.texto)
            .padding(.horizontal, 20)
            .frame(minHeight: 60)
            .background(tema.vidrio(1), in: .rect(cornerRadius: 20))
            .overlay { RoundedRectangle(cornerRadius: 20).strokeBorder(tema.borde, lineWidth: 1) }
            .padding(.top, 20)
            .accessibilityLabel("Nombre de la rutina")
            .onChange(of: nombre) { _, nuevo in
                if nuevo.count > Self.maxNombre { nombre = String(nuevo.prefix(Self.maxNombre)) }
            }
    }

    private var campoNota: some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionLabel("Nota de la rutina (opcional)")
            TextField(
                "",
                text: $nota,
                prompt: Text("Indicaciones para este entrenamiento").foregroundStyle(tema.texto3),
                axis: .vertical
            )
            .font(.system(size: 14))
            .foregroundStyle(tema.texto)
            .lineLimit(3...6)
            .padding(16)
            .background(tema.vidrio(1), in: .rect(cornerRadius: 20))
            .overlay { RoundedRectangle(cornerRadius: 20).strokeBorder(tema.borde, lineWidth: 1) }
            .accessibilityLabel("Nota de la rutina")
            .onChange(of: nota) { _, nuevo in
                if nuevo.count > Self.maxNota { nota = String(nuevo.prefix(Self.maxNota)) }
            }
        }
        .padding(.top, 24)
    }

    /// `ForEach` sobre `$items` y no sobre los índices: así cada fila recibe su
    /// binding directo y quitar el último ejercicio no deja un binding
    /// apuntando a una posición que ya no existe.
    private var panelEjercicios: some View {
        PanelLista {
            ForEach($items) { $item in
                if item.exerciseID != items.first?.exerciseID {
                    Rectangle().fill(tema.borde).frame(height: 1)
                }

                FilaPrescripcion(
                    item: $item,
                    ejercicio: store.exercise(item.exerciseID),
                    nombre: store.name(of: item.exerciseID),
                    abierto: abierto == item.exerciseID,
                    alTocar: { abierto = abierto == item.exerciseID ? nil : item.exerciseID },
                    alQuitar: { quitar(item.exerciseID) }
                )

                if items.count > 1 { reordenar(item) }
            }
        }
    }

    private func reordenar(_ item: RoutineDraftExercise) -> some View {
        let indice = items.firstIndex(of: item) ?? 0

        return HStack(spacing: 8) {
            Spacer()
            flecha("arrow.up", rotulo: "Subir \(store.name(of: item.exerciseID))", activo: indice > 0) {
                items = RoutineCompose.mover(items, de: indice, a: indice - 1)
            }
            flecha(
                "arrow.down",
                rotulo: "Bajar \(store.name(of: item.exerciseID))",
                activo: indice < items.count - 1
            ) {
                items = RoutineCompose.mover(items, de: indice, a: indice + 1)
            }
        }
        .padding(.horizontal, 14)
        .padding(.bottom, 12)
    }

    private func flecha(
        _ icono: String,
        rotulo: String,
        activo: Bool,
        accion: @escaping () -> Void
    ) -> some View {
        Button(action: accion) {
            Image(systemName: icono)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(tema.texto)
                .frame(width: 34, height: 30)
                .background(tema.vidrio(1), in: .capsule)
                .overlay { Capsule().strokeBorder(tema.borde, lineWidth: 1) }
        }
        .buttonStyle(.plain)
        .disabled(!activo)
        .opacity(activo ? 1 : 0.35)
        .accessibilityLabel(rotulo)
    }

    private var panelMusculos: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionLabel("Músculos que trabaja").padding(.bottom, 10)
            GlassCard(padding: 16) {
                VStack(spacing: 11) {
                    ForEach(musculos) { fila in
                        VStack(spacing: 5) {
                            HStack {
                                Text(fila.muscle.label).font(.system(size: 12)).foregroundStyle(tema.texto)
                                Spacer()
                                Text("\(Int((fila.pct * 100).rounded()))%")
                                    .font(.system(size: 12)).foregroundStyle(tema.texto2)
                            }
                            WidgetMeter(value: fila.pct)
                        }
                    }
                }
            }
        }
        .padding(.top, 24)
    }

    // MARK: - Acciones

    /// Filtra los que ya están: dos filas con el mismo id rompen el `ForEach`.
    private func agregar(_ elegidos: [Exercise]) {
        let nuevos = elegidos
            .filter { !agregados.contains($0.id) }
            .map(RoutineDraftExercise.init(exercise:))
        items.append(contentsOf: nuevos)
    }

    private func quitar(_ id: String) {
        items.removeAll { $0.exerciseID == id }
        if abierto == id { abierto = nil }
    }

    private func guardar() async {
        error = ""
        do {
            try RoutineDraftValidation.validate(name: nombre, exercises: items)
        } catch {
            self.error = error.localizedDescription
            return
        }

        guardando = true
        do {
            try await store.createRoutine(name: nombre, note: nota, exercises: items)
            dismiss()
        } catch {
            self.error = error.localizedDescription
            guardando = false
        }
    }
}

/// Un ejercicio del armador. Cerrado muestra el resumen; abierto, la
/// prescripción. Se abre de a uno: una rutina de diez ejercicios con todos los
/// campos desplegados no se puede leer.
private struct FilaPrescripcion: View {
    @Environment(\.tema) private var tema
    @Binding var item: RoutineDraftExercise
    let ejercicio: Exercise?
    let nombre: String
    let abierto: Bool
    let alTocar: () -> Void
    let alQuitar: () -> Void

    private var esDeTiempo: Bool { ejercicio?.registrationType.isTimeBased == true }
    /// El peso se pide solo donde tiene sentido: en peso corporal o en plancha no.
    private var llevaPeso: Bool { ejercicio?.registrationType == .pesoReps }
    private var rotuloReps: String { esDeTiempo ? "Tiempo (s)" : "Reps" }

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
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

                        Text(item.resumen(esDeTiempo: esDeTiempo))
                            .font(.system(size: 12))
                            .foregroundStyle(tema.texto2)
                            .lineLimit(1)

                        Image(systemName: "chevron.down")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(tema.texto3)
                            .rotationEffect(.degrees(abierto ? 180 : 0))
                    }
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .accessibilityHint(abierto ? "Cerrar la prescripción" : "Abrir la prescripción")

                Button(action: alQuitar) {
                    Image(systemName: "xmark")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(tema.texto3)
                        .frame(width: 34, height: 34)
                }
                .accessibilityLabel("Quitar \(nombre)")
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)

            if abierto { detalle }
        }
        .animation(.snappy(duration: 0.2), value: abierto)
    }

    private var detalle: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                campo("Series", valor: Binding(
                    get: { item.cantidadSeries },
                    set: { item.cambiarCantidad($0) }
                ))

                if !item.esDetallada {
                    campo(rotuloReps, valor: $item.targetReps)
                    if llevaPeso {
                        campoDecimal("Peso (kg)", valor: $item.targetWeight)
                    }
                    campo("RIR", valor: Binding(
                        get: { item.targetRIR ?? -1 },
                        set: { item.targetRIR = $0 < 0 ? nil : $0 }
                    ), opcional: true)
                }
            }

            Button {
                if item.esDetallada { item.emparejar() } else { item.detallar() }
            } label: {
                HStack(spacing: 9) {
                    Image(systemName: item.esDetallada ? "checkmark.square.fill" : "square")
                        .font(.system(size: 16))
                        .foregroundStyle(item.esDetallada ? tema.solido : tema.texto3)
                    Text("Prescribir cada serie por separado")
                        .font(.system(size: 12))
                        .foregroundStyle(item.esDetallada ? tema.texto : tema.texto2)
                }
            }
            .buttonStyle(.plain)
            .accessibilityAddTraits(item.esDetallada ? [.isSelected] : [])

            // La nota técnica del armador del coach (`ExerciseConfigRow` en la
            // web). `sanitizeExercises` ya la guarda y el detalle de la rutina
            // la muestra, así que se puede cargar desde acá.
            TextField(
                "",
                text: $item.techniqueNote,
                prompt: Text("Nota técnica (opcional)").foregroundStyle(tema.texto3)
            )
            .font(.system(size: 12))
            .foregroundStyle(tema.texto)
            .padding(.horizontal, 12)
            .frame(minHeight: 38)
            .background(tema.vidrio(1), in: .rect(cornerRadius: 12))
            .overlay { RoundedRectangle(cornerRadius: 12).strokeBorder(tema.borde, lineWidth: 1) }
            .accessibilityLabel("Nota técnica de \(nombre)")

            if item.esDetallada, let filas = item.sets {
                // El caso: press con 10, 12, 14 y 16 repeticiones.
                leyendaSeries
                VStack(spacing: 7) {
                    ForEach(Array(filas.enumerated()), id: \.offset) { indice, _ in
                        HStack(spacing: 7) {
                            Text("\(indice + 1)")
                                .font(.system(size: 11))
                                .foregroundStyle(tema.texto3)
                                .frame(width: 20, alignment: .leading)

                            CampoNumero(valor: Binding(
                                get: { item.sets?[indice].reps ?? 0 },
                                set: { nuevo in cambiarSerie(indice) { vieja in
                                    PlannedSet(setNumber: vieja.setNumber, weight: vieja.weight, reps: nuevo, rir: vieja.rir)
                                } }
                            ))
                            .accessibilityLabel("\(rotuloReps) de la serie \(indice + 1)")

                            if llevaPeso {
                                CampoDecimal(valor: Binding(
                                    get: { item.sets?[indice].weight },
                                    set: { nuevo in cambiarSerie(indice) { vieja in
                                        PlannedSet(setNumber: vieja.setNumber, weight: nuevo, reps: vieja.reps, rir: vieja.rir)
                                    } }
                                ))
                                .accessibilityLabel("Peso de la serie \(indice + 1)")
                            }

                            CampoNumero(valor: Binding(
                                get: { item.sets?[indice].rir ?? -1 },
                                set: { nuevo in cambiarSerie(indice) { vieja in
                                    PlannedSet(setNumber: vieja.setNumber, weight: vieja.weight, reps: vieja.reps, rir: nuevo < 0 ? nil : nuevo)
                                } }
                            ), opcional: true)
                            .accessibilityLabel("RIR de la serie \(indice + 1)")
                        }
                    }
                }
            }
        }
        .padding(.horizontal, 14)
        .padding(.bottom, 14)
    }

    /// Tres cajas sin encabezado no se entienden: cuál es reps, cuál peso y
    /// cuál RIR tiene que decirlo la fila de arriba.
    private var leyendaSeries: some View {
        HStack(spacing: 7) {
            Text("").frame(width: 20)
            rotuloColumna(rotuloReps)
            if llevaPeso { rotuloColumna("Peso") }
            rotuloColumna("RIR")
        }
        .accessibilityHidden(true)
    }

    private func rotuloColumna(_ texto: String) -> some View {
        Text(texto)
            .font(.system(size: 10))
            .foregroundStyle(tema.texto2)
            .frame(maxWidth: .infinity)
    }

    private func cambiarSerie(_ indice: Int, _ transformar: (PlannedSet) -> PlannedSet) {
        guard var filas = item.sets, filas.indices.contains(indice) else { return }
        filas[indice] = transformar(filas[indice])
        item.sets = filas
    }

    private func campo(_ rotulo: String, valor: Binding<Int>, opcional: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(rotulo).font(.system(size: 10)).foregroundStyle(tema.texto2)
            CampoNumero(valor: valor, opcional: opcional)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
    }

    private func campoDecimal(_ rotulo: String, valor: Binding<Double?>) -> some View {
        VStack(alignment: .leading, spacing: 5) {
            Text(rotulo).font(.system(size: 10)).foregroundStyle(tema.texto2)
            CampoDecimal(valor: valor)
        }
        .frame(maxWidth: .infinity)
        .accessibilityElement(children: .combine)
    }
}

/// Caja de número de la prescripción.
///
/// Tiene texto propio y no lee el binding directo porque un `TextField` se
/// queda con lo que tipeaste aunque el modelo lo haya recortado: escribís 43
/// series, el tope son 12, y la caja seguía diciendo 43 mientras la rutina ya
/// tenía 12. Igual que un input controlado de React, acá la caja vuelve a
/// escribirse siempre con el valor que el modelo aceptó.
private struct CampoNumero: View {
    @Environment(\.tema) private var tema
    @Binding var valor: Int
    /// Con `opcional`, el 0 es un valor (un RIR de 0 es al fallo) y el vacío se
    /// guarda como nil. Sin él, el 0 es el vacío.
    var opcional = false

    @State private var texto = ""

    private var canonico: String {
        opcional ? (valor < 0 ? "" : "\(valor)") : (valor <= 0 ? "" : "\(valor)")
    }

    var body: some View {
        TextField("", text: $texto, prompt: Text("—").foregroundStyle(tema.texto3))
            .keyboardType(.numberPad)
            .multilineTextAlignment(.center)
            .foregroundStyle(tema.texto)
            .frame(maxWidth: .infinity, minHeight: 40)
            .background(tema.vidrio(1), in: .rect(cornerRadius: 12))
            .overlay { RoundedRectangle(cornerRadius: 12).strokeBorder(tema.borde, lineWidth: 1) }
            .onAppear { texto = canonico }
            .onChange(of: texto) { _, nuevo in
                // El teclado numérico no deja pegar letras, pero el dictado sí.
                let digitos = nuevo.filter(\.isNumber)
                valor = Int(digitos) ?? (opcional ? -1 : 0)
                sincronizar()
            }
            .onChange(of: valor) { _, _ in sincronizar() }
    }

    /// Converge en una pasada: al reescribir el texto con el canónico, el
    /// `onChange` siguiente parsea el mismo número y ya no cambia nada.
    private func sincronizar() {
        if texto != canonico { texto = canonico }
    }
}

/// Caja de peso. No tiene topes, así que no reescribe lo tipeado: hacerlo
/// comería el punto de "60." antes de poder escribir "60.5".
private struct CampoDecimal: View {
    @Environment(\.tema) private var tema
    @Binding var valor: Double?

    var body: some View {
        TextField("", text: Binding(
            get: { valor.map { $0.formatted() } ?? "" },
            set: { valor = Double($0.replacingOccurrences(of: ",", with: ".")) }
        ), prompt: Text("—").foregroundStyle(tema.texto3))
            .keyboardType(.decimalPad)
            .multilineTextAlignment(.center)
            .foregroundStyle(tema.texto)
            .frame(maxWidth: .infinity, minHeight: 40)
            .background(tema.vidrio(1), in: .rect(cornerRadius: 12))
            .overlay { RoundedRectangle(cornerRadius: 12).strokeBorder(tema.borde, lineWidth: 1) }
    }
}
