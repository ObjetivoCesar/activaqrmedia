import { getLLMProvider } from '@/lib/llm/provider'
import { loadPrompt } from '@/lib/prompts/loader'

export interface BuyerPersonaProfile {
    name: string
    description: string
    q1: boolean   // ¿Entendí lo que hace el producto?
    q2: boolean   // ¿Siento que esto es para mí o para mi negocio?
    q3: boolean   // ¿Haría algo después de ver este video?
    passed: boolean
    comments: string
}

export interface ChecklistResult {
    profile1: BuyerPersonaProfile
    profile2: BuyerPersonaProfile
    profile3: BuyerPersonaProfile
    profile4: BuyerPersonaProfile
    overallPass: boolean
    failedProfiles: string[]
    rawOutput: string
    tokensUsed: number
}

/**
 * Corre el checklist de los 4 buyer personas dinámicos.
 * Claude genera los perfiles en base al sector del guion (no son fijos).
 * Si cualquier perfil responde NO a q1 o q2 → overallPass = false.
 */
export async function runChecklist(script: string): Promise<ChecklistResult> {
    const llm = getLLMProvider()
    const adn = loadPrompt('adn-activaqr')
    const checklistPrompt = loadPrompt('checklist-buyer-persona')

    const response = await llm.complete({
        system: adn,
        messages: [
            {
                role: 'user',
                content: [
                    checklistPrompt,
                    '---',
                    'GUION A EVALUAR:',
                    script,
                ].join('\n\n'),
            },
        ],
        maxTokens: 4096,
    })

    const parsed = parseChecklistOutput(response.content)

    return {
        ...parsed,
        rawOutput: response.content,
        tokensUsed: response.tokensUsed,
    }
}

/**
 * Parsea el output estructurado del checklist.
 * El prompt de checklist-buyer-persona.md debe devolver JSON entre bloques:
 * ```json
 * { "profile1": {...}, "profile2": {...}, ... }
 * ```
 */
function parseChecklistOutput(output: string): Omit<ChecklistResult, 'rawOutput' | 'tokensUsed'> {
    const jsonMatch = output.match(/```json\n([\s\S]*?)\n```/)

    if (!jsonMatch) {
        // Fallback: intentar parsear el output completo
        throw new Error(
            'El LLM no devolvió JSON válido para el checklist. Revisar prompt checklist-buyer-persona.md'
        )
    }

    const data = JSON.parse(jsonMatch[1])
    const profiles: BuyerPersonaProfile[] = [
        data.profile1,
        data.profile2,
        data.profile3,
        data.profile4,
    ]

    const failedProfiles = profiles
        .filter((p) => !p.q1 || !p.q2)
        .map((p) => p.name)

    return {
        profile1: data.profile1,
        profile2: data.profile2,
        profile3: data.profile3,
        profile4: data.profile4,
        overallPass: failedProfiles.length === 0,
        failedProfiles,
    }
}
