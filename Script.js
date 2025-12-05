/**
 * pipeline.js
 * Ejecuta un pipeline asíncrono usando Generators + un runner personalizado.
 *
 * Instrucciones:
 * 1) Guarda este archivo como pipeline.js
 * 2) En la terminal ejecuta: node pipeline.js
 *
 * Verás en consola la "mezcla final" o mensajes de timeout/errores según latencias aleatorias.
 */

/* -------------------- Helpers -------------------- */

/**
 * withTimeout(promise, ms, msg)
 * Envuelve una promesa y rechaza si no se resuelve en `ms` ms.
 */
function withTimeout(promise, ms = 2000, msg = 'Timeout') {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(msg)), ms);
  });
  return Promise.race([
    Promise.resolve(promise).then((v) => {
      clearTimeout(timeoutId);
      return v;
    }),
    timeoutPromise
  ]);
}

/**
 * parallelLimit(tasks, limit)
 * Ejecuta tareas (cada una es una función que devuelve una Promise) con un límite de concurrencia.
 * Devuelve Promise que resuelve un array con los resultados en el mismo orden.
 */
function parallelLimit(tasks, limit = 2) {
  return new Promise((resolve, reject) => {
    const results = new Array(tasks.length);
    let i = 0, active = 0, finished = 0;

    function runNext() {
      if (finished === tasks.length) {
        resolve(results);
        return;
      }
      while (active < limit && i < tasks.length) {
        const idx = i++;
        active++;
        // Ejecutar la tarea (es una función que devuelve promesa)
        Promise.resolve()
          .then(() => tasks[idx]())
          .then(res => {
            results[idx] = res;
            active--;
            finished++;
            runNext();
          })
          .catch(err => reject(err));
      }
    }

    // caso borde: sin tareas
    if (tasks.length === 0) return resolve([]);
    runNext();
  });
}

/* -------------------- Simulaciones asíncronas (I/O) -------------------- */

/**
 * loadTrack(trackId)
 * Simula la carga de una pista (I/O) devolviendo un objeto track tras un delay aleatorio.
 */
function loadTrack(trackId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: trackId, samples: `audio-data-${trackId}` });
    }, 300 + Math.random() * 400);
  });
}

/**
 * applyEffect(track, effect)
 * Simula aplicar un efecto a una pista y devuelve la pista procesada.
 */
function applyEffect(track, effect) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const processed = { ...track, effect: effect, samples: `${track.samples}+${effect}` };
      resolve(processed);
    }, 200 + Math.random() * 300);
  });
}

/**
 * mixTracks(trackA, trackB)
 * Simula mezclar dos pistas y devuelve la pista resultante.
 */
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

/* -------------------- Runner (generator executor) -------------------- */

/**
 * runnerV2(genOrGenFn, ...args)
 * Ejecuta un generator que puede `yield`:
 *  - una Promise
 *  - un array de Promises (se ejecutan con Promise.all)
 *  - cualquier valor (se pasa directo)
 *
 * El generator puede `yield` funciones que devuelvan promesas si así se diseña (aquí devolvemos promesas o arrays).
 */
function runnerV2(genOrGenFn, ...args) {
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

      let yielded = result.value;

      // Soporte: si yield devuelve un array -> Promise.all
      if (Array.isArray(yielded)) {
        yielded = Promise.all(yielded.map(p => Promise.resolve(p)));
      }

      // Acepta también que el yielded sea una función que devuelva Promise:
      if (typeof yielded === 'function') {
        try {
          yielded = yielded();
        } catch (err) {
          // error al llamar la función
          step(gen.throw, err);
          return;
        }
      }

      Promise.resolve(yielded)
        .then(res => step(gen.next, res))
        .catch(err => step(gen.throw, err));
    }

    step(gen.next);
  });
}

/* -------------------- Pipeline (generator) -------------------- */

/**
 * musicPipelineV2()
 * - carga dos pistas en paralelo usando parallelLimit
 * - aplica efectos (se ejecutan en paralelo usando yield de array)
 * - mezcla y retorna el resultado final
 *
 * Observa que usamos withTimeout en operaciones críticas para evitar esperas infinitas.
 */
function* musicPipelineV2() {
  try {
    // Crear tareas de carga (funciones que devuelven promesas) para parallelLimit
    const loadTasks = [
      () => withTimeout(loadTrack('guitar'), 1500, 'Carga guitar timeout'),
      () => withTimeout(loadTrack('drums'), 1500, 'Carga drums timeout')
    ];

    // Cargar en paralelo con límite 2
    const [track1, track2] = yield parallelLimit(loadTasks, 2);

    // Preparar promesas de efectos (sin ejecutarlas aquí): son promesas ya al llamar applyEffect
    const effectPromises = [
      withTimeout(applyEffect(track1, 'reverb'), 1200, 'Effect timeout (guitar)'),
      withTimeout(applyEffect(track2, 'compressor'), 1200, 'Effect timeout (drums)')
    ];

    // yield de array -> runnerV2 aplica Promise.all y devuelve [track1Fx, track2Fx]
    const [track1Fx, track2Fx] = yield effectPromises;

    // Mezcla final con timeout
    const finalMix = yield withTimeout(mixTracks(track1Fx, track2Fx), 2000, 'Mix timeout');

    return finalMix;
  } catch (err) {
    // Devolver un objeto consistente ante errores para manejo arriba
    return { error: true, message: err.message || String(err) };
  }
}

/* -------------------- Ejecutar -------------------- */

console.log('Iniciando pipeline musical (generators + runnerV2)...');

runnerV2(musicPipelineV2)
  .then(result => {
    if (result && result.error) {
      console.error('Pipeline finalizó con error interno:', result);
    } else {
      console.log('Mezcla finalizada (v2):');
      console.log(JSON.stringify(result, null, 2));
    }
  })
  .catch(err => {
    console.error('Error no capturado en runnerV2:', err);
  });

/* Opcional: descomentar para ejecutar varias veces seguidas y observar variabilidad
setTimeout(() => { runnerV2(musicPipelineV2).then(r => console.log('Segunda ejecución:', r)).catch(e => console.error(e)); }, 3000);
*/
