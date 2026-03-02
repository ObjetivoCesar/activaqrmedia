import { getLLMProvider } from '@/lib/llm/provider'
import { loadPrompt } from '@/lib/prompts/loader'
import { LENS_ORDER, LENSES, type LensType } from './lenses'

export interface LensResult {
    lens: string
    verdict: 'green' | 'yellow' | 'red'
    feedback: string
    tokensUsed: number
}

export interface PipelineResult {
    scriptId: string
    versions: Array<{ version: number; body: string; triggeredBy: string }>
    lensResults: LensResult[]
    finalScript: string
    currentVersion: number
    scriptOptions?: string[] // Las 3 bombas: Clásica, Conversión, Narrativa
}

export interface RunPipelineOptions {
    scriptId: string
    idea: string
    duration: string
    style: string
    startFromScript?: string
    startVersion?: number
}

/**
 * Ejecuta el pipeline de CONSENSO evolucionado: 
 * Borrador -> Expertos (Paralelo) -> Triple Orquestación -> Auditoría.
 */
export async function runPipeline(options: RunPipelineOptions): Promise<PipelineResult> {
    const { scriptId, idea, duration, style, startFromScript, startVersion = 0 } = options

    const versions: PipelineResult['versions'] = []
    const lensResults: LensResult[] = []
    let currentVersion = startVersion
    let currentScript = startFromScript ?? ''

    // ── Paso 1: Borrador Inicial ──
    if (!currentScript) {
        currentScript = await generateInitialDraft({ idea, duration, style })
        currentVersion = 0
        versions.push({ version: currentVersion, body: currentScript, triggeredBy: 'draft_initial' })
    }

    // ── Paso 2: Panel de Expertos (Misma crítica para las 3 opciones) ──
    const expertLenses = LENS_ORDER.filter(id => id !== 'lens_orchestrator' && id !== 'lens_buyer_persona')
    for (const lensId of expertLenses) {
        const result = await runLensPass(lensId, currentScript)
        lensResults.push({
            lens: lensId,
            verdict: result.verdict,
            feedback: result.feedback,
            tokensUsed: result.tokensUsed,
        })
    }

    // ── Paso 3: Triple Orquestación (Las 3 Bombas) ──
    console.log(`[PIPELINE] Generando 3 variantes creativas...`)
    const directions: Array<'classic' | 'conversion' | 'storytelling'> = ['classic', 'conversion', 'storytelling']
    const scriptOptions: string[] = []

    for (const direction of directions) {
        const orch = await runOrchestratorPass(currentScript, lensResults, direction)
        scriptOptions.push(orch.updatedScript)

        // Guardamos la primera como principal para compatibilidad
        if (direction === 'classic') {
            currentScript = orch.updatedScript
            lensResults.push({
                lens: 'lens_orchestrator',
                verdict: orch.verdict,
                feedback: orch.feedback,
                tokensUsed: orch.tokensUsed
            })
        }
    }

    // ── Paso 4: Auditoría sobre la opción seleccionada (por ahora la v1) ──
    const auditResult = await runLensPass('lens_buyer_persona', currentScript)
    lensResults.push({
        lens: 'lens_buyer_persona',
        verdict: auditResult.verdict,
        feedback: auditResult.feedback,
        tokensUsed: auditResult.tokensUsed,
    })

    return {
        scriptId,
        versions,
        lensResults,
        finalScript: currentScript,
        currentVersion: currentVersion + 1,
        scriptOptions
    }
}

export async function runOrchestratorPass(
    v0Script: string,
    expertCritiques: LensResult[],
    direction: 'classic' | 'conversion' | 'storytelling' = 'classic',
    preferredProvider?: string
): Promise<{
    updatedScript: string,
    verdict: 'green' | 'yellow' | 'red',
    feedback: string,
    tokensUsed: number
}> {
    const rawAdn = loadPrompt('adn-activaqr')
    const rawOrchPrompt = loadPrompt('lens-orchestrator')

    // FIX: Reemplazar placeholder del ADN
    const orchestratorPrompt = rawOrchPrompt.replace('[INSERCIÓN DEL ADN DE LA EMPRESA]', rawAdn)

    const directionInstructions = {
        classic: "DIRECCIÓN: Fiel al ADN puro y elegancia de la marca.",
        conversion: "DIRECCIÓN: High-Conversion. Enfócate en ganchos agresivos, escasez y neuroventas.",
        storytelling: "DIRECCIÓN: Narrativa emocional. Enfócate en la historia del usuario y conexión humana."
    }

    const critiquesText = expertCritiques
        .map(c => `EXPERT: ${c.lens.toUpperCase()}\nVERDICT: ${c.verdict}\nSUGGESTIONS: ${c.feedback}`)
        .join('\n\n---\n\n')

    const executeCall = async (providerName?: string) => {
        const llm = getLLMProvider(providerName)
        return await llm.complete({
            system: rawAdn,
            messages: [
                {
                    role: 'user',
                    content: [
                        orchestratorPrompt,
                        directionInstructions[direction],
                        '---',
                        'GUION BORRADOR (v0):',
                        v0Script,
                        '---',
                        'CRÍTICAS DEL PANEL DE EXPERTOS:',
                        critiquesText
                    ].join('\n\n'),
                },
            ],
            modelLevel: 'advanced',
        })
    }

    try {
        const response = await executeCall(preferredProvider)
        return {
            updatedScript: extractUpdatedScript(response.content, v0Script),
            verdict: extractVerdict(response.content),
            feedback: response.content,
            tokensUsed: response.tokensUsed,
        }
    } catch (error: any) {
        const isQuotaError = error.message.includes('429') || error.message.includes('quota')
        if ((preferredProvider || 'gemini') === 'gemini' && isQuotaError) {
            const response = await executeCall('deepseek')
            return {
                updatedScript: extractUpdatedScript(response.content, v0Script),
                verdict: extractVerdict(response.content),
                feedback: response.content,
                tokensUsed: response.tokensUsed,
            }
        }
        throw error
    }
}

