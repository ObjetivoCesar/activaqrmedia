import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Cliente con SERVICE_ROLE_KEY para operaciones admin (sin RLS).
 * Este cliente NO usa cookies y es seguro para llamar desde Server Actions
 * sin riesgo de fugas de 'next/headers' al bundle del cliente.
 */
export function getSupabaseServiceClient() {
    return createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
