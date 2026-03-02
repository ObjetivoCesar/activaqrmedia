import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

/**
 * Transcribe audio a texto usando OpenAI Whisper.
 * Uses OPENAI_API_KEY (independiente del LLM_PROVIDER).
 *
 * @param audioBuffer - Buffer del archivo de audio
 * @param fileName    - Nombre del archivo con extensión (ej: "nota.m4a")
 * @param language    - Idioma hint (default: "es")
 * @returns Texto transcrito
 */
export async function transcribeAudio(
    audioBuffer: Buffer,
    fileName: string,
    language = 'es'
): Promise<string> {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    // Whisper necesita un File object — usamos un blob temporal
    const blob = new Blob([new Uint8Array(audioBuffer)])
    const file = new File([blob], fileName)

    const response = await client.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language,
        response_format: 'text',
    })

    return response as unknown as string
}

/**
 * Transcribe un archivo de audio desde el filesystem (uso en scripts/tests).
 */
export async function transcribeFile(filePath: string, language = 'es'): Promise<string> {
    const buffer = fs.readFileSync(filePath)
    const fileName = path.basename(filePath)
    return transcribeAudio(buffer, fileName, language)
}
