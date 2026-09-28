import SwiftUI

/// Agrupar ejercicios consecutivos de una rutina en bloques con nombre y
/// color: "Entrada en calor", "Fuerza", "Potencia". Es el `group`/`groupColor`
/// de `lib/routines/routines.js` y el agrupamiento de `RoutineComposer.js` y
/// `RoutineScreen.js` en la web, puerto exacto.

/// Los siete colores de bloque de la web (`GROUP_COLORS` en
/// `RoutineComposer.js`), con los mismos valores hexadecimales que
/// `--d2-grp-*` en `app/design2.css`.
nonisolated enum GroupColor: String, CaseIterable, Identifiable, Sendable {
    case teal, amber, blue, purple, rose, emerald, indigo

    var id: String { rawValue }

    var color: Color {
        switch self {
        case .teal: Color(red: 0x10 / 255, green: 0xb9 / 255, blue: 0x81 / 255)
        case .amber: Color(red: 0xf5 / 255, green: 0x9e / 255, blue: 0x0b / 255)
        case .blue: Color(red: 0x38 / 255, green: 0xbd / 255, blue: 0xf8 / 255)
        case .purple: Color(red: 0xc0 / 255, green: 0x84 / 255, blue: 0xfc / 255)
        case .rose: Color(red: 0xfb / 255, green: 0x71 / 255, blue: 0x85 / 255)
        case .emerald: Color(red: 0x34 / 255, green: 0xd3 / 255, blue: 0x99 / 255)
        case .indigo: Color(red: 0x81 / 255, green: 0x8c / 255, blue: 0xf8 / 255)
        }
    }

    /// El mismo texto que `GROUP_COLORS` en la web, para el selector.
    var label: String {
        switch self {
        case .teal: "Verde azulado"
        case .amber: "Ámbar / Naranja"
        case .blue: "Celeste / Azul"
        case .purple: "Violeta"
        case .rose: "Rosa / Carmín"
        case .emerald: "Verde esmeralda"
        case .indigo: "Índigo"
        }
    }

    /// `groupColor` guarda `""` sin grupo y el id del color con grupo. Con
    /// nombre pero sin color explícito, la web cae en `teal`
    /// (`item.groupColor || (groupName ? "teal" : "")`): el mismo criterio acá.
    static func resuelto(_ id: String, nombre: String) -> GroupColor? {
        if let propio = GroupColor(rawValue: id) { return propio }
        return nombre.isEmpty ? nil : .teal
    }
}

/// Los seis atajos de `PRESET_GROUPS` en `RoutineComposer.js`. Son sólo punto
/// de partida: el nombre siempre se puede escribir a mano.
nonisolated struct GroupPreset: Identifiable, Sendable {
    let name: String
    let color: GroupColor

    var id: String { name }

    static let todos: [GroupPreset] = [
        GroupPreset(name: "Movilidad", color: .teal),
        GroupPreset(name: "Fuerza", color: .amber),
        GroupPreset(name: "Descanso", color: .blue),
        GroupPreset(name: "Calentamiento", color: .emerald),
        GroupPreset(name: "Core", color: .purple),
        GroupPreset(name: "Cardio", color: .rose),
    ]
}

/// Una tanda de ejercicios consecutivos con el mismo grupo. `color == nil` es
/// "sin grupo": esas tandas se muestran lisas, sin encabezado ni borde.
///
/// Sin exigir `Sendable` en `Item` a propósito: `WorkoutDraft.ExerciseDraft`
/// vive dentro de una clase `@Observable` y no lo es, y esto es puro cálculo
/// para una vista, no algo que cruce actores.
nonisolated struct RoutineSection<Item>: Identifiable {
    let id: String
    let nombreGrupo: String
    let color: GroupColor?
    let items: [Item]

    var agrupada: Bool { !nombreGrupo.isEmpty }
}

/// El agrupamiento consecutivo de `RoutineComposer.js` (`sections` useMemo) y
/// `RoutineScreen.js`: recorre la lista y corta una tanda nueva cada vez que
/// cambia el par (nombre, color). Dos bloques "Fuerza" separados por un
/// "Descanso" son dos tandas, no una: agrupar no reordena, sólo junta lo que
/// ya está consecutivo.
nonisolated enum RoutineGrouping {
    static func seccionar<Item>(
        _ items: [Item],
        grupo: (Item) -> String,
        colorID: (Item) -> String
    ) -> [RoutineSection<Item>] {
        guard !items.isEmpty else { return [] }

        var resultado: [RoutineSection<Item>] = []
        var actuales: [Item] = []
        var nombreActual = ""
        var colorActual: GroupColor?

        func cerrarTanda(hasta indice: Int) {
            guard !actuales.isEmpty else { return }
            let base = indice - actuales.count
            resultado.append(RoutineSection(
                id: "\(nombreActual.isEmpty ? "sin-grupo" : nombreActual)-\(base)",
                nombreGrupo: nombreActual,
                color: colorActual,
                items: actuales
            ))
            actuales = []
        }

        for (indice, item) in items.enumerated() {
            let nombre = grupo(item).trimmingCharacters(in: .whitespaces)
            let color = GroupColor.resuelto(colorID(item), nombre: nombre)

            if actuales.isEmpty || nombreActual != nombre || colorActual != color {
                cerrarTanda(hasta: indice)
                nombreActual = nombre
                colorActual = color
            }
            actuales.append(item)
        }
        cerrarTanda(hasta: items.count)

        return resultado
    }
}
