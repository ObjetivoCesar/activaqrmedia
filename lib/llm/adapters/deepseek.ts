import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'
import type { LLMAdapter, LLMRequestOptions, LLMResponse } from '../types'

function debugLog(msg: string) {
    const logPath = path.join(process.cwd(), 'pipeline_debug.log')
    const time = new Date().toISOString()
    fs.appendFileSync(logPath, `[${time}] ${msg}\n`)
}

/**
 * Adaptador para la API de DeepSeek.
 * Utiliza el SDK de OpenAI ya que DeepSeek es compatible con la API de OpenAI.
 * Implementa la interfaz LLMAdapter.
 */
export class DeepSeekAdapter implements LLMAdapter {
    private client: OpenAI
    private model: string

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: 'https://api.deepseek.com'
        })
        this.model = process.env.DEEPSEEK_MODEL ?? 'deepseek-reasoner'
    }

    async complete(options: LLMRequestOptions): Promise<LLMResponse> {
        try {
            // Formatear mensajes para OpenAI/DeepSeek
            const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

            if (options.system) {
                messages.push({
                    role: 'system',
                    content: options.system,
                })
            }

            options.messages.forEach((m) => {
                messages.push({
                    role: m.role,
                    content: m.content,
                })
            })

            // Forzar deepseek-chat para estabilidad. El reasoner es demasiado lento para 7 llamadas secuenciales.
            const requestModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

            console.log(`[DeepSeek] Calling ${requestModel}... (Messages: ${messages.length})`)
            debugLog(`DeepSeek: Calling ${requestModel}...`)

            const response = await this.client.chat.completions.create({
                model: requestModel,
                messages: messages,
                max_tokens: options.maxTokens ?? 8192,
                temperature: options.temperature ?? 0.7,
            })

            const content = response.choices[0]?.message?.content || ''
            let tokensUsed = response.usage?.total_tokens ?? 0

            debugLog(`DeepSeek: Received ${content.length} chars`)
            return { content, tokensUsed, model: response.model }
        } catch (error: any) {
            console.error('[DeepSeek] Error in complete():', error.message)
            debugLog(`DeepSeek ERROR: ${error.message}`)
            if (error.response) {
                console.error('[DeepSeek] Status:', error.status)
                console.error('[DeepSeek] Data:', error.data)
            }
            throw error
        }
    }
}
