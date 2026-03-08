export type HookCategory =
    | 'movimiento_camara'
    | 'objeto_protagonista'
    | 'narrativo'
    | 'pov_inmersivo'
    | 'demostracion'
    | 'movimiento_humano'
    | 'interaccion_directa'
    | 'cambio_visual';

export type ContentStyle =
    | 'educativo'
    | 'storytelling'
    | 'tutorial'
    | 'vlog'
    | 'opinion'
    | 'emocional'
    | 'tecnico';

export type DifficultyLevel = 'baja' | 'media' | 'alta';

export interface VisualHook {
    id: string; // "hook_01"
    category: HookCategory;
    difficulty: DifficultyLevel;
    requiresObject: boolean;
    requiresMovement: boolean;
    idealFor: ContentStyle[];
    instructions: string;
}

export const VISUAL_HOOKS: VisualHook[] = [
    // 1. Hooks con movimiento de cámara
    {
        id: 'hook_01',
        category: 'movimiento_camara',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['vlog', 'opinion', 'storytelling'],
        instructions: 'Empieza moviendo el celular hacia la mesa y lo apoyas mientras empiezas a hablar.',
    },
    {
        id: 'hook_02',
        category: 'movimiento_camara',
        difficulty: 'media',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['emocional', 'storytelling', 'opinion'],
        instructions: 'Cámara apuntando al techo → bajas el celular y apareces en cuadro.',
    },
    {
        id: 'hook_03',
        category: 'movimiento_camara',
        difficulty: 'media',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['educativo', 'opinion'],
        instructions: 'Cámara apuntando al suelo → la levantas hacia tu cara.',
    },
    {
        id: 'hook_04',
        category: 'movimiento_camara',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['vlog', 'storytelling'],
        instructions: 'Tomas el celular con la mano y caminas hacia el trípode.',
    },
    {
        id: 'hook_05',
        category: 'movimiento_camara',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['educativo', 'tutorial', 'tecnico'],
        instructions: 'Colocas el celular en el trípode frente a la cámara.',
    },
    {
        id: 'hook_06',
        category: 'movimiento_camara',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['educativo', 'opinion', 'vlog'],
        instructions: 'Apareces entrando al plano desde un lado.',
    },
    {
        id: 'hook_07',
        category: 'movimiento_camara',
        difficulty: 'alta',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['tecnico', 'emocional'],
        instructions: 'Empiezas desenfocado y te acercas a la cámara.',
    },
    {
        id: 'hook_08',
        category: 'movimiento_camara',
        difficulty: 'media',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['educativo', 'opinion'],
        instructions: 'Cámara quieta y te sientas rápidamente frente a ella.',
    },

    // 2. Hooks con objeto protagonista
    {
        id: 'hook_09',
        category: 'objeto_protagonista',
        difficulty: 'baja',
        requiresObject: true,
        requiresMovement: false,
        idealFor: ['educativo', 'tecnico', 'tutorial'],
        instructions: 'Empiezas sosteniendo un objeto frente a la cámara.',
    },
    {
        id: 'hook_10',
        category: 'objeto_protagonista',
        difficulty: 'media',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['educativo', 'tecnico'],
        instructions: 'El objeto entra al plano desde abajo.',
    },
    {
        id: 'hook_11',
        category: 'objeto_protagonista',
        difficulty: 'media',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['educativo', 'tecnico'],
        instructions: 'El objeto aparece desde un lado.',
    },
    {
        id: 'hook_12',
        category: 'objeto_protagonista',
        difficulty: 'media',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['educativo', 'tutorial'],
        instructions: 'Acercas el objeto lentamente a la cámara.',
    },
    {
        id: 'hook_13',
        category: 'objeto_protagonista',
        difficulty: 'media',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['opinion', 'tecnico'],
        instructions: 'Golpeas la mesa suavemente con el objeto.',
    },
    {
        id: 'hook_14',
        category: 'objeto_protagonista',
        difficulty: 'alta',
        requiresObject: true,
        requiresMovement: false,
        idealFor: ['educativo', 'tecnico'],
        instructions: 'Muestras dos objetos comparándolos.',
    },
    {
        id: 'hook_15',
        category: 'objeto_protagonista',
        difficulty: 'media',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['storytelling', 'opinion'],
        instructions: 'Dejas caer el objeto en la mesa.',
    },
    {
        id: 'hook_16',
        category: 'objeto_protagonista',
        difficulty: 'baja',
        requiresObject: true,
        requiresMovement: false,
        idealFor: ['educativo', 'tutorial'],
        instructions: 'Señalas el objeto mientras hablas.',
    },

    // 3. Hooks narrativos (mini historia)
    {
        id: 'hook_17',
        category: 'narrativo',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['storytelling', 'emocional'],
        instructions: 'Empiezas de espaldas y luego te giras hacia la cámara.',
    },
    {
        id: 'hook_18',
        category: 'narrativo',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: false,
        idealFor: ['storytelling', 'opinion'],
        instructions: 'Empiezas mirando algo fuera de cámara y luego miras al frente.',
    },
    {
        id: 'hook_19',
        category: 'narrativo',
        difficulty: 'baja',
        requiresObject: true,
        requiresMovement: false,
        idealFor: ['educativo', 'storytelling'],
        instructions: 'Empiezas leyendo un papel.',
    },
    {
        id: 'hook_20',
        category: 'narrativo',
        difficulty: 'baja',
        requiresObject: true,
        requiresMovement: false,
        idealFor: ['vlog', 'storytelling'],
        instructions: 'Empiezas revisando tu celular.',
    },
    {
        id: 'hook_21',
        category: 'narrativo',
        difficulty: 'baja',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['educativo', 'tecnico'],
        instructions: 'Empiezas escribiendo algo en una libreta o pizarra.',
    },
    {
        id: 'hook_22',
        category: 'narrativo',
        difficulty: 'baja',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['tecnico', 'opinion'],
        instructions: 'Empiezas cerrando una laptop de golpe.',
    },
    {
        id: 'hook_23',
        category: 'narrativo',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: false,
        idealFor: ['emocional', 'storytelling'],
        instructions: 'Empiezas suspirando como si algo hubiera salido mal.',
    },
    {
        id: 'hook_24',
        category: 'narrativo',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['opinion'],
        instructions: 'Empiezas negando con la cabeza.',
    },

    // 4. Hooks tipo POV (inmersivos)
    {
        id: 'hook_25',
        category: 'pov_inmersivo',
        difficulty: 'alta',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['tecnico', 'tutorial', 'vlog'],
        instructions: 'Cámara dentro de una caja que abres hacia la luz.',
    },
    {
        id: 'hook_26',
        category: 'pov_inmersivo',
        difficulty: 'alta',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['storytelling', 'vlog'],
        instructions: 'Cámara dentro de un cajón que abres.',
    },
    {
        id: 'hook_27',
        category: 'pov_inmersivo',
        difficulty: 'alta',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['storytelling', 'vlog'],
        instructions: 'Cámara dentro de una mochila, mirando hacia arriba cuando la abres.',
    },
    {
        id: 'hook_28',
        category: 'pov_inmersivo',
        difficulty: 'media',
        requiresObject: true,
        requiresMovement: false,
        idealFor: ['tutorial', 'educativo'],
        instructions: 'Cámara sobre la mesa (plano POV de tus manos) mientras pones objetos.',
    },
    {
        id: 'hook_29',
        category: 'pov_inmersivo',
        difficulty: 'alta',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['educativo', 'storytelling'],
        instructions: 'Cámara dentro de un libro que se abre.',
    },
    {
        id: 'hook_30',
        category: 'pov_inmersivo',
        difficulty: 'alta',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['educativo', 'tecnico'],
        instructions: 'Cámara apuntando desde dentro de un folder que levantas.',
    },

    // 5. Hooks tipo demostración
    {
        id: 'hook_31',
        category: 'demostracion',
        difficulty: 'media',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['tutorial', 'vlog'],
        instructions: 'Empiezas haciendo algo manual con las manos (ej: doblando algo, armando algo).',
    },
    {
        id: 'hook_32',
        category: 'demostracion',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['educativo', 'tutorial'],
        instructions: 'Empiezas señalando algo específico en la mesa.',
    },
    {
        id: 'hook_33',
        category: 'demostracion',
        difficulty: 'baja',
        requiresObject: true,
        requiresMovement: false,
        idealFor: ['educativo', 'tecnico'],
        instructions: 'Empiezas mostrando una lista en papel o pantalla.',
    },
    {
        id: 'hook_34',
        category: 'demostracion',
        difficulty: 'baja',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['educativo', 'tecnico'],
        instructions: 'Empiezas marcando algo violentamente con marcador.',
    },
    {
        id: 'hook_35',
        category: 'demostracion',
        difficulty: 'baja',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['educativo', 'opinion'],
        instructions: 'Empiezas tachando algo en una hoja (pattern interrupt fuerte).',
    },
    {
        id: 'hook_36',
        category: 'demostracion',
        difficulty: 'baja',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['educativo', 'storytelling'],
        instructions: 'Empiezas subrayando un texto en un libro.',
    },
    {
        id: 'hook_37',
        category: 'demostracion',
        difficulty: 'baja',
        requiresObject: true,
        requiresMovement: true,
        idealFor: ['educativo', 'tecnico'],
        instructions: 'Empiezas escribiendo una palabra clave muy visible.',
    },

    // 6. Hooks con movimiento humano
    {
        id: 'hook_38',
        category: 'movimiento_humano',
        difficulty: 'media',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['vlog', 'storytelling'],
        instructions: 'Apareces caminando hacia la cámara desde el fondo.',
    },
    {
        id: 'hook_39',
        category: 'movimiento_humano',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['educativo', 'opinion'],
        instructions: 'Te sientas frente al escritorio o silla.',
    },
    {
        id: 'hook_40',
        category: 'movimiento_humano',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['emocional', 'opinion'],
        instructions: 'Empiezas sentado y te levantas de la silla con energía.',
    },
    {
        id: 'hook_41',
        category: 'movimiento_humano',
        difficulty: 'media',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['vlog', 'storytelling'],
        instructions: 'Cruzas el cuadro caminando de izquierda a derecha (o viceversa).',
    },
    {
        id: 'hook_42',
        category: 'movimiento_humano',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['emocional', 'opinion'],
        instructions: 'Te acercas a cámara lentamente (crea intimidad).',
    },
    {
        id: 'hook_43',
        category: 'movimiento_humano',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['educativo', 'opinion'],
        instructions: 'Te inclinas hacia adelante hacia la cámara (demuestra interés o secreto).',
    },

    // 7. Hooks con interacción directa
    {
        id: 'hook_44',
        category: 'interaccion_directa',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['opinion', 'educativo'],
        instructions: 'Señalas directamente a la cámara (al espectador).',
    },
    {
        id: 'hook_45',
        category: 'interaccion_directa',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['emocional', 'storytelling'],
        instructions: 'Levantas una ceja mirando fijamente a la cámara.',
    },
    {
        id: 'hook_46',
        category: 'interaccion_directa',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['storytelling', 'opinion'],
        instructions: 'Haces gesto de silencio (dedo en los labios) antes de hablar.',
    },
    {
        id: 'hook_47',
        category: 'interaccion_directa',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['educativo', 'tutorial'],
        instructions: 'Aplaudes una vez fuerte para iniciar la acción.',
    },
    {
        id: 'hook_48',
        category: 'interaccion_directa',
        difficulty: 'baja',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['tecnico', 'educativo'],
        instructions: 'Chasqueas los dedos frente a la cámara.',
    },

    // 8. Hooks con cambio visual
    {
        id: 'hook_49',
        category: 'cambio_visual',
        difficulty: 'media',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['vlog', 'tecnico'],
        instructions: 'Tapas la cámara con la mano y la destapas rápidamente para iniciar.',
    },
    {
        id: 'hook_50',
        category: 'cambio_visual',
        difficulty: 'media',
        requiresObject: false,
        requiresMovement: true,
        idealFor: ['educativo', 'storytelling'],
        instructions: 'Empiezas con un plano vacío de tu set (2 segundos) y luego entras rápido al cuadro.',
    }
];

