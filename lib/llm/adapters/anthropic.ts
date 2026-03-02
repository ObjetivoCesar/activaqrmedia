import Anthropic from '@anthropic-ai/sdk'
import type { LLMAdapter, LLMRequestOptions, LLMResponse } from '../types'

/**
 * Adaptador para la API de Anthropic (Claude).
 * Implementa la interfaz LLMAdapter — el resto del código
 * no necesita saber qué proveedor está usando.
 */
export class AnthropicAdapter implements LLMAdapter {
    private client: Anthropic
    private model: string

    constructor() {
        this.client = new Anthropic({ apiKey: process.env.LLM_API_KEY })
        this.model = process.env.LLM_MODEL ?? 'claude-opus-4-5'
    }

    async complete(options: LLMRequestOptions): Promise<LLMResponse> {
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: options.maxTokens ?? 8192,
            system: options.system,
            messages: options.messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
        })

        const content =
            response.content[0].type === 'text' ? response.content[0].text : ''

        const tokensUsed =
            (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0)

        return { content, tokensUsed, model: response.model }
    }
}
