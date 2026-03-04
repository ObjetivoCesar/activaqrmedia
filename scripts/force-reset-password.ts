import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function main() {
    const email = 'reyescesarenloja@gmail.com'; // Based on the token payload
    const newPassword = process.argv[2];

    if (!newPassword) {
        console.error('❌ Por favor provee una contraseña:\n   npx ts-node scripts/force-reset-password.ts "MiNuevaClave123"');
        process.exit(1);
    }

    // Find user
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error buscando usuarios:', listError.message);
        return;
    }

    const user = users.find(u => u.email === email);
    if (!user) {
        console.error('❌ Usuario no encontrado:', email);
        return;
    }

    console.log(`Usuario encontrado: ${user.id}`);

    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword
    });

    if (updateError) {
        console.error('❌ Error cambiando clave:', updateError.message);
    } else {
        console.log(`✅ Contraseña actualizada exitosamente para ${email}`);
        console.log(`Ya puedes iniciar sesión en https://activaqrmedia.vercel.app/login`);
    }
}

main();
