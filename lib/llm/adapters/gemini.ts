import { GoogleGenAI } from '@google/genai'
import type { LLMAdapter, LLMRequestOptions, LLMResponse } from '../types'
// Disable file logging on Vercel
function debugLog(msg: string) {
    const time = new Date().toISOString()
    console.log(`[GEMINI] [${time}] ${msg}`)
}

/**
 * Adaptador para la API de Google Gemini.
 * Implementa la interfaz LLMAdapter.
 */
export class GeminiAdapter implements LLMAdapter {
    private client: any // Using any to avoid SDK-specific type conflicts if it's an unusual version
    private model: string

    constructor() {
        const apiKey = process.env.GOOGLE_AI_API_KEY || ''
        this.client = new GoogleGenAI({ apiKey })
        this.model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
    }

    async complete(options: LLMRequestOptions): Promise<LLMResponse> {
        try {
            const requestModel = options.modelLevel === 'advanced'
                ? 'gemini-2.0-flash'
                : 'gemini-2.0-flash'

            debugLog(`Gemini: Calling ${requestModel}...`)

            // Reconstruir el prompt incluyendo el system instruction si existe
            const fullPrompt = options.system
                ? `${options.system}\n\n---\n\n${options.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')}`
                : options.messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n\n')

            const response = await this.client.models.generateContent({
                model: requestModel,
                contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
                config: {
                    temperature: options.temperature ?? 0.7,
                    maxOutputTokens: options.maxTokens ?? 8192,
                }
            })

            const content = response.candidates?.[0]?.content?.parts?.[0]?.text || ''
            const tokensUsed = 0

            debugLog(`Gemini: Received ${content.length} chars`)

            return {
                content,
                tokensUsed,
                model: requestModel
            }
        } catch (error: any) {
            console.error('[Gemini] Error in complete():', error.message)
            debugLog(`Gemini ERROR: ${error.message}`)
            throw error
        }
    }
}
