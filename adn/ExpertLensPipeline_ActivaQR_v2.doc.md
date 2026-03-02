🎬

**EXPERT LENS PIPELINE™**

Sistema de producción de guiones para video — ActivaQR.com

*Documento de especificación para desarrollo backend · v1.0*

# **1\. ¿Qué es esto?**

Quiero construir un sistema automatizado que tome una idea en bruto — puede ser un audio, una nota de voz o un texto — y la convierta en un guion de video listo para producción. El sistema aplica una cadena de filtros expertos en secuencia, cada uno evaluando el guion desde un ángulo diferente, hasta que el guion pasa todos los criterios.

No quiero un asistente que genere guiones genéricos. Quiero un pipeline que razone como un equipo multidisciplinario: claridad, neurociencia, copywriting, música, SEO, cinematografía y validación con el buyer persona real.

El motor de razonamiento de todo el sistema es la API de Anthropic (Claude). Cada lente es un prompt especializado que se ejecuta secuencialmente sobre el mismo guion.

# **2\. Flujo completo del sistema**

| 📋 El flujo de extremo a extremo Entrada de idea → Transcripción → Pipeline de 6 lentes → Checklist de aprobación → Prompts de producción → Output final |
| :---- |

| \# | Etapa | Descripción |
| :---: | :---- | :---- |
| **1** | **Entrada de idea** | El usuario ingresa su idea. Puede ser texto libre, audio transcrito o nota de voz. El sistema acepta el input en cualquier forma. |
| **2** | **Borrador inicial** | Claude genera un primer guion en bruto basado en la idea. Este borrador entra al pipeline. |
| **3** | **Pipeline — 6 Lentes** | El guion pasa por 6 evaluaciones secuenciales. Cada lente emite un veredicto y sugerencias concretas. |
| **4** | **Revisión humana** | El usuario lee el resultado del pipeline y puede aceptar cambios o solicitar ajustes. Si hay cambios, el guion modificado vuelve a correr el pipeline. |
| **5** | **Checklist de aprobación** | Validación final del guion con 4 perfiles de buyer persona de ActivaQR. Cada perfil responde 3 preguntas. Debe pasar todos. |
| **6** | **Generación de prompts** | Se generan 3 outputs: prompts de video por escena, prompt de voz en off, prompt de música. |
| **7** | **Entrega** | El usuario recibe el guion final \+ los 3 paquetes de prompts de producción listos para usar. |

# **3\. Los 6 Lentes del Pipeline**

Cada lente es un prompt independiente que se ejecuta contra el guion activo. Se ejecutan en este orden específico porque cada uno construye sobre el anterior.

| 🧒 Lente 1 | El Niño de 10 años *Representación del espectador sin contexto previo* Criterio: ¿Lo entiende alguien que no sabe nada del producto? ¿Cada frase es necesaria? Output: Semáforo verde/amarillo/rojo \+ frase específica que no se entiende |
| :---: | :---- |

| 🧠 Lente 2 | El Neurocientífico *Experto en neuroventas y comportamiento del consumidor* Criterio: ¿Activa las palancas correctas? ¿Hay dolor, urgencia, confianza, identidad? Output: Lista de triggers presentes y triggers faltantes con sugerencia de inserción |
| :---: | :---- |

| ✍️ Lente 3 | El Copywriter *Experto en persuasión y estructura narrativa* Criterio: ¿El hook engancha en 3 segundos? ¿Cada palabra trabaja? ¿El CTA es accionable? Output: Versión reescrita del guion o anotaciones línea por línea |
| :---: | :---- |

| 🎵 Lente 4 | El Director Musical *Experto en psicología del audio y memoria emocional* Criterio: ¿Qué música potencia la retención del mensaje? ¿El ritmo del guion permite respiro? Output: Brief musical: género, BPM, tonalidad, transiciones, referencias |
| :---: | :---- |

| 🔍 Lente 5 | El Experto en SEO *Especialista en posicionamiento y keywords del ADN de ActivaQR* Criterio: ¿El guion contiene las palabras clave estratégicas de ActivaQR? ¿Son naturales? Output: Lista de keywords a insertar \+ sugerencia de título y descripción del video |
| :---: | :---- |

