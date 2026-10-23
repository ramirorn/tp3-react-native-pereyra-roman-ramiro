# TP N° 3 — Permisos móviles: Android, iOS y Expo

Respuestas de las Partes A a F. La Parte G (la app "Mantenimiento IPF") está en el código del repositorio y se documenta en el [README](README.md).

---

## Parte A · ¿Qué es un permiso y por qué existe?

### A1. Conceptos

**a) ¿Qué es un permiso?** Es una autorización explícita para que una app acceda a un recurso o dato sensible que está fuera de su propia caja de arena (cámara, ubicación, micrófono, contactos, fotos, notificaciones, etc.).

- **La app** declara qué recursos va a necesitar y, en el momento de usarlos, los solicita.
- **El sistema operativo** es el intermediario: verifica que el permiso esté declarado, muestra el diálogo (que la app no puede dibujar ni modificar), guarda la decisión y bloquea el acceso si no fue concedido.
- **La persona usuaria** es la dueña de los datos: decide si concede, deniega o concede parcialmente, y puede cambiar de opinión en cualquier momento desde Ajustes.

**b) Caja de arena (sandbox).** Es el aislamiento que el sistema le impone a cada app: corre en su propio proceso, con su propio usuario/espacio de archivos, y no puede ver los datos de otras apps ni el hardware sensible. Los permisos son la "puerta" controlada para salir de esa caja. Sin ningún permiso una app puede: dibujar su interfaz, guardar archivos en su propio directorio, usar su almacenamiento interno, hacer cálculos, reproducir sonido, abrir el selector de fotos o de documentos del sistema (la persona elige qué compartir) y, en Android, todo lo que cubren los permisos "de instalación" (como Internet) que se conceden solos.

**c) Las cuatro razones por las que existen los permisos:**

| Razón | Ejemplo concreto |
| --- | --- |
| **Privacidad**: proteger datos personales | Una linterna no debería poder leer los contactos ni la ubicación. |
| **Seguridad**: evitar abusos o fraudes | Impedir que una app lea SMS para robar códigos de verificación bancarios. |
| **Control / transparencia** para la persona | Saber que una app usa el micrófono y poder revocarlo desde Ajustes. |
| **Recursos del dispositivo** (batería, datos) | Limitar la ubicación en segundo plano, que gasta batería todo el día. |

**d) Analogía del portero.** La **visita** es la app que quiere entrar a un recurso; el **portero** es el sistema operativo, que controla la puerta; el **dueño del departamento** es la persona usuaria, que decide si deja pasar. "El portero se acuerda de la respuesta" significa que el sistema guarda la decisión: si el dueño dijo que sí, la visita entra las próximas veces sin volver a preguntar; si dijo que no (y en iOS, o en Android después de dos rechazos), el portero ya no vuelve a tocar el timbre y la única forma de cambiarlo es que el dueño vaya a Ajustes.

### A2. Declarar y solicitar

| | Declarar (al compilar) | Solicitar (al ejecutar) |
| --- | --- | --- |
| **¿Qué se hace?** | Se anuncia en la configuración nativa qué permisos podría usar la app. | Se le pide a la persona, con el diálogo del sistema, en el momento en que se va a usar el recurso. |
| **¿Dónde / cómo en Android?** | `<uses-permission android:name="android.permission.X" />` en `AndroidManifest.xml`. | `ActivityCompat.requestPermissions()` / `ActivityResultContracts.RequestPermission` (solo para los permisos de tiempo de ejecución). |
| **¿Dónde / cómo en iOS?** | Clave `NS…UsageDescription` con el texto de propósito en `Info.plist`. | La API del framework (p. ej. `AVCaptureDevice.requestAccess`, `CLLocationManager.requestWhenInUseAuthorization`). |
| **¿Dónde / cómo en Expo?** | En `app.json` / `app.config.ts`: `plugins` de cada módulo (con sus textos), `android.permissions`, `android.blockedPermissions`, `ios.infoPlist`. `expo prebuild` genera los archivos nativos. | Con las funciones de cada módulo: `request…PermissionsAsync()` o el hook `use…Permissions()`. |
| **¿Qué pasa si se omite?** | Android: el diálogo no aparece y el pedido devuelve denegado. iOS: la app se cierra (crash) al usar el recurso y App Store Connect rechaza la build (ITMS-90683). | El recurso no se puede usar: las APIs fallan o devuelven error/denegado. Los permisos de tiempo de ejecución nunca se conceden solos. |

### A3. Verdadero o falso

- **a) F.** El diálogo lo dibuja el **sistema operativo**; la app no puede modificar su diseño ni sus botones (en iOS solo aporta el texto de propósito).
- **b) V.** En Expo con CNG la fuente de verdad es `app.json`/`app.config.ts`; `AndroidManifest.xml` es un archivo generado por `prebuild`.
- **c) F.** El `Info.plist` es parte del binario nativo: cualquier cambio requiere una **nueva build** y pasar por la tienda. Una OTA solo cambia JavaScript y assets.
- **d) F.** Si el permiso no está en el manifiesto, Android **no muestra el diálogo** y lo devuelve denegado inmediatamente.
- **e) F.** `expo-permissions` está **deprecado y eliminado** (desde SDK 41 deprecado, removido después). Hoy se usan las funciones/hooks de cada módulo (`expo-camera`, `expo-location`, etc.).
- **f) V.** Las notificaciones en iOS no llevan clave `NS…UsageDescription`; el diálogo lo arma el sistema solo con el nombre de la app.
- **g) V.** Con acceso limitado, `status` es `'granted'` y el detalle está en `accessPrivileges: 'limited'` (vs. `'all'`).
- **h) V.** Desinstalar y reinstalar borra las decisiones guardadas en las dos plataformas (también se puede con `adb shell pm reset-permissions` o `xcrun simctl privacy … reset`).

