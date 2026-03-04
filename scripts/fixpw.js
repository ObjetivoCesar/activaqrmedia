const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    const email = 'reyescesarenloja@gmail.com';
    const newPassword = 'PipelineAdmin2026!';

    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) return console.error('Error listUsers:', listError);

    const user = users.find(u => u.email === email);
    if (!user) return console.error('Usuario no encontrado');

    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword
    });

    if (updateError) {
        console.error('Error actualizando clave:', updateError);
    } else {
        console.log('SUCCESS');
    }
}

main();
