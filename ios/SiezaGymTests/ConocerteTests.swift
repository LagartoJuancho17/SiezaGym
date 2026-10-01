import Testing
@testable import SiezaGym

@Suite("Conocerte")
struct ConocerteTests {
    @Test("la meta es MET × peso × horas × días, redondeada a 50")
    func meta() {
        // Hipertrofia: 1 h a MET 5. 78,5 kg × 4 días = 1570 → 1550.
        #expect(Conocerte.metaSemanal(objetivo: .hipertrofia, dias: 4, pesoKg: 78.5) == 1550)
        // Fuerza: 1,25 h. 80 kg × 3 días = 1500.
        #expect(Conocerte.metaSemanal(objetivo: .fuerza, dias: 3, pesoKg: 80) == 1500)
        // Sin peso usa el de por defecto (75 kg).
        #expect(Conocerte.metaSemanal(objetivo: .hipertrofia, dias: 2, pesoKg: nil) == 750)
        // Más días o más peso nunca bajan la meta.
        #expect(Conocerte.metaSemanal(objetivo: .salud, dias: 5, pesoKg: 70) > Conocerte.metaSemanal(objetivo: .salud, dias: 4, pesoKg: 70))
    }

    @Test("se muestra una vez y solo si al perfil le faltan los datos")
    func cuandoSeMuestra() {
        let vacio = UserProfile(id: "u", data: [:])
        let conPeso = UserProfile(id: "u", data: ["bodyWeightKg": 80.0])
        let conObjetivo = UserProfile(id: "u", data: ["trainingGoal": "fuerza"])
        #expect(Conocerte.debeMostrar(perfil: vacio, yaVisto: false))
        #expect(!Conocerte.debeMostrar(perfil: vacio, yaVisto: true))
        #expect(!Conocerte.debeMostrar(perfil: conPeso, yaVisto: false))
        #expect(!Conocerte.debeMostrar(perfil: conObjetivo, yaVisto: false))
        // Sin perfil cargado todavía, esperar.
        #expect(!Conocerte.debeMostrar(perfil: nil, yaVisto: false))
    }

    @Test("cada paso pide lo suyo y el último guarda")
    func pasos() {
        var r = Conocerte.Recorrido()
        let a1 = r.seguir(); #expect(!a1)
        #expect(r.paso == 1)
        r.objetivo = .hipertrofiaFuerza
        let a2 = r.seguir(); #expect(!a2)
        #expect(r.paso == 2)
        #expect(!r.puedeSeguir)
        r.dias = 4
        let a3 = r.seguir(); #expect(!a3)
        #expect(r.esUltimo)
        // El peso es opcional, pero si se escribe tiene que ser válido.
        r.peso = "abc"
        #expect(!r.puedeSeguir)
        r.peso = "78,5"
        let guarda = r.seguir(); #expect(guarda)
        r.volver()
        #expect(r.paso == 2)
    }

    @Test("guarda objetivo, días, nivel, peso y la meta calculada")
    func campos() {
        let campos = Conocerte.campos(objetivo: .hipertrofia, dias: 4, nivel: .intermedio, pesoKg: 78.5)
        #expect(campos["trainingGoal"] as? String == "hipertrofia")
        #expect(campos["trainingDaysPerWeek"] as? Int == 4)
        #expect(campos["experienceLevel"] as? String == "intermedio")
        #expect(campos["bodyWeightKg"] as? Double == 78.5)
        #expect(campos["weeklyCalorieGoalKcal"] as? Double == 1550)
        // Lo que no se eligió no se pisa.
        #expect(Conocerte.campos(objetivo: nil, dias: nil, nivel: nil, pesoKg: nil).isEmpty)
    }

    @Test("el perfil lee objetivo y días desde Firestore")
    func perfilLee() {
        let perfil = UserProfile(id: "u", data: ["trainingGoal": "perder_grasa", "trainingDaysPerWeek": 3])
        #expect(perfil.trainingGoal == .perderGrasa)
        #expect(perfil.trainingDaysPerWeek == 3)
    }
}