### A4. Los estados de un permiso

**a) Diagrama de estados**

Android (11+):

```
Sin decidir ──pedir──► Concedido ◄─────────────── (Ajustes)
     │                     ▲                         │
     │ "No permitir"       │ "Permitir"              │
     ▼                     │                         │
Denegado (canAskAgain) ──pedir──┘                    │
     │ "No permitir" (2.ª vez)                       │
     ▼                                               │
Bloqueado ───────────────── solo desde Ajustes ──────┘
```

iOS:

```
Sin decidir ──pedir (única vez)──► Concedido
     │
     └──"No permitir"──► Denegado = Bloqueado ── solo desde Ajustes ──► Concedido
```

**Diferencia central:** iOS muestra el diálogo **una sola vez**; si la persona dice que no, el permiso queda bloqueado. Android da **dos oportunidades** (desde Android 11): después del segundo rechazo pasa a "no volver a preguntar".

**b) Qué devuelve Expo**

| Estado | `status` | `canAskAgain` | ¿Puede aparecer el diálogo? |
| --- | --- | --- | --- |
| Sin decidir | `'undetermined'` | `true` | Sí |
| Concedido | `'granted'` | `true` | No hace falta (devuelve concedido al instante) |
| Denegado (se puede volver a pedir) | `'denied'` | `true` | Sí (solo Android) |
| Bloqueado | `'denied'` | `false` | No: solo desde Ajustes |

---

## Parte B · Android: tipos de permisos y manifiesto

### B1. Clasificá los permisos

| Permiso | Tipo | ¿Cómo se obtiene? |
| --- | --- | --- |
| `INTERNET` | De instalación (normal) | Se concede solo al instalar si está en el manifiesto. |
| `CAMERA` | De tiempo de ejecución (peligroso) | Manifiesto + diálogo en tiempo de ejecución. |
| `VIBRATE` | De instalación (normal) | Solo al instalar. |
| `SYSTEM_ALERT_WINDOW` | Especial | Manifiesto + la persona lo habilita en una pantalla de Ajustes ("Mostrar sobre otras apps"). |
| `POST_NOTIFICATIONS` | De tiempo de ejecución (Android 13+) | Manifiesto + diálogo. |
| `ACCESS_NETWORK_STATE` | De instalación (normal) | Solo al instalar. |
| `READ_CONTACTS` | De tiempo de ejecución | Manifiesto + diálogo. |
| `SCHEDULE_EXACT_ALARM` | Especial | Manifiesto + Ajustes ("Alarmas y recordatorios"); se verifica con `canScheduleExactAlarms()`. |
| `RECORD_AUDIO` | De tiempo de ejecución | Manifiesto + diálogo. |
| `MANAGE_EXTERNAL_STORAGE` | Especial | Manifiesto + Ajustes ("Acceso a todos los archivos") y declaración aprobada por Google Play. |

### B2. Grupos y nombres

**a)** Un grupo de permisos agrupa permisos relacionados con un mismo recurso (p. ej. `LOCATION`, `CAMERA`, `MICROPHONE`) para que la persona vea **un solo diálogo** por recurso. Si la app pide `ACCESS_FINE_LOCATION` y `ACCESS_COARSE_LOCATION` juntos, la persona ve **un solo diálogo** (desde Android 12, con la opción de elegir "Precisa" o "Aproximada").

**b)** El prefijo es `android.permission.`. Nombre completo de la cámara: `android.permission.CAMERA`.

**c)** Los permisos de firma (`signature`) solo se conceden a apps firmadas con el **mismo certificado** que la app o el sistema que declaró el permiso. Sirven para que apps de un mismo fabricante o el propio sistema se comuniquen entre sí; una app común no tiene ese certificado, así que nunca los obtendría.

### B3. Leé el manifiesto

**a)** Se conceden solos al instalar: `INTERNET`. Hay que pedir en tiempo de ejecución: `CAMERA`, `ACCESS_COARSE_LOCATION`/`ACCESS_FINE_LOCATION` (un diálogo), `POST_NOTIFICATIONS` (Android 13+) y `READ_EXTERNAL_STORAGE` (solo hasta Android 12). `RECORD_AUDIO` no queda en el manifiesto final porque está marcado para eliminarse.

**b)** `android:maxSdkVersion="32"` significa que el permiso solo se declara en dispositivos con API 32 (Android 12L) o anterior; en Android 13+ no existe para la app. Desde Android 13 lo reemplazan `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` y `READ_MEDIA_AUDIO` (y desde Android 14 `READ_MEDIA_VISUAL_USER_SELECTED` para el acceso parcial).

**c)** `tools:node="remove"` le indica al *manifest merger* que **elimine** ese permiso del manifiesto final aunque lo declare alguna librería. Lo genera:

```json
{
  "expo": {
    "android": {
      "blockedPermissions": ["android.permission.RECORD_AUDIO"]
    }
  }
}
```

**d)** En `expo.android.permissions`:

```json
{ "expo": { "android": { "permissions": ["android.permission.SCHEDULE_EXACT_ALARM"] } } }
```

