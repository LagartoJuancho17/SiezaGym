# 🏋️‍♂️ SiezaGym — Plataforma SaaS de Entrenamiento & App iOS

**SiezaGym** es una plataforma integral de entrenamiento de fuerza, hipertrofia y acondicionamiento físico diseñada para atletas, entrenadores y administradores. Combina una **aplicación web moderna (Next.js 16)** con una **aplicación nativa de iPhone (SwiftUI / iOS 18+)**, ambas conectadas en tiempo real a la misma base de datos **Firebase Firestore**.

Toda la lógica de entrenamiento, cálculo de marcas (1RM), registro de series, distribución de grupos musculares y seguimiento de progreso es compartida y coherente entre plataformas: lo que registrás en el gimnasio desde el iPhone impacta inmediatamente en la web y viceversa.

---

## 📑 Tabla de Contenidos

1. [Visión General y Roles](#-visión-general-y-roles)
2. [Stack Tecnológico de la Web](#-stack-tecnológico-de-la-web)
3. [Arquitectura y Cómo Funciona la Web](#-arquitectura-y-cómo-funciona-la-web)
4. [Funcionalidades de la Web](#-funcionalidades-de-la-web)
   - [Para el Alumno / Atleta](#1-experiencia-del-alumno--atleta)
   - [Para el Entrenador (Coach Workspace)](#2-panel-del-entrenador-coach-workspace)
   - [Para el Administrador (Admin Panel)](#3-panel-de-administración-admin-panel)
5. [Cómo Funciona la App de iPhone (iOS Nativa)](#-cómo-funciona-la-app-de-iphone-ios-nativa)
   - [Tecnologías y Estructura](#tecnologías-y-arquitectura-de-ios)
   - [Integraciones Clave (Salud, Widgets, Dynamic Island)](#integraciones-clave-en-ios)
   - [Entrenamiento en Vivo y Ejercicios Propios](#entrenamiento-en-vivo-y-ejercicios-propios)
6. [Modelo de Datos en Firestore](#-modelo-de-datos-en-firestore)
7. [Fórmulas y Lógica de Dominio](#-fórmulas-y-lógica-de-dominio)
8. [Estructura del Proyecto](#-estructura-del-proyecto)
9. [Guía de Puesta en Marcha Local](#-guía-de-puesta-en-marcha-local)
   - [Instalación de la Web](#desarrollo-web)
   - [Instalación de la App iOS](#desarrollo-ios)
10. [Testing y Control de Calidad](#-testing-y-control-de-calidad)

---

## 👥 Visión General y Roles

SiezaGym opera con un modelo de tres roles con permisos granulares y vistas adaptadas a cada necesidad:

1. **Atleta / Alumno**:
   - Gestiona sus propias rutinas o entrena con las rutinas asignadas por su entrenador.
   - Ejecuta entrenamientos interactivos con cronómetro, descansos sonoros/hápticos y registro de peso, reps y series al fallo.
   - Analiza su evolución con gráficos de volumen semanal, racha, distribución muscular y récords personales (1RM).
   - Se vincula a un entrenador mediante un código de invitación seguro.
2. **Entrenador / Coach**:
   - Panel de control de alumnos en escritorio y móvil.
   - Generación de códigos únicos de vinculación de 6 caracteres.
   - Inspección profunda del progreso del alumno: volumen, sesiones históricas, cargas y repeticiones serie por serie.
   - Asignación de rutinas de su biblioteca personal a alumnos específicos con notas personalizadas y seguimiento por semanas.
3. **Administrador**:
   - Centro de operaciones restringido a emails autorizados en lista blanca y protegido en Firestore.
   - Monitoreo en tiempo real de métricas operativas (usuarios activos, sesiones totales, retención a 30 días).
   - Auditoría del catálogo maestro de ejercicios y cobertura de medios visuales (GIFs demostrativos).
   - Supervisión de seguridad y actividad del sistema.

---

## 🛠 Stack Tecnológico de la Web

La aplicación web está desarrollada sobre las últimas especificaciones del ecosistema React y Node:

### Frontend
- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) con Server Components (RSC) y Server Actions.
- **Librería UI**: [React 19](https://react.dev/).
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) combinado con un sistema de diseño propio modular (**Design2 / Sistema SIEZA**), implementado en CSS puro con soporte para temas variables (**Plata**, **Noche**, **Brasa**), Glassmorphism, y layouts responsivos con Split-View para escritorio.
- **Gráficos & Visualización**: [Recharts](https://recharts.org/) para visualización interactiva de volumen semanal y curvas de 1RM; [react-muscle-highlighter](https://github.com/) para visualización anatómica interactiva del impacto muscular.
- **Interacciones & Drag-and-Drop**: [@dnd-kit/core](https://dndkit.com/) y `@dnd-kit/sortable` para la reordenación fluida de ejercicios en el creador de rutinas.
- **Tipografía & Assets**: Geist y fuentes optimizadas del sistema; GIFs animados optimizados de demostración de técnica para cada ejercicio del catálogo.

### Backend & Persistencia
- **Base de Datos**: [Cloud Firestore](https://firebase.google.com/docs/firestore) con reglas de seguridad estrictas (`firestore.rules`) basadas en identidad y relaciones coach-alumno.
- **Autenticación**:
  - [Firebase Authentication Client SDK v12](https://firebase.google.com/docs/auth) para login con Google y Email.
  - [Firebase Admin SDK v14](https://firebase.google.com/docs/admin/setup) para validación de sesiones server-side mediante cookies `HTTP-only` seguras (`__session`).
  - Flujo de verificación de doble factor (MFA) por email con tokens transitorios de 6 dígitos enviados mediante [Resend](https://resend.com/).
- **Web APIs Avanzadas**:
  - **Media Session API**: Integración con controles de audio y pantalla de bloqueo del navegador/dispositivo durante el entrenamiento activo.
  - **Web Audio API & Vibration API**: Retroalimentación sonora y háptica al completar los descansos o registrar series.

### Testing & Tooling
- **Test Runner**: [Vitest 5](https://vitest.dev/) con más de 45 suites de pruebas unitarias y de integración de lógica de negocio, workflows y renderizado.
- **Linter**: ESLint v9 con configuración para Next.js.
- **Scripts de Seed**: Migración e inserción del catálogo global de ejercicios verificado mediante Firebase Admin SDK (`scripts/seedExercises.mjs`).

---

## 🏛 Arquitectura y Cómo Funciona la Web

### 1. Autenticación y Ciclo de Sesión
- El acceso se realiza mediante **Email y Contraseña** o **Google OAuth 2.0**.
- Al iniciar sesión con éxito en el cliente, se emite una solicitud interna a `/api/session/login` que genera una **Cookie de Sesión HTTP-only** de Firebase (`__session`).
- Los Server Components leen la sesión de forma nativa mediante `getCurrentUser()` en `lib/firebase/session.js`, permitiendo renderizado en el servidor sin destellos de carga ni redirecciones cliente innecesarias.
- Si un usuario tiene rol de Coach o Admin y accede desde una pantalla de escritorio, el middleware y el punto de entrada lo redirigen de forma inteligente a su espacio de trabajo correspondiente (`/dashboard/coach` o `/admin`).

### 2. Capa de Servicios y Abstracción de Datos (`lib/`)
La lógica de negocio está completamente separada de las vistas:
- `lib/routines/`: Creación, edición, duplicación, prescripciones parecidas vs rampa por serie, y ordenamiento de rutinas.
- `lib/workout/`: Estado activo del entrenamiento, temporizadores, sonido y cálculo de volumen.
- `lib/sessions/`: Registro de entrenamientos finalizados, cálculo de rachas continuas y estadísticas semanales.
- `lib/coach/`: Gestión de invitaciones, desvinculación y lectura de perfiles de alumnos.
- `lib/epley.js`: Algoritmo matemático unificado para la estimación de 1RM.
- `lib/home/metrics.js`: Ponderación de esfuerzo, cálculo de calorías (fórmula MET) y balance empuje/tracción.

---

## ⚡ Funcionalidades de la Web

### 1. Experiencia del Alumno / Atleta

#### 🏠 Portada Inteligente (`/`)
- **Titular dinámico**: Identifica cuál es la rutina prioritaria según el día y último uso ("*Hoy toca Empuje A.*"), ofreciendo acceso de 1 toque a entrenar.
- **Métricas semanales**:
  - Kilos levantados en la semana actual y comparación con la mejor semana histórica.
  - Calorías estimadas quemadas (cálculo MET 5.0 con peso real o default 75 kg) vs. objetivo semanal.
  - Porcentaje de series completadas.
- **Semana de entrenamiento**: Visualización de los 7 días con marcas de actividad y racha actual de días seguidos entrenando.
- **Carrusel de rutinas**: Acceso rápido a rutinas propias y asignadas por el coach, ordenadas por frecuencia de uso.

#### 📋 Gestor de Rutinas (`/rutinas` y `/rutinas/nueva`)
- **Doble fuente de rutinas**: Muestra rutinas propias creadas por el usuario y rutinas oficiales asignadas por su entrenador (claramente etiquetadas).
- **Creador y Editor de Rutinas (`RoutineComposer`)**:
  - Búsqueda en catálogo de 94 ejercicios con filtros por grupo muscular y equipamiento.
  - Creación de **ejercicios personalizados propios** (`customExercises`) especificando nombre, músculos implicados, patrón motor y equipamiento.
  - Prescripción flexible:
    - *Pareja*: Mismo peso y repeticiones para todas las series (ej. `4 × 10`).
    - *Serie por serie (Rampas)*: Peso y repeticiones personalizados para cada serie (ej. `12 reps @ 60kg`, `10 reps @ 70kg`, `8 reps @ 80kg`).
  - Notas de técnica por ejercicio y agrupación en superseries/bloques con colores.
  - Reordenamiento interactivo con Drag and Drop (`@dnd-kit`).
- **Acciones avanzadas**: Duplicar rutinas, ocultar/mostrar en la portada, editar o eliminar.

#### ⏱ Modo Entrenamiento Activo (`/rutinas/[id]`)
- **Pantalla Unificada (`RoutineScreen`)**: El detalle de la rutina y la sesión en vivo conviven en la misma interfaz:
  - Al iniciar sesión, se despliega el primer ejercicio y se activa el cronómetro general.
  - **Temporizador de descanso interactivo**: Cuenta regresiva entre series con sonido y vibración háptica al finalizar.
  - **Control de series**: Marcado de serie completada, registro de peso levantado, repeticiones y toggle para marcar series al fallo.
  - **Flujo guiado**: Al completar un ejercicio se pliega automáticamente y se expande el siguiente para evitar fatiga de scroll.
  - **Persistencia ante recarga**: Guarda el estado en `localStorage` (`activeWorkout`); si se cierra la pestaña accidentalmente, el entrenamiento no se pierde.
  - **Integración con Media Session**: Control de pausa/reanudación y visualización del ejercicio en los controles multimedia de la pantalla bloqueada.
  - Al finalizar, calcula el tonelaje total (kg), tiempo efectivo y lo persiste en Firestore en `/sessions`.

#### 📈 Historial y Progreso (`/historial` y `/progreso`)
- **Historial Completo**: Registro de cada sesión con fecha, hora, duración, volumen y series. Al abrir una sesión (`/historial/[id]`), se detalla cada serie, peso, reps y el 1RM estimado alcanzado.
- **Dashboard de Progreso (`/progreso`)**:
  - Gráfico de barras de volumen semanal de las últimas 12 semanas.
  - Grilla de consistencia de 26 semanas (estilo mapa de calor).
  - Reparto de volumen por grupo muscular y ratio de balance empuje vs. tracción (*Push/Pull*).
  - Lista de ejercicios con su evolución reciente.
- **Detalle de Ejercicio Individual (`/progreso/[exerciseId]`)**:
  - Curva de evolución histórica del 1RM estimado con gráfico Recharts.
  - Identificación visual de **Récords Personales (PR)**.
  - Tabla de todas las sesiones históricas en las que se realizó dicho ejercicio.

#### ⚙️ Perfil y Configuración (`/perfil`)
- Modificación de nombre, peso corporal y objetivo de calorías semanales.
- Historial total: Entrenamientos finalizados, series acumuladas y racha histórica.
- Selector de tema de interfaz: **SIEZA / Noche** (oscuro profundo), **Plata** (glassmorphism claro/plateado) y **Brasa** (acento vibrante).
- Vinculación con el entrenador: Campo para canjear el código de invitación provisto por el profesor.

---

### 2. Panel del Entrenador (Coach Workspace)

Ubicado en `/dashboard/coach`, optimizado para escritorio y accesible para usuarios con `isCoach: true`:
- **Roster de Alumnos**:
  - Lista de todos los alumnos vinculados, con su avatar, última fecha de entrenamiento y estado de actividad.
  - Acceso directo a desvincular alumnos en caso de finalizar el servicio.
- **Generador de Códigos de Invitación**:
  - Generación de códigos alfanuméricos únicos de 6 caracteres con botón de copiado directo al portapapeles.
  - Capacidad de regenerar el código (invalidando el anterior de forma inmediata).
- **Ficha Detallada del Alumno (`/dashboard/coach/alumnos/[studentId]`)**:
  - Consulta de perfil, peso y estadísticas globales del alumno.
  - Gráfico de volumen reciente del alumno.
  - Inspección del historial real de entrenamientos del alumno con pesos, repeticiones y marcas logradas.
  - **Asignación de Rutinas**: El coach puede asignar cualquier rutina de su propia biblioteca al alumno, asignándole opcionalmente un número de semana (ej. `Semana 3`) y notas específicas.

---

### 3. Panel de Administración (Admin Panel)

Ubicado en `/admin`, accesible únicamente para los correos configurados como administradores:
- **Resumen Ejecutivo (Health Check)**:
  - Usuarios registrados totales y nuevos en los últimos 30 días.
  - Usuarios activos (con logins recientes).
  - Cantidad total de sesiones de entrenamiento registradas en la plataforma.
  - Entrenadores registrados y total de asignaciones activas.
- **Explorador de Entidades**:
  - Tabla de usuarios recientes con roles y métodos de autenticación.
  - Lista de entrenadores y volumen de alumnos.
  - Últimas sesiones de entrenamiento completadas en todo el sistema.
- **Auditoría del Catálogo de Ejercicios**:
  - Conteo de ejercicios verificados con y sin soporte multimedia (GIFs de técnica).
  - Distribución por patrones de movimiento y tipos de equipamiento.

---

## 📱 Cómo Funciona la App de iPhone (iOS Nativa)

La carpeta `/ios` contiene la aplicación nativa en **SwiftUI** para el alumno. Habla directamente con **el mismo Firebase Firestore que la web**, sin capas intermedias ni bases de datos duplicadas.

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│       SiezaGym Web (Next.js)    │       │     SiezaGym iOS (SwiftUI)      │
│  - App Router                   │       │  - Swift 6 / iOS 18+            │
│  - React 19                     │       │  - ActivityKit & WidgetKit      │
│  - Firebase Client & Admin SDK  │       │  - HealthKit (Apple Salud)      │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 │          Firebase Firestore             │
                 └──────────────►  & Auth  ◄───────────────┘
```

### Tecnologías y Arquitectura de iOS
- **Lenguaje y Concurrencia**: Swift 6 bajo modo de concurrencia estricta (`SWIFT_DEFAULT_ACTOR_ISOLATION = YES`, Main Actor por defecto).
- **Framework UI**: SwiftUI puro con soporte para iOS 18+.
- **Gestor de Paquetes**: Swift Package Manager (SPM) integrando `firebase-ios-sdk` (v12) y `GoogleSignIn-iOS` (v9).
- **Generación del Proyecto**: **XcodeGen** mediante `project.yml`. Toda la configuración de compilación, targets, bundles y capacidades se gestiona desde el archivo YAML para evitar conflictos de merge en `.pbxproj`.
- **Estructura en Capas**:
  - `Models/`: Modelos de datos inmutables y conformes a `Sendable` (`Exercise`, `Routine`, `WorkoutSession`, `UserProfile`).
  - `Domain/`: Funciones matemáticas y reglas de negocio puras, sin dependencias de Firestore ni SwiftUI (port idéntico de `lib/` de la web: `HomeMetrics`, `Epley`, `TrainingCalendar`, `RoutineSummary`, `RestTimer`).
  - `Services/`: Repositorio de Firestore (`GymRepository`), servicio de autenticación y estado reactivo global (`GymStore`).
  - `DesignSystem/`: Paleta SIEZA sincronizada con el CSS de la web mediante `ios/scripts/sync-theme.mjs`.
  - `Features/`: Pantallas modulares (Inicio, Rutinas, Entrenamiento, Historial, Progreso, Perfil).
  - `SiezaGymWidgets/`: Extensión de widgets y actividades en vivo.

### Integraciones Clave en iOS

#### 1. Pantalla de Bienvenida (Onboarding Fotográfico)
- En la primera apertura tras la instalación, la app muestra un recorrido de tres escenas en blanco y negro con la estética de SIEZA, explicando el armado de rutinas, el registro de series y la conexión opcional con Apple Salud.
- Se almacena el estado completado en `UserDefaults` (`sieza.onboarding.completed.v1`).

#### 2. Apple Salud (HealthKit)
- En la pantalla de Inicio, la tarjeta `Actividad de hoy` se conecta a HealthKit para leer:
  - Calorías activas quemadas en el día (`activeEnergyBurned`).
  - Pasos realizados (`stepCount`).
  - Distancia caminando / corriendo (`distanceWalkingRunning`).
- La app opera con **permisos exclusivos de lectura**; no escribe ni altera datos en la app Salud de Apple.

#### 3. Actividad en Vivo (Live Activities) & Dynamic Island
- Al iniciar un entrenamiento, se activa una `Activity<WorkoutActivityAttributes>` de ActivityKit:
  - **Dynamic Island**: Muestra el icono de entrenamiento, el ejercicio actual y un cronómetro en tiempo real manejado directamente por el sistema operativo (`Text(timerInterval:)`), lo que garantiza cero consumo excesivo de batería.
  - **Pantalla Bloqueada**: Widget interactivo con la serie actual (`Serie 2 de 4`), el peso y las repeticiones.
  - **Interactividad Directa (`TerminarSerieIntent`)**: El usuario puede pulsar el botón de "*Terminar serie*" directamente desde la Dynamic Island o la pantalla de bloqueo para registrar la serie sin desbloquear el teléfono.

#### 4. Widgets para Pantalla de Inicio y Bloqueo (WidgetKit)
- Widgets disponibles en formato pequeño y mediano:
  - **Racha**: Días continuos entrenados.
  - **Hoy**: Rutina programada para el día, volumen acumulado y estado de la semana.
- **Solución técnica para cuentas gratuitas de Apple Developer**:
  - Apple exige cuenta paga de desarrollador para la capacidad de `App Groups`.
  - SiezaGym utiliza un **Grupo de Llavero Compartido (Keychain Access Group)** (`SnapshotStore`) con atributo `kSecAttrAccessibleAfterFirstUnlock`. La app principal deposita un snapshot ligero de datos y el widget lo consume instantáneamente sin requerir sesión de Firebase ni exceder los límites de memoria de WidgetKit.

#### 5. Entrenamiento en Vivo y Ejercicios Propios
- **Temporizador de Descanso (`RestTimer.swift`)**: Se inicia en 90 segundos entre series y se sincroniza con el estado de la rutina.
- **Decodificación de GIFs**: `AsyncImage` no anima GIFs remotos en iOS. La app utiliza ImageIO nativo para extraer los frames y renderizarlos mediante `UIImageView` con caché en memoria.
- **Creador de Ejercicios Propios con Video de YouTube**:
  - Permite crear ejercicios no existentes en el catálogo.
  - En lugar de sliders complejos, el usuario asigna la carga muscular tocando los grupos (ponderación 1×, 2×, 3× que la app normaliza automáticamente a 1.0).
  - Permite pegar un link de YouTube; la app limpia los parámetros de rastreo y utiliza la miniatura oficial de YouTube (`img.youtube.com/vi/<id>/mqdefault.jpg`).

---

## 🗄 Modelo de Datos en Firestore

| Colección / Ruta | Descripción | Acceso / Reglas de Seguridad |
| :--- | :--- | :--- |
| `/users/{uid}` | Perfil de usuario, peso corporal, rol, referencias al coach. | Lectura: propio usuario o coach vinculado. Escritura: propio usuario (protegiendo campos de rol). |
| `/users/{uid}/customExercises` | Ejercicios propios creados por el usuario. | Lectura: propio usuario o su coach. Escritura: propio usuario (validando estructura muscular). |
| `/exercises/{exerciseId}` | Catálogo maestro de 94 ejercicios (nombre, músculos, GIFs, equipamiento). | Lectura: todos los usuarios autenticados. Escritura: restringida (solo Admin SDK). |
| `/routines/{routineId}` | Rutinas creadas por atletas o entrenadores. | Lectura y escritura: únicamente el propietario (`ownerId == auth.uid`). |
| `/assignments/{assignmentId}` | Rutinas congeladas asignadas de un entrenador a un alumno. | Lectura: entrenador o alumno asignado. Escritura: únicamente el entrenador vinculado. |
| `/sessions/{sessionId}` | Registro inmutable de entrenamientos completados con detalle serie por serie. | Lectura: atleta propietario o su entrenador. Creación: atleta autenticado (máx 40 ejercicios). |
| `/coaches/{coachId}/students/{studentId}` | Registro de relación formal entre profesor y alumno. | Lectura: entrenador propietario. Escritura: sólo transacciones seguras del servidor. |
| `/invites/{code}` | Códigos temporales de 6 caracteres para vinculación. | Lectura: autenticados. Creación: entrenador autenticado. Canje: Server Action seguro. |
| `/mfaChallenges/{challengeId}` | Desafíos OTP de 6 dígitos para autenticación por correo. | Acceso totalmente bloqueado a clientes. Solo gestionado por Firebase Admin SDK. |

---

## 🧮 Fórmulas y Lógica de Dominio

La plataforma implementa algoritmos idénticos en JavaScript (`lib/`) y Swift (`Domain/`):

1. **Estimación de 1RM (Fórmula de Epley)**:
   $$\text{1RM} = \text{Peso} \times \left(1 + \frac{\text{Reps}}{30}\right)$$
   *(Si $\text{Reps} = 1$, $\text{1RM} = \text{Peso}$. Las series marcadas como falladas se excluyen).*

2. **Gasto Calórico Estimado (MET)**:
   $$\text{Calorías (kcal)} = \text{MET (5.0)} \times \text{Peso (kg)} \times \text{Horas de entrenamiento}$$
   *(Si el perfil no registra peso, se utiliza un estándar de 75 kg con advertencia visible en UI).*

3. **Reparto y Distribución Muscular**:
   Cada ejercicio almacena un diccionario `muscleWeights` que suma `1.0`. El impacto de una sesión en cada grupo muscular se calcula multiplicando el tonelaje levantado ($\text{Peso} \times \text{Reps}$) por el coeficiente de participación de cada músculo.

4. **Cálculo de Racha (Streak)**:
   Basado en días locales consecutivos con al menos una sesión terminada. Los cálculos normalizan la fecha a la zona horaria de Argentina (`America/Argentina/Buenos_Aires`).

---

## 📁 Estructura del Proyecto

```text
SiezaGym/
├── app/                           # Next.js 16 App Router
│   ├── (app)/                     # Rutas privadas de la aplicación
│   │   ├── page.js                # Portada / Home del atleta
│   │   ├── rutinas/               # Listado, nueva rutina y [id] detalle/entrenamiento
│   │   ├── historial/             # Listado de entrenamientos y [id] detalle de sesión
│   │   ├── progreso/              # Dashboard de progreso y [exerciseId] evolución 1RM
│   │   ├── perfil/                # Perfil, ajustes de tema y vinculación con coach
│   │   └── layout.js              # Layout base con temas y estilos
│   ├── admin/                     # Panel de operaciones del Administrador
│   ├── dashboard/coach/           # Panel del Entrenador (Roster, alumnos, invitaciones)
│   ├── api/                       # Endpoints HTTP (MFA, sesión con cookies)
│   ├── globals.css                # Estilos globales y tokens base
│   └── design2.css                # Sistema de diseño SIEZA / Design2
├── components/                    # Componentes modulares de React
│   ├── design2/                   # Componentes visuales del sistema SIEZA (Header, TabBar, etc.)
│   ├── coach/                     # Vistas y componentes del entrenador
│   ├── progress/                  # Gráficos Recharts y tablas de marcas
│   └── routines/                  # Creadores de rutinas y formularios de ejercicios
├── lib/                           # Lógica de dominio pura y servicios backend
│   ├── admin/                     # Métricas y control de acceso de admin
│   ├── assignments/               # Lógica de asignación de rutinas coach-alumno
│   ├── coach/                     # Invitaciones y vinculación
│   ├── exercises/                 # Catálogo global y categorización de ejercicios
│   ├── firebase/                  # Configuración de Firebase Client y Firebase Admin SDK
│   ├── home/                      # Métricas de la portada y volumen semanal
│   ├── routines/                  # Prescripciones, cálculo de duración y armado
│   ├── sessions/                  # Gestión de sesiones y algoritmo de racha
│   └── epley.js                   # Algoritmo de 1RM
├── ios/                           # Aplicación Nativa para iPhone (SwiftUI)
│   ├── project.yml                # Especificación declarativa del proyecto (XcodeGen)
│   ├── SiezaGym/                  # Código fuente de la app nativa
│   │   ├── Models/                # Entidades Sendable de Swift
│   │   ├── Domain/                # Lógica de negocio pura (HomeMetrics, Epley, etc.)
│   │   ├── Services/              # GymRepository, GymStore, Firebase iOS SDK
│   │   ├── DesignSystem/          # Tokens SIEZA sincronizados
│   │   └── Features/              # Vistas SwiftUI por pestaña y pantalla
│   ├── SiezaGymCompartido/        # Código compartido entre App y Extensión de Widgets
│   ├── SiezaGymWidgets/           # WidgetKit y Live Activities (Dynamic Island)
│   ├── SiezaGymTests/             # Tests unitarios en Swift
│   └── scripts/                   # Scripts de sincronización de temas, configs y build
├── firestore.rules                # Reglas de seguridad para Firestore
├── scripts/seedExercises.mjs      # Script de migración y siembra de catálogo de ejercicios
├── tests/                         # Suites de pruebas con Vitest
└── package.json                   # Dependencias y scripts de Node
```

---

## 🚀 Guía de Puesta en Marcha Local

### Desarrollo Web

#### 1. Requisitos Previos
- Node.js 20+ instalado.
- Cuenta de Firebase con un proyecto activo (Authentication + Cloud Firestore).

#### 2. Variables de Entorno
Crear un archivo `.env.local` en la raíz del proyecto con la siguiente configuración:

```ini
# Firebase Client SDK
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_app_id

# Firebase Admin SDK (Server-Side)
FIREBASE_PROJECT_ID=tu_proyecto_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@tu_proyecto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\ntu_clave_privada\n-----END PRIVATE KEY-----"

# Proveedor de Correo para MFA (Opcional en desarrollo local)
RESEND_API_KEY=re_tu_clave_resend
RESEND_FROM="SiezaGym <seguridad@tu-dominio.com>"
```

#### 3. Instalación y Ejecución
```bash
# Instalar dependencias
npm install

# Sembrar el catálogo de 94 ejercicios en Firestore (solo la primera vez)
npm run seed:exercises

# Iniciar el servidor de desarrollo
npm run dev
```
La aplicación web estará disponible en [http://localhost:3000](http://localhost:3000).

---

### Desarrollo iOS

#### 1. Requisitos Previos
- Mac con macOS Sonoma o Sequoia y **Xcode 16+**.
- Homebrew instalado (`brew install xcodegen`).

#### 2. Generar Configuración de Firebase para iOS
Para evitar exponer claves privadas en repositorios públicos, el archivo `GoogleService-Info.plist` se descarga dinámicamente usando las credenciales del Admin SDK ya configuradas en el entorno:

```bash
# Desde la raíz del repositorio:
node --env-file=.env --env-file=.env.local ios/scripts/fetch-google-service-info.mjs
```

#### 3. Generar y Abrir el Proyecto en Xcode
```bash
cd ios
xcodegen generate
open SiezaGym.xcodeproj
```

#### 4. Ejecutar en un iPhone Físico
Para desplegar en un dispositivo real con cuenta de desarrollador gratuita:
```bash
cp Local.example.xcconfig Local.xcconfig
# Editar Local.xcconfig e ingresar tu Apple Development Team ID

./scripts/run-on-device.sh
```
*(En el iPhone, aprobar el certificado de desarrollador en: Ajustes › General › VPN y gestión de dispositivos › Confiar en el desarrollador).*

---

## 🧪 Testing y Control de Calidad

### Tests de la Aplicación Web (Vitest)
Se cuenta con 47 archivos de test que validan flujos completos, seguridad y cálculos:
```bash
# Correr todas las suites de prueba
npm run test

# Verificar linter de código
npm run lint

# Validar compilación de producción
npm run build
```

### Tests de la Aplicación iOS (Swift Testing / XCTest)
Pruebas unitarias de las funciones puras de `Domain/`, cálculo de 1RM, sincronización de temas y widgets:
```bash
xcodebuild test -project ios/SiezaGym.xcodeproj -scheme SiezaGym \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro'
```

---

## 📄 Licencia

Proyecto desarrollado en el marco de la carrera de Programación (UMAI) para la materia Programación 3.  
Diseñado y construido por **Tobías Arraiza** y **Valentín Sierra**. Todos los derechos reservados.
