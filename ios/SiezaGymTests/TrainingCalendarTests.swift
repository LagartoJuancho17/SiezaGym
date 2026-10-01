import Foundation
import Testing
@testable import SiezaGym

@Suite("Calendario de entrenamiento")
struct TrainingCalendarTests {
    /// Mediodía en Argentina, para que ningún corrimiento de zona cambie el día.
    private func date(_ iso: String) -> Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        formatter.timeZone = TrainingCalendar.timeZone
        return formatter.date(from: "\(iso) 12:00")!
    }

    @Test("la clave del día es la del horario argentino")
    func dayKey() {
        #expect(TrainingCalendar.dayKey(date("2026-09-06")) == "2026-09-06")
    }

    @Test("las 22 de Buenos Aires siguen siendo el mismo día, no el siguiente en UTC")
    func lateNightStaysSameDay() {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        formatter.timeZone = TrainingCalendar.timeZone
        let lateNight = formatter.date(from: "2026-09-06 22:30")!
        #expect(TrainingCalendar.dayKey(lateNight) == "2026-09-06")
    }

    @Test("el lunes es el índice 0 y el domingo el 6")
    func weekdayIndex() {
        // 2026-09-07 es lunes.
        #expect(TrainingCalendar.weekdayIndex(date("2026-09-07")) == 0)
        #expect(TrainingCalendar.weekdayIndex(date("2026-09-13")) == 6)
    }

    @Test("la semana del mes corta de a siete días", arguments: [
        (1, 1), (7, 1), (8, 2), (14, 2), (28, 4), (31, 5),
    ])
    func weekOfMonth(day: Int, expected: Int) {
        #expect(TrainingCalendar.weekOfMonth(day: day) == expected)
    }

    @Test("el mes se escribe en español")
    func monthLabel() {
        #expect(TrainingCalendar.monthLabel(year: 2026, month: 9) == "Septiembre 2026")
    }

    @Test("días consecutivos suman racha")
    func streak() {
        let today = date("2026-09-06")
        let keys: Set<String> = ["2026-09-06", "2026-09-05", "2026-09-04"]
        #expect(TrainingCalendar.streak(trainedDayKeys: keys, now: today) == 3)
    }

    @Test("la racha sobrevive el día que todavía no entrenaste")
    func streakSurvivesToday() {
        // Hoy no hay entrenamiento, pero ayer y anteayer sí: la racha vive
        // hasta la medianoche siguiente.
        let today = date("2026-09-06")
        let keys: Set<String> = ["2026-09-05", "2026-09-04"]
        #expect(TrainingCalendar.streak(trainedDayKeys: keys, now: today) == 2)
    }

    @Test("un hueco corta la racha")
    func streakBreaksOnGap() {
        let today = date("2026-09-06")
        let keys: Set<String> = ["2026-09-06", "2026-09-04", "2026-09-03"]
        #expect(TrainingCalendar.streak(trainedDayKeys: keys, now: today) == 1)
    }

    @Test("sin entrenamientos la racha es cero")
    func noStreak() {
        #expect(TrainingCalendar.streak(trainedDayKeys: [], now: date("2026-09-06")) == 0)
    }

    /// El caso del pedido: 24 de septiembre es semana 4.
    @Test("la semana de una fecha junta año, mes y semana del mes")
    func semanaDeUnaFecha() {
        let semana = TrainingCalendar.semana(de: date("2026-09-24"))

        #expect(semana.anio == 2026)
        #expect(semana.mes == 9)
        #expect(semana.numero == 4)
        #expect(semana.texto == "Septiembre · Semana 4")
        #expect(semana.clave == "2026-09-4")
    }

    @Test("el primer día del mes es semana 1")
    func primerDiaEsSemanaUno() {
        #expect(TrainingCalendar.semana(de: date("2026-09-01")).numero == 1)
    }

    /// Dos fechas de meses o años distintos no pueden compartir clave, aunque
    /// caigan en la misma semana del mes: si no, asignar en septiembre de 2026
    /// mostraría también lo asignado en septiembre de 2025.
    @Test("la clave distingue mes y año, no sólo el número de semana")
    func claveDistingueMesYAnio() {
        let sept2026 = TrainingCalendar.semana(de: date("2026-09-06"))
        let oct2026 = TrainingCalendar.semana(de: date("2026-10-06"))
        #expect(sept2026.numero == oct2026.numero)
        #expect(sept2026.clave != oct2026.clave)
    }

    /// La semana es por bloques de 7 días del mes, igual que `weekOfMonth`:
    /// el 2 y el 5 caen en el bloque 1-7, aunque no sean el mismo lunes-a-domingo.
    @Test("dos fechas del mismo bloque de siete días dan la misma clave")
    func mismoBloqueMismaClave() {
        let dia2 = TrainingCalendar.semana(de: date("2026-09-02"))
        let dia5 = TrainingCalendar.semana(de: date("2026-09-05"))
        #expect(dia2.clave == dia5.clave)
    }
}

