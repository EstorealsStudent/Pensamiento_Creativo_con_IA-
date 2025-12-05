# Proyecto: Pipeline Asíncrono Creativo en JavaScript (Mini Proyecto IA)

Este repositorio contiene la solución completa del mini‑proyecto **CT - Pensamiento Creativo con IA | Javascript con IA**, siguiendo las cuatro fases requeridas: pensamiento divergente, desafío del sesgo, evaluación y presentación visual.

---

## 🧠 1. Descripción del Concepto de JavaScript Elegido
El concepto que se trabajó fue **control de flujo asíncrono en JavaScript**, específicamente cómo manejar código asíncrono más allá de `async/await`.

Para desafiar prácticas estándar, se implementó un flujo completo usando:
- **Generators**
- **Un runner personalizado** que pausa y reanuda ejecución
- **Promesas envueltas con timeout**
- **Concurrencia limitada**

El tema creativo elegido fue **música**, creando una "pipeline" que carga pistas, aplica efectos y mezcla resultados.

---

## 🎨 2. Fase 1: Pensamiento Divergente
Se pidió a la IA generar ideas que combinaran JavaScript asíncrono con temas no relacionados. Entre opciones como arte, deportes y música, se seleccionó la idea de una *pipeline musical asíncrona*.

Se incluyen las capturas o transcripciones de prompts correspondientes (agregar en el PDF o repo):
- `screenshots/prompt-fase1-ideas.png`
- `screenshots/prompt-fase1-seleccion.png`

---

## 🚫 3. Fase 2: Desafío del Sesgo (Enfoque Prohibido)
Se pidió a la IA un enfoque que evitara completamente:
- `async`
- `await`
- `.then()` encadenados comunes

El enfoque seleccionado fue usar **Generators + Runner personalizado**, logrando código que se lee de forma secuencial sin las abstracciones típicas.

El código generado inicialmente está en:
- `src/pipeline-original.js`

---

## 🔍 4. Fase 3: Revisión, Optimización y Evaluación con IA
La IA revisó el código inicial e identificó mejoras:

### ✔ Mejora 1 — `withTimeout()`
Se implementó un wrapper para evitar que operaciones asíncronas se cuelguen indefinidamente.

### ✔ Mejora 2 — `parallelLimit()`
Se implementó un sistema de concurrencia controlada, permitiendo cargar varias pistas sin saturar recursos.

El código final con optimizaciones se encuentra en:
- `src/pipeline-final.js`

---

## 📊 5. Fase 4: Presentación Visual (IA Generativa)
Se generó un diagrama Mermaid que describe visualmente el pipeline asíncrono:

```
flowchart TD
  A[Start] --> B[runner inicia generator]
  B --> C{yield load tasks}
  C -->|parallelLimit| D[loadTrack guitar]
  C -->|parallelLimit| E[loadTrack drums]
  D --> F[applyEffect guitar]
  E --> G[applyEffect drums]
  F --> H[mixTracks]
  G --> H
  H --> I[Final Mix]
  I --> J[End]
```

Imagen generada por IA (añadir archivo):
- `visuals/infografia.png`

Prompt usado disponible en:
- `prompts/infografia.txt`

---

## 📁 Estructura del Proyecto
```
project/
├── README.md
├── report.pdf
├── screenshots/
│   ├── prompt-fase1-ideas.png
│   ├── prompt-fase2-codigo.png
│   └── prompt-review.png
├── visuals/
│   ├── pipeline-diagram.mmd
│   └── infografia.png
├── prompts/
│   └── infografia.txt
└── src/
    ├── pipeline-original.js
    └── pipeline-final.js
```

---

## 🧪 6. Ejecución del Código
Ejecutar el pipeline:
```bash
node src/pipeline-final.js
```
Deberías ver en consola la mezcla final con efectos aplicados y tiempos variables.

---

## 📝 7. Reflexión Final
Este proyecto permitió comprender de forma profunda cómo funciona el flujo asíncrono debajo de `async/await`, al replicar su comportamiento con Generators y Promesas manuales.

El uso de IA:
- Facilitó el pensamiento divergente
- Permitió romper patrones típicos
- Ayudó a revisar y optimizar código
- Generó material visual para explicar el concepto a cualquier audiencia
