#if DEBUG
import FirebaseCore
import SwiftUI

/// Datos de ejemplo para los previews de Xcode: permiten ver y retocar cada
/// pantalla en el canvas (⌥⌘↩) sin compilar, instalar ni iniciar sesión.
///
/// Se arman con los mismos inits `(id:data:)` que usa Firestore, así lo que se
/// ve en el preview pasa por el mismo camino que los datos reales. Las fechas
/// son relativas a hoy para que la racha, "esta semana" y el calendario tengan
/// contenido siempre, no solo el día en que se escribió esto.
enum PreviewData {
    static let uid = "preview"

    // MARK: - Catálogo

    static let catalog: [String: Exercise] = Dictionary(
        uniqueKeysWithValues: [
            ejercicio("press-banca", "Press de banca", .barra, .empujeHorizontal, ["pecho": 0.6, "triceps": 0.25, "deltoideAnterior": 0.15], gif: "0025-EIeI8Vf.gif"),
            ejercicio("remo-barra", "Remo con barra", .barra, .traccionHorizontal, ["dorsal": 0.5, "espaldaAltaTrapecio": 0.3, "biceps": 0.2], gif: "0027-eZyBC3j.gif"),
            ejercicio("sentadilla", "Sentadilla con barra", .barra, .dominanteRodilla, ["cuadriceps": 0.6, "gluteo": 0.3, "aductores": 0.1], gif: "0043-qXTaZnJ.gif"),
            ejercicio("peso-muerto-rumano", "Peso muerto rumano", .barra, .dominanteCadera, ["isquiotibiales": 0.55, "gluteo": 0.35, "lumbar": 0.1], gif: "0085-wQ2c4XD.gif"),
            ejercicio("press-militar", "Press militar con mancuernas", .mancuerna, .empujeVertical, ["deltoideAnterior": 0.6, "deltoideLateral": 0.2, "triceps": 0.2]),
            ejercicio("dominadas", "Dominadas", .pesoCorporal, .traccionVertical, ["dorsal": 0.65, "biceps": 0.35], tipo: .reps, gif: "0652-lBDjFxJ.gif"),
            ejercicio("curl-biceps", "Curl de bíceps con mancuernas", .mancuerna, .aislamiento, ["biceps": 0.85, "antebrazo": 0.15]),
            // Un ejercicio propio con video de YouTube: el preview de la hoja
            // de técnica muestra el reproductor embebido.
            Exercise(id: "custom-video", data: [
                "nameEs": "Face pull con banda",
                "equipment": Equipment.banda.rawValue,
                "pattern": MovementPattern.traccionHorizontal.rawValue,
                "registrationType": RegistrationType.pesoReps.rawValue,
                "muscleWeights": ["deltoidePosterior": 0.6, "espaldaAltaTrapecio": 0.4],
                "videoUrl": "https://www.youtube.com/watch?v=SZC3B7vEjV0",
            ], source: .custom),
            ejercicio("plancha", "Plancha abdominal", .pesoCorporal, .core, ["abdomen": 0.8, "lumbar": 0.2], tipo: .tiempo),
        ].map { ($0.id, $0) }
    )

