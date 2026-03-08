'use server'

import {
    runPipeline,
    generateInitialDraft,
    runLensPass,
    runOrchestratorPass,
    type PipelineResult,
    type LensResult
} from '@/lib/pipeline/executor'
import { LENSES, type LensType } from '@/lib/pipeline/lenses'
import { getSupabaseServiceClient } from '@/lib/supabase/admin'
import OpenAI from 'openai'

// ── Env validation guard ──────────────────────────────────────────────────
// Fail loudly at boot so misconfigured deploys are caught immediately.
if (!process.env.GOOGLE_AI_API_KEY) {
    console.error('[CONFIG] ⚠️  GOOGLE_AI_API_KEY is not set. Gemini calls will fail.')
}
if (!process.env.DEEPSEEK_API_KEY) {
    console.error('[CONFIG] ⚠️  DEEPSEEK_API_KEY is not set. DeepSeek fallback will fail.')
}

// ── Debug logger (console only — safe for Vercel/serverless) ─────────────
function debugLog(msg: string) {
    console.log(`[PIPELINE] ${msg}`)
}

// ── Input validation ──────────────────────────────────────────────────────
const MAX_IDEA_LENGTH = 1500
function validateIdea(idea: string) {
    if (!idea || idea.trim() === '') throw new Error('La idea no puede estar vacía.')
    if (idea.length > MAX_IDEA_LENGTH) throw new Error(`La idea no puede superar ${MAX_IDEA_LENGTH} caracteres (actual: ${idea.length}).`)
}

// ── Pipeline timeout wrapper ──────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout: ${label} superó ${ms / 1000}s`)), ms)
    )
    return Promise.race([promise, timeout])
}

export async function generateScript(idea: string, options: { duration: string, style: string }): Promise<{ success: boolean; data?: PipelineResult; error?: string }> {
    try {
        validateIdea(idea)
        debugLog(`generateScript: ${idea.substring(0, 30)}...`)
        // Use a temporary UUID-like string or real UUID for the pipeline logic
        const tempId = crypto.randomUUID()

        const result = await withTimeout(
            runPipeline({ scriptId: tempId, idea, duration: options.duration, style: options.style }),
            300_000, // 5 min max
            'Pipeline completo'
        )
        debugLog(`generateScript DONE: ${result.lensResults.length} lenses`)
        return { success: true, data: result }
    } catch (error: any) {
        console.error('[ACTIONS] generateScript Error:', error)
        return { success: false, error: error.message || 'Error desconocido al generar el guion.' }
    }
}

export async function generateDraftAction(
    idea: string,
    options: { duration: string, style: string, preferredProvider?: string }
) {
    try {
        validateIdea(idea)
        debugLog(`generateDraftAction: ${idea.substring(0, 30)}... (${options.preferredProvider || 'default'})`)
        const draft = await withTimeout(
            generateInitialDraft({ idea, duration: options.duration, style: options.style, preferredProvider: options.preferredProvider }),
            60_000, // 1 min max for initial draft
            'Borrador inicial'
        )
        return { success: true, draft }
    } catch (error: any) {
        debugLog(`generateDraftAction ERROR: ${error.message}`)
        return { success: false, error: error.message }
    }
}

/**
 * Acción granular: Aplica un lente específico.
 */
export async function runLensAction(lensId: string, currentScript: string, preferredProvider?: string, context?: string) {
    try {
        debugLog(`runLensAction: ${lensId} (${preferredProvider || 'default'})`)
        const result = await withTimeout(
            runLensPass(lensId as LensType, currentScript, preferredProvider, context),
            90_000, // 1.5 min max per lens
            `Lente ${lensId}`
        )
        return { success: true, ...result }
    } catch (error: any) {
        debugLog(`runLensAction ERROR: ${error.message}`)
        return { success: false, error: error.message }
    }
}

/**
 * Genera prompts de producción (voz, música, video) de forma aislada.
 */
export async function generateProductionPromptsAction(script: string) {
    try {
        const { generateProductionPrompts } = await import('@/lib/pipeline/production-prompts')
        const data = await generateProductionPrompts(script)
        return { success: true, data }
    } catch (error: any) {
        debugLog(`generateProductionPromptsAction ERROR: ${error.message}`)
        return { success: false, error: error.message }
    }
}

