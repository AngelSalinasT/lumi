# Análisis Hackathon Troyano — FIF UAQ
> Qué ganar, por qué, y qué patrones distinguen a los equipos que llegan al podio

---

## El evento

| Campo | Detalle |
|-------|---------|
| Nombre | Hackathon Troyano 2026 |
| Organización | FIF UAQ — Facultad de Informática y Estadística, Universidad Autónoma de Querétaro |
| Fecha | 17–18 de Abril, 2026 (48 horas) |
| Sede | Centro de Negocios UAQ, Juriquilla, Querétaro |
| Tema | **Open Innovation Challenge: IA para Impacto en el Mundo Real** |
| Equipos registrados | ~50 equipos |
| Entregable final | Video de 4 minutos en YouTube + formulario de registro el día del evento |
| Deadline entrega | ~14:45 del 18 de Abril |

### Patrocinadores oficiales (APIs con puntos extra)
- **Google Gemini** — LLM + multimodal
- **ElevenLabs** — Text-to-speech
- **MongoDB Atlas** — Base de datos en la nube

> Usar las APIs de patrocinadores suma puntos en categorías especiales de premio, además de los criterios principales del jurado.

---

## Criterios de evaluación del jurado

| Criterio | Peso relativo (estimado) |
|----------|--------------------------|
| Importancia del problema abordado | Alta |
| Creatividad e innovación de la solución | Alta |
| Avance de implementación (demo funcional) | Muy alta |
| Mérito técnico | Alta |

**Lectura clave:** el jurado castiga los proyectos que son solo PowerPoint o mockups. Un demo que corre en vivo, aunque sea limitado, vale más que una arquitectura perfecta sin código.

---

## Análisis de ganadores anteriores

### 2025 — SIRIUS (1° lugar)
- **Problema:** Coordinación de emergencias y vigilancia en zonas de difícil acceso
- **Solución:** Drones autónomos con visión artificial + análisis de video en tiempo real usando **Gemini**
- **Stack:** Drones físicos + Gemini API (multimodal, análisis de imágenes) + backend Python
- **Por qué ganó:**
  - Hardware físico presente y funcionando durante el demo
  - IA real integrada (no simulada) usando Gemini, patrocinador oficial
  - Problema de impacto real y medible (seguridad, emergencias)
  - Video mostraba el sistema corriendo, no slides

---

### 2024 — NEXTRANSIT (1° lugar)
- **Problema:** Fatiga del conductor en transporte de carga — accidentes en carretera
- **Solución:** Detección de fatiga mediante visión por computadora (análisis facial en tiempo real)
- **Stack:** Cámara + modelo de visión + alertas
- **Por qué ganó:**
  - Problema real con estadísticas reales (accidentes en México)
  - Demo funcional con cámara encendida y detección activa
  - Impacto humano claro y directo
  - No fue solo un modelo — fue un producto con flujo completo

---

### Patrón consistente entre ganadores

```
Hardware físico
  +
IA que procesa datos reales (no texto hardcodeado)
  +
Problema humano concreto y medible
  +
Demo que corre en el video, no slides
  =
PRIMER LUGAR
```

---

## Lo que NO ha ganado (o ha quedado atrás)

- **Apps web sin hardware:** pueden tener buena IA pero pierden en el factor "wow" del demo
- **Proyectos con IA simulada:** si el modelo "responde" con respuestas hardcodeadas, el jurado lo detecta
- **Problemas genéricos o globales sin anclaje local:** "mejorar la educación en el mundo" sin datos de QRO o México pierde frente a algo concreto
- **Demos que fallan en el video:** si el video muestra el sistema roto o se corta, baja la puntuación de "avance de implementación"

---

## Contexto competitivo 2026

### Equipos a considerar
- **Centro de Desarrollo (CD):** equipo conocido, normalmente competitivo. En 2026 se filtró que trabajan en un modelo de predicción de huracanes. Enfoque: datos climáticos + ML clásico. Punto débil: poco hardware y problema geográficamente lejano a QRO.
- **~50 equipos registrados:** la mayoría aún en apps web o dashboards. El vector de diferenciación es hardware + AI integrada.

