import Testing
@testable import SiezaGym

@Suite("Media de ejercicios")
struct ExerciseMediaTests {
    @Test("conserva la URL del GIF que entrega Firestore")
    func parsesGifURL() {
        let url = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-EIeI8Vf.gif"
        let exercise = Exercise(
            id: "press-de-banca-con-barra",
            data: ["nameEs": "Press de banca con barra", "mediaUrl": url]
        )

        #expect(exercise.mediaURL?.absoluteString == url)
        #expect(exercise.mediaURL?.pathExtension.lowercased() == "gif")
    }
}
