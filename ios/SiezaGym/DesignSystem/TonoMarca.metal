#include <metal_stdlib>
#include <SwiftUI/SwiftUI_Metal.h>
using namespace metal;

// Mapa de color: toma la luz de cada píxel (la foto es en blanco y negro) y la
// reemplaza por el color de la marca que le toca. Las paradas vienen de Swift
// (TonoMarca.paradas), repartidas parejo de 0 (sombra) a 1 (luz).
[[ stitchable ]] half4 tonoMarca(float2 position, half4 color, device const half4 *paradas, int cantidad) {
    if (cantidad < 2 || color.a <= 0.0h) return color;
    float luz = clamp(float(dot(color.rgb / color.a, half3(0.2126h, 0.7152h, 0.0722h))), 0.0, 1.0);
    float t = luz * float(cantidad - 1);
    int i = min(int(floor(t)), cantidad - 2);
    half4 tono = mix(paradas[i], paradas[i + 1], half(t - float(i)));
    return half4(tono.rgb * color.a, color.a);
}
