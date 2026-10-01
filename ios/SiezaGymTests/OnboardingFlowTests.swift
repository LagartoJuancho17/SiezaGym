import Foundation
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

    @Test("el comando de p5 lleva la mancha de cada pantalla")
    func comandoP5() {
        #expect(
            ArteP5.comando(pagina: 0, sinMovimiento: false)
                == "window.sieza && window.sieza.mostrar({x: 0.68, y: 0.36, ancho: 0.95, alto: 0.42, quieto: false})"
        )
        #expect(ArteP5.comando(pagina: 2, sinMovimiento: true).hasSuffix("ancho: 1.15, alto: 0.5, quieto: true})"))
        let comandos = Set(OnboardingPage.allCases.map { ArteP5.comando(pagina: $0.rawValue, sinMovimiento: false) })
        #expect(comandos.count == 3)
    }

    @Test("el boceto de p5 viene adentro de la app, con su licencia")
    func bocetoEmpaquetado() throws {
        let html = try #require(ArteP5.urlBoceto())
        let carpeta = html.deletingLastPathComponent()
        for archivo in ["onboarding-arte.js", "p5.min.js", "p5-license.txt"] {
            #expect(FileManager.default.fileExists(atPath: carpeta.appending(path: archivo).path()), "\(archivo)")
        }
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
