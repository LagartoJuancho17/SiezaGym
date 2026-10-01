import Testing
@testable import SiezaGym

@Suite("Bienvenida SIEZA")
struct OnboardingFlowTests {
    @Test("muestra exactamente tres escenas en orden")
    func pages() {
        #expect(OnboardingPage.allCases == [.routines, .workout, .progress])
        #expect(Set(OnboardingPage.allCases.map(\.headline)).count == 3)
        #expect(OnboardingPage.allCases.allSatisfy { !$0.headline.isEmpty && !$0.detail.isEmpty })
    }

    @Test("la mancha de color cae en otro lugar en cada pantalla")
    func manchaPorPagina() {
        let manchas = OnboardingPage.allCases.map { ArteOnboarding.mancha(pagina: $0.rawValue) }
        #expect(manchas[0] != manchas[1])
        #expect(manchas[1] != manchas[2])
        // Siempre adentro de la pantalla, para que se vea.
        for mancha in manchas {
            #expect((0...1).contains(mancha.centro.x))
            #expect((0...1).contains(mancha.centro.y))
        }
    }

    @Test("el grano sale igual en cada dibujo: la semilla es fija")
    func granoEstable() {
        var a = ArteOnboarding.Semilla(estado: 42)
        var b = ArteOnboarding.Semilla(estado: 42)
        #expect((0..<5).map { _ in a.next() } == (0..<5).map { _ in b.next() })
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
