import Testing
@testable import SiezaGym

@Suite("Tus datos")
struct BodyMetricsTests {
    @Test("lee coma o punto, y vacío o cero no es un dato")
    func decimal() {
        #expect(BodyMetrics.decimal("78,5") == 78.5)
        #expect(BodyMetrics.decimal(" 78.5 ") == 78.5)
        #expect(BodyMetrics.decimal("") == nil)
        #expect(BodyMetrics.decimal("0") == nil)
        #expect(BodyMetrics.decimal("abc") == nil)
    }

    @Test("IMC con las categorías de la OMS")
    func imc() {
        #expect(BodyMetrics.imc(pesoKg: 78.5, alturaCm: 180) == .init(valor: 24.2, categoria: "Normal"))
        #expect(BodyMetrics.imc(pesoKg: 50, alturaCm: 175)?.categoria == "Bajo peso")
        #expect(BodyMetrics.imc(pesoKg: 90, alturaCm: 175)?.categoria == "Sobrepeso")
        #expect(BodyMetrics.imc(pesoKg: 110, alturaCm: 175)?.categoria == "Obesidad")
        // Sin un dato, o con valores que no son de una persona, no hay IMC.
        #expect(BodyMetrics.imc(pesoKg: nil, alturaCm: 180) == nil)
        #expect(BodyMetrics.imc(pesoKg: 78, alturaCm: 1.8) == nil)
    }

    @Test("el resumen del Perfil muestra lo que hay")
    func resumen() {
        #expect(BodyMetrics.resumen(pesoKg: 78.5, alturaCm: 180, nivel: "Intermedio") == "78,5 kg · 180 cm · Intermedio")
        #expect(BodyMetrics.resumen(pesoKg: nil, alturaCm: 172, nivel: nil) == "172 cm")
        #expect(BodyMetrics.resumen(pesoKg: nil, alturaCm: nil, nivel: nil) == "Completá peso, altura y experiencia")
    }
}
