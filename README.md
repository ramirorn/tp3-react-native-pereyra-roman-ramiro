# Mantenimiento IPF

App para que alumnos y docentes del Instituto Politécnico Formosa reporten desperfectos del edificio (una luz quemada, una canilla que pierde, un proyector roto) y reciban un aviso cuando se resuelven.

Trabajo Práctico N° 3 — *Permisos móviles: Android, iOS y Expo* (Taller Complementario – React Native II). Las respuestas de las Partes A a F están en [RESPUESTAS.md](RESPUESTAS.md).

- Expo SDK 58 · Expo Router · TypeScript
  > La consigna pide SDK 57 y el proyecto se creó con esa versión, pero se actualizó a **SDK 58** porque Expo Go para iOS solo soporta la última versión del SDK (en iPhone no se puede instalar un Expo Go anterior). Las APIs de permisos y las opciones de los plugins usadas son las mismas en las dos versiones; SDK 58 sigue apuntando a API 36 y exigiendo iOS 16.4.
- Módulos: `expo-camera`, `expo-location`, `expo-image-picker`, `expo-notifications` (instalados con `npx expo install`). **No** se usa `expo-permissions`.

## Cómo correrla

```bash
npm install
npx expo start              # Expo Go (los textos de propósito que se ven son los de Expo Go)
```

Development build (para ver los textos de propósito propios y que se apliquen `blockedPermissions`):

```bash
npx expo install expo-dev-client
npx expo run:android        # o: npx eas-cli@latest build --profile development --platform android
```

Volver un permiso a "sin decidir" para probar:

```bash
adb shell pm reset-permissions -p com.ipf.mantenimiento
xcrun simctl privacy booted reset all com.ipf.mantenimiento
```

## Árbol de rutas (`src/app`)

```
src/app
├── _layout.tsx                 Stack raíz + ReportesProvider
├── (tabs)/                     Grupo: no agrega segmento a la URL
│   ├── _layout.tsx             Tabs: Reportes · Avisos · Permisos
│   ├── index.tsx               /                     Inicio: mis reportes + "Nuevo reporte"
│   ├── avisos.tsx              /avisos               Bandeja de avisos (alternativa a notificaciones)
│   └── permisos.tsx            /permisos             Panel de permisos
├── permisos/
│   └── [recurso].tsx           /permisos/[recurso]   Pantalla previa (presentation: "modal")
├── reporte/
│   ├── nuevo.tsx               /reporte/nuevo        Formulario (no pide nada al abrir)
│   ├── escanear.tsx            /reporte/escanear     QR del aula, cuatro estados
│   ├── foto.tsx                /reporte/foto         Sacar foto (cámara) / elegir (selector, sin permiso)
│   ├── ubicacion.tsx           /reporte/ubicacion    Ubicación en primer plano o sector a mano
│   └── [id].tsx                /reporte/[id]         Detalle + "Simular resolución"
├── ajustes-app.tsx             /ajustes-app          Interruptor "Avisarme cuando se resuelva…"
└── +not-found.tsx              Cualquier otra URL
```

`/reporte/nuevo` y `/reporte/[id]` conviven porque Expo Router prioriza la ruta estática sobre la dinámica. `/permisos` (dentro del grupo de tabs) y `/permisos/[recurso]` (fuera, en el Stack raíz) tampoco chocan: la primera resuelve la URL exacta y la segunda las que tienen un segmento más; así la pantalla previa se abre como modal por encima de las tabs.

### Organización del resto del código

```
src/
├── components/   boton, tarjeta, etiqueta, pantalla, pantalla-previa (la pantalla previa reutilizable)
├── hooks/        usePermiso (hook unificado), useRevisarAlVolver (AppState), useConPermiso
└── lib/          permisos (adaptadores por recurso), notificaciones (canal + programar),
                  ubicacion (obtenerUbicacion), reportes (estado de la app: reportes, borrador, avisos)
```

