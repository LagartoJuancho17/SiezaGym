#!/usr/bin/env bash
# Compila, instala y abre la app en un iPhone conectado por cable.
#
# Hace falta reinstalar cada 7 dias: la cuenta de desarrollador es gratuita y
# Apple le pone esa fecha de vencimiento al perfil. Cuando la app deje de abrir
# ("ya no esta disponible"), correr esto de nuevo.
#
#   ./scripts/run-on-device.sh
#
# La primera vez, despues de instalar, hay que confiar en el desarrollador en:
# Ajustes > General > VPN y gestion de dispositivos > Apps de desarrollador.

set -euo pipefail
cd "$(dirname "$0")/.."

TEAM="${DEVELOPMENT_TEAM:-}"
if [[ -z "$TEAM" && -f Local.xcconfig ]]; then
  TEAM=$(grep -E '^DEVELOPMENT_TEAM' Local.xcconfig | cut -d= -f2 | tr -d ' ')
fi
if [[ -z "$TEAM" ]]; then
  echo "Falta el Team ID. Copiá Local.example.xcconfig a Local.xcconfig y completalo," >&2
  echo "o exportá DEVELOPMENT_TEAM=XXXXXXXXXX." >&2
  exit 1
fi

# UDID de hardware del primer iPhone conectado. Se saca de xctrace y no de
# devicectl porque devicectl devuelve un id de CoreDevice, que -destination no
# acepta. El corte en "== Simulators ==" evita agarrar un simulador.
UDID=$(xcrun xctrace list devices 2>/dev/null \
  | sed -n '/== Devices ==/,/== Simulators ==/p' \
  | grep -i iPhone \
  | sed -n 's/.*(\([0-9A-Fa-f][0-9A-Fa-f-]\{15,\}\)).*/\1/p' \
  | head -1)

if [[ -z "$UDID" ]]; then
  echo "No hay ningún iPhone conectado. Conectalo por cable y desbloquealo." >&2
  exit 1
fi
echo "==> iPhone $UDID"

echo "==> Compilando para el dispositivo"
xcodebuild -project SiezaGym.xcodeproj -scheme SiezaGym \
  -destination "platform=iOS,id=$UDID" \
  -derivedDataPath build-device \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="$TEAM" \
  build

APP=build-device/Build/Products/Debug-iphoneos/SiezaGym.app

echo "==> Instalando"
xcrun devicectl device install app --device "$UDID" "$APP"

echo "==> Abriendo"
if ! xcrun devicectl device process launch --device "$UDID" com.siezagym.app; then
  cat >&2 <<'MSG'

No se pudo abrir. Si dice que el perfil no es de confianza, en el iPhone:
  Ajustes > General > VPN y gestión de dispositivos > Apps de desarrollador
  > Apple Development: <tu email> > Confiar

Después volvé a correr este script.
MSG
  exit 1
fi
