import fs from 'fs'
import path from 'path'

/**
 * Cargador de prompts desde /prompts/*.md
 *
 * Los prompts NUNCA se hardcodean en código — viven como archivos .md
 * y se leen en runtime. Para cambiar un prompt, editar el archivo .md,
 * no el código.
 *
 * Uso:
 *   const prompt = loadPrompt('lens-01-clarity')
 *   const adn    = loadPrompt('adn-activaqr')
 */

const PROMPTS_DIR = path.join(process.cwd(), 'prompts')

/** Cache en memoria para evitar I/O redundante en la misma instancia */
const cache = new Map<string, string>()

export function loadPrompt(name: string): string {
    const cached = cache.get(name)
    if (cached) return cached

    const filePath = path.join(PROMPTS_DIR, `${name}.md`)

    if (!fs.existsSync(filePath)) {
        throw new Error(
            `Prompt no encontrado: "${name}.md" en ${PROMPTS_DIR}\n` +
            `Prompts disponibles: ${listAvailablePrompts().join(', ')}`
        )
    }

    const content = fs.readFileSync(filePath, 'utf-8')
    cache.set(name, content)
    return content
}

export function listAvailablePrompts(): string[] {
    if (!fs.existsSync(PROMPTS_DIR)) return []
    return fs
        .readdirSync(PROMPTS_DIR)
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace('.md', ''))
}

/** Invalida el cache de un prompt (útil en desarrollo) */
export function invalidatePromptCache(name?: string) {
    if (name) {
        cache.delete(name)
    } else {
        cache.clear()
    }
}