## Cómo funcionan los permisos en la app

### `usePermiso(recurso)` — [src/hooks/usePermiso.ts](src/hooks/usePermiso.ts)

Devuelve `{ estado, parcial, respuesta, pedir, abrirAjustes, consultar }`:

| `estado` | Cuándo | Qué muestra la app |
| --- | --- | --- |
| `'cargando'` | La respuesta todavía es `null` | Indicador de carga |
| `'concedido'` | `granted` (o notificaciones provisionales en iOS) | La función |
| `'preguntable'` | `!granted && canAskAgain` | Pantalla previa con **Continuar** |
| `'bloqueado'` | `!granted && !canAskAgain` | Camino exacto en Ajustes + **Abrir Ajustes** |

`parcial` vale `'Ubicación aproximada'` (Android `accuracy: 'coarse'`, iOS `accuracy: 'reduced'`) o `'Provisional (llegan en silencio)'` (iOS `IosAuthorizationStatus.PROVISIONAL`). El hook vuelve a consultar al enfocar la pantalla y cada vez que la app vuelve a primer plano (`useRevisarAlVolver` escucha `AppState`), así que el panel y las pantallas se actualizan al volver de Ajustes.

La decisión "Continuar" vs. "Abrir Ajustes" está en `interpretar()` de [src/lib/permisos.ts](src/lib/permisos.ts): la toma el campo **`canAskAgain`**.

### Pedidos en contexto y "no insistir"

`useConPermiso(recurso).usar(accion, siguiente?)` ([src/hooks/useConPermiso.ts](src/hooks/useConPermiso.ts)) es lo único que abre la pantalla previa, y solo se llama desde el `onPress` de un botón. Nunca se pide un permiso al abrir una pantalla ni dentro de un efecto, así que si la persona dijo que no, la pantalla previa no vuelve a aparecer sola: solo cuando toca otra vez la función.

La pantalla previa ([src/components/pantalla-previa.tsx](src/components/pantalla-previa.tsx)) tiene el beneficio en una frase, **un único botón "Continuar"** (sin "Ahora no" ni "Cerrar", pauta 5.1.1(iv) de Apple) y la aclaración de que se puede cambiar en Ajustes. Si está bloqueado, muestra el camino exacto según `Platform.OS` y el botón pasa a "Abrir Ajustes".

### Tabla de permisos

| Recurso | Módulo | Cuándo se pide | Alternativa si se deniega |
| --- | --- | --- | --- |
| Cámara (QR) | `expo-camera` (`Camera.requestCameraPermissionsAsync`, la misma función de `useCameraPermissions`) | Al tocar "Escanear QR" en el formulario | Escribir el código del aula a mano |
| Cámara (foto) | `expo-image-picker` (`launchCameraAsync`) | Al tocar "Sacar foto" | "Elegir de la galería" con el selector del sistema |
| Galería | `expo-image-picker` (`launchImageLibraryAsync`) | **Nunca**: el selector del sistema no necesita permiso | — |
| Ubicación (solo primer plano) | `expo-location` (`requestForegroundPermissionsAsync`) | Al tocar "Marcar ubicación" | Elegir el sector (patio, estacionamiento, pasillo…) a mano |
| Notificaciones | `expo-notifications` (`requestPermissionsAsync`, con `allowProvisional` en iOS) | Al activar "Avisarme cuando se resuelva mi reporte" en `/ajustes-app` (en Android se crea antes el canal `reportes`) | Bandeja `/avisos` dentro de la app |

Ningún permiso denegado impide crear un reporte: el único campo obligatorio es el título.

### "Simular resolución"

En `/reporte/[id]` el reporte pasa a "en curso" y a los 10 segundos a "resuelto". Si el interruptor de avisos está activo y el permiso concedido, se programa una notificación local (`TIME_INTERVAL`, 10 s, canal `reportes`). El aviso **siempre** queda en la bandeja `/avisos`, indicando si además llegó como notificación o solo a la bandeja.

