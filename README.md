# Proyecto: Pipeline Asíncrono Creativo en JavaScript (Mini Proyecto IA)

Este repositorio contiene la solución completa del mini-proyecto **CT - Pensamiento Creativo con IA | Javascript con IA**, siguiendo las cuatro fases requeridas: pensamiento divergente, desafío del sesgo, evaluación y presentación visual.

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

### Código: `src/pipeline-original.js`

```javascript
/**
 * runner(generatorFn): ejecuta un generator que puede yield promesas.
 * Soporta manejo de errores: si una promesa rechaza, lanza el error dentro del generator.
 */

function runner(genOrGenFn, ...args) {
  const gen = typeof genOrGenFn === 'function' ? genOrGenFn(...args) : genOrGenFn;

  return new Promise((resolve, reject) => {
    function step(nextF, arg) {
      let result;
      try {
        result = nextF.call(gen, arg); // { value, done }
      } catch (err) {
        reject(err);
        return;
      }

      if (result.done) {
        resolve(result.value);
        return;
      }

      // result.value expected to be a Promise
      Promise.resolve(result.value)
        .then(
          res => step(gen.next, res),
          err => step(gen.throw, err)
        );
    }

    step(gen.next);
  });
}

/* ---------- Simulaciones asíncronas (I/O) ---------- */

/** Simula carga de pista, devuelve un objeto track tras delay */
function loadTrack(trackId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: trackId, samples: `audio-data-${trackId}` });
    }, 300 + Math.random() * 400);
  });
}

/** Simula aplicación de un efecto a una pista */
function applyEffect(track, effect) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const processed = { ...track, effect: effect, samples: `${track.samples}+${effect}` };
      resolve(processed);
    }, 200 + Math.random() * 300);
  });
}

/** Simula mezcla de dos pistas en una pista resultante */
function mixTracks(trackA, trackB) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mixed = {
        id: `${trackA.id}+${trackB.id}`,
        samples: `mix(${trackA.samples},${trackB.samples})`,
        effects: [trackA.effect, trackB.effect].filter(Boolean)
      };
      resolve(mixed);
    }, 250 + Math.random() * 350);
  });
}

/* ---------- Generator-based pipeline (flujo 'síncrono' en apariencia) ---------- */

function* musicPipeline() {
  try {
    const track1 = yield loadTrack('guitar');
    const track1Fx = yield applyEffect(track1, 'reverb');

    const track2 = yield loadTrack('drums');
    const track2Fx = yield applyEffect(track2, 'compressor');

    // mezcla
    const finalMix = yield mixTracks(track1Fx, track2Fx);

    return finalMix;
  } catch (err) {
    // manejo de error dentro del pipeline
    return { error: true, message: err.message || String(err) };
  }
}

/* ---------- Ejecutar el pipeline ---------- */

runner(musicPipeline)
  .then(result => {
    if (result && result.error) {
      console.error('Pipeline finalizó con error interno:', result);
    } else {
      console.log('Mezcla finalizada:', result);
    }
  })
  .catch(err => {
    console.error('Error no capturado en runner:', err);
  });

/* Para pruebas rápidas: ejecuta varias veces para ver latencias aleatorias */
```

---

## 🔍 4. Fase 3: Revisión, Optimización y Evaluación con IA
La IA revisó el código inicial e identificó mejoras:

### ✔ Mejora 1 — `withTimeout()`
Se implementó un wrapper para evitar que operaciones asíncronas se cuelguen indefinidamente.

### ✔ Mejora 2 — `parallelLimit()`
Se implementó un sistema de concurrencia controlada, permitiendo cargar varias pistas sin saturar recursos.

El código final con optimizaciones se encuentra en:
- `src/pipeline-final.js`

### Código: `src/pipeline-final.js`