export async function generateInitialDraft(options: {
    idea: string,
    duration: string,
    style: string,
    preferredProvider?: string
}): Promise<string> {
    const { idea, duration, style, preferredProvider } = options
    const adn = loadPrompt('adn-activaqr')
    const draftPrompt = loadPrompt('draft-initial')

    const executeCall = async (providerName?: string) => {
        const llm = getLLMProvider(providerName)
        return await llm.complete({
            system: adn,
            messages: [
                {
                    role: 'user',
                    content: `${draftPrompt}\n\n---\nIDEA DEL USUARIO: ${idea}\nDURACIÓN OBJETIVO: ${duration}\nESTILO REQUERIDO: ${style}`,
                },
            ],
            modelLevel: 'standard',
        })
    }

    try {
        console.log(`[PIPELINE] Generando borrador inicial (${preferredProvider || 'default'})...`)
        const response = await executeCall(preferredProvider)
        return response.content
    } catch (error: any) {
        const isQuotaError = error.message.includes('429') ||
            error.message.includes('quota') ||
            error.message.includes('RESOURCE_EXHAUSTED')

        // Fallback si el proveedor actual es gemini y falló por cuota
        const currentProvider = preferredProvider || process.env.LLM_PROVIDER || 'gemini'
        if (currentProvider === 'gemini' && isQuotaError) {
            console.warn(`[PIPELINE] Gemini quota hit. Falling back to DeepSeek for initial draft...`)
            const fallbackResponse = await executeCall('deepseek')
            return fallbackResponse.content
        }
        throw error
    }
}

/**
 * Aplica un lente específico a un guion existente.
 */
export async function runLensPass(
    lensId: LensType,
    currentScript: string,
    preferredProvider?: string
): Promise<{
    updatedScript: string,
    verdict: 'green' | 'yellow' | 'red',
    feedback: string,
    tokensUsed: number
}> {
    const adn = loadPrompt('adn-activaqr')
    const lensConfig = LENSES[lensId]
    const lensPrompt = loadPrompt(lensConfig.promptFile)

    const executeCall = async (providerName?: string) => {
        const llm = getLLMProvider(providerName)
        return await llm.complete({
            system: adn,
            messages: [
                {
                    role: 'user',
                    content: [
                        lensPrompt,
                        '---',
                        'GUION ACTUAL (versión a evaluar):',
                        currentScript,
                    ].join('\n\n'),
                },
            ],
            modelLevel: lensConfig.modelLevel || 'advanced',
        })
    }

    try {
        console.log(`[PIPELINE] Aplicando lente: ${lensId.toUpperCase()} (${preferredProvider || 'default'})...`)
        const response = await executeCall(preferredProvider)
        const verdict = extractVerdict(response.content)
        const updatedScript = lensConfig.mutatesScript
            ? extractUpdatedScript(response.content, currentScript)
            : currentScript

        return {
            updatedScript,
            verdict,
            feedback: response.content,
            tokensUsed: response.tokensUsed,
        }
    } catch (error: any) {
        const isQuotaError = error.message.includes('429') ||
            error.message.includes('quota') ||
            error.message.includes('RESOURCE_EXHAUSTED')

        const currentProvider = preferredProvider || process.env.LLM_PROVIDER || 'gemini'
        if (currentProvider === 'gemini' && isQuotaError) {
            console.warn(`[PIPELINE] Gemini quota hit. Falling back to DeepSeek for lens ${lensId}...`)
            const response = await executeCall('deepseek')
            const verdict = extractVerdict(response.content)
            const updatedScript = lensConfig.mutatesScript
                ? extractUpdatedScript(response.content, currentScript)
                : currentScript

            return {
                updatedScript,
                verdict,
                feedback: response.content,
                tokensUsed: response.tokensUsed,
            }
        }
        throw error
    }
}

// ── Helpers ──────────────────────────────────────────────────────────────

export function extractVerdict(output: string): 'green' | 'yellow' | 'red' {
    const lower = output.toLowerCase()
    if (lower.includes('veredicto: verde') || lower.includes('verdict: green')) return 'green'
    if (lower.includes('veredicto: rojo') || lower.includes('verdict: red')) return 'red'
    return 'yellow'
}

/**
 * Extrae el guion actualizado del output del lente.
 */
export function extractUpdatedScript(output: string, fallback: string): string {
    const match = output.match(
        /---\s*GUION ACTUALIZADO\s*---\n([\s\S]*?)\n---\s*FIN GUION\s*---/i
    )
    return match ? match[1].trim() : fallback
}
