import SwiftUI

/// Foto recortada a una altura fija.
///
/// No alcanza con `.aspectRatio(.fill).frame(height:)`: eso fija el alto pero
/// deja el ancho libre, asi que la imagen mide su ancho natural (mucho mas que
/// la pantalla) y arrastra a todo el scroll fuera de cuadro. El truco es que el
/// que define el tamano sea un contenedor vacio y la foto vaya de overlay.
struct HeroImage: View {
    var height: CGFloat
    var width: CGFloat?

    var body: some View {
        Color.clear
            .frame(width: width, height: height)
            .frame(maxWidth: width == nil ? .infinity : nil)
            .overlay {
                Image(.heroGym)
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            }
            .clipped()
    }
}
