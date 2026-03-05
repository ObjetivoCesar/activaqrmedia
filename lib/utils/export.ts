import { PipelineResult } from '@/lib/pipeline/executor'

/**
 * Formatea los resultados del pipeline en un documento Markdown legible.
 * Ideal para abrir en Google Docs o enviar a un productor.
 */
export function formatPipelineForExport(
    idea: string,
    result: PipelineResult,
    extra?: {
        frames?: any[],
        voiceScript?: string,
        sunoPrompt?: string
    }
): string {
    const timestamp = new Date().toLocaleString()

    let doc = `# Reporte de Producción: ${idea.substring(0, 50)}...\n`
    doc += `**Fecha:** ${timestamp}\n`
    doc += `**ID del Proyecto:** ${result.scriptId}\n\n`
    doc += `---\n\n`

    doc += `## 1. Idea Original\n`
    doc += `${idea}\n\n`

    doc += `## 2. Guion Final (v${result.currentVersion})\n`
    doc += `\`\`\`text\n${result.finalScript}\n\`\`\`\n\n`

    if (result.scriptOptions && result.scriptOptions.length > 0) {
        doc += `### Variantes Alternativas\n`
        const labels = ['Clásica', 'Conversión', 'Storytelling']
        result.scriptOptions.forEach((opt, i) => {
            doc += `#### Opción: ${labels[i]}\n`
            doc += `\`\`\`text\n${opt}\n\`\`\`\n\n`
        })
    }

    doc += `## 3. Feedback de Lentes de Expertos\n`
    result.lensResults.forEach(lr => {
        const emoji = lr.verdict === 'green' ? '🟢' : lr.verdict === 'red' ? '🔴' : '🟡'
        doc += `### ${emoji} ${lr.lens.toUpperCase()}\n`
        doc += `${lr.feedback}\n\n`
    })

    if (extra?.frames && extra.frames.length > 0) {
        doc += `## 4. Secuencia de Video (Directores)\n\n`
        extra.frames.forEach((f, i) => {
            doc += `### Escena ${i + 1}\n`
            doc += `* **Script:** ${f.scene}\n`
            doc += `* **Prompt Image:** ${f.imagePrompt}\n`
            doc += `* **Movimiento:** ${f.motionInstructions}\n\n`
        })
    }

    if (extra?.voiceScript || extra?.sunoPrompt) {
        doc += `## 5. Producción de Audio\n\n`
        if (extra.voiceScript) {
            doc += `### 🎙️ Voz en Off\n`
            doc += `${extra.voiceScript}\n\n`
        }
        if (extra.sunoPrompt) {
            doc += `### 🎵 Música (Prompt Suno)\n`
            doc += `${extra.sunoPrompt}\n\n`
        }
    }

    return doc
}
