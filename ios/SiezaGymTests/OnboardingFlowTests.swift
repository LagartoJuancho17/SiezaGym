import Testing
@testable import SiezaGym

@Suite("Bienvenida SIEZA")
struct OnboardingFlowTests {
    @Test("muestra exactamente tres escenas en orden")
    func pages() {
        #expect(OnboardingPage.allCases == [.routines, .workout, .progress])
        #expect(Set(OnboardingPage.allCases.map(\.imageName)).count == 3)
        #expect(OnboardingPage.allCases.allSatisfy { !$0.headline.isEmpty && !$0.detail.isEmpty })
    }

    @Test("las fotos se tiñen de negro a Brasa y naranja, sin saltos")
    func tonoMarca() {
        let negro = TonoMarca.tono(luz: 0)
        #expect(negro.r < 0.05 && negro.g < 0.05 && negro.b < 0.05)
        // El medio tono es exactamente Brasa #FF3201.
        let medio = TonoMarca.tono(luz: 0.5)
        #expect(medio.r == 1 && abs(medio.g - 50.0 / 255) < 1e-9 && abs(medio.b - 1.0 / 255) < 1e-9)
        // Más luz en la foto nunca da un color más oscuro.
        let luces = stride(from: 0.0, through: 1.0, by: 0.01).map { luz in
            let c = TonoMarca.tono(luz: luz)
            return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b
        }
        #expect(zip(luces, luces.dropFirst()).allSatisfy { $0 <= $1 })
        // Fuera de rango se queda en los extremos.
        #expect(TonoMarca.tono(luz: -1) == negro)
        #expect(TonoMarca.tono(luz: 2) == TonoMarca.tono(luz: 1))
    }

    @Test("avanza de a una y solo termina al continuar desde la tercera")
    func advance() {
        var flow = OnboardingFlow()
        #expect(flow.page == .routines)
        #expect(!flow.canGoBack)
        let finishedFirst = flow.advance()
        #expect(!finishedFirst)
        #expect(flow.page == .workout)
        let finishedSecond = flow.advance()
        #expect(!finishedSecond)
        #expect(flow.page == .progress)
        #expect(flow.isLastPage)
        let finishedThird = flow.advance()
        #expect(finishedThird)
        #expect(flow.page == .progress)
    }

    @Test("volver desde la primera no sale del recorrido")
    func back() {
        var flow = OnboardingFlow()
        flow.goBack()
        #expect(flow.page == .routines)
        _ = flow.advance()
        flow.goBack()
        #expect(flow.page == .routines)
    }
}