@Suite("Secciones de Rutinas por semana")
struct SeccionesPorSemanaTests {
    private struct Item: Equatable {
        let nombre: String
        var fecha: Date?
    }

    private func date(_ iso: String) -> Date {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm"
        formatter.timeZone = TrainingCalendar.timeZone
        return formatter.date(from: "\(iso) 12:00")!
    }

    private func seccionar(_ items: [Item]) -> [TrainingCalendar.SeccionSemana<Item>] {
        TrainingCalendar.seccionesPorSemana(items, fechaDe: \.fecha)
    }

    /// El caso del pedido: una rutina del 24/9 cae en "Septiembre · Semana 4".
    @Test("una rutina entra en la sección de su semana")
    func unaRutina() {
        let secciones = seccionar([Item(nombre: "Full body", fecha: date("2026-09-24"))])
        #expect(secciones.map(\.texto) == ["Septiembre · Semana 4"])
        #expect(secciones[0].items.map(\.nombre) == ["Full body"])
    }

    @Test("los meses van del más nuevo al más viejo")
    func mesesDescendente() {
        let secciones = seccionar([
            Item(nombre: "Vieja", fecha: date("2026-08-05")),
            Item(nombre: "Nueva", fecha: date("2026-09-05")),
        ])
        #expect(secciones.map(\.texto) == ["Septiembre · Semana 1", "Agosto · Semana 1"])
    }

    @Test("dentro de un mes las semanas van de la 1 en adelante")
    func semanasAscendente() {
        let secciones = seccionar([
            Item(nombre: "Tardía", fecha: date("2026-09-24")),
            Item(nombre: "Temprana", fecha: date("2026-09-02")),
        ])
        #expect(secciones.map(\.texto) == ["Septiembre · Semana 1", "Septiembre · Semana 4"])
    }

    @Test("dos rutinas de la misma semana quedan juntas")
    func mismaSemanaJuntas() {
        let secciones = seccionar([
            Item(nombre: "A", fecha: date("2026-09-02")),
            Item(nombre: "B", fecha: date("2026-09-05")),
        ])
        #expect(secciones.count == 1)
        #expect(secciones[0].items.map(\.nombre) == ["A", "B"])
    }

    /// Sin fecha no puede desaparecer de la pantalla sin aviso: mismo criterio
    /// que `itemsWithoutDate` en la web.
    @Test("sin fecha va en una sección aparte al final")
    func sinFechaAlFinal() {
        let secciones = seccionar([
            Item(nombre: "Con fecha", fecha: date("2026-09-24")),
            Item(nombre: "Sin fecha", fecha: nil),
        ])
        #expect(secciones.last?.texto == "Sin fecha")
        #expect(secciones.last?.items.map(\.nombre) == ["Sin fecha"])
    }

    @Test("una lista vacía no produce secciones")
    func listaVacia() {
        #expect(seccionar([]).isEmpty)
    }
}

@Suite("Rutinas de la semana")
struct DelaSemanaTests {
    private struct Item: Equatable {
        let nombre: String
        var clave: String?
    }

    @Test("sólo pasan las que tienen exactamente esa clave")
    func filtraPorClave() {
        let items = [
            Item(nombre: "A", clave: "2026-09-4"),
            Item(nombre: "B", clave: "2026-09-3"),
            Item(nombre: "C", clave: "2026-09-4"),
        ]
        let resultado = TrainingCalendar.delaSemana(items, clave: "2026-09-4", claveDe: \.clave)
        #expect(resultado.map(\.nombre) == ["A", "C"])
    }

