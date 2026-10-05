import Foundation
import SwiftUI
import Testing
@testable import SiezaGym

/// Un ítem mínimo para probar el algoritmo sin depender de `RoutineDraftExercise`
/// ni `RoutineExercise`: sólo lo que `seccionar` necesita.
private struct Item: Equatable {
    let nombre: String
    var group = ""
    var groupColor = ""
}

@Suite("Agrupar ejercicios en bloques")
struct RoutineGroupingTests {
    private func seccionar(_ items: [Item]) -> [RoutineSection<Item>] {
        RoutineGrouping.seccionar(items, grupo: \.group, colorID: \.groupColor)
    }

    /// Igual que la web: dos ejercicios sueltos seguidos son "" y "" en nombre
    /// y color, así que se funden en una sola tanda sin agrupar. No cambia
    /// nada visible -- una tanda sin nombre no lleva encabezado igual --, pero
    /// el cálculo tiene que coincidir con `RoutineComposer.js`.
    @Test("ejercicios sueltos seguidos se funden en una sola tanda sin agrupar")
    func sinGrupos() {
        let secciones = seccionar([Item(nombre: "A"), Item(nombre: "B")])

        #expect(secciones.count == 1)
        #expect(secciones[0].agrupada == false)
        #expect(secciones[0].color == nil)
        #expect(secciones[0].items.map(\.nombre) == ["A", "B"])
    }

    @Test("ejercicios consecutivos con el mismo grupo forman una sola tanda")
    func consecutivosSeJuntan() {
        let secciones = seccionar([
            Item(nombre: "A", group: "Fuerza", groupColor: "amber"),
            Item(nombre: "B", group: "Fuerza", groupColor: "amber"),
            Item(nombre: "C", group: "Fuerza", groupColor: "amber"),
        ])

        #expect(secciones.count == 1)
        #expect(secciones[0].nombreGrupo == "Fuerza")
        #expect(secciones[0].color == .amber)
        #expect(secciones[0].items.map(\.nombre) == ["A", "B", "C"])
    }

    /// El caso del pedido: "Entrada en calor" (2), "Fuerza" (1), "Potencia" (2).
    @Test("tres bloques seguidos quedan en tres tandas en orden")
    func tresBloques() {
        let secciones = seccionar([
            Item(nombre: "1", group: "Entrada en calor", groupColor: "teal"),
            Item(nombre: "2", group: "Entrada en calor", groupColor: "teal"),
            Item(nombre: "3", group: "Fuerza", groupColor: "amber"),
            Item(nombre: "4", group: "Potencia", groupColor: "rose"),
            Item(nombre: "5", group: "Potencia", groupColor: "rose"),
        ])

        #expect(secciones.map(\.nombreGrupo) == ["Entrada en calor", "Fuerza", "Potencia"])
        #expect(secciones.map { $0.items.count } == [2, 1, 2])
    }

    /// Dos tandas "Fuerza" separadas por algo en el medio NO se juntan: el
    /// agrupamiento no reordena, sólo junta lo que ya está consecutivo.
    @Test("el mismo nombre no consecutivo son dos tandas distintas")
    func mismoNombreNoConsecutivo() {
        let secciones = seccionar([
            Item(nombre: "A", group: "Fuerza", groupColor: "amber"),
            Item(nombre: "B"),
            Item(nombre: "C", group: "Fuerza", groupColor: "amber"),
        ])

        #expect(secciones.count == 3)
        #expect(secciones[0].id != secciones[2].id)
    }

    @Test("agrupados y sueltos se intercalan en tandas separadas")
    func intercalados() {
        let secciones = seccionar([
            Item(nombre: "A"),
            Item(nombre: "B", group: "Fuerza", groupColor: "amber"),
            Item(nombre: "C"),
        ])

        #expect(secciones.count == 3)
        #expect(secciones[0].agrupada == false)
        #expect(secciones[1].agrupada)
        #expect(secciones[2].agrupada == false)
    }

    /// Con nombre pero sin color explícito, la web cae en "teal"
    /// (`item.groupColor || (groupName ? "teal" : "")`).
    @Test("nombre sin color explícito cae en teal")
    func sinColorCaeEnTeal() {
        let secciones = seccionar([Item(nombre: "A", group: "Fuerza", groupColor: "")])
        #expect(secciones[0].color == .teal)
    }

    /// Un espacio de más en el nombre no cuenta como un grupo distinto: es el
    /// mismo `.trim()` que hace la web antes de comparar.
    @Test("los espacios de más no rompen la fusión de tandas")
    func espaciosDeMas() {
        let secciones = seccionar([
            Item(nombre: "A", group: "Fuerza", groupColor: "amber"),
            Item(nombre: "B", group: "  Fuerza  ", groupColor: "amber"),
        ])
        #expect(secciones.count == 1)
    }

    @Test("distinto color con el mismo nombre corta la tanda")
    func mismoNombreDistintoColor() {
        let secciones = seccionar([
            Item(nombre: "A", group: "Fuerza", groupColor: "amber"),
            Item(nombre: "B", group: "Fuerza", groupColor: "blue"),
        ])
        #expect(secciones.count == 2)
    }

    @Test("una lista vacía no produce tandas")
    func listaVacia() {
        #expect(seccionar([]).isEmpty)
    }

    @Test("un id de color desconocido en los datos no rompe nada")
    func colorDesconocido() {
        let secciones = seccionar([Item(nombre: "A", group: "Fuerza", groupColor: "fucsia-inventado")])
        // No existe ese color: cae en el mismo teal por defecto que "sin color".
        #expect(secciones[0].color == .teal)
    }
}

@Suite("Colores y presets de grupo")
struct GroupColorTests {
    @Test("los siete colores tienen su propio hex, ninguno repetido")
    func coloresDistintos() {
        let hex = GroupColor.allCases.map { UIColorHexParaProbar($0.color) }
        #expect(Set(hex).count == GroupColor.allCases.count)
    }

    @Test("resuelto: sin nombre y sin color es sin grupo")
    func resueltoSinNada() {
        #expect(GroupColor.resuelto("", nombre: "") == nil)
    }

    @Test("resuelto: con nombre y sin color cae en teal")
    func resueltoConNombreSinColor() {
        #expect(GroupColor.resuelto("", nombre: "Fuerza") == .teal)
    }

    @Test("resuelto: con un id de color válido lo respeta")
    func resueltoConColorValido() {
        #expect(GroupColor.resuelto("rose", nombre: "Cardio") == .rose)
    }

    @Test("los seis presets son los mismos nombres y colores que PRESET_GROUPS en la web")
    func presetsWeb() {
        let esperados: [(String, GroupColor)] = [
            ("Movilidad", .teal), ("Fuerza", .amber), ("Descanso", .blue),
            ("Calentamiento", .emerald), ("Core", .purple), ("Cardio", .rose),
        ]
        #expect(GroupPreset.todos.map(\.name) == esperados.map(\.0))
        #expect(GroupPreset.todos.map(\.color) == esperados.map(\.1))
    }
}

/// Compara colores por sus componentes RGB, sin depender de un entorno gráfico.
private func UIColorHexParaProbar(_ color: Color) -> String {
    let resolved = color.resolve(in: .init())
    return "\(resolved.red)-\(resolved.green)-\(resolved.blue)"
}
