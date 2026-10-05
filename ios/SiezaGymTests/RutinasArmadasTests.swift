import Foundation
import Testing
@testable import SiezaGym

@Suite("Rutinas armadas")
struct RutinasArmadasTests {
    @Test("vienen las diez en la app, con sus ejercicios en orden")
    func empaquetadas() {
        let rutinas = RutinasArmadas.cargar()
        #expect(rutinas.count == 10)
        #expect(rutinas.map(\.id).contains("upper-body"))
        let upper = rutinas.first { $0.id == "upper-body" }
        #expect(upper?.ejercicios.first?.exerciseID == "face-pull-en-polea")
        #expect(upper?.ejercicios.map(\.order) == Array(0..<(upper?.ejercicios.count ?? 0)))
        #expect(upper?.detalle == "Intermedio · 2 a 4 por semana")
        // Sin el ejercicio en el catálogo se muestra su nombre, no el id.
        if let upper, let primero = upper.ejercicios.first {
            #expect(upper.nombre(de: primero, catalogo: [:]) == "Face pull en polea")
        }
    }

    @Test("copiar deja afuera lo que no está en tu catálogo y respeta series, reps y bloques")
    func borradores() throws {
        let json = """
        {"rutinas":[{"id":"x","name":"X","exercises":[
          {"exerciseId":"sentadilla","targetSets":4,"targetReps":6,"targetRIR":2,"group":"Fuerza","groupColor":"amber"},
          {"exerciseId":"propio-de-otro","targetSets":3,"targetReps":10}
        ]}]}
        """
        let rutina = try #require(RutinasArmadas.leer(Data(json.utf8)).first)
        let catalogo = ["sentadilla": Exercise(id: "sentadilla", data: ["nameEs": "Sentadilla"])]
        let copia = rutina.borradores(catalogo: catalogo)
        #expect(copia.map(\.exerciseID) == ["sentadilla"])
        #expect(copia.first?.targetSets == 4 && copia.first?.targetReps == 6 && copia.first?.targetRIR == 2)
        #expect(copia.first?.group == "Fuerza" && copia.first?.groupColor == "amber")
        #expect(rutina.faltantes(catalogo: catalogo).map(\.exerciseID) == ["propio-de-otro"])
    }

    @Test("un JSON roto no rompe la pantalla: no hay rutinas")
    func roto() {
        #expect(RutinasArmadas.leer(Data("no".utf8)).isEmpty)
    }
}