export interface CameraAngle {
    id: string;
    name: string;
    description: string;
}

export const CAMERA_ANGLES: CameraAngle[] = [
    { id: 'angle_picado', name: 'Plano Picado', description: 'Cámara desde arriba mirando hacia abajo. Da sensación documental, tutorial o mostrar objetos en mesa.' },
    { id: 'angle_contrapicado', name: 'Plano Contrapicado', description: 'Cámara desde abajo mirando hacia arriba. Otorga autoridad y poder al creador.' },
    { id: 'angle_frontal', name: 'Plano Frontal (Eye-level)', description: 'Cámara a la altura de los ojos. Clásico, genera confianza.' },
    { id: 'angle_cenital', name: 'Plano Cenital (Top-down)', description: 'Cámara totalmente desde arriba (90 grados). Ideal para unboxing, escribir o cocinar.' },
    { id: 'angle_pov', name: 'Plano POV', description: 'Punto de vista del creador. Como si los ojos del creador fueran la cámara.' }
];

export interface VisualMicroAction {
    id: string;
    name: string;
    description: string;
}

export const MICRO_ACTIONS: VisualMicroAction[] = [
    { id: 'action_zoom_in', name: 'Acercamiento rápido (Zoom In)', description: 'Mover el celular o ti mismo rápido hacia adelante.' },
    { id: 'action_whip_pan', name: 'Whip Pan', description: 'Giro rápido de cámara desde un costado u otro lado hacia el creador.' },
    { id: 'action_drop', name: 'Dejar caer', description: 'Dejar algo sobre la mesa con energía.' },
    { id: 'action_grab', name: 'Agarrar objeto', description: 'Tomar de pronto un elemento con la mano.' },
    { id: 'action_point', name: 'Señalar', description: 'Indicar algo con el dedo o con una pluma.' }
];

