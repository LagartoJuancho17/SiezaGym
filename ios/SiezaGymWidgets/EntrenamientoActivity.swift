import ActivityKit
import SwiftUI
import WidgetKit

/// El entrenamiento en curso: pantalla bloqueada y Dynamic Island.
///
/// El cronómetro es `Text(timerInterval:)` y no un valor que la app manda: así
/// lo corre el sistema cada segundo sin despertar la app ni gastar batería.
struct EntrenamientoActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WorkoutActivityAttributes.self) { contexto in
            PantallaBloqueada(contexto: contexto)
                .activityBackgroundTint(Theme.conId(contexto.attributes.themeID).fondoPlano)
                .activitySystemActionForegroundColor(Theme.conId(contexto.attributes.themeID).texto)
        } dynamicIsland: { contexto in
            // La isla siempre se dibuja sobre negro: los colores del tema no
            // valen acá (el sólido de Plata es casi negro y desaparece). Va en
            // blanco, como el resto de las actividades del sistema.
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    // La región es angosta: sin ancho fijo el cronómetro se
                    // corta en "0:…" apenas pasa del minuto.
                    reloj(desde: contexto.attributes.startedAt, tamanio: 15)
                        .frame(width: 66, alignment: .leading)
                        .padding(.leading, 4)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("\(contexto.state.completedSets)/\(contexto.state.totalSets)")
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .monospacedDigit()
                        .padding(.trailing, 4)
                }
                DynamicIslandExpandedRegion(.center) {
                    Text(contexto.state.exerciseName ?? contexto.attributes.routineName)
                        .font(.system(size: 13, weight: .semibold))
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 6) {
                        Barra(relleno: .white, fondo: .white.opacity(0.22), progreso: contexto.state.progress)
                        HStack {
                            Text(contexto.state.setLabel)
                            Spacer()
                            Text("\(Int(contexto.state.volumeKg).formatted()) kg")
                        }
                        .font(.system(size: 11))
                        .foregroundStyle(.white.opacity(0.65))
                    }
                    .padding(.horizontal, 4)
                }
            } compactLeading: {
                Image(systemName: "dumbbell.fill").foregroundStyle(.white)
            } compactTrailing: {
                reloj(desde: contexto.attributes.startedAt, tamanio: 13)
                    .frame(maxWidth: 52)
            } minimal: {
                Image(systemName: "dumbbell.fill").foregroundStyle(.white)
            }
        }
    }
}

private struct PantallaBloqueada: View {
    let contexto: ActivityViewContext<WorkoutActivityAttributes>

    private var tema: Theme { Theme.conId(contexto.attributes.themeID) }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .firstTextBaseline) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(contexto.attributes.routineName.uppercased())
                        .font(.system(size: 9, weight: .bold))
                        .tracking(1.2)
                        .foregroundStyle(tema.solido)
                        .lineLimit(1)
                    Text(contexto.state.exerciseName ?? "Entrenamiento terminado")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(tema.texto)
                        .lineLimit(1)
                }
                Spacer()
                reloj(desde: contexto.attributes.startedAt, tamanio: 22)
                    .foregroundStyle(tema.texto)
            }

            Barra(
                relleno: tema.solido,
                fondo: tema.plano ? tema.bordeFuerte : Color.white.opacity(tema.glass2),
                progreso: contexto.state.progress
            )

            HStack {
                Text(contexto.state.setLabel)
                Spacer()
                Text("\(contexto.state.completedSets) de \(contexto.state.totalSets) series")
                Spacer()
                Text("\(Int(contexto.state.volumeKg).formatted()) kg")
            }
            .font(.system(size: 11))
            .foregroundStyle(tema.texto2)

            if contexto.state.exerciseName != nil {
                Button(intent: TerminarSerieIntent()) {
                    HStack(spacing: 6) {
                        Image(systemName: "checkmark.circle.fill")
                        Text("Terminar serie")
                    }
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(tema.sobreSolido)
                    .frame(maxWidth: .infinity, minHeight: 32)
                    .background(tema.solido, in: .capsule)
                }
                .buttonStyle(.plain)
                .padding(.top, 2)
            }
        }
        .padding(16)
    }
}

private struct Barra: View {
    let relleno: Color
    let fondo: Color
    let progreso: Double

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                Capsule().fill(fondo)
                Capsule().fill(relleno).frame(width: geo.size.width * progreso)
            }
        }
        .frame(height: 5)
        .accessibilityLabel("\(Int(progreso * 100))% de las series")
    }
}

/// El cronómetro lo corre el sistema: la app solo dice cuándo arrancó.
private func reloj(desde inicio: Date, tamanio: CGFloat) -> some View {
    Text(timerInterval: inicio...Date.distantFuture, countsDown: false)
        .font(.system(size: tamanio, weight: .bold, design: .rounded))
        .monospacedDigit()
        .foregroundStyle(.white)
        .lineLimit(1)
        .minimumScaleFactor(0.6)
}
