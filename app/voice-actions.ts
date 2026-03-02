'use server'

import OpenAI from 'openai'
import { GoogleGenAI } from '@google/genai'
import fs from 'fs'
import path from 'path'

// Duration-to-seconds map
const DURATION_SECONDS: Record<string, number> = {
    '15s': 15,
    '30s': 30,
    '60s': 60,
    '120s': 120,
}

function debugLog(msg: string) {
    const logPath = path.join(process.cwd(), 'pipeline_debug.log')
    const time = new Date().toISOString()
    fs.appendFileSync(logPath, `[${time}] ${msg}\n`)
}

export async function extractVoiceScript(
    finalScript: string,
    duration: string
): Promise<{ success: boolean; voiceScript?: string; voiceProfile?: string; error?: string }> {
    try {
        const durationSecs = DURATION_SECONDS[duration] ?? 30
        const targetWords = Math.round((durationSecs / 60) * 135)

        const client = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: 'https://api.deepseek.com',
        })

        const systemPrompt = `Eres un director de casting y producción de audio especializado en voz en off para videos de marketing en español.
Extract the spoken voiceover text from the script.
Eliminate visual instructions [Pantalla:...], scene notes, etc.
Target words: ${targetWords}.
Include markers like [pausa_corta], [pausa_larga], *emphasis*.

FORMAT:
PERFIL DE VOZ:
...
TEXTO DE VOZ EN OFF:
...`

        const response = await client.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `GUION COMPLETO:\n\n${finalScript}` },
            ],
        })

        const content = response.choices[0]?.message?.content || ''
        const profileMatch = content.match(/PERFIL DE VOZ:([\s\S]*?)TEXTO DE VOZ EN OFF:/i)
        const scriptMatch = content.match(/TEXTO DE VOZ EN OFF:\s*([\s\S]+)/i)

        return {
            success: true,
            voiceScript: scriptMatch ? scriptMatch[1].trim() : content,
            voiceProfile: profileMatch ? profileMatch[1].trim() : ''
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function synthesizeVoiceOff(
    voiceScript: string,
    voiceId: string = 'Charon'
): Promise<{ success: boolean; audioBase64?: string; mimeType?: string; error?: string }> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
        const cleanedScript = voiceScript
            .replace(/\[pausa_larga\]/gi, '...')
            .replace(/\[pausa_corta\]/gi, ',')
            .replace(/\*(.*?)\*/g, '$1')

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: [{ parts: [{ text: cleanedScript }] }],
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceId },
                    },
                },
            },
        })

        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData
        if (!data?.data) return { success: false, error: 'No audio data' }

        return { success: true, audioBase64: data.data, mimeType: data.mimeType || 'audio/wav' }
    } catch (error: any) {
        debugLog(`TTS ERROR: ${error.message}`)
        return { success: false, error: error.message }
    }
}

export async function generateGeminiMusic(
    musicPrompt: string
): Promise<{ success: boolean; audioBase64?: string; error?: string }> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY })
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ parts: [{ text: musicPrompt }] }],
            config: { responseModalities: ['AUDIO'] },
        })
        const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData
        if (!data?.data) return { success: false, error: 'No audio data' }
        return { success: true, audioBase64: data.data }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

export async function generateMusicPrompt(
    musicBrief: string,
    duration: string
): Promise<{ success: boolean; sunoPrompt?: string; udioPrompt?: string; mixNotes?: string; error?: string }> {
    try {
        const durationSecs = DURATION_SECONDS[duration] ?? 30
        const client = new OpenAI({
            apiKey: process.env.DEEPSEEK_API_KEY,
            baseURL: 'https://api.deepseek.com',
        })
        const response = await client.chat.completions.create({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: 'You are a music supervisor. Generate Suno/Udio prompts (JSON: sunoPrompt, udioPrompt, mixNotes).' },
                { role: 'user', content: `Brief: ${musicBrief}\nDuration: ${durationSecs}s` },
            ],
            response_format: { type: 'json_object' },
        })
        const parsed = JSON.parse(response.choices[0]?.message?.content || '{}')
        return { success: true, ...parsed }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}
