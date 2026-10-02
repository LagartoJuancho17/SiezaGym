import Testing
@testable import SiezaGym

/// Los previews de Xcode dependen de estos datos. Si una rutina apunta a un
/// ejercicio que no está en el catálogo, el canvas muestra el id pelado en vez
/// del nombre y nadie se entera hasta abrirlo.
@MainActor
@Suite("Datos de los previews")
struct PreviewDataTests {
    @Test func cadaEjercicioDeLasRutinasEstaEnElCatalogo() {
        for rutina in PreviewData.routines {
            for item in rutina.exercises {
                #expect(PreviewData.catalog[item.exerciseID] != nil, "\(rutina.name): falta \(item.exerciseID)")
            }
        }
    }

    @Test func cadaEjercicioDeLasSesionesEstaEnElCatalogo() {
        for sesion in PreviewData.sessions {
            for ejercicio in sesion.exercises {
                #expect(PreviewData.catalog[ejercicio.exerciseID] != nil)
            }
        }
    }

    @Test func elStoreArrancaCargadoYConRacha() {
        let store = PreviewData.store()
        #expect(store.hasLoaded)
        #expect(store.routines.count == 4)
        #expect(store.routines.contains { $0.isAssigned })
        #expect(store.streak == 3)
    }

    @Test func cargarNoBorraLosDatosNiVaAFirestore() async {
        let store = PreviewData.store()
        await store.load()
        #expect(store.routines.count == 4)
        #expect(store.loadError == nil)
    }

    @Test func elStoreVacioMuestraLosEstadosVacios() {
        let store = PreviewData.storeVacio()
        #expect(store.routines.isEmpty)
        #expect(store.sessions.isEmpty)
        #expect(store.hasLoaded)
    }
}
