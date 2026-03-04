import { PipelineResult } from '@/lib/pipeline/executor'

/**
 * Formatea los resultados del pipeline en un documento Markdown legible.
 * Ideal para abrir en Google Docs o enviar a un productor.
 */
export function formatPipelineForExport(idea: string, result: PipelineResult): string {
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

    if (result.checklistResults) {
        doc += `## 4. Validación de Buyer Personas\n`
        const profiles = [
            result.checklistResults.profile1,
            result.checklistResults.profile2,
            result.checklistResults.profile3,
            result.checklistResults.profile4
        ]

        profiles.forEach((p, i) => {
            const passEmoji = p.passed ? '✅' : '❌'
            doc += `### Perfil ${i + 1}: ${p.name} (${passEmoji})\n`
            doc += `**Descripción:** ${p.description}\n`
            doc += `* Entendió el producto: ${p.q1 ? 'Sí' : 'No'}\n`
            doc += `* Siente que es para él: ${p.q2 ? 'Sí' : 'No'}\n`
            doc += `* Haría algo después: ${p.q3 ? 'Sí' : 'No'}\n`
            doc += `**Comentarios:** ${p.comments}\n\n`
        })

        doc += `**Resultado Final:** ${result.checklistResults.overallPass ? 'APROBADO' : 'RECHAZADO'}\n\n`
    }

    if (result.productionPrompts) {
        doc += `## 5. Prompts de Producción\n\n`

        doc += `### 🎥 Video\n`
        result.productionPrompts.videoPrompts.forEach(f => {
            doc += `#### Escena ${f.sceneNumber} (${f.durationSeconds}s)\n`
            doc += `* **Descripción Visual:** ${f.visualDescription}\n`
            doc += `* **Estilo:** ${f.cinematographicStyle}\n`
            doc += `* **Prompt Full:** \`${f.fullPrompt}\`\n\n`
        })

        doc += `### 🎙️ Voz en Off\n`
        doc += `${result.productionPrompts.voicePrompt}\n\n`

        doc += `### 🎵 Música\n`
        doc += `${result.productionPrompts.musicPrompt}\n\n`
    }

    return doc
}
