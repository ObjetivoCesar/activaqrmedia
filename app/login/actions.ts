'use server'

import { getSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function login(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { success: false, error: 'Por favor ingresa usuario y contraseña.' }
    }

    const supabase = await getSupabaseServerClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    // We can't use redirect directly inside a try-catch, so we handle the error return first.
    if (error) {
        console.error('Login error:', error.message)
        return { success: false, error: error.message }
    }

    // Si login es válido, redirigimos limpiamente
    redirect('/')
}

export async function logout() {
    const supabase = await getSupabaseServerClient()
    await supabase.auth.signOut()
    redirect('/login')
}
