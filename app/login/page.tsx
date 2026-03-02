'use client'

import { useTransition, useState } from 'react'
import { login } from './actions'

export default function LoginPage() {
    const [isPending, startTransition] = useTransition()
    const [errorMsg, setErrorMsg] = useState('')

    async function handleSubmit(formData: FormData) {
        setErrorMsg('')
        startTransition(async () => {
            const res = await login(formData)
            if (res?.error) {
                if (res.error.includes('Invalid login credentials')) {
                    setErrorMsg('Credenciales incorrectas. Verifica tu correo y contraseña.')
                } else {
                    setErrorMsg(res.error)
                }
            }
        })
    }

    return (
        <div className="min-h-screen bg-black text-neutral-200 flex flex-col items-center justify-center p-4 selection:bg-violet-500/30 font-sans">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-violet-900/10 via-black to-black -z-10" />

            <main className="w-full max-w-md">
                <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800/80 rounded-3xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20 mb-4 ring-1 ring-white/10">
                            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-white mb-1">
                            Activa<span className="text-violet-500">QR</span> Pipeline
                        </h1>
                        <p className="text-neutral-400 text-sm">Acceso administrativo seguro.</p>
                    </div>

                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Correo Electrónico</label>
                            <input
                                type="email"
                                name="email"
                                required
                                disabled={isPending}
                                placeholder="cesar@ejemplo.com"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                            />
                        </div>

                        <div className="space-y-1.5 pt-2">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Contraseña</label>
                            <input
                                type="password"
                                name="password"
                                required
                                disabled={isPending}
                                placeholder="••••••••"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                            />
                        </div>

                        {errorMsg && (
                            <div className="p-3 mt-4 rounded-xl bg-red-950/50 border border-red-900/50 text-red-400 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                                ⚠️ {errorMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full py-3.5 mt-6 rounded-xl font-bold text-sm transition-all relative overflow-hidden bg-white text-black hover:bg-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                            {isPending ? (
                                <span className="flex items-center justify-center gap-2 text-neutral-600">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-neutral-400 border-t-black" />
                                    Verificando credenciales...
                                </span>
                            ) : 'Ingresar al Pipeline'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[10px] text-neutral-600 mt-6 uppercase tracking-widest font-bold">
                    Pipeline privado. Acceso restringido.
                </p>
            </main>
        </div>
    )
}