export interface SuggestedVisualOpening {
    hook: VisualHook;
    cameraAngle: CameraAngle;
    microAction?: VisualMicroAction;
    combinedInstruction: string;
}

/**
 * Filter hooks based on content type/style and requirements
 */
export function getRecommendedHooks(
    style: ContentStyle,
    requiresObject?: boolean,
    limit: number = 3
): VisualHook[] {
    let filtered = VISUAL_HOOKS.filter(h => h.idealFor.includes(style));

    if (requiresObject !== undefined) {
        filtered = filtered.filter(h => h.requiresObject === requiresObject);
    }

    // Shuffle array using Fisher-Yates
    for (let i = filtered.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filtered[i], filtered[j]] = [filtered[j], filtered[i]];
    }

    return filtered.slice(0, limit);
}

/**
 * Generate a complete combinatorial visual opening
 */
export function generateVisualOpening(style: ContentStyle): SuggestedVisualOpening {
    const hooks = getRecommendedHooks(style, undefined, 1);
    const hook = hooks.length > 0 ? hooks[0] : VISUAL_HOOKS[Math.floor(Math.random() * VISUAL_HOOKS.length)];

    const angle = CAMERA_ANGLES[Math.floor(Math.random() * CAMERA_ANGLES.length)];
    const action = Math.random() > 0.5 ? MICRO_ACTIONS[Math.floor(Math.random() * MICRO_ACTIONS.length)] : undefined;

    let combinedInstruction = `1. Plano: ${angle.name}. ${angle.description}\n2. Acción de inicio: ${hook.instructions}`;

    if (action) {
        combinedInstruction += `\n3. Toque visual extra: ${action.name} (${action.description})`;
    }

    return {
        hook,
        cameraAngle: angle,
        microAction: action,
        combinedInstruction
    };
}
