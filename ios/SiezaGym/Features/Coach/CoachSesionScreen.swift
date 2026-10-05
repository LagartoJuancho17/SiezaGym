import SwiftUI

/// Un entrenamiento del alumno, serie por serie: peso × reps de cada una, las
/// falladas y los PR (series que batieron su mejor marca anterior).
struct CoachSesionScreen: View {
    @Environment(\.tema) private var tema
    let sesion: DetalleAlumno.Sesion
    let nombres: [String: String]

    private var prs: Int { sesion.exercises.reduce(0) { $0 + $1.sets.count(where: \.pr) } }

    var body: some View {
        Pantalla(
            titulo: sesion.routineName ?? "Entrenamiento libre",
            rotulo: sesion.finishedAt?.formatted(date: .complete, time: .shortened),
            volver: true
        ) {
            StatsCard(datos: [
                ("\(sesion.durationSeconds / 60)", "minutos"),
                ("\(sesion.totalSetsCompleted)", sesion.totalSetsCompleted == 1 ? "serie" : "series"),
                (ProgressMetrics.formatKg(sesion.totalVolumeKg), "volumen"),
            ])
            .padding(.top, 16)

            if prs > 0 {
                Label("\(prs) \(prs == 1 ? "récord personal" : "récords personales") en este entrenamiento", systemImage: "trophy.fill")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(tema.solido)
                    .padding(.top, 14)
            }

            VStack(spacing: 12) {
                ForEach(Array(sesion.exercises.enumerated()), id: \.offset) { _, ejercicio in
                    tarjeta(ejercicio)
                }
            }
            .padding(.top, 16)
        }
        .bottomNavInset()
    }

    private func tarjeta(_ ejercicio: DetalleAlumno.Sesion.Ejercicio) -> some View {
        GlassCard(padding: 16) {
            VStack(alignment: .leading, spacing: 10) {
                HStack(alignment: .firstTextBaseline) {
                    Text(nombres[ejercicio.exerciseId] ?? ejercicio.exerciseId)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(tema.texto)
                    Spacer(minLength: 8)
                    if ejercicio.hayPR {
                        Label("PR", systemImage: "trophy.fill")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(tema.sobreSolido)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(tema.solido, in: .capsule)
                    }
                }

                ForEach(Array(ejercicio.sets.enumerated()), id: \.offset) { indice, serie in
                    HStack(spacing: 10) {
                        Text("\(indice + 1)")
                            .font(.system(size: 12))
                            .monospacedDigit()
                            .foregroundStyle(tema.texto3)
                            .frame(width: 18, alignment: .leading)
                        Text(serie.texto)
                            .font(.system(size: 15, weight: serie.pr ? .semibold : .regular))
                            .monospacedDigit()
                            .foregroundStyle(serie.failed ? tema.texto3 : tema.texto)
                            .strikethrough(serie.failed)
                        Spacer(minLength: 8)
                        if serie.pr {
                            Image(systemName: "trophy.fill")
                                .font(.system(size: 12))
                                .foregroundStyle(tema.solido)
                                .accessibilityLabel("Récord personal")
                        } else if serie.failed {
                            Text("fallada").font(.system(size: 11)).foregroundStyle(tema.texto3)
                        }
                    }
                    .accessibilityElement(children: .combine)
                }

                if let nota = ejercicio.note, !nota.isEmpty {
                    Text("“\(nota)”")
                        .font(.system(size: 12))
                        .italic()
                        .foregroundStyle(tema.texto2)
                        .padding(.top, 2)
                }
            }
        }
    }
}

/// Todos los récords del alumno, cuando son más de los que entran en su ficha.
struct CoachRecordsScreen: View {
    @Environment(\.tema) private var tema
    let detalle: DetalleAlumno

    var body: some View {
        Pantalla(titulo: "Récords", rotulo: detalle.student.displayName, volver: true) {
            ListaRecords(records: detalle.records, detalle: detalle).padding(.top, 16)
        }
        .bottomNavInset()
    }
}

/// Una fila por ejercicio: el 1RM estimado (o las reps máximas) y la mejor serie.
struct ListaRecords: View {
    @Environment(\.tema) private var tema
    let records: [DetalleAlumno.Record]
    let detalle: DetalleAlumno

    var body: some View {
        PanelLista {
            ForEach(Array(records.enumerated()), id: \.element.id) { indice, record in
                if indice > 0 { Rectangle().fill(tema.borde).frame(height: 1) }
                FilaLista(
                    nombre: detalle.nombre(record.exerciseId),
                    detalle: record.detalle,
                    valor: record.valor.numero,
                    unidad: record.valor.unidad,
                    chevron: false
                )
            }
        }
    }
}