| 🎥 Lente 6 | El Director Creativo *Especialista en cinematografía y narrativa visual para el buyer persona* Criterio: ¿Qué se ve? ¿Cómo se ve? ¿El mood visual corresponde al perfil del espectador objetivo? Output: Brief de producción: planos, colores, ritmo de edición, mood, storyboard conceptual |
| :---: | :---- |

# **4\. Checklist de Aprobación — Buyer Persona**

Una vez el usuario revisa y acepta el guion post-pipeline, se activa esta validación. El sistema genera automáticamente 4 perfiles de buyer persona específicos para el contexto del guion — no son perfiles fijos. Si el guion habla de restaurantes, los perfiles serán del mundo gastronómico. Si habla de abogados, vendedores corporativos o profesores de nivelación, los perfiles reflejarán ese universo. Claude los construye en base al ADN de ActivaQR y al tema del guion activo. Cada perfil responde exactamente 3 preguntas.

| ❓ Las 3 preguntas de cada perfil 1\. ¿Entendí lo que hace el producto? 2\. ¿Siento que esto es para mí o para mi negocio? 3\. ¿Haría algo después de ver este video? |
| :---- |

|  | Perfil generado | Cómo se construye dinámicamente |
| :---: | :---- | :---- |
| 👤 | **Perfil 1 — El cliente directo del sector** | Claude analiza el tema del guion e infiere el sector al que apunta. Construye el perfil principal: la persona que más directamente se identifica con el problema planteado en el video. Ejemplo: si el guion habla de profesores de nivelación, el Perfil 1 es un profesor independiente con 5+ años de experiencia. |
| 👤 | **Perfil 2 — Variante del mismo sector (diferente nivel educativo o actitud)** | Mismo sector que el Perfil 1, pero con una característica diferente: mayor nivel educativo, más desconfiado, más impulsivo, o con menos tiempo. Sirve para detectar si el guion solo conecta con un subtipo del sector. Ejemplo: el mismo profesor, pero que tiene posgrado y evalúa todo con más criterio técnico. |
| 👤 | **Perfil 3 — Cliente corporativo o comprador indirecto** | Quien compra ActivaQR para un equipo o para terceros. Evalúa ROI, escalabilidad y presentación ante superiores. Ejemplo: un director de academia que compraría el producto para todos sus profesores. No le interesa si él lo usaría — le interesa si sus profesores lo usarían. |
| 👤 | **Perfil 4 — El escéptico del sector** | Alguien del mismo sector que ya probó soluciones similares y no le funcionaron, o que simplemente desconfía de las herramientas digitales. Es el perfil más exigente. Si el guion no lo convence, hay un problema de credibilidad en el mensaje. Ejemplo: un profesor que ya tuvo una tarjeta digital antes y la dejó de usar. |

| ⚠️ Criterio de aprobación Si cualquier perfil responde NO a la pregunta 1 o 2, el guion regresa al pipeline. Se indica cuál perfil falló y en qué pregunta. Si todos responden SÍ a las 3 preguntas — se activa la etapa de producción. |
| :---- |

# **5\. Output de Producción — Los 3 Paquetes de Prompts**

Una vez aprobado el guion, el sistema genera automáticamente 3 paquetes de prompts listos para usar en las herramientas de producción correspondientes.

## **5.1 Prompts de Video por Escena**

Herramienta destino: Kling AI / Runway / Pika (el desarrollador define cuál integrar primero)

El sistema divide el guion en escenas individuales y genera un prompt técnico para cada una. Cada prompt incluye:

* Descripción visual exacta de la escena (sujeto, acción, ambiente)

* Estilo cinematográfico (plano, ángulo, movimiento de cámara)

* Mood y paleta de color

* Duración estimada de la escena en segundos

* Notas de sincronización con el audio

## **5.2 Prompt de Voz en Off**

Herramienta destino: ElevenLabs

El sistema genera el texto exacto del narrador con marcaciones de pausa, énfasis y velocidad. Incluye:

* Texto final limpio del voiceover

* Perfil de voz sugerido (género, edad percibida, tono)

* Marcaciones de ritmo: \[pausa corta\], \[pausa larga\], \[énfasis\]

* Velocidad de locución recomendada en palabras por minuto

## **5.3 Prompt de Música**

Herramienta destino: Suno / Udio

Basado en el brief del Lente 4 (Director Musical), el sistema genera:

* Descripción de género y subgénero

* BPM exacto

