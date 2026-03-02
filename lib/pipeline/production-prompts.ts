import { getLLMProvider } from '@/lib/llm/provider'
import { loadPrompt } from '@/lib/prompts/loader'

export interface SceneVideoPrompt {
    sceneNumber: number
    visualDescription: string
    cinematographicStyle: string
    moodColor: string
    durationSeconds: number
    syncNotes: string
    fullPrompt: string
}

export interface ProductionPackage {
    videoPrompts: SceneVideoPrompt[]
    voicePrompt: string
    musicPrompt: string
    tokensUsed: number
}

/**
 * Genera los 3 paquetes de prompts de producción a partir del guion aprobado.
 * NO hace llamadas a APIs de Kling/ElevenLabs/Suno — solo genera texto.
 */
export async function generateProductionPrompts(script: string): Promise<ProductionPackage> {
    const llm = getLLMProvider()
    const adn = loadPrompt('adn-activaqr')

    // Las 3 generaciones pueden correr en paralelo — son independientes
    const [videoResponse, voiceResponse, musicResponse] = await Promise.all([
        llm.complete({
            system: adn,
            messages: [
                {
                    role: 'user',
                    content: `${loadPrompt('production-video')}\n\n---\nGUION APROBADO:\n${script}`,
                },
            ],
            maxTokens: 4096,
        }),
        llm.complete({
            system: adn,
            messages: [
                {
                    role: 'user',
                    content: `${loadPrompt('production-voice')}\n\n---\nGUION APROBADO:\n${script}`,
                },
            ],
            maxTokens: 2048,
        }),
        llm.complete({
            system: adn,
            messages: [
                {
                    role: 'user',
                    content: `${loadPrompt('production-music')}\n\n---\nGUION APROBADO:\n${script}`,
                },
            ],
            maxTokens: 1024,
        }),
    ])

    const videoPrompts = parseVideoPrompts(videoResponse.content)
    const totalTokens =
        videoResponse.tokensUsed + voiceResponse.tokensUsed + musicResponse.tokensUsed

    return {
        videoPrompts,
        voicePrompt: voiceResponse.content,
        musicPrompt: musicResponse.content,
        tokensUsed: totalTokens,
    }
}

/**
 * Parsea el JSON de prompts de video devuelto por el LLM.
 * El prompt production-video.md debe devolver JSON:
 * ```json
 * [{ "sceneNumber": 1, "visualDescription": "...", ... }]
 * ```
 */
function parseVideoPrompts(output: string): SceneVideoPrompt[] {
    const jsonMatch = output.match(/```json\n([\s\S]*?)\n```/)
    if (!jsonMatch) {
        // Fallback: devolver un solo prompt sin parsear
        return [
            {
                sceneNumber: 1,
                visualDescription: output,
                cinematographicStyle: '',
                moodColor: '',
                durationSeconds: 0,
                syncNotes: '',
                fullPrompt: output,
            },
        ]
    }
    return JSON.parse(jsonMatch[1]) as SceneVideoPrompt[]
}
