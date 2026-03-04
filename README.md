# 🎬 Expert Lens Pipeline™ — ActivaQR.com

Pipeline privado para generación de guiones de video con IA. Desarrollado exclusivamente para uso interno de ActivaQR.

---

## 🔐 Acceso

**URL Local:** http://localhost:3000  
**URL Producción (Vercel):** *(ver Vercel Project URL)*

### Usuario administrador
| Campo | Valor |
|:------|:------|
| **Email** | `reyescesarenloja@gmail.com` |
| **User UID** | `8e0c80dc-e901-46dd-85ea-b2de11cb1189` |
| **Contraseña** | *(Establecida via "Send password recovery" en Supabase → Authentication → Users)* |

> **Si olvidas la contraseña:** Ve a Supabase → Authentication → Users → Click en el usuario → "Send password recovery". Recibirás un email en `reyescesarenloja@gmail.com`.

---

## ⚙️ Variables de Entorno

Copia estas variables en Vercel → **Settings → Environment Variables**:

```env
# Supabase (obtener de: supabase.com → Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_proyecto
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key   ← SECRETO, nunca exponer

# APIs de IA (obtener de sus respectivos paneles)
GOOGLE_AI_API_KEY=tu_google_ai_key      # Google AI Studio
DEEPSEEK_API_KEY=tu_deepseek_key        # platform.deepseek.com
```

> **Nota de seguridad:** `SUPABASE_SERVICE_ROLE_KEY` y `DEEPSEEK_API_KEY` son secretos. Nunca los incluyas en código o los compartas públicamente.

---

## 🗄️ Base de Datos (Supabase)

**Tablas principales:**

| Tabla | Contenido |
|:------|:----------|
| `scripts` | Guiones generados (idea, body, estado) |
| `lens_results` | Observaciones de cada experto (Lente) del pipeline |
| `checklist_results` | Evaluaciones de los 4 Buyer Personas |
| `production_outputs` | Prompts de video, voz en off y música |

**Para resetear/recrear las tablas:** Ejecuta el archivo `supabase/manual_setup.sql` en el Editor SQL de Supabase.

---

## 🚀 Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables (crear .env.local con las variables de arriba)

# 3. Correr servidor de desarrollo
npm run dev
```

## 🏗️ Build para Producción

```bash
npm run build
```

---

## 📁 Estructura del Proyecto

```
app/
  page.tsx          ← UI principal del Pipeline
  actions.ts        ← Server Actions (generación + guardado en BD)
  login/            ← Sistema de autenticación
lib/
  pipeline/
    executor.ts     ← Orquestador del Pipeline (runPipeline)
    lenses.ts       ← Definición de los 6 Lentes expertos
    checklist.ts    ← Evaluación buyer personas
    production-prompts.ts ← Prompts de video/voz/música
  llm/              ← Adaptadores Gemini y DeepSeek
  prompts/          ← Loader de prompts desde archivos .md
  utils/
    export.ts       ← Formateo para exportar a Google Docs
prompts/            ← Archivos .md de prompts (editables sin tocar código)
supabase/
  manual_setup.sql  ← Script SQL para crear las tablas
types/
  database.ts       ← Tipos TypeScript para Supabase
```