/**
 * Acción granular: Ejecuta el Orquestador.
 */
export async function runOrchestratorAction(
    currentScript: string,
    critiques: LensResult[],
    direction: 'classic' | 'conversion' | 'storytelling' = 'classic',
    preferredProvider?: string
) {
    try {
        debugLog(`runOrchestratorAction (${direction}, ${preferredProvider || 'default'})`)
        const result = await withTimeout(
            runOrchestratorPass(currentScript, critiques, direction, preferredProvider),
            120_000, // 2 min max per orchestration
            `Orquestación ${direction}`
        )
        return { success: true, ...result }
    } catch (error: any) {
        debugLog(`runOrchestratorAction ERROR: ${error.message}`)
        return { success: false, error: error.message }
    }
}

export async function saveFullPipelineAction(
    idea: string,
    result: PipelineResult,
    extra?: {
        frames?: any[],
        voicePrompt?: string,
        musicPrompt?: string
    }
): Promise<{ success: boolean; scriptId?: string; error?: string }> {
    try {
        const supabase = getSupabaseServiceClient()

        // 1. Guardar el guion principal
        const { data: scriptData, error: scriptError } = await (supabase
            .from('scripts' as any) as any)
            .insert([{
                title: idea.substring(0, 50),
                original_idea: idea,
                current_body: result.finalScript,
                status: 'approved',
                version: result.currentVersion,
            }])
            .select()
            .single()

        if (scriptError) throw scriptError
        const scriptId = (scriptData as any).id

        // 2. Guardar resultados de los lentes
        if (result.lensResults && result.lensResults.length > 0) {
            const lensInserts = result.lensResults.map(lr => ({
                script_id: scriptId,
                version: result.currentVersion,
                lens: lr.lens,
                verdict: lr.verdict,
                feedback: lr.feedback,
                tokens_used: lr.tokensUsed
            }))

            const { error: lensError } = await (supabase
                .from('lens_results' as any) as any)
                .insert(lensInserts)

            if (lensError) throw lensError
        }

        // 3. Guardar checklist si existe
        if (result.checklistResults) {
            const { error: checklistError } = await (supabase
                .from('checklist_results' as any) as any)
                .insert([{
                    script_id: scriptId,
                    version: result.currentVersion,
                    profile_1: result.checklistResults.profile1,
                    profile_2: result.checklistResults.profile2,
                    profile_3: result.checklistResults.profile3,
                    profile_4: result.checklistResults.profile4,
                    overall_pass: result.checklistResults.overallPass,
                    raw_output: result.checklistResults.rawOutput
                }])

            if (checklistError) throw checklistError
        }

        // 4. Guardar prompts de producción, frames y visual hook
        const videoPrompts = extra?.frames || result.productionPrompts?.videoPrompts
        const voicePrompt = extra?.voicePrompt || result.productionPrompts?.voicePrompt
        const musicPrompt = extra?.musicPrompt || result.productionPrompts?.musicPrompt
        const visualHook = result.visualHook

        if (videoPrompts || voicePrompt || musicPrompt || visualHook) {
            const { error: prodError } = await (supabase
                .from('production_outputs' as any) as any)
                .insert([{
                    script_id: scriptId,
                    video_prompts: videoPrompts,
                    voice_prompt: voicePrompt,
                    music_prompt: musicPrompt,
                    visual_hook: visualHook
                }])

            if (prodError) throw prodError
        }

        return { success: true, scriptId }
    } catch (error: any) {
        console.error('[ACTIONS] saveFullPipelineAction Error:', error)
        return { success: false, error: error.message || 'Error al guardar el pipeline completo.' }
    }
}