**e)** Porque es un archivo **generado**: el próximo `npx expo prebuild --clean` (o una build en EAS sin carpeta `android/`) lo regenera desde `app.json` y se pierden los cambios manuales. `blockedPermissions` **no funciona en Expo Go**: Expo Go es una app ya compilada con su propio manifiesto; solo se aplica en una development build o en la build de producción.

### B4. Así pregunta Android

**a)** No. El diálogo de Android solo muestra el nombre de la app y el recurso; no acepta texto propio. Por eso el "para qué" se explica **en la propia app**, en una pantalla previa (o explicación en contexto) antes de llamar al pedido.

**b)** "Mientras la app está en uso" deja el permiso concedido de forma permanente (mientras la app está en primer plano). "Solo esta vez" lo concede de forma temporal: se revoca cuando la app pasa a segundo plano por un rato y se cierra. Existe (Android 11+) para **ubicación, micrófono y cámara**.

**c)** El sistema lo toma como "no volver a preguntar": las siguientes llamadas a `request…` no muestran diálogo y devuelven denegado. `canAskAgain` pasa a `false`.

**d)** Funciona bien con aproximada: mostrar el clima de la ciudad, sucursales o farmacias del barrio. No funciona: navegación giro a giro, seguir el recorrido de una carrera, ubicar un auto estacionado o un delivery a una puerta concreta.

**e)** Android **mata el proceso** de la app (la reinicia cuando la persona vuelve). La app vuelve a arrancar y tiene que consultar de nuevo el estado del permiso.

### B5. Android, versión por versión

| Cambio | Versión (API) | Qué implica para el código |
| --- | --- | --- |
| Nacen los permisos en tiempo de ejecución | Android 6.0 (API 23) | Además del manifiesto hay que pedir los permisos peligrosos con un diálogo y manejar la denegación. |
| La ubicación en segundo plano pasa a ser un permiso aparte | Android 10 (API 29) | Hay que declarar `ACCESS_BACKGROUND_LOCATION` y pedirlo **después** del de primer plano. |
| Dos rechazos equivalen a "no volver a preguntar" | Android 11 (API 30) | Leer `canAskAgain`; si es `false`, ofrecer "Abrir Ajustes". En Android 11 el permiso de segundo plano se concede solo desde Ajustes. |
| Ubicación precisa o aproximada | Android 12 (API 31) | Pedir FINE + COARSE juntos y revisar `android.accuracy` (`'fine'`/`'coarse'`). |
| Notificaciones como permiso (`POST_NOTIFICATIONS`) | Android 13 (API 33) | Declararlo y pedirlo; crear un canal antes de pedir. Si no se concede, no se muestran notificaciones. |
| Acceso parcial a fotos y videos ("Seleccionar fotos") | Android 14 (API 34) | `READ_MEDIA_VISUAL_USER_SELECTED`: el estado puede ser parcial (`accessPrivileges: 'limited'`); mejor usar el selector del sistema. |
| Permiso de red local (`ACCESS_LOCAL_NETWORK`) | Android 17 (API 37) (opcional para probar desde Android 16) | Las apps que descubran o se conecten a dispositivos de la red local (impresoras, Chromecast, IoT) deben declarar y pedir el permiso. |

**targetSdkVersion** es la versión de Android para la que la app fue compilada y probada: el sistema activa los comportamientos (y restricciones) de permisos correspondientes a esa versión. Expo SDK 57 apunta a **API 36 (Android 16)**. Google Play exige desde el **31 de agosto de 2026** que las apps nuevas y las actualizaciones apunten a **API 36** (Android 16) o superior.

---

## Parte C · iOS: textos de propósito y acceso parcial

### C1. Claves del Info.plist

| Recurso | Clave en Info.plist |
| --- | --- |
| Cámara | `NSCameraUsageDescription` |
| Micrófono | `NSMicrophoneUsageDescription` |
| Ubicación en uso | `NSLocationWhenInUseUsageDescription` |
| Ubicación siempre | `NSLocationAlwaysAndWhenInUseUsageDescription` |
| Fotos (leer) | `NSPhotoLibraryUsageDescription` |
| Fotos (solo guardar) | `NSPhotoLibraryAddUsageDescription` |
| Contactos | `NSContactsUsageDescription` |
| Face ID | `NSFaceIDUsageDescription` |
| Rastreo entre apps (ATT) | `NSUserTrackingUsageDescription` |
| Notificaciones | No lleva clave. |

### C2. Sin texto, no hay permiso

**a)** Si falta el texto de propósito, iOS **cierra la app (crash)** en cuanto intenta usar la cámara, con el mensaje "This app has crashed because it attempted to access privacy-sensitive data without a usage description". Al subir la build, App Store Connect la rechaza con el error **ITMS-90683: Missing Purpose String in Info.plist**.

**b)** **Una sola vez.** Si la persona dice que no, la app ya no puede volver a mostrar el diálogo: lo único que le queda es explicar por qué lo necesita y ofrecer un botón que abra Ajustes (`Linking.openSettings()`), además de una alternativa para seguir funcionando.

**c)** El sistema arma el título ("«App» quiere acceder a tu cámara") y los botones; la app escribe solo el **texto de propósito** (el mensaje debajo del título). En Expo se configura en el plugin del módulo en `app.json` (p. ej. `cameraPermission` de `expo-camera`) o en `ios.infoPlist`.

**d)** Apple analiza estáticamente el binario: si encuentra que se enlazan APIs protegidas (de una librería), exige la clave correspondiente aunque tu código nunca la llame. Se resuelve agregando la clave con un texto honesto, o configurando el plugin de la librería para no incluir ese código (p. ej. `microphonePermission: false`) o quitando la librería si no se usa.

