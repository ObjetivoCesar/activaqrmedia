import { getLLMProvider } from './provider'
import 'dotenv/config' // Carga .env.local si se ejecuta directamente con ts-node

async function testDeepSeek() {
    try {
        console.log('Testing DeepSeek Adapter...')

        // Simular que aseguramos que dotenv haya cargado los valores correctos
        if (!process.env.DEEPSEEK_API_KEY) {
            console.warn('⚠️ DEEPSEEK_API_KEY no encontrada en process.env. Cargando de .env.local...')
            require('dotenv').config({ path: '.env.local' });
        }

        const llm = getLLMProvider()

        const response = await llm.complete({
            system: 'Eres un asistente útil que responde siempre con "Hola mundo".',
            messages: [
                { role: 'user', content: 'Dime cualquier cosa.' }
            ],
            maxTokens: 50
        })

        console.log('\n--- SUCCESS ---')
        console.log('Model:', response.model)
        console.log('Tokens used:', response.tokensUsed)
        console.log('Content:', response.content)
        console.log('-----------------\n')
    } catch (error) {
        console.error('\n--- ERROR ---')
        console.error(error)
        console.error('---------------\n')
    }
}

testDeepSeek()