    private static func ejercicio(
        _ id: String,
        _ nombre: String,
        _ equipo: Equipment,
        _ patron: MovementPattern,
        _ musculos: [String: Double],
        tipo: RegistrationType = .pesoReps,
        gif: String? = nil
    ) -> Exercise {
        var data: [String: Any] = [
            "nameEs": nombre,
            "equipment": equipo.rawValue,
            "pattern": patron.rawValue,
            "registrationType": tipo.rawValue,
            "muscleWeights": musculos.filter { $0.value > 0 },
            "descriptionEs": "Descripción de ejemplo para ver cómo queda el texto largo de técnica en la pantalla.",
        ]
        // Los mismos GIF públicos que carga el catálogo real
        // (scripts/seed/media-map.mjs): el preview los muestra animados.
        if let gif { data["mediaUrl"] = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/\(gif)" }
        return Exercise(id: id, data: data)
    }

    // MARK: - Perfil

    static let profile = UserProfile(id: uid, data: [
        "email": "atleta@ejemplo.com",
        "displayName": "Tobias",
        "sex": "masculino",
        "bodyWeightKg": 78,
        "heightCm": 180,
        "weeklyCalorieGoalKcal": 2500,
        "experienceLevel": "intermedio",
    ])

    // MARK: - Rutinas

    static let routines: [Routine] = [
        Routine(id: "r-empuje", data: [
            "ownerId": uid,
            "name": "Empuje · Pecho y hombro",
            "note": "Calentar bien el hombro antes del press.",
            "showOnHome": true,
            "createdAt": dias(-3),
            "lastUsedAt": dias(-1),
            "exercises": [
                item("press-banca", sets: 4, reps: 8, peso: 70, grupo: "Fuerza", color: "amber", nota: "Pausa de 1 segundo en el pecho"),
                item("press-militar", sets: 3, reps: 10, peso: 20, grupo: "Fuerza", color: "amber"),
                item("curl-biceps", sets: 3, reps: 12, peso: 12, grupo: "Accesorios", color: "purple"),
                item("custom-video", sets: 3, reps: 15, grupo: "Accesorios", color: "purple"),
                item("plancha", sets: 3, reps: 45, grupo: "Core", color: "rose"),
            ],
        ]),
        Routine(id: "r-tiron", data: [
            "ownerId": uid,
            "name": "Tirón · Espalda",
            "createdAt": dias(-10),
            "lastUsedAt": dias(-2),
            "exercises": [
                item("dominadas", sets: 4, reps: 8),
                item("remo-barra", sets: 4, reps: 10, peso: 60),
                item("curl-biceps", sets: 3, reps: 12, peso: 12),
            ],
        ]),
        Routine(id: "r-pierna", data: [
            "ownerId": uid,
            "name": "Pierna pesada",
            "createdAt": dias(-20),
            "exercises": [
                item("sentadilla", sets: 5, reps: 5, peso: 100, grupo: "Fuerza", color: "amber"),
                item("peso-muerto-rumano", sets: 3, reps: 10, peso: 80),
            ],
        ]),
        Routine(id: "a-coach", data: [
            "studentId": uid,
            "routineName": "Full body del coach",
            "assignedAt": dias(-5),
            "exercises": [
                item("sentadilla", sets: 3, reps: 10, peso: 80),
                item("press-banca", sets: 3, reps: 10, peso: 60),
                item("remo-barra", sets: 3, reps: 10, peso: 50),
            ],
        ], isAssigned: true),
    ]

    private static func item(
        _ id: String,
        sets: Int,
        reps: Int,
        peso: Double? = nil,
        grupo: String = "",
        color: String = "",
        nota: String = ""
    ) -> [String: Any] {
        var data: [String: Any] = [
            "exerciseId": id,
            "targetSets": sets,
            "targetReps": reps,
            "techniqueNote": nota,
            "group": grupo,
            "groupColor": color,
        ]
        if let peso { data["targetWeight"] = peso }
        return data
    }

    // MARK: - Sesiones

    /// Diez días de historial con una racha de tres días que termina hoy.
    static let sessions: [WorkoutSession] = [
        sesion("s1", hace: 0, rutina: routines[0], series: [("press-banca", 70, 8), ("press-militar", 20, 10), ("plancha", 0, 45)]),
        sesion("s2", hace: 1, rutina: routines[1], series: [("dominadas", 0, 8), ("remo-barra", 60, 10)]),
        sesion("s3", hace: 2, rutina: routines[2], series: [("sentadilla", 100, 5), ("peso-muerto-rumano", 80, 10)]),
        sesion("s4", hace: 5, rutina: routines[0], series: [("press-banca", 67.5, 8), ("curl-biceps", 12, 12)]),
        sesion("s5", hace: 7, rutina: routines[1], series: [("remo-barra", 57.5, 10), ("dominadas", 0, 7)]),
        sesion("s6", hace: 9, rutina: routines[2], series: [("sentadilla", 95, 5)]),
    ]

    private static func sesion(
        _ id: String,
        hace diasAtras: Int,
        rutina: Routine,
        series: [(String, Double, Int)]
    ) -> WorkoutSession {
        let fin = dias(-diasAtras)
        let ejercicios: [[String: Any]] = series.map { ejercicio, peso, reps in
            [
                "exerciseId": ejercicio,
                "sets": (1...3).map { ["setNumber": $0, "weight": peso, "reps": reps, "failed": false] },
            ]
        }
        let volumen = series.reduce(0.0) { $0 + $1.1 * Double($1.2) * 3 }
        return WorkoutSession(id: id, data: [
            "userId": uid,
            "routineName": rutina.name,
            "source": ["type": "routine", "routineId": rutina.id],
            "startedAt": fin.addingTimeInterval(-3600),
            "finishedAt": fin,
            "durationSeconds": 3480,
            "totalVolumeKg": volumen,
            "totalSetsCompleted": series.count * 3,
            "exercises": ejercicios,
        ])
    }

    /// Hoy a las 19:00 corrido `offset` días: horario de gimnasio, siempre en
    /// el pasado para hoy (salvo que se mire el preview antes de las 19).
    private static func dias(_ offset: Int) -> Date {
        let calendario = Calendar.current
        let hoy = calendario.date(bySettingHour: 19, minute: 0, second: 0, of: .now) ?? .now
        return calendario.date(byAdding: .day, value: offset, to: hoy) ?? hoy
    }

    // MARK: - Store

    static func store() -> GymStore {
        GymStore(preview: uid, profile: profile, routines: routines, sessions: sessions, catalog: catalog)
    }

    /// Un store sin nada: para ver los estados vacíos ("Todavía no tenés rutinas").
    static func storeVacio() -> GymStore {
        GymStore(preview: uid, profile: profile, routines: [], sessions: [], catalog: catalog)
    }
}

/// El entorno que arma `RootView` en la app: tema, `ThemeStore`, sesión y
/// fondo. Sin esto las pantallas que leen `@Environment(ThemeStore.self)` o
/// `AuthService` se caen en el canvas.
struct PreviewEntorno: ViewModifier {
    let temaID: String
    @State private var temas = ThemeStore()
    @State private var auth: AuthService

    init(temaID: String) {
        self.temaID = temaID
        // `AuthService` toca `Auth.auth()`: Firebase tiene que estar
        // configurado antes. En el canvas no pasa por `SiezaGymApp.init`.
        if FirebaseApp.app() == nil, SiezaGymApp.hasFirebaseConfig {
            FirebaseApp.configure()
        }
        _auth = State(initialValue: AuthService())
    }

    func body(content: Content) -> some View {
        let tema = Theme.conId(temaID)
        ZStack {
            Backdrop()
            content
        }
        .environment(\.tema, tema)
        .environment(temas)
        .environment(auth)
        .tint(tema.solido)
        .preferredColorScheme(.dark)
    }
}

extension View {
    /// `.previewSieza()` al final de cualquier `#Preview` y la pantalla se ve
    /// igual que en el teléfono. Cambiá `tema` para probar otro ("plata",
    /// "noche"...).
    func previewSieza(tema: String = Theme.porDefecto.id) -> some View {
        modifier(PreviewEntorno(temaID: tema))
    }
}
#endif