### C3. Probador de textos de propósito

| Texto propuesto | ¿Aprobado? | Versión mejorada |
| --- | --- | --- |
| "Necesitamos tu ubicación." | No: no dice para qué. | "Usamos tu ubicación para mostrarte los puntos de reciclaje más cercanos." |
| "Para mejorar tu experiencia." | No: vago, no menciona el dato ni un beneficio concreto. | "Usamos tu ubicación para ordenar las sucursales de la más cercana a la más lejana." |
| "Usamos tu ubicación para mostrarte las farmacias de turno más cercanas." | **Sí**: dato + beneficio concreto. | — |
| "La app no funciona sin ubicación." | No: amenaza y no explica el uso (además, la app debería funcionar igual). | "Usamos tu ubicación para marcar en el mapa dónde está el desperfecto que reportás." |
| "Ubicación requerida por el sistema." | No: falso y genérico. | "Usamos tu ubicación para sugerirte la parada de colectivo más cercana." |

### C4. Acceso parcial y gradual

| Caso | iOS | En Expo |
| --- | --- | --- |
| Fotos limitadas ("Seleccionar fotos") | iOS 14 | `accessPrivileges: 'limited'` en la respuesta de `MediaLibrary`/`ImagePicker`; `presentPermissionsPickerAsync()` para ampliar la selección. |
| Ubicación aproximada (interruptor "Precisa") | iOS 14 | `ios.accuracy` de la respuesta de `expo-location` (`'reduced'` vs `'full'`). |
| "Permitir una vez" (ubicación) | iOS 13 | Devuelve `status: 'granted'`, pero al cerrar la app vuelve a `'undetermined'`: hay que consultar con `getForegroundPermissionsAsync()` cada vez. |
| Ubicación escalonada: de "al usar la app" a "Siempre" | iOS 13 | Primero `requestForegroundPermissionsAsync()`, después `requestBackgroundPermissionsAsync()`; `ios.scope` indica `'whenInUse'` o `'always'`. |
| Notificaciones provisionales | iOS 12 | `requestPermissionsAsync({ ios: { allowProvisional: true } })` y `ios.status === IosAuthorizationStatus.PROVISIONAL`. |
| Rastreo entre apps (App Tracking Transparency) | iOS 14.5 | `expo-tracking-transparency`: `requestTrackingPermissionsAsync()` / `useTrackingPermissions()`. |

Expo SDK 57 requiere **iOS 16.4** como mínimo. Consecuencia práctica: **todas** las funciones de la tabla existen siempre en los dispositivos soportados, así que el código no necesita ramas por versión de iOS; sí tiene que contemplar siempre los estados parciales (fotos limitadas, ubicación aproximada, permitir una vez, provisional).

### C5. Android vs iOS, lado a lado

| | Android | iOS |
| --- | --- | --- |
| ¿Dónde se declara? | `AndroidManifest.xml` (`<uses-permission>`) | `Info.plist` (`NS…UsageDescription`) |
| Texto en el diálogo | No se puede: el sistema lo arma solo. | Sí: el texto de propósito de la app. |
| Oportunidades para preguntar | Dos (Android 11+); después, solo Ajustes. | Una; después, solo Ajustes. |
| "Solo esta vez" / "Permitir una vez" | Sí, para ubicación, cámara y micrófono (Android 11+). | Sí, para ubicación (iOS 13+). |
| Notificaciones | Permiso `POST_NOTIFICATIONS` desde Android 13 (antes, concedidas solas); requieren canal. | Siempre requieren permiso; sin clave en Info.plist; existe la autorización provisional. |
| Ubicación en segundo plano | Permiso aparte (`ACCESS_BACKGROUND_LOCATION`); desde Android 11 solo se concede en Ajustes; Google Play exige declaración. | Pedido escalonado a "Siempre", clave `NSLocationAlwaysAndWhenInUseUsageDescription` y modo de fondo `location`. |
| Si falta la declaración | No aparece el diálogo y el pedido devuelve denegado. | Crash al usar el recurso y rechazo de la build (ITMS-90683). |

---

## Parte D · Expo: una API, dos plataformas

### D1. Módulos y funciones

| Necesidad | Módulo | Hook / función de permiso |
| --- | --- | --- |
| Escanear un QR con la cámara | `expo-camera` | `useCameraPermissions()` |
| Grabar video con sonido | `expo-camera` | `useCameraPermissions()` + `useMicrophonePermissions()` |
| Mostrar farmacias cercanas | `expo-location` | `useForegroundPermissions()` / `requestForegroundPermissionsAsync()` |
| Seguir un envío con la app en segundo plano | `expo-location` (+ `expo-task-manager`) | `requestForegroundPermissionsAsync()` y después `requestBackgroundPermissionsAsync()` |
| Mostrar un recordatorio | `expo-notifications` | `requestPermissionsAsync()` / `getPermissionsAsync()` |
| Grabar una nota de voz | `expo-audio` | `requestRecordingPermissionsAsync()` / `useAudioRecorder` |
| Galería propia dentro de la app | `expo-media-library` | `usePermissions()` / `requestPermissionsAsync()` |
| Publicidad personalizada entre apps (iOS) | `expo-tracking-transparency` | `useTrackingPermissions()` / `requestTrackingPermissionsAsync()` |