* Tonalidad e instrumentación

* Estructura de la pista: intro, desarrollo, resolución final

* Referencias de mood en lenguaje de prompt

# **6\. Arquitectura Técnica**

Esta sección define las decisiones tecnológicas del backend para que el desarrollador (o el equipo de IA que construya el sistema) entienda los requisitos de integración.

## **6.1 Motor de razonamiento — API de Anthropic (Claude)**

Todos los lentes, el checklist de buyer persona y la generación de prompts de producción funcionan a través de la API de Anthropic. Esta es la única dependencia de IA conversacional del sistema.

| 🔌 Especificación de integración Endpoint: https://api.anthropic.com/v1/messages Modelo recomendado: claude-sonnet-4-20250514 Cada lente \= 1 llamada independiente a la API El historial del guion se pasa como contexto en cada llamada |
| :---- |

## **6.2 Estructura de llamadas al pipeline**

El pipeline NO es una sola llamada de API. Es una cadena de llamadas donde el output de una alimenta el input de la siguiente. El estado del guion se mantiene en el backend entre llamadas.

| Llamada | Input | Output |
| :---- | :---- | :---- |
| **Borrador inicial** | Idea del usuario \+ ADN de ActivaQR | Guion v0 |
| **Lente 1 (Claridad)** | Guion v0 \+ prompt del lente | Evaluación \+ guion v1 |
| **Lente 2 (Neuroventas)** | Guion v1 \+ prompt del lente | Evaluación \+ guion v2 |
| **Lente 3 (Copywriting)** | Guion v2 \+ prompt del lente | Evaluación \+ guion v3 |
| **Lente 4 (Musical)** | Guion v3 \+ prompt del lente | Brief musical \+ guion v3 (sin cambios) |
| **Lente 5 (SEO)** | Guion v3 \+ prompt del lente | Keywords \+ guion v4 |
| **Lente 6 (Cinematografía)** | Guion v4 \+ prompt del lente | Brief visual \+ guion v4 (sin cambios) |
| **Checklist Buyer Persona** | Guion v4 \+ 4 perfiles generados dinámicamente según el sector del guion | Veredicto por perfil (aprobado/rechazado) |
| **Generación de prompts** | Guion aprobado | 3 paquetes de prompts de producción |

## **6.3 Interfaz de usuario (Frontend)**

La interfaz es un formulario simple con las siguientes vistas:

* Pantalla 1 — Entrada: campo de texto o carga de audio transcrito, selector de buyer persona objetivo del video, botón 'Iniciar pipeline'

* Pantalla 2 — Pipeline en progreso: barra de progreso con los 6 lentes, resultado de cada lente expandible

* Pantalla 3 — Revisión humana: guion final post-pipeline con opción de editar y re-correr

* Pantalla 4 — Checklist buyer persona: resultado de cada perfil con semáforo

* Pantalla 5 — Output final: guion aprobado \+ 3 paquetes de prompts descargables

## **6.4 ADN de ActivaQR como contexto permanente**

El documento de ADN de ActivaQR se incluye como contexto del sistema en cada llamada a la API. Este contexto no cambia entre llamadas — es el 'sistema nervioso' que orienta a todos los lentes hacia la identidad, propuesta de valor y buyer persona correcto del producto.

# **7\. Glosario de términos del sistema**

| Término | Definición |
| :---- | :---- |
| **Pipeline** | Cadena de pasos secuenciales que procesa el guion de inicio a fin |
| **Lente** | Módulo evaluador especializado con criterio y output definidos |
| **Guion vN** | Versión del guion después de pasar por N lentes (v0=borrador, v4=final post-pipeline) |
| **ADN ActivaQR** | Documento base con identidad, propuesta de valor y casos de uso del producto. Contexto permanente de la API. |
| **Buyer persona** | Perfil de cliente objetivo. En el Lente 6 orienta la producción visual. En el Checklist, Claude genera 4 perfiles dinámicamente según el sector del guion activo — nunca son perfiles fijos. |
| **Prompt de producción** | Instrucción técnica lista para usar en herramientas de generación de video, voz o música |
| **API Anthropic** | Servicio de IA de Anthropic que procesa todos los lentes. Requiere API key del propietario del sistema. |

*Expert Lens Pipeline™ — ActivaQR.com · Documento confidencial · v1.0*