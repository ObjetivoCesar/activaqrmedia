export type LensType =
    | 'lens_clarity'
    | 'lens_neuro'
    | 'lens_ad_copy'
    | 'lens_pricing'
    | 'lens_closer'
    | 'lens_seo'
    | 'lens_content'
    | 'lens_orchestrator'
    | 'lens_buyer_persona'

export interface LensConfig {
    id: LensType
    name: string
    description: string
    promptFile: string
    mutatesScript: boolean // El orquestador sí muta, los demás son críticos
    modelLevel?: 'standard' | 'advanced'
}

export const LENS_ORDER: LensType[] = [
    'lens_clarity',
    'lens_neuro',
    'lens_ad_copy',
    'lens_pricing',
    'lens_closer',
    'lens_seo',
    'lens_content'
]

export const LENSES: Record<LensType, LensConfig> = {
    lens_clarity: {
        id: 'lens_clarity',
        name: '🧒 Claridad (Niño 10 años)',
        description: 'Asegura que el mensaje sea ultra simple y sin fricción.',
        promptFile: 'lens-clarity',
        mutatesScript: false,
    },
    lens_neuro: {
        id: 'lens_neuro',
        name: '🧠 Neuroventas',
        description: 'Optimiza los ganchos emocionales y triggers de dolor/placer.',
        promptFile: 'lens-neuro',
        mutatesScript: false,
    },
    lens_ad_copy: {
        id: 'lens_ad_copy',
        name: '✍️ Ad-Copywriter',
        description: 'Crea hooks irresistibles y headlines que detienen el scroll.',
        promptFile: 'lens-marketing', // Basado en marketing skills
        mutatesScript: false,
    },
    lens_pricing: {
        id: 'lens_pricing',
        name: '💰 Estratega de Precios',
        description: 'Compara el valor de ActivaQR vs el costo de métodos tradicionales.',
        promptFile: 'lens-pricing',
        mutatesScript: false,
    },
    lens_closer: {
        id: 'lens_closer',
        name: '🤝 El Closer',
        description: 'Diseña el cierre para maximizar la conversión inmediata.',
        promptFile: 'lens-closer',
        mutatesScript: false,
    },
    lens_seo: {
        id: 'lens_seo',
        name: '🔍 Auditor SEO & Branding',
        description: 'Asegura presencia de marca y optimización de keywords.',
        promptFile: 'lens-seo',
        mutatesScript: false,
    },
    lens_content: {
        id: 'lens_content',
        name: '📱 Estratega de Contenido',
        description: 'Busca que el video sea shareable y altamente recordable.',
        promptFile: 'lens-content',
        mutatesScript: false,
    },
    lens_orchestrator: {
        id: 'lens_orchestrator',
        name: '🎬 El Orquestador',
        description: 'Unifica todas las críticas en el guion final perfecto.',
        promptFile: 'lens-orchestrator',
        mutatesScript: true,
        modelLevel: 'advanced'
    },
    lens_buyer_persona: {
        id: 'lens_buyer_persona',
        name: '👥 Auditores de Mercado',
        description: 'Validación final por perfiles de clientes reales.',
        promptFile: 'lens-buyer-persona',
        mutatesScript: false,
        modelLevel: 'standard'
    }
}