Si un tutorial usa `import * as Permissions from 'expo-permissions'`, el tutorial está **desactualizado** (es de SDK 40 o anterior): ese paquete fue deprecado y eliminado, y hoy cada módulo expone sus propias funciones de permiso.

### D2. Consultar, pedir y el hook

**a)** `get…PermissionsAsync()` solo **consulta** el estado actual, sin mostrar nada. `request…PermissionsAsync()` **pide** el permiso: es la única que puede mostrar el diálogo (si el estado lo permite) y devuelve la decisión.

**b)** `permiso` es la última respuesta (`PermissionResponse`) o `null`; `pedirPermiso` llama a `request…` y actualiza `permiso`; `consultarPermiso` llama a `get…` y actualiza `permiso`. En el primer render `permiso` vale **`null`** (la consulta es asíncrona), así que la pantalla tiene que mostrar un estado de **carga** (spinner o "Revisando permiso…") y no asumir nada.

**c)** No aparece ningún diálogo: la promesa se resuelve al instante con `status: 'denied'`. Si se lo llama en un bucle (por ejemplo en cada render o en un `useEffect` sin dependencias correctas), la app entra en un ciclo infinito de pedidos/re-renders, la pantalla queda "pidiendo permiso" para siempre y la persona nunca ve una salida.

### D3. Leé la respuesta

| Respuesta | Qué hace la app |
| --- | --- |
| `null` | Muestra "cargando": todavía no se sabe el estado. |
| `{ status: 'granted', granted: true }` | Usa la función (muestra la cámara, toma la ubicación, etc.). |
| `{ status: 'undetermined', canAskAgain: true }` | Muestra la pantalla previa con "Continuar"; al tocarla, llama a `request…`. |
| `{ status: 'denied', canAskAgain: true }` | Explica de nuevo el beneficio y ofrece "Continuar" (solo si la persona vuelve a tocar la función) y la alternativa. |
| `{ status: 'denied', canAskAgain: false }` | Bloqueado: explica cómo habilitarlo, botón "Abrir Ajustes" (`Linking.openSettings()`) y la alternativa. |
| `{ status: 'granted', accessPrivileges: 'limited' }` | Funciona con las fotos elegidas; ofrece ampliar la selección (`presentPermissionsPickerAsync`). |
| `{ status: 'granted', android: { accuracy: 'coarse' } }` | Funciona con ubicación aproximada: no muestra coordenadas exactas y, si hace falta, explica por qué convendría la precisa. |

Los dos campos que deciden casi todo son **`granted`** ("¿puedo usar el recurso ahora?") y **`canAskAgain`** ("si no, ¿puedo mostrar el diálogo o tengo que mandar a Ajustes?").

### D4. Simulación del ciclo completo

Android 14, app recién instalada:

| # | Acción | status | canAskAgain | ¿Diálogo? |
| --- | --- | --- | --- | --- |
| 1 | `getForegroundPermissionsAsync()` | `undetermined` | `true` | No (solo consulta) |
| 2 | `request…` → "No permitir" | `denied` | `true` | Sí |
| 3 | `request…` → "No permitir" | `denied` | `false` | Sí (segunda y última vez) |
| 4 | `request…` | `denied` | `false` | No |
| 5 | `Linking.openSettings()` → habilita "Mientras la app está en uso" → vuelve y consulta | `granted` | `true` | No |
| 6 | Igual que el 5 pero sin volver a consultar | Muestra el estado viejo: `denied` / `canAskAgain: false` (la pantalla sigue diciendo "bloqueado") | | No |

En iOS el resultado cambia en el **paso 2**: después del primer "No permitir" el permiso queda `denied` con `canAskAgain: false` (iOS pregunta una sola vez). En el paso 3 ya no aparece el diálogo (queda igual que el paso 4). Si la persona elige "Permitir una vez", la app recibe `granted`; al cerrarla y reabrirla, el permiso vuelve a `undetermined` (`canAskAgain: true`) y la próxima vez que la app pida se vuelve a mostrar el diálogo.

### D5. Configurar app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-camera",
        {
          "cameraPermission": "Usamos tu cámara para leer el código QR de los contenedores de reciclaje.",
          "microphonePermission": false,
          "recordAudioAndroid": false
        }
      ],
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "Usamos tu ubicación para mostrarte los puntos de reciclaje más cercanos.",
          "locationAlwaysAndWhenInUsePermission": false,
          "locationAlwaysPermission": false,
          "isIosBackgroundLocationEnabled": false,
          "isAndroidBackgroundLocationEnabled": false
        }
      ]
    ],
    "android": {
      "blockedPermissions": [
        "android.permission.RECORD_AUDIO",
        "android.permission.SYSTEM_ALERT_WINDOW",
        "android.permission.ACCESS_BACKGROUND_LOCATION"
      ]
    }
  }
}
```

`expo-camera` agrega `RECORD_AUDIO` en Android por defecto porque `CameraView` también sirve para **grabar video con sonido** (`recordAsync`), y el plugin no puede saber si tu app lo usa. Por eso existe la opción `recordAudioAndroid: false` (y `blockedPermissions` como refuerzo).

### D6. Expo Go no es tu app

**a)** Porque Expo Go es **otra app ya compilada** con su propio `Info.plist` y `AndroidManifest.xml`: los diálogos muestran los textos de Expo Go, no los de tu `app.json`. Tus plugins solo se aplican al compilar tu propio binario.

**b)** En Expo Go se puede probar la lógica de permisos de primer plano: cámara, ubicación en uso, selector de imágenes y notificaciones **locales**. Necesitan development build: tus textos de propósito, `blockedPermissions`, notificaciones **push** en Android (Expo Go las quitó desde SDK 53), ubicación en **segundo plano** (requiere `UIBackgroundModes`/tareas propias), cualquier módulo nativo que no venga en Expo Go.

**c)** Comandos:

```bash
npx expo prebuild --clean          # genera android/ e ios/ para ver los archivos nativos
npx expo run:android               # compila e instala una development build local (requiere expo-dev-client)
npx eas-cli@latest build --profile development --platform android   # o en la nube con EAS
```

**d)** Volver a "sin decidir" sin reinstalar:

```bash
# Android: un permiso puntual, o todos los de la app
adb shell pm revoke com.ipf.mantenimiento android.permission.CAMERA
adb shell pm clear-permission-flags com.ipf.mantenimiento android.permission.CAMERA user-set user-fixed
adb shell pm reset-permissions -p com.ipf.mantenimiento

