const { runPipeline } = require('../lib/pipeline/executor');
const dotenv = require('dotenv');
const path = require('path');

// Load .env.local
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function test() {
    console.log('--- Testing Pipeline Diagnostics (CJS) ---');
    console.log('Provider:', process.env.LLM_PROVIDER);
    console.log('Model:', process.env.DEEPSEEK_MODEL);
    console.log('CWD:', process.cwd());

    try {
        const result = await runPipeline({
            scriptId: 'test_diag',
            idea: 'Vender ActivaQR a medicos muy ocupados',
            duration: '15s',
            style: 'retorical'
        });
        console.log('✅ Pipeline Success!');
        console.log('Final Script Length:', result.finalScript.length);
    } catch (err: any) {
        console.error('❌ Pipeline Failed with Error:');
        console.error(err.message);
        if (err.stack) console.error(err.stack);
    }
}

test();
