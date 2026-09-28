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