# Simulador de iOS
xcrun simctl privacy booted reset camera com.ipf.mantenimiento
xcrun simctl privacy booted reset all com.ipf.mantenimiento
```

---

## Parte E · Recetas: leer y corregir código

### E1. Encontrá los errores (cámara)

Problemas:

1. `permiso` es `null` en el primer render: `permiso.status` rompe la app (TypeError). Falta el estado **cargando**.
2. No contempla el estado **bloqueado** (`canAskAgain: false`): el botón "Permitir" no hace nada y la persona queda trabada. Falta "Abrir Ajustes".
3. El botón dice "Permitir" (copia el diálogo del sistema); debería decir "Continuar".
4. No hay alternativa si se deniega (escribir el código del aula a mano).
5. `Explicacion` no está importado y `onPress={pedirPermiso}` le pasa el evento al pedido.
6. No vuelve a consultar al volver de Ajustes.

Versión corregida:

```tsx
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ActivityIndicator, Button, Linking, Text, View } from 'react-native';

import { Explicacion } from '@/components/explicacion';
import { useRevisarAlVolver } from '@/hooks/useRevisarAlVolver';

export default function Escanear() {
  const [permiso, pedirPermiso, consultarPermiso] = useCameraPermissions();
  useRevisarAlVolver(consultarPermiso);

  // 1. Cargando
  if (!permiso) {
    return <ActivityIndicator style={{ flex: 1 }} />;
  }

  // 2. Concedido
  if (permiso.granted) {
    return <CameraView style={{ flex: 1 }} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} />;
  }

  // 3. Preguntable
  if (permiso.canAskAgain) {
    return (
      <Explicacion texto="Usamos la cámara para leer el QR del aula.">
        <Button title="Continuar" onPress={() => pedirPermiso()} />
      </Explicacion>
    );
  }

  // 4. Bloqueado
  return (
    <Explicacion texto="La cámara está desactivada. Podés habilitarla en Ajustes o escribir el código del aula a mano.">
      <Button title="Abrir Ajustes" onPress={() => Linking.openSettings()} />
    </Explicacion>
  );
}
```

### E2. El orden importa (ubicación)

**a)** Pide **primero segundo plano** y después primer plano. El orden correcto es al revés: el permiso de segundo plano solo se puede pedir cuando ya está concedido el de primer plano. En **iOS** el pedido de "Siempre" sin "al usar" no muestra el diálogo esperado (o devuelve denegado) y la función devuelve `false`. En **Android 11+** el pedido de segundo plano sin primer plano se rechaza directamente (no hay diálogo; segundo plano solo se concede desde Ajustes después de tener el de primer plano), así que también devuelve `false` siempre.

**b)**

```ts
import * as Location from 'expo-location';

export async function activarSeguimiento() {
  const enUso = await Location.requestForegroundPermissionsAsync();
  if (!enUso.granted) return false;

  const siempre = await Location.requestBackgroundPermissionsAsync();
  return siempre.granted;
}
```

**c)**

```ts
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type Ubicacion = { latitud: number; longitud: number; aproximada: boolean };

