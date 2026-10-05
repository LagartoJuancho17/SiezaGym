import Foundation

/// Una rutina que todavía no es tuya y se puede copiar a tus rutinas: una de
/// las armadas que trae la app, o una que alguien te compartió con un link.
/// Los ejercicios vienen con la misma forma que en Firestore, así se leen con
/// el mismo `RoutineExercise(order:data:)` que las rutinas propias.
nonisolated struct RutinaParaCopiar: Identifiable, Sendable, Hashable {
    let id: String
    let nombre: String
    let nota: String
    /// "Intermedio · 2 a 4 por semana", o quién la compartió.
    let detalle: String
    let ejercicios: [RoutineExercise]
    /// El nombre de cada ejercicio según quien la armó: se muestra si el
    /// ejercicio no está en tu catálogo, en vez del id.
    var nombres: [String: String] = [:]

    func nombre(de ejercicio: RoutineExercise, catalogo: [String: Exercise]) -> String {
        catalogo[ejercicio.exerciseID]?.nameEs ?? nombres[ejercicio.exerciseID] ?? ejercicio.exerciseID
    }

    /// Lo que se guarda al copiarla. Deja afuera los ejercicios que no están en
    /// tu catálogo (por ejemplo, uno propio de quien la compartió): guardarlos
    /// dejaría una fila con un id que nadie puede mostrar.
    func borradores(catalogo: [String: Exercise]) -> [RoutineDraftExercise] {
        ejercicios
            .filter { catalogo.isEmpty || catalogo[$0.exerciseID] != nil }
            .map(RoutineDraftExercise.init)
    }

    /// Los ejercicios que no se van a copiar, para avisarlo antes.
    func faltantes(catalogo: [String: Exercise]) -> [RoutineExercise] {
        guard !catalogo.isEmpty else { return [] }
        return ejercicios.filter { catalogo[$0.exerciseID] == nil }
    }

    /// Arma los ejercicios desde la lista cruda (JSON o Firestore).
    static func ejercicios(de crudos: [[String: Any]]) -> [RoutineExercise] {
        crudos.enumerated()
            .map { RoutineExercise(order: $0.offset, data: $0.element) }
            .sorted { $0.order < $1.order }
    }
}

/// Las diez rutinas armadas que trae la app (upper, lower, full body, push,
/// pull...). Viven en `Resources/RutinasArmadas/rutinas-armadas.json`;
/// `tests/routine-templates.test.js` comprueba que cada ejercicio exista en el
/// catálogo.
nonisolated enum RutinasArmadas {
    static func cargar(bundle: Bundle = .main) -> [RutinaParaCopiar] {
        guard let url = bundle.url(forResource: "rutinas-armadas", withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return [] }
        return leer(data)
    }

    static func leer(_ data: Data) -> [RutinaParaCopiar] {
        guard let raiz = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let rutinas = raiz["rutinas"] as? [[String: Any]] else { return [] }
        return rutinas.compactMap { rutina in
            guard let id = rutina["id"] as? String, let nombre = rutina["name"] as? String else { return nil }
            let nivel = (rutina["nivel"] as? String).map { $0.prefix(1).uppercased() + $0.dropFirst() }
            let detalle = [nivel, rutina["dias"] as? String].compactMap { $0 }.joined(separator: " · ")
            let crudos = rutina["exercises"] as? [[String: Any]] ?? []
            var nombres: [String: String] = [:]
            for crudo in crudos {
                if let id = crudo["exerciseId"] as? String, let nombre = crudo["nombre"] as? String { nombres[id] = nombre }
            }
            return RutinaParaCopiar(
                id: id,
                nombre: nombre,
                nota: rutina["descripcion"] as? String ?? "",
                detalle: detalle,
                ejercicios: RutinaParaCopiar.ejercicios(de: crudos),
                nombres: nombres
            )
        }
    }
}