## `app.json`: bloque `plugins` comentado

> JSON no admite comentarios; este es el mismo bloque de [app.json](app.json) con explicaciones.

```jsonc
"plugins": [
  "expo-router",
  ["expo-splash-screen", { /* … */ }],

  ["expo-camera", {
    // NSCameraUsageDescription. Molde: "Usamos tu [dato] para [beneficio concreto]".
    "cameraPermission": "Usamos tu cámara para leer el código QR de la puerta del aula y para sacar la foto del desperfecto que reportás.",
    "microphonePermission": false,   // iOS: no agrega NSMicrophoneUsageDescription (no grabamos video)
    "recordAudioAndroid": false,     // Android: no agrega RECORD_AUDIO
    "barcodeScannerEnabled": true    // necesitamos leer QR
  }],

  ["expo-location", {
    // NSLocationWhenInUseUsageDescription: solo primer plano.
    "locationWhenInUsePermission": "Usamos tu ubicación para marcar en qué parte del instituto está el desperfecto que reportás.",
    "locationAlwaysAndWhenInUsePermission": false,  // sin "Siempre"
    "locationAlwaysPermission": false,
    "isIosBackgroundLocationEnabled": false,        // sin UIBackgroundModes: location
    "isAndroidBackgroundLocationEnabled": false,    // sin ACCESS_BACKGROUND_LOCATION
    "isAndroidForegroundServiceEnabled": false      // sin servicio en primer plano
  }],

  ["expo-image-picker", {
    "photosPermission": false,       // iOS: sin NSPhotoLibraryUsageDescription (usamos el selector del sistema)
    "cameraPermission": "Usamos tu cámara para sacar la foto del desperfecto que reportás.",
    "microphonePermission": false    // no grabamos video
  }],

  ["expo-notifications", {
    "color": "#1F6FEB"               // color del ícono de la notificación en Android
  }]
]
```

> Nota: `expo-camera` y `expo-image-picker` escriben la misma clave `NSCameraUsageDescription`; queda el texto del último plugin que se aplica. Los dos textos cumplen el molde.

### `android.blockedPermissions` (mínimo privilegio)

Cada uno genera `<uses-permission … tools:node="remove" />` en el manifiesto final:

| Permiso bloqueado | Por qué la app no lo usa |
| --- | --- |
| `RECORD_AUDIO` | No grabamos audio ni video; `expo-camera` lo agrega por defecto para `recordAsync`. |
| `SYSTEM_ALERT_WINDOW` | No dibujamos sobre otras apps (lo agrega React Native en modo debug). |
| `ACCESS_BACKGROUND_LOCATION` | La ubicación es solo en primer plano: se marca el lugar mientras se carga el reporte. |
| `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` | Elegimos fotos con el selector del sistema; Google Play restringe estos permisos. |
| `READ_MEDIA_AUDIO` | No accedemos a audios. |
| `READ_MEDIA_VISUAL_USER_SELECTED` | Acceso parcial a la galería: tampoco lo necesitamos con el selector. |
| `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` | Permisos viejos de almacenamiento (Android ≤ 12); no leemos ni escribimos archivos compartidos. |

> `blockedPermissions` no tiene efecto en Expo Go: se aplica en la development build y en producción.

## Auditoría del manifiesto (desafío opcional)

Resultado de `npx expo prebuild --clean --platform android` (generado con SDK 57; SDK 58 mantiene el mismo `targetSdkVersion`) (`targetSdkVersion` 36). Se revisó el `AndroidManifest.xml` generado y los manifiestos de las librerías que se fusionan al compilar (`node_modules/*/android/src/main/AndroidManifest.xml`):