export async function obtenerUbicacion(): Promise<Ubicacion | null> {
  try {
    const permiso = await Location.requestForegroundPermissionsAsync();
    if (!permiso.granted) return null;

    const aproximada =
      Platform.OS === 'android'
        ? permiso.android?.accuracy === 'coarse'
        : permiso.ios?.accuracy === 'reduced';

    const posicion = await Location.getCurrentPositionAsync({
      accuracy: aproximada ? Location.Accuracy.Low : Location.Accuracy.Balanced,
    });

    return {
      latitud: posicion.coords.latitude,
      longitud: posicion.coords.longitude,
      aproximada,
    };
  } catch {
    // GPS apagado, timeout, etc.: la app sigue funcionando sin ubicación.
    return null;
  }
}
```

**d)** No: para mostrar farmacias cercanas alcanza con la ubicación **en primer plano** (la persona está mirando la app). Si se pide segundo plano, Google Play exige completar la **declaración de permisos de ubicación** en la Play Console, justificar que es una función central, mostrar un aviso destacado (*prominent disclosure*) dentro de la app y un **video** que muestre la función; si no se justifica, la app se rechaza.

### E3. Notificaciones mudas

**a)** Lo más probable es que **no exista ningún canal de notificaciones**: en Android 13+ el diálogo de `POST_NOTIFICATIONS` aparece recién cuando la app crea su primer canal. Hay que llamar a `Notifications.setNotificationChannelAsync('reportes', {...})` **antes** de `requestPermissionsAsync()`. (También puede faltar el permiso en el manifiesto o que ya esté bloqueado.)

**b)** En Android 12 o anterior no es un permiso de tiempo de ejecución: las notificaciones están **concedidas por defecto** al instalar (la persona solo puede apagarlas desde Ajustes); `requestPermissionsAsync()` devuelve `granted` sin diálogo.

**c)** La **autorización provisional** (iOS 12+): las notificaciones llegan "en silencio" al Centro de notificaciones sin mostrar diálogo, con botones para mantenerlas o desactivarlas. Se pide con `requestPermissionsAsync({ ios: { allowProvisional: true } })` y se detecta con `permiso.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL`.

**d)** Cuando la persona hace algo que necesita el aviso y entiende el beneficio. Bueno: al activar "Avisarme cuando se resuelva mi reporte" o justo después de sacar un turno ("¿Querés que te recordemos el turno un día antes?"). Malo: apenas se abre la app por primera vez, antes de que la persona sepa qué hace la app.

### E4. Fotos sin pedir permiso

| Necesidad | Herramienta | Permiso |
| --- | --- | --- |
| Elegir una foto de perfil | `expo-image-picker` → `launchImageLibraryAsync()` (selector del sistema) | Ninguno |
| Sacar una foto en el momento | `expo-image-picker` → `launchCameraAsync()` o `expo-camera` | Cámara |
| Editor que muestra toda la galería | `expo-media-library` | Fotos (`READ_MEDIA_IMAGES`/`VIDEO`, `NSPhotoLibraryUsageDescription`), posiblemente limitado |
| Adjuntar la foto de un comprobante | `launchImageLibraryAsync()` (o `expo-document-picker`) | Ninguno |

Google Play restringe `READ_MEDIA_IMAGES` y `READ_MEDIA_VIDEO` porque dan acceso a **toda** la galería, cuando la mayoría de las apps solo necesita una foto puntual. Desde la política de fotos y videos (anunciada en 2023, obligatoria desde **2025**), solo las apps cuya función central es la galería (editores, gestores de fotos) pueden declararlos; el resto debe usar el **selector de fotos del sistema**. "El mejor permiso" es **el que no se pide**: si una herramienta del sistema resuelve la necesidad sin permiso, se usa esa.

### E5. Volver de Ajustes

```ts
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useRevisarAlVolver(revisar: () => void) {
  const anterior = useRef(AppState.currentState);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nuevo) => {
      const estabaAfuera = /inactive|background/.test(anterior.current);
      if (estabaAfuera && nuevo === 'active') revisar();
      anterior.current = nuevo;
    });
    return () => sub.remove();
  }, [revisar]);
}
```

**a)** Porque los hooks guardan la última respuesta en estado de React y solo consultan al montarse (o cuando se llama a `get`/`request`). El cambio en Ajustes ocurre **fuera de la app** y el sistema no emite ningún evento de "permiso cambiado"; la app tiene que volver a consultar cuando vuelve a primer plano.

**b)** La tercera: `consultarPermiso` (el `getPermission` que devuelve `useCameraPermissions()`).

**c)** Porque el permiso **puede cambiar en cualquier momento fuera de la app** (Ajustes, "Solo esta vez", revocación automática por no uso, reinstalación) y un valor guardado "para siempre" queda desactualizado. La fuente de verdad es el sistema: hay que consultarlo cada vez que se va a usar el recurso o al volver a primer plano.

---

## Parte F · Buenas prácticas y tiendas

### F1. Pedir en contexto

| App y permiso | ¿Cuándo pedirlo? | Alternativa si lo deniegan |
| --- | --- | --- |
| Delivery · ubicación | Al tocar "Usar mi ubicación actual" en la dirección de entrega. | Escribir la dirección a mano o elegir una guardada. |
| Billetera virtual · cámara | Al tocar "Pagar con QR". | Ingresar el código/alias del comercio a mano. |
| Red social · contactos | Al tocar "Buscar amigos de mi agenda". | Buscar personas por nombre de usuario o compartir un link de invitación. |
| Mensajería · micrófono | Al mantener presionado el botón de nota de voz por primera vez. | Escribir el mensaje de texto. |
| Turnos médicos · notificaciones | Después de confirmar un turno: "¿Te avisamos un día antes?". | Recordatorios dentro de la app, agregar al calendario o recibir aviso por mail/SMS. |
| Editor de fotos · galería completa | Al abrir la sección "Mi galería" del editor. | Elegir fotos sueltas con el selector del sistema (o acceso limitado). |

Pedir cuatro permisos apenas se abre la app "entrena el No permitir automático" porque la persona todavía no sabe para qué sirve la app ni recibe un beneficio inmediato: ve una ráfaga de diálogos sin contexto, aprende a cerrarlos con "No permitir" y, como en iOS solo hay una oportunidad (y dos en Android), esos permisos quedan bloqueados para cuando realmente hagan falta.

### F2. La pantalla previa

**a)** (1) El **beneficio** concreto en una frase ("Usamos tu cámara para leer el QR del aula"); (2) un **único botón** "Continuar" que dispara el diálogo del sistema; (3) la **aclaración** de que se puede cambiar después en Ajustes (y, si aplica, que hay una alternativa).

**b)** Porque el botón no concede nada: solo lleva al diálogo real del sistema, donde la persona decide. Decir "Permitir" sería engañoso (haría creer que ya aceptó) y además Apple lo considera un patrón que manipula la decisión.

**c)** La pauta 5.1.1(iv) dice que la app debe respetar la decisión de la persona y **no puede manipularla ni obligarla**; en la pantalla previa, el botón para continuar debe usar una palabra neutra como "Continuar" o "Siguiente", y no hay que poner botones de salida como "Ahora no", "Cerrar" o "Saltar" que lleven a la persona a evitar el diálogo del sistema: la decisión se toma en el diálogo, no en la pantalla previa.

**d)** Si el permiso ya está bloqueado, mostrar el diálogo es imposible: la pantalla explica que el permiso está desactivado, indica **el camino exacto en Ajustes** (p. ej. "Ajustes › Apps › Mantenimiento IPF › Permisos › Cámara") y el botón pasa a ser **"Abrir Ajustes"** (`Linking.openSettings()`), junto con la alternativa para seguir sin ese permiso.

### F3. Mínimo privilegio

**a)** **Aproximada**: para saber qué puntos de reciclaje están en el barrio alcanzan ~3 km²; no hace falta la posición exacta.

**b)** **En uso**: mientras la carrera está en curso se puede usar un servicio en primer plano (Android: notificación persistente "Registrando carrera"; iOS: indicador de ubicación activo), que cuenta como "en uso" aunque el celular esté bloqueado en el bolsillo. "Siempre" solo haría falta para registrar sin que la persona inicie nada.

**c)** **Selector del sistema**: se elige una sola foto, no hace falta acceso a toda la galería.

**d)** **Sin micrófono**: escanear un QR no graba sonido; `microphonePermission: false` y `recordAudioAndroid: false`.

### F4. Tiendas

**a)**

- Google Play: (1) completar la sección **Seguridad de los datos** (*Data safety*) declarando qué datos se recolectan y para qué; (2) completar la **Declaración de permisos** para permisos sensibles (ubicación en segundo plano, `READ_MEDIA_*`, SMS/registro de llamadas, `MANAGE_EXTERNAL_STORAGE`) con justificación y video; además, cumplir el `targetSdkVersion` mínimo y publicar una política de privacidad.
- App Store: (1) **textos de propósito** claros en el Info.plist para cada API protegida (pauta 5.1.1); (2) **etiquetas de privacidad** ("Privacy Nutrition Labels") en App Store Connect y el **manifiesto de privacidad** con las *Required Reason APIs*; además, pedir ATT antes de rastrear entre apps y ofrecer borrado de cuenta.

**b)** `PrivacyInfo.xcprivacy` es un archivo que declara qué tipos de datos recolecta la app (y sus SDKs), si rastrea, a qué dominios de rastreo se conecta y **por qué motivo** usa las *Required Reason APIs* (p. ej. `UserDefaults`, fecha de archivos, espacio en disco). Apple lo exige desde mayo de 2024. En Expo se configura en `app.json` con `expo.ios.privacyManifests` (`NSPrivacyAccessedAPITypes`, `NSPrivacyCollectedDataTypes`, `NSPrivacyTracking`, etc.); `prebuild` genera el archivo.

**c)** Android 17 suma un **selector de contactos del sistema** (Contact Picker) que permite compartir solo los contactos (y campos) que la persona elige, sin dar acceso a toda la agenda, siguiendo el mismo modelo que el selector de fotos. Google Play, desde el **27/01/2027**, va a exigir que las apps que hoy piden `READ_CONTACTS` usen ese selector cuando solo necesiten contactos puntuales; solo podrán conservar `READ_CONTACTS` las apps cuya función central lo requiera, completando una **declaración de permisos** en Play Console y justificando el uso.

### F5. Errores comunes

**a)** *Causa:* falta la clave `NS…UsageDescription` del recurso en el `Info.plist` (por ejemplo, no se configuró el plugin del módulo en `app.json` o no se volvió a compilar). *Solución:* agregar el texto en el plugin (`cameraPermission`, `locationWhenInUsePermission`, …) o en `ios.infoPlist`, y generar una **nueva build** (no alcanza con OTA).

**b)** *Causa:* en Expo Go el permiso existe porque Expo Go lo declara; en tu development build el permiso **no está declarado** (falta el plugin, o se lo bloqueó con `blockedPermissions`, o no se reconstruyó tras cambiar `app.json`), o ya quedó bloqueado de una prueba anterior. *Solución:* revisar `app.json` (plugin `expo-camera` con `cameraPermission`), revisar el manifiesto/Info.plist generado con `npx expo prebuild --clean`, recompilar e instalar de nuevo (o resetear el permiso).

**c)** *Causa:* la app guardó el estado viejo y no vuelve a consultar al volver a primer plano. *Solución:* volver a llamar a `get…PermissionsAsync()` cuando `AppState` pasa a `active` (hook `useRevisarAlVolver`), y no persistir el estado del permiso.

**d)** *Causa:* `request…()` se llama en el cuerpo del componente (o en un efecto que se dispara en cada render); cada respuesta actualiza el estado, provoca otro render y otro pedido, y con `canAskAgain: false` nunca hay diálogo. *Solución:* consultar con `get…` al montar y llamar a `request…` **solo** en respuesta a una acción de la persona (tocar "Continuar"), manejando los cuatro estados.

**e)** *Causa:* se trató un permiso opcional como obligatorio (bloquea toda la app). *Solución:* la app tiene que funcionar sin notificaciones: pedirlas en contexto (al activar los recordatorios), y si se deniegan ofrecer una alternativa (bandeja de avisos dentro de la app, recordatorio en el calendario, mail) sin impedir el acceso a ninguna pantalla.