### El espacio menos disputado en 2026
Basado en el tema "IA para Impacto en el Mundo Real" y el análisis de equipos conocidos, el nicho con menor competencia y mayor potencial de premio es:

> **Hardware físico + IA conversacional o sensorial + problema social local (QRO/México)**

Los equipos de software puro son la mayoría. Los que traen hardware son pocos, y los que además conectan ese hardware a una API de IA en tiempo real son aún menos.

---

## Factores de victorios replicables

### 1. El "wow moment" del video
El jurado ve decenas de videos. El que tiene un momento donde el hardware hace algo visible e inesperado en respuesta a IA en vivo rompe el patrón. Ese momento tiene que estar en los primeros 90 segundos del video.

### 2. Problema con datos reales de México
Citar estadísticas reales (INEGI, SSA, IMSS) sobre el problema que resuelves da credibilidad. El jurado de FIF UAQ valora el impacto social medible en contexto local.

### 3. Stack de patrocinadores bien integrado
No es suficiente con "usamos Gemini". El demo debe mostrar Gemini/ElevenLabs/MongoDB haciendo algo que el usuario ve directamente. Si el patrocinador está solo en el backend sin impacto visible, no suma tanto.

### 4. La historia humana del usuario final
Los dos ganadores anteriores tenían una historia humana clara: el conductor que se duerme, la persona en zona de emergencia. El jurado recuerda la historia, no la arquitectura.

### 5. Demo vivo > slides
El video de SIRIUS mostraba los drones volando y Gemini analizando frames en tiempo real. Eso no se olvida. Un diagrama de arquitectura en Figma sí se olvida.

---

## Criterios de evaluación — cómo atacarlos

| Criterio | Cómo maximizar el puntaje |
|----------|--------------------------|
| Importancia del problema | Abrir el video con estadísticas reales (INEGI, SSA, IMSS, OMS). Mostrar que el problema existe HOY en México. |
| Creatividad e innovación | Combinar hardware físico + IA multimodal + sensores. La combinación importa más que cada pieza individual. |
| Avance de implementación | Demo que corre en el video sin cortes. Mejor demo imperfecto que slide perfecto. Mostrar el flujo completo end-to-end. |
| Mérito técnico | Integrar al menos 2 APIs de patrocinadores de forma visible. Mencionar en el video qué tecnología hace qué. |

---

## Estructura del video ganador (4 minutos)

Basada en el patrón de videos ganadores anteriores:

| Segmento | Duración | Contenido |
|----------|----------|-----------|
| Hook del problema | 0:00 – 0:30 | Estadística impactante + historia humana en 1 oración |
| Demo en vivo parte 1 | 0:30 – 1:30 | El flujo más importante funcionando en hardware real |
| Demo en vivo parte 2 | 1:30 – 2:30 | Segunda funcionalidad o caso de uso extremo (emergencia, fallo, etc.) |
| Stack técnico | 2:30 – 3:30 | Diagrama simple + mencionar patrocinadores con rol específico |
| Cierre e impacto | 3:30 – 4:00 | Quiénes somos + a quién ayuda + siguiente paso si existiera |

> **Regla de oro del video:** si el hardware aparece antes del minuto 1, el jurado ya está enganchado.

---

## Resumen ejecutivo para decisiones de diseño

1. **Hardware presente = ventaja competitiva real.** La mayoría de equipos no lo tiene.
2. **IA funcionando en vivo > IA "planeada".** Aunque sea simple, tiene que responder de verdad.
3. **Problema local + datos reales = credibilidad ante el jurado de FIF UAQ.**
4. **Patrocinadores visibles en el demo = puntos extra directos** (Gemini, ElevenLabs, MongoDB).
5. **El video decide.** Puedes tener el mejor código y perder con un video mal cortado.
6. **48 horas = scope mínimo que funciona.** No hay tiempo para features. Hay tiempo para que una cosa funcione muy bien.

---

*Análisis basado en: información pública del evento, ediciones 2024 y 2025, Instagram oficial FIF UAQ, y patrón de proyectos ganadores observado.*
