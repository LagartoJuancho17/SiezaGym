import SwiftUI

/// "Conocerte", la pantalla del user flow (paso 02): después del primer login,
/// tres pasos para saber qué buscás, cuánto entrenás y cuánto pesás, y con eso
/// estimar la meta semanal de calorías. Todo opcional: «Omitir» cierra sin
/// guardar nada. Se ve con los colores del tema, como el resto de la app.
struct ConocerteView: View {
    @Environment(\.tema) private var tema
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let store: GymStore
    let onTerminar: () -> Void

    @State private var recorrido = Conocerte.Recorrido()
    @State private var guardando = false
    @FocusState private var pesoEnFoco: Bool

    var body: some View {
        ZStack {
            tema.fondoPlano.ignoresSafeArea()

            VStack(alignment: .leading, spacing: 0) {
                encabezado
                ScrollView {
                    VStack(alignment: .leading, spacing: 0) {
                        titulo.padding(.top, 28)
                        contenido.padding(.top, 24)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .id(recorrido.paso)
                    .transition(.opacity.combined(with: .offset(x: 24)))
                }
                .scrollDismissesKeyboard(.interactively)
                controles.padding(.top, 12)
            }
            .padding(.horizontal, 24)
            .padding(.top, 12)
            .padding(.bottom, 18)
        }
        .foregroundStyle(tema.texto)
        .tecladoConBotonListo()
    }

    // MARK: - Encabezado

    private var encabezado: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                Text("Tu perfil")
                    .font(.system(size: 15, weight: .semibold))
                Spacer()
                Text("Paso \(recorrido.paso)/\(Conocerte.pasos)")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(tema.solido)
                    .monospacedDigit()
                Button("Omitir", action: onTerminar)
                    .font(.system(size: 14, weight: .medium))
                    .foregroundStyle(tema.texto2)
                    .frame(minHeight: 44)
                    .padding(.leading, 12)
                    .accessibilityHint("Entra a la app sin guardar estos datos")
            }
            HStack(spacing: 6) {
                ForEach(1...Conocerte.pasos, id: \.self) { paso in
                    Capsule()
                        .fill(paso <= recorrido.paso ? tema.solido : tema.texto3.opacity(0.35))
                        .frame(height: 4)
                }
            }
            .accessibilityHidden(true)
        }
    }

    // MARK: - Títulos

    private var titulo: some View {
        let (titulo, detalle): (String, String) = switch recorrido.paso {
        case 1: ("¿Qué buscás?", "Elegí tu objetivo principal. Lo podés cambiar cuando quieras en Tus datos.")
        case 2: ("¿Cuánto entrenás?", "Los días por semana que querés entrenar y tu experiencia.")
        default: ("Tu peso actual", "Con tu peso estimamos las calorías de cada sesión. Es opcional.")
        }
        return VStack(alignment: .leading, spacing: 10) {
            Text(titulo)
                .font(.system(size: 34, weight: .bold))
                .tracking(-1)
            Text(detalle)
                .font(.system(size: 15))
                .foregroundStyle(tema.texto2)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Contenido de cada paso

    @ViewBuilder private var contenido: some View {
        switch recorrido.paso {
        case 1: objetivos
        case 2: frecuencia
        default: peso
        }
    }

    private var objetivos: some View {
        VStack(spacing: 10) {
            ForEach(TrainingGoal.allCases, id: \.self) { objetivo in
                let activo = recorrido.objetivo == objetivo
                Button {
                    recorrido.objetivo = objetivo
                } label: {
                    HStack(spacing: 14) {
                        Image(systemName: objetivo.icono)
                            .font(.system(size: 17, weight: .medium))
                            .foregroundStyle(activo ? tema.sobreSolido : tema.solido)
                            .frame(width: 40, height: 40)
                            .background(activo ? tema.solido : tema.vidrio(2), in: .rect(cornerRadius: 12))
                        VStack(alignment: .leading, spacing: 3) {
                            Text(objetivo.label).font(.system(size: 16, weight: .semibold))
                            Text(objetivo.detalle).font(.system(size: 12)).foregroundStyle(tema.texto2)
                        }
                        Spacer(minLength: 8)
                        Image(systemName: activo ? "checkmark.circle.fill" : "circle")
                            .font(.system(size: 20))
                            .foregroundStyle(activo ? tema.solido : tema.texto3)
                    }
                    .padding(14)
                    .background(activo ? tema.solido.opacity(0.12) : tema.vidrio(1), in: .rect(cornerRadius: 18))
                    .overlay {
                        RoundedRectangle(cornerRadius: 18)
                            .strokeBorder(activo ? tema.solido : tema.borde, lineWidth: activo ? 1.5 : 1)
                    }
                    .contentShape(.rect)
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(activo ? [.isSelected] : [])
            }
        }
        .animation(.smooth(duration: 0.2), value: recorrido.objetivo)
    }

    private var frecuencia: some View {
        VStack(alignment: .leading, spacing: 22) {
            VStack(alignment: .leading, spacing: 10) {
                Text("Días por semana").font(.system(size: 12)).foregroundStyle(tema.texto2)
                HStack(spacing: 8) {
                    ForEach(Conocerte.diasPosibles, id: \.self) { dias in
                        let activo = recorrido.dias == dias
                        Button { recorrido.dias = dias } label: {
                            Text("\(dias)")
                                .font(.system(size: 22, weight: .semibold))
                                .monospacedDigit()
                                .foregroundStyle(activo ? tema.sobreSolido : tema.texto)
                                .frame(maxWidth: .infinity, minHeight: 60)
                                .background(activo ? tema.solido : tema.vidrio(1), in: .rect(cornerRadius: 16))
                                .overlay { RoundedRectangle(cornerRadius: 16).strokeBorder(activo ? .clear : tema.borde, lineWidth: 1) }
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel("\(dias) días por semana")
                        .accessibilityAddTraits(activo ? [.isSelected] : [])
                    }
                }
            }

            VStack(alignment: .leading, spacing: 10) {
                Text("Experiencia").font(.system(size: 12)).foregroundStyle(tema.texto2)
                HStack(spacing: 8) {
                    ForEach(ExperienceLevel.allCases, id: \.self) { nivel in
                        let activo = recorrido.nivel == nivel
                        Button { recorrido.nivel = activo ? nil : nivel } label: {
                            Text(nivel.label)
                                .font(.system(size: 14))
                                .foregroundStyle(activo ? tema.sobreSolido : tema.texto2)
                                .frame(maxWidth: .infinity, minHeight: 44)
                                .background(activo ? tema.solido : tema.vidrio(1), in: .capsule)
                                .overlay { Capsule().strokeBorder(activo ? .clear : tema.borde, lineWidth: 1) }
                        }
                        .buttonStyle(.plain)
                        .accessibilityAddTraits(activo ? [.isSelected] : [])
                    }
                }
            }

            if let meta = recorrido.meta {
                metaEstimada(meta)
            }
        }
        .animation(.smooth(duration: 0.2), value: recorrido.dias)
        .animation(.smooth(duration: 0.2), value: recorrido.nivel)
    }

    private var peso: some View {
        VStack(alignment: .leading, spacing: 20) {
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                TextField("", text: $recorrido.peso, prompt: Text("78,5").foregroundStyle(tema.texto3))
                    .keyboardType(.decimalPad)
                    .focused($pesoEnFoco)
                    .font(.system(size: 44, weight: .semibold))
                    .monospacedDigit()
                    .fixedSize()
                Text("kg").font(.system(size: 20)).foregroundStyle(tema.texto2)
            }
            .padding(.horizontal, 18)
            .frame(maxWidth: .infinity, minHeight: 84, alignment: .leading)
            .background(tema.vidrio(1), in: .rect(cornerRadius: 20))
            .overlay {
                RoundedRectangle(cornerRadius: 20)
                    .strokeBorder(recorrido.puedeSeguir ? tema.borde : tema.solido, lineWidth: 1)
            }
            .onTapGesture { pesoEnFoco = true }

            resumen
        }
    }

    /// El resumen de lo elegido, como en el user flow de la presentación.
    private var resumen: some View {
        GlassCard(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                VStack(alignment: .leading, spacing: 3) {
                    Text("Objetivo principal").font(.system(size: 11, weight: .semibold)).foregroundStyle(tema.solido)
                    Text(recorrido.objetivo?.label ?? "—").font(.system(size: 17, weight: .bold))
                }
                .padding(12)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(tema.solido.opacity(0.12), in: .rect(cornerRadius: 12))
                .overlay { RoundedRectangle(cornerRadius: 12).strokeBorder(tema.solido.opacity(0.45), lineWidth: 1) }

                HStack(spacing: 10) {
                    dato("Frecuencia", recorrido.dias.map { "\($0) días / sem" } ?? "—")
                    dato("Peso actual", recorrido.pesoKg.map { "\(BodyMetrics.numero($0)) kg" } ?? "—")
                }

                if let meta = recorrido.meta {
                    metaEstimada(meta)
                }
            }
        }
    }

    private func dato(_ rotulo: String, _ valor: String) -> some View {
        VStack(spacing: 3) {
            Text(rotulo).font(.system(size: 11)).foregroundStyle(tema.texto2)
            Text(valor).font(.system(size: 14, weight: .semibold)).monospacedDigit()
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 10)
        .background(tema.vidrio(2), in: .rect(cornerRadius: 12))
    }

    private func metaEstimada(_ meta: Int) -> some View {
        Text("Meta estimada: \(meta.formatted()) kcal por semana")
            .font(.system(size: 13, weight: .medium))
            .monospacedDigit()
            .foregroundStyle(tema.solido)
            .frame(maxWidth: .infinity, minHeight: 36)
            .background(tema.solido.opacity(0.16), in: .rect(cornerRadius: 12))
            .contentTransition(.numericText())
            .animation(.smooth(duration: 0.25), value: meta)
    }

    // MARK: - Controles

    private var controles: some View {
        HStack(spacing: 10) {
            if recorrido.paso > 1 {
                Button {
                    cambiar { recorrido.volver() }
                } label: {
                    Image(systemName: "arrow.left")
                        .font(.system(size: 17, weight: .semibold))
                        .frame(width: 58, height: 58)
                        .overlay { Circle().strokeBorder(tema.bordeFuerte, lineWidth: 1) }
                        .contentShape(.circle)
                }
                .buttonStyle(.plain)
                .accessibilityLabel("Volver")
            }

            Button {
                var siguiente = recorrido
                if siguiente.seguir() {
                    Task { await guardar() }
                } else {
                    cambiar { recorrido = siguiente }
                }
            } label: {
                Text(recorrido.esUltimo ? (guardando ? "Guardando…" : "Guardar y empezar") : "Continuar")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(recorrido.puedeSeguir ? tema.sobreSolido : tema.texto3)
                    .frame(maxWidth: .infinity, minHeight: 58)
                    .background(recorrido.puedeSeguir ? tema.solido : tema.vidrio(2), in: .capsule)
            }
            .buttonStyle(.plain)
            .disabled(!recorrido.puedeSeguir || guardando)
        }
    }

    private func cambiar(_ cambio: () -> Void) {
        withAnimation(reduceMotion ? nil : .smooth(duration: 0.3), cambio)
    }

    private func guardar() async {
        guardando = true
        defer { guardando = false }
        let campos = Conocerte.campos(
            objetivo: recorrido.objetivo, dias: recorrido.dias, nivel: recorrido.nivel, pesoKg: recorrido.pesoKg
        )
        if !campos.isEmpty { await store.updateProfile(campos) }
        onTerminar()
    }
}

#if DEBUG
#Preview("Conocerte") {
    ConocerteView(store: PreviewData.storeVacio()) {}
        .previewSieza()
}
#endif
