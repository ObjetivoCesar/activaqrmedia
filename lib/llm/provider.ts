import type { LLMAdapter } from './types'
import { AnthropicAdapter } from './adapters/anthropic'
import { DeepSeekAdapter } from './adapters/deepseek'
import { GeminiAdapter } from './adapters/gemini'

/**
 * Factory que retorna el adaptador LLM correcto según LLM_PROVIDER.
 * Para agregar un nuevo proveedor: crear el adaptador en /adapters/
 * y registrarlo aquí — sin tocar el resto del código.
 */
let _instance: LLMAdapter | null = null

export function getLLMProvider(overrideProvider?: string): LLMAdapter {
    const provider = overrideProvider || process.env.LLM_PROVIDER || 'gemini'

    switch (provider) {
        case 'anthropic':
            return new AnthropicAdapter()
        case 'deepseek':
            return new DeepSeekAdapter()
        case 'gemini':
            return new GeminiAdapter()
        default:
            throw new Error(`LLM_PROVIDER no soportado: "${provider}". Opciones: anthropic, deepseek, gemini`)
    }
}
