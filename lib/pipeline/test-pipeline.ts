import { runPipeline } from './executor'
import 'dotenv/config'

async function testPipeline() {
    try {
        console.log('Testing Expert Lens Pipeline locally...')

        // Simular que aseguramos que dotenv haya cargado los valores correctos
        if (!process.env.DEEPSEEK_API_KEY) {
            console.warn('⚠️ DEEPSEEK_API_KEY no encontrada en process.env. Cargando de .env.local...')
            require('dotenv').config({ path: '.env.local' });
        }

        const idea = `
Quiero un video para TikTok e Instagram Reels.
Soy un abogado en Bogotá especializado en derecho laboral.
Ayudo a empleados que fueron despedidos injustificadamente a conseguir su liquidación correcta y muchas veces los reintegramos si tenían estabilidad laboral reforzada (por salud o embarazo).
Quiero que el tono sea directo, que no suene a "abogado aburrido", sino a alguien que les da la razón y los defiende contra las empresas abusivas.
El objetivo es que guarden mi contacto escaneando mi código ActivaQR que pondré al final del video.
        `.trim()

        console.log('--- IDEA DEL USUARIO ---')
        console.log(idea)
        console.log('------------------------\n')

        console.log('Iniciando pipeline... (Esto puede tardar un par de minutos dependiendo del LLM)')

        const startTime = Date.now()

        const result = await runPipeline({
            scriptId: 'test-local-script-123',
            idea,
            duration: '60 segundos',
            style: 'Cinemático'
        })

        const endTime = Date.now()

        console.log('\n=======================================')
        console.log('PIPELINE COMPLETADO EXITOSAMENTE')
        console.log(`Tiempo total: ${((endTime - startTime) / 1000).toFixed(2)}s`)
        console.log('=======================================\n')

        console.log('--- LENS RESULTS ---')
        result.lensResults.forEach((lens, index) => {
            console.log(`\n### [${index + 1}] Lente: ${lens.lens.toUpperCase()} ###`)
            console.log(`Veredicto: ${lens.verdict.toUpperCase()}`)
            console.log(`Tokens usados: ${lens.tokensUsed}`)
            console.log('Feedback extract:\n', lens.feedback.substring(0, 150) + '...\n')
        })

        console.log('\n--- HISTORIAL DE VERSIONES ---')
        console.log(`Total de versiones: ${result.versions.length}`)
        result.versions.forEach(v => {
            console.log(`- Versión ${v.version} (Trigger: ${v.triggeredBy})`)
        })

        console.log('\n=======================================')
        console.log('GUION FINAL GENERADO')
        console.log('=======================================')
        console.log(result.finalScript)
        console.log('\n=======================================')

    } catch (error) {
        console.error('\n--- ERROR DURANTE EL PIPELINE ---')
        console.error(error)
        console.error('---------------------------------\n')
    }
}

testPipeline()