```javascript
// --- withTimeout helper ---
function withTimeout(promise, ms = 2000, msg = 'Timeout') {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(msg)), ms);
  });
  return Promise.race([promise.then((v) => { clearTimeout(timeoutId); return v; }), timeoutPromise]);
}

// --- parallelLimit helper: recibe tasks: Array<() => Promise> ---
function parallelLimit(tasks, limit = 2) {
  return new Promise((resolve, reject) => {
    const results = [];
    let i = 0, active = 0, finished = 0;
    function runNext() {
      if (finished === tasks.length) {
        resolve(results);
        return;
      }
      while (active < limit && i < tasks.length) {
        const idx = i++;
        active++;
        tasks[idx]()
          .then(res => {
            results[idx] = res;
            active--;
            finished++;
            runNext();
          })
          .catch(err => reject(err));
      }
    }
    runNext();
  });
}

/* Simulaciones asíncronas (idénticas a original) */
function loadTrack(trackId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: trackId, samples: `audio-data-${trackId}` });
    }, 300 + Math.random() * 400);
  });
}

function applyEffect(track, effect) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const processed = { ...track, effect: effect, samples: `${track.samples}+${effect}` };
      resolve(processed);
    }, 200 + Math.random() * 300);
  });
}

function mixTracks(trackA, trackB) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mixed = {
        id: `${trackA.id}+${trackB.id}`,
        samples: `mix(${trackA.samples},${trackB.samples})`,
        effects: [trackA.effect, trackB.effect].filter(Boolean)
      };
      resolve(mixed);
    }, 250 + Math.random() * 350);
  });
}

// --- Runner mejorado para permitir yield de arrays (ejecuta Promise.all) ---
function runnerV2(genOrGenFn, ...args) {
  const gen = typeof genOrGenFn === 'function' ? genOrGenFn(...args) : genOrGenFn;

  return new Promise((resolve, reject) => {
    function step(nextF, arg) {
      let result;
      try {
        result = nextF.call(gen, arg);
      } catch (err) {
        reject(err);
        return;
      }

      if (result.done) {
        resolve(result.value);
        return;
      }

      let yielded = result.value;
      // support arrays of promises -> Promise.all
      if (Array.isArray(yielded)) {
        yielded = Promise.all(yielded);
      }

      Promise.resolve(yielded)
        .then(res => step(gen.next, res))
        .catch(err => step(gen.throw, err));
    }

    step(gen.next);
  });
}

// Pipeline usando withTimeout y parallelLimit
function* musicPipelineV2() {
  try {
    // cargar dos pistas en paralelo con límite 2 (aquí son solo 2)
    const loadTasks = [
      () => withTimeout(loadTrack('guitar'), 1500, 'Carga guitar timeout'),
      () => withTimeout(loadTrack('drums'), 1500, 'Carga drums timeout')
    ];
    const [track1, track2] = yield parallelLimit(loadTasks, 2);

    const effectsPromises = [
      applyEffect(track1, 'reverb'),
      applyEffect(track2, 'compressor')
    ];

    // yield array -> runnerV2 ejecuta Promise.all
    const [track1Fx, track2Fx] = yield effectsPromises.map(p => withTimeout(p, 1200, 'Effect timeout'));

    const finalMix = yield withTimeout(mixTracks(track1Fx, track2Fx), 2000, 'Mix timeout');
    return finalMix;
  } catch (err) {
    return { error: true, message: err.message || String(err) };
  }
}

// Ejecutar
runnerV2(musicPipelineV2)
  .then(result => {
    if (result && result.error) console.error('Pipeline finalizó con error interno:', result);
    else console.log('Mezcla finalizada (v2):', result);
  })
  .catch(err => console.error('Error no capturado en runnerV2:', err));
```

**Comentarios sobre los cambios**
- `withTimeout` evita bloqueos largos y hace el pipeline más resiliente.  
- `parallelLimit` ofrece control de concurrencia para escalabilidad.  
- `runnerV2` añade soporte para `yield [p1, p2]` que se resuelve como `Promise.all`, facilitando paralelismo declarativo dentro del generator.

---

## 📊 5. Fase 4: Presentación Visual (IA Generativa)
Se generó un diagrama Mermaid que describe visualmente el pipeline asíncrono:

```
flowchart TD
  A[Start] --> B[runnerV2 inicia generator]
  B --> C{yield load tasks}
  C -->|parallelLimit| D[loadTrack guitar]
  C -->|parallelLimit| E[loadTrack drums]
  D --> F[applyEffect guitar]
  E --> G[applyEffect drums]
  F --> H[mixTracks]
  G --> H
  H --> I[Final Mix]
  I --> J[End / resultado]
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

---

## 📬 Contacto
Si deseas continuar extendiendo el proyecto, creando efectos adicionales o agregando un pequeño servidor Express, ¡se pueden seguir generando ideas creativas! 🚀
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

---

## 📬 Contacto
Si deseas continuar extendiendo el proyecto, creando efectos adicionales o agregando un pequeño servidor Express, ¡se pueden seguir generando ideas creativas! 🚀