    @Test("sin clave asignada no entra en ninguna semana")
    func sinClaveNoEntra() {
        let items = [Item(nombre: "A", clave: nil)]
        #expect(TrainingCalendar.delaSemana(items, clave: "2026-09-4", claveDe: \.clave).isEmpty)
    }

    @Test("una lista vacía no rompe nada")
    func listaVacia() {
        #expect(TrainingCalendar.delaSemana([Item](), clave: "2026-09-4", claveDe: \.clave).isEmpty)
    }
}

@Suite("Decodificar la semana de una rutina")
struct RoutineWeekKeyDecodeTests {
    @Test("con weekKey en el documento, se decodifica")
    func conWeekKey() {
        let rutina = Routine(id: "r1", data: ["ownerId": "u1", "weekKey": "2026-09-4"])
        #expect(rutina.weekKey == "2026-09-4")
    }

    @Test("sin weekKey en el documento, es nil y no explota")
    func sinWeekKey() {
        let rutina = Routine(id: "r1", data: ["ownerId": "u1"])
        #expect(rutina.weekKey == nil)
    }

    @Test("una rutina asignada por el coach también puede decodificar weekKey")
    func rutinaAsignada() {
        let rutina = Routine(id: "r1", data: ["studentId": "u1", "weekKey": "2026-09-1"], isAssigned: true)
        #expect(rutina.weekKey == "2026-09-1")
    }
}

@Suite("Resumen de rutina")
struct RoutineSummaryTests {
    private func routine(_ exercises: [RoutineExercise]) -> Routine {
        Routine(
            id: "r1", ownerID: "u1", name: "Test", note: "",
            exercises: exercises, showOnHome: true,
            lastUsedAt: nil, createdAt: nil, updatedAt: nil, isAssigned: false, weekKey: nil
        )
    }

    private func item(_ id: String, sets: Int, reps: Int = 10) -> RoutineExercise {
        RoutineExercise(
            exerciseID: id, source: .catalog, order: 0,
            targetSets: sets, targetReps: reps, targetRIR: nil,
            targetWeight: nil, techniqueNote: "", sets: nil, group: "", groupColor: ""
        )
    }

    private func exercise(_ id: String, muscles: [MuscleGroup: Double], time: Bool = false) -> Exercise {
        Exercise(
            id: id, nameEs: id, nameEn: id, equipment: nil, pattern: nil,
            muscleWeights: muscles,
            registrationType: time ? .tiempo : .pesoReps,
            unilateral: false, descriptionEs: "", mediaURL: nil, source: .catalog, videoURL: nil
        )
    }

    @Test("suma las series objetivo")
    func totalSets() {
        #expect(routine([item("a", sets: 3), item("b", sets: 4)]).totalSets == 7)
    }

    @Test("estima la duración con 40s de trabajo y 75s de descanso")
    func duration() {
        // 3 series × (40 + 75) = 345 s = 5.75 min -> 6.
        let minutes = RoutineSummary.estimatedMinutes(routine([item("a", sets: 3)]), catalog: [:])
        #expect(minutes == 6)
    }

    @Test("en un ejercicio de tiempo, targetReps son segundos de trabajo")
    func timeBasedDuration() {
        let catalog = ["plancha": exercise("plancha", muscles: [.abdomen: 1], time: true)]
        // 2 series × (60 + 75) = 270 s = 4.5 min -> 5 (redondeo hacia arriba).
        let minutes = RoutineSummary.estimatedMinutes(
            routine([item("plancha", sets: 2, reps: 60)]),
            catalog: catalog
        )
        #expect(minutes == 5)
    }

    @Test("el reparto muscular normaliza a 1")
    func muscleDistribution() {
        let catalog = [
            "press": exercise("press", muscles: [.pecho: 0.6, .triceps: 0.4]),
            "remo": exercise("remo", muscles: [.dorsal: 1]),
        ]
        let shares = RoutineSummary.muscleDistribution(
            routine([item("press", sets: 3), item("remo", sets: 3)]),
            catalog: catalog
        )
        #expect(abs(shares.reduce(0) { $0 + $1.pct } - 1) < 0.001)
        #expect(shares.first?.muscle == .dorsal)
    }

    @Test("una rutina sin ejercicios del catálogo no reparte nada")
    func unknownCatalog() {
        #expect(RoutineSummary.muscleDistribution(routine([item("x", sets: 3)]), catalog: [:]).isEmpty)
    }
}