| Permiso | Quién lo agrega | Tipo | ¿Queda? |
| --- | --- | --- | --- |
| `INTERNET` | Plantilla de Expo, `expo-image`, `expo-file-system` | Instalación | ✅ Sí (Metro, imágenes remotas) |
| `ACCESS_NETWORK_STATE` | `expo-image` | Instalación | ✅ Sí |
| `VIBRATE` | Plantilla de Expo | Instalación | ✅ Sí (vibración de las notificaciones) |
| `CAMERA` | Plugin `expo-camera`, `expo-image-picker` | Tiempo de ejecución | ✅ Sí: escanear QR y sacar foto |
| `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` | Plugin y manifiesto de `expo-location` | Tiempo de ejecución | ✅ Sí: un solo diálogo, la persona elige precisa o aproximada |
| `POST_NOTIFICATIONS` | `expo-notifications` | Tiempo de ejecución (Android 13+) | ✅ Sí: aviso de reporte resuelto |
| `RECEIVE_BOOT_COMPLETED` | `expo-notifications` | Instalación | ✅ Sí: reprograma notificaciones locales tras reiniciar |
| `ACCESS_BACKGROUND_LOCATION` | `expo-location` (solo si `isAndroidBackgroundLocationEnabled`) | Tiempo de ejecución | ❌ Quitado (`tools:node="remove"`) |
| `RECORD_AUDIO` | Plugin `expo-camera` (por defecto) y `expo-image-picker` | Tiempo de ejecución | ❌ Quitado |
| `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` | Plantilla de Expo, `expo-image-picker`, `expo-file-system`, `expo-image` | Tiempo de ejecución (≤ Android 12) | ❌ Quitados |
| `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`, `READ_MEDIA_VISUAL_USER_SELECTED` | Ninguna librería en SDK 57; bloqueados preventivamente | Tiempo de ejecución | ❌ Quitados |
| `SYSTEM_ALERT_WINDOW` | Plantilla de Expo (main) y React Native en `src/debug` (overlay de errores en desarrollo) | Especial | ❌ Quitado del manifiesto principal; sigue en el manifiesto *debug* (no llega a la build de producción) |

Manifiesto principal generado:

```xml
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" tools:node="remove"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.CAMERA"/>
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" tools:node="remove"/>
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" tools:node="remove"/>
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" tools:node="remove"/>
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" tools:node="remove"/>
<uses-permission android:name="android.permission.READ_MEDIA_VISUAL_USER_SELECTED" tools:node="remove"/>
<uses-permission android:name="android.permission.RECORD_AUDIO" tools:node="remove"/>
<uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" tools:node="remove"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" tools:node="remove"/>
```

La carpeta `android/` generada no se sube al repositorio (está en `.gitignore`): la fuente de verdad es `app.json`.

## Desafíos opcionales hechos

- **Notificaciones provisionales:** en iOS se piden con `allowProvisional: true`; `/permisos` y `/ajustes-app` muestran "Parcial · Provisional (llegan en silencio)" cuando `ios.status` es `PROVISIONAL`.
- **Bloqueo por plataforma:** la pantalla de permiso bloqueado muestra el camino exacto en Ajustes según `Platform.OS` (`caminoEnAjustes()` en [src/lib/permisos.ts](src/lib/permisos.ts)).
- **Auditoría del manifiesto:** ver la sección anterior.

## Capturas

Las capturas se agregan en `docs/capturas/` al probar la app en el dispositivo:

| Qué | Archivo |
| --- | --- |
| Escáner: cargando / concedido / preguntable / bloqueado | `docs/capturas/escaner-*.png` |
| Ubicación concedida y denegada | `docs/capturas/ubicacion-*.png` |
| Foto desde el selector | `docs/capturas/foto-selector.png` |
| Notificación recibida | `docs/capturas/notificacion.png` |
| Panel de permisos antes y después de volver de Ajustes | `docs/capturas/panel-*.png` |
| Diálogo del sistema con el texto de propósito (development build) | `docs/capturas/dialogo-dev-build.png` |
