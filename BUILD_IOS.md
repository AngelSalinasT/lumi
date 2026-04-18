# Compilar Lumi Family para iPhone

## Problema conocido
La ruta del proyecto tiene un espacio (`/Volumes/ssd angel/`), lo cual rompe algunos scripts de Xcode. La solucion es copiar la app a `/tmp/lumi-build` para compilar.

## Prerequisitos
- Xcode instalado
- iPhone conectado por USB y desbloqueado
- Cuenta Apple Developer configurada en Xcode
- CocoaPods instalado (`brew install cocoapods`)
- Node.js y npm

## Datos del proyecto
- **Bundle ID**: `com.angelsalinas.lumifamily`
- **Team ID**: `J5CX793KK2`
- **Signing Identity**: `Apple Development: tprog.angel.salinas@outlook.com (C643AQBZ7S)`
- **Device ID iPhone**: `00008110-001179E62281801E`

## Pasos

### 1. Copiar proyecto a ruta sin espacios
```bash
rm -rf /tmp/lumi-build
cp -a "/Volumes/ssd angel/dev/personal/hackathon2026/src/app" /tmp/lumi-build
```

### 2. Prebuild iOS (genera proyecto nativo + instala pods)
```bash
cd /tmp/lumi-build
rm -rf ios
npx expo prebuild --platform ios
```

### 3. Generar JS bundle (Release, sin Metro)
```bash
cd /tmp/lumi-build
npx expo export:embed --platform ios --entry-file index.ts --bundle-output ios/main.jsbundle --assets-dest ios --dev false
```

### 4. Compilar con xcodebuild
```bash
cd /tmp/lumi-build
xcodebuild -workspace ios/LumiFamily.xcworkspace \
  -scheme LumiFamily \
  -destination 'platform=iOS,id=00008110-001179E62281801E' \
  -configuration Release \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM=J5CX793KK2 \
  SKIP_BUNDLING=1 \
  build
```

### 5. Copiar JS bundle al .app (xcodebuild no lo incluye con SKIP_BUNDLING)
```bash
APP_PATH="/Users/angelsalinas/Library/Developer/Xcode/DerivedData/LumiFamily-cnevsfnemwluypgklvlnygfynisp/Build/Products/Release-iphoneos/LumiFamily.app"
cp /tmp/lumi-build/ios/main.jsbundle "$APP_PATH/"
```

### 6. Re-firmar el .app
```bash
# Extraer entitlements originales
codesign -d --entitlements /tmp/lumi-ent.xml --xml "$APP_PATH"

# Re-firmar con el bundle incluido
codesign --force \
  --sign "Apple Development: tprog.angel.salinas@outlook.com (C643AQBZ7S)" \
  --entitlements /tmp/lumi-ent.xml \
  "$APP_PATH"
```

### 7. Instalar en iPhone
```bash
xcrun devicectl device install app \
  --device "00008110-001179E62281801E" \
  "$APP_PATH"
```

### 8. Confiar en el certificado (solo la primera vez)
En el iPhone: **Ajustes > General > VPN y Gestion de Dispositivos > Confiar**

## Comando rapido (todo en uno)
```bash
rm -rf /tmp/lumi-build && \
cp -a "/Volumes/ssd angel/dev/personal/hackathon2026/src/app" /tmp/lumi-build && \
cd /tmp/lumi-build && \
rm -rf ios && \
npx expo prebuild --platform ios && \
npx expo export:embed --platform ios --entry-file index.ts --bundle-output ios/main.jsbundle --assets-dest ios --dev false && \
xcodebuild -workspace ios/LumiFamily.xcworkspace -scheme LumiFamily -destination 'platform=iOS,id=00008110-001179E62281801E' -configuration Release -allowProvisioningUpdates DEVELOPMENT_TEAM=J5CX793KK2 SKIP_BUNDLING=1 build && \
APP_PATH="/Users/angelsalinas/Library/Developer/Xcode/DerivedData/LumiFamily-cnevsfnemwluypgklvlnygfynisp/Build/Products/Release-iphoneos/LumiFamily.app" && \
cp /tmp/lumi-build/ios/main.jsbundle "$APP_PATH/" && \
codesign -d --entitlements /tmp/lumi-ent.xml --xml "$APP_PATH" && \
codesign --force --sign "Apple Development: tprog.angel.salinas@outlook.com (C643AQBZ7S)" --entitlements /tmp/lumi-ent.xml "$APP_PATH" && \
xcrun devicectl device install app --device "00008110-001179E62281801E" "$APP_PATH"
```

## Notas
- El certificado free de Apple expira cada 7 dias. Si la app deja de abrir, recompilar.
- El iPhone debe estar desbloqueado durante todo el proceso.
- Si cambia el DerivedData path, buscar con: `find ~/Library/Developer/Xcode/DerivedData -name "LumiFamily.app" -path "*/Release-iphoneos/*"`