export async function generateVideoFrames(script: string, stylePrompt: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
        const apiKey = process.env.DEEPSEEK_API_KEY
        if (!apiKey) throw new Error('DEEPSEEK_API_KEY no configurada')

        const client = new OpenAI({ apiKey, baseURL: 'https://api.deepseek.com' })

        const systemPrompt = `You are an expert VIDEO DIRECTOR and VISUAL STORY TRANSLATOR.

Your mission is to convert a marketing script into a sequence of image prompts for video production.

## THE SELECTED VISUAL STYLE (YOUR RENDERING ENGINE):
The user has selected this visual aesthetic. Use it as the RENDERING LANGUAGE — the lighting, color grade, artistic treatment, and rendering method. Do NOT copy the style's example subjects or props.
---
${stylePrompt}
---

## YOUR 3-STEP PROCESS (mandatory for each scene):

### STEP 1 — SCENE PARSING:
Read the script and divide it into distinct narrative MOMENTS. Each moment is a beat that communicates one idea.

### STEP 2 — VISUAL CONCEPT (THE KEY STEP):
For each moment, determine what IMAGE would best SHOW (not tell) that idea visually. Think like a director.

### STEP 3 — STYLE APPLICATION:
Render the visual concept using the SELECTED VISUAL STYLE as your aesthetic language.

## CRITICAL RULES:
- NEVER copy subjects, props, or settings from the style's description.
- EACH scene must have a UNIQUE visual concept derived from the script's narrative.
- imagePrompt must be written in English, highly detailed.
- motionInstructions should describe camera movement and action for a video AI.

## OUTPUT FORMAT (strict JSON):
{
  "frames": [
    {
      "scene": "exact snippet from script",
      "imagePrompt": "full detailed image prompt applying the selected style",
      "motionInstructions": "camera and motion instructions"
    }
  ]
}`.trim()

        const response = await withTimeout(
            client.chat.completions.create({
                model: 'deepseek-chat',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Here is the script:\n\n${script}` }
                ],
                response_format: { type: 'json_object' }
            }),
            60_000,
            'Generación de frames'
        )

        const content = response.choices[0]?.message?.content || '{"frames": []}'
        const parsed = JSON.parse(content)
        const framesArray = parsed.frames || parsed.scenes || parsed.prompts ||
            parsed.keyframes || parsed.sequence || (Array.isArray(parsed) ? parsed : null)

        if (!framesArray || !Array.isArray(framesArray)) {
            return { success: false, error: 'La IA no devolvió el formato esperado. Intenta de nuevo.' }
        }

        return { success: true, data: framesArray }
    } catch (error: any) {
        console.error('[ACTIONS] generateVideoFrames Error:', error)
        return { success: false, error: error.message }
    }
}

// ── History & Retrieval ───────────────────────────────────────────────────

export async function getSavedPipelinesAction() {
    try {
        const supabase = getSupabaseServiceClient()
        const { data, error } = await supabase
            .from('scripts')
            .select('id, title, original_idea, created_at')
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) throw error
        return { success: true, scripts: data }
    } catch (err: any) {
        console.error('[ACTIONS] getSavedPipelinesAction Error:', err)
        return { success: false, error: err.message }
    }
}

export async function getPipelineDetailsAction(scriptId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
        const supabase = getSupabaseServiceClient()

        // 1. Fetch script metadata
        const { data: scriptData, error: scriptError } = await supabase
            .from('scripts')
            .select('*')
            .eq('id', scriptId)
            .single()

        if (scriptError) throw scriptError

        // 2. Fetch lens results
        const { data: lensData, error: lensError } = await supabase
            .from('lens_results')
            .select('*')
            .eq('script_id', scriptId)
            .order('run_at', { ascending: true })

        if (lensError) throw lensError

        // 3. Fetch production outputs
        const { data: prodData, error: prodError } = await supabase
            .from('production_outputs')
            .select('*')
            .eq('script_id', scriptId)
            .single()
        // Error is fine here since old scripts might not have prod output
        if (prodError && prodError.code !== 'PGRST116') {
            console.error('[ACTIONS] Error fetching production outputs:', prodError)
        }

        return {
            success: true,
            data: {
                script: scriptData,
                lensResults: lensData || [],
                productionOutputs: prodData || null
            }
        }
    } catch (err: any) {
        console.error('[ACTIONS] getPipelineDetailsAction Error:', err)
        return { success: false, error: err.message }
    }
}
