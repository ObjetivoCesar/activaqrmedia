'use client'

import { useState, useEffect } from 'react'
import { generateDraftAction, runLensAction, runOrchestratorAction, saveFullPipelineAction, generateVideoFrames, generateScript } from './actions'
import { formatPipelineForExport } from '@/lib/utils/export'
import { extractVoiceScript, synthesizeVoiceOff, generateMusicPrompt, generateGeminiMusic } from './voice-actions'

import { logout } from './login/actions'
import { GEMINI_VOICES } from '@/lib/audio/voices'
import { LENS_ORDER } from '@/lib/pipeline/lenses'
import type { PipelineResult, LensResult } from '@/lib/pipeline/executor'

interface VideoStyle {
  id: string
  title: string
  prompt: string
  image: string
  category: string
}

/* ── Step indicator ───────────────────────────────────────────────────── */
const STEPS = [
  { id: 1, emoji: '💡', label: 'Tu Idea' },
  { id: 2, emoji: '📝', label: 'Guion' },
  { id: 3, emoji: '🎨', label: 'Estilo Visual' },
  { id: 4, emoji: '🎙️', label: 'Voz & Música' },
]

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className={`flex flex-col items-center ${current >= s.id ? 'opacity-100' : 'opacity-30'} transition-all duration-500`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all duration-300
              ${current === s.id ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_20px_rgba(139,92,246,0.4)]' :
                current > s.id ? 'border-violet-400 bg-violet-400/20' : 'border-neutral-700 bg-neutral-800'}`}>
              {current > s.id ? '✓' : s.emoji}
            </div>
            <span className="text-[11px] mt-1.5 font-medium text-neutral-400 whitespace-nowrap">{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`w-16 h-[2px] mb-5 mx-1 rounded transition-all duration-500 ${current > s.id ? 'bg-violet-400' : 'bg-neutral-700'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

/* ── Lens badge ───────────────────────────────────────────────────────── */
function LensBadge({ lens, verdict, status }: { lens: string; verdict?: string; status: 'idle' | 'loading' | 'done' | 'error' }) {
  const labels: Record<string, string> = {
    lens_clarity: '🧒 Claridad',
    lens_neuro: '🧠 Neuroventas',
    lens_copy: '✍️ Copywriting',
    lens_music: '🎵 Musical',
    lens_seo: '🔍 SEO',
    lens_visual: '🎥 Director Creativo',
  }

  const isIdle = status === 'idle'
  const isLoading = status === 'loading'
  const isError = status === 'error'

  const color = isIdle ? 'border-neutral-800 bg-neutral-900/40 text-neutral-600'
    : isLoading ? 'border-violet-500/50 bg-violet-900/20 text-violet-400 animate-pulse'
      : isError ? 'border-red-600/40 bg-red-900/20 text-red-400'
        : verdict === 'green' ? 'border-emerald-600/40 bg-emerald-900/20 text-emerald-400'
          : verdict === 'red' ? 'border-red-600/40 bg-red-900/20 text-red-100 bg-red-600'
            : 'border-amber-600/40 bg-amber-900/20 text-amber-400'

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all duration-300 ${color}`}>
      <span>{labels[lens] ?? lens}</span>
      {isLoading ? (
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
      ) : (
        <span>{isIdle ? '⚪' : isError ? '❌' : (verdict === 'green' ? '🟢' : verdict === 'red' ? '🔴' : '🟡')}</span>
      )}
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────────────────*/
const MAX_IDEA_LENGTH = 1500

export default function Home() {
  // Pipeline state
  const [idea, setIdea] = useState('')
  const [duration, setDuration] = useState('30s')
  const [style, setStyle] = useState('retorical')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PipelineResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [llmProvider, setLlmProvider] = useState<'gemini' | 'deepseek'>('gemini')

  // Visual style state
  const [styles, setStyles] = useState<VideoStyle[]>([])
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle | null>(null)
  const [frames, setFrames] = useState<any[]>([])
  const [generatingFrames, setGeneratingFrames] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // Pipeline Granular State
  const [pipelinePhase, setPipelinePhase] = useState<string>('')
  const [lensStatuses, setLensStatuses] = useState<Record<string, { status: 'idle' | 'loading' | 'done' | 'error', verdict?: string }>>({
    lens_clarity: { status: 'idle' },
    lens_neuro: { status: 'idle' },
    lens_ad_copy: { status: 'idle' },
    lens_pricing: { status: 'idle' },
    lens_closer: { status: 'idle' },
    lens_seo: { status: 'idle' },
    lens_content: { status: 'idle' },
    lens_orchestrator: { status: 'idle' },
    lens_buyer_persona: { status: 'idle' },
  })

  const [activeOption, setActiveOption] = useState<number>(0)

  const step = result ? (frames.length > 0 ? 4 : 3) : 1

  const categories = ['All', '3D & Cartoon', 'Photo-realistic', 'Satirical & Art', 'Creative Pixels']
  const filteredStyles = styles.filter(st => {
    const matchesCategory = selectedCategory === 'All' || st.category === selectedCategory
    const matchesSearch = st.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Voice & Music state
  const [voiceScript, setVoiceScript] = useState('')
  const [voiceProfile, setVoiceProfile] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('Charon')
  const [audioBase64, setAudioBase64] = useState<string | null>(null)
  const [audioMime, setAudioMime] = useState('audio/wav')
  const [extractingVoice, setExtractingVoice] = useState(false)
  const [synthesizing, setSynthesizing] = useState(false)
  const [sunoPrompt, setSunoPrompt] = useState('')
  const [udioPrompt, setUdioPrompt] = useState('')
  const [mixNotes, setMixNotes] = useState('')
  const [generatingMusic, setGeneratingMusic] = useState(false)
  const [geminiMusicUrl, setGeminiMusicUrl] = useState<string | null>(null)
  const [generatingGeminiMusic, setGeneratingGeminiMusic] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    fetch('/video-styles/styles.json').then(r => r.json()).then(setStyles).catch(console.error)

    // Load from LocalStorage
    const savedResult = localStorage.getItem('pipeline_result')
    const savedStatuses = localStorage.getItem('pipeline_statuses')
    const savedActiveOption = localStorage.getItem('pipeline_active_option')
    const savedIdea = localStorage.getItem('pipeline_idea')
    const savedDuration = localStorage.getItem('pipeline_duration')
    const savedStyle = localStorage.getItem('pipeline_style')

    if (savedResult) setResult(JSON.parse(savedResult))
    if (savedStatuses) setLensStatuses(JSON.parse(savedStatuses))
    if (savedActiveOption) setActiveOption(parseInt(savedActiveOption))
    if (savedIdea) setIdea(savedIdea)
    if (savedDuration) setDuration(savedDuration)
    if (savedStyle) setStyle(savedStyle)

    // Set mounted after hydration so the save effect doesn't overwrite loaded data
    setMounted(true)
  }, [])

  // Save to LocalStorage (only after hydration completes)
  useEffect(() => {
    if (!mounted) return
    if (result) localStorage.setItem('pipeline_result', JSON.stringify(result))
    localStorage.setItem('pipeline_statuses', JSON.stringify(lensStatuses))
    localStorage.setItem('pipeline_active_option', activeOption.toString())
    localStorage.setItem('pipeline_idea', idea)
    localStorage.setItem('pipeline_duration', duration)
    localStorage.setItem('pipeline_style', style)
  }, [result, lensStatuses, activeOption, idea, duration, style, mounted])

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idea.trim()) return
    if (idea.length > MAX_IDEA_LENGTH) return

    // Clear previous persistence
    localStorage.removeItem('pipeline_result')
    localStorage.removeItem('pipeline_statuses')
    localStorage.removeItem('pipeline_active_option')

    setLoading(true)
    setError(null)
    setResult(null)
    setFrames([])
    setSelectedStyle(null)
    setVoiceScript('')
    setAudioBase64(null)

    // Reset lens statuses
    const initialStatuses: any = {}
    LENS_ORDER.forEach(l => initialStatuses[l] = { status: 'idle' })
    setLensStatuses(initialStatuses)

    try {
      // PHASE 4: Run full consensus pipeline (On Server)
      setPipelinePhase('Ejecutando Pipeline de Consenso (6 Expertos + Orquestador)...')

      const res = await generateScript(idea, { duration, style })

      if (res.success && res.data) {
        setResult(res.data)

        // Update lens statuses for the UI semáforo
        const newStatuses: any = { ...lensStatuses }
        res.data.lensResults.forEach((lr: any) => {
          newStatuses[lr.lens] = { status: 'done', verdict: lr.verdict }
        })
        setLensStatuses(newStatuses)
        setActiveOption(0)
        setPipelinePhase('Pipeline completado con éxito. ✨')
      } else {
        throw new Error(res.error || 'Error en el pipeline')
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado.')
      setPipelinePhase('⚠️ Pipeline detenido. Ver error arriba.')
    } finally {
      setLoading(false)
    }
  }


  const handleSaveAll = async () => {
    if (!result || !idea) return
    setLoading(true)
    setPipelinePhase('Guardando todo en la base de datos...')
    const res = await saveFullPipelineAction(idea, result)
    if (res.success) {
      setPipelinePhase('¡Todo guardado correctamente! ✅')
    } else {
      setError(res.error || 'Error al guardar.')
    }
    setLoading(false)
  }

  const handleExport = () => {
    if (!result || !idea) return
    const content = formatPipelineForExport(idea, result)
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `guion-produccion-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }


  const handleGenerateFrames = async () => {
    if (!selectedStyle) return
    const scriptToUse = result?.finalScript
    if (!scriptToUse?.trim()) { setError('No hay guion disponible.'); return }
    setError(null)
    setGeneratingFrames(true)
    const res = await generateVideoFrames(scriptToUse, selectedStyle.prompt)
    if (res.success) setFrames(res.data || [])
    else setError(res.error || 'Error al generar escenas.')
    setGeneratingFrames(false)
  }

  const handleExtractVoice = async () => {
    const script = result?.finalScript
    if (!script) return
    setExtractingVoice(true)
    setError(null)
    const res = await extractVoiceScript(script, duration)
    if (res.success) { setVoiceScript(res.voiceScript || ''); setVoiceProfile(res.voiceProfile || ''); setAudioBase64(null) }
    else setError(res.error || 'Error al extraer narración.')
    setExtractingVoice(false)
  }

  const handleSynthesizeVoice = async () => {
    if (!voiceScript) return
    setSynthesizing(true)
    setError(null)
    const res = await synthesizeVoiceOff(voiceScript, selectedVoice)
    if (res.success) { setAudioBase64(res.audioBase64 || null); setAudioMime(res.mimeType || 'audio/wav') }
    else setError(res.error || 'Error al generar audio.')
    setSynthesizing(false)
  }

  const handleGenerateMusicPrompt = async () => {
    const musicLens = result?.lensResults?.find((l: any) => l.lens === 'lens_music')
    if (!musicLens?.feedback) { setError('No hay brief musical. Genera el guion completo primero.'); return }
    setGeneratingMusic(true)
    setError(null)
    const res = await generateMusicPrompt(musicLens.feedback, duration)
    if (res.success) { setSunoPrompt(res.sunoPrompt || ''); setUdioPrompt(res.udioPrompt || ''); setMixNotes(res.mixNotes || '') }
    else setError(res.error || 'Error generando prompt de música.')
    setGeneratingMusic(false)
  }

  const handleGenerateGeminiMusic = async () => {
    const musicLens = result?.lensResults?.find((l: any) => l.lens === 'lens_music')
    if (!musicLens?.feedback) { setError('No hay brief musical.'); return }
    setGeneratingGeminiMusic(true)
    setError(null)
    try {
      const res = await generateGeminiMusic(musicLens.feedback)
      if (res.success && res.audioBase64) {
        setGeminiMusicUrl(`data:audio/wav;base64,${res.audioBase64}`)
      } else {
        setError(res.error || 'Error al generar música con Gemini.')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setGeneratingGeminiMusic(false)
    }
  }

  /* ── Render ──────────────────────────────────────────────────────────*/
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-neutral-100 py-12 px-4">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <header className="relative text-center space-y-3 mb-8 pt-4">
          <button
            onClick={() => logout()}
            className="absolute top-0 right-0 px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-xs font-medium text-neutral-400 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/20 transition-all flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-950/60 border border-violet-800/40 text-violet-400 text-xs font-semibold tracking-widest uppercase mb-2">
            ActivaQR.com
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-br from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
            Expert Lens Pipeline™
          </h1>
          <p className="text-neutral-500 max-w-xl mx-auto text-sm leading-relaxed">
            Convierte una idea en un guion de video profesional. 6 lentes de expertos lo analizan en secuencia.
          </p>
        </header>

        {/* Step bar */}
        <StepBar current={result ? (frames.length > 0 ? 4 : 3) : 1} />

        {/* ── STEP 1: Idea Input ─────────────────────────────────────────── */}
        <section className="bg-neutral-900/60 backdrop-blur border border-neutral-800/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">1</span>
            <h2 className="text-lg font-bold text-neutral-100">Tu idea</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Duración</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-100 focus:border-violet-500 focus:outline-none transition-colors"
                >
                  <option value="15s">15 seg — Reel Corto</option>
                  <option value="30s">30 seg — Promocional</option>
                  <option value="60s">60 seg — Explicativo</option>
                  <option value="120s">2 min — Landing Page</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Estructura</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-100 focus:border-violet-500 focus:outline-none transition-colors"
                >
                  <option value="retorical">Estructura Retórica</option>
                  <option value="narrative">Narrativo / Storytelling</option>
                  <option value="demonstration">Demostración Directa</option>
                  <option value="educational">Educativo / Tutorial</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Motor de IA</label>
                <select
                  value={llmProvider}
                  onChange={(e) => setLlmProvider(e.target.value as any)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-100 focus:border-violet-500 focus:outline-none transition-colors"
                >
                  <option value="gemini">Turbo (Gemini)</option>
                  <option value="deepseek">Estable (DeepSeek)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Describe tu video</label>
                <span className={`text-[10px] font-mono transition-colors ${idea.length > MAX_IDEA_LENGTH * 0.9 ? 'text-amber-400' : 'text-neutral-600'
                  }`}>{idea.length}/{MAX_IDEA_LENGTH}</span>
              </div>
              <textarea
                rows={4}
                value={idea}
                onChange={(e) => setIdea(e.target.value.slice(0, MAX_IDEA_LENGTH))}
                maxLength={MAX_IDEA_LENGTH}
                placeholder="Ejemplo: Soy mecánica automotriz con 15 años de experiencia. Quiero un video para TikTok dirigido a dueños de negocios que pierden clientes porque no están bien guardados en la agenda de sus clientes."
                className={`w-full bg-neutral-800 border rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none transition-colors resize-none ${idea.length > MAX_IDEA_LENGTH * 0.9 ? 'border-amber-600/60 focus:border-amber-500' : 'border-neutral-700 focus:border-violet-500'
                  }`}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !idea.trim() || idea.length > MAX_IDEA_LENGTH}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all relative overflow-hidden
                bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
                disabled:opacity-40 disabled:cursor-not-allowed
                shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]
                active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                  {pipelinePhase || 'Procesando...'}
                </span>
              ) : '⚡ Generar Guion Profesional'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}
        </section>

        {/* ── STEP 2: Script Result ─────────────────────────────────────── */}
        {result && (
          <section className="bg-neutral-900/60 backdrop-blur border border-neutral-800/60 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">2</span>
              <h2 className="text-lg font-bold text-neutral-100">Guion Final</h2>
              <span className="ml-auto text-xs text-neutral-500">v{result.currentVersion}</span>
              <button
                onClick={() => {
                  setResult(null)
                  setActiveOption(0)
                  localStorage.removeItem('pipeline_result')
                  localStorage.removeItem('pipeline_statuses')
                  localStorage.removeItem('pipeline_active_option')
                }}
                className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30"
                title="Limpiar resultado actual"
              >
                ✕ Limpiar
              </button>
            </div>

            {/* Script Options Tabs */}
            {result && result.scriptOptions && (
              <div className="flex gap-2 mb-4 p-1 bg-neutral-950/50 border border-neutral-800/60 rounded-xl">
                {['Clásico', 'Conversión', 'Storytelling'].map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => setActiveOption(idx)}
                    className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${activeOption === idx
                      ? 'bg-violet-600/20 text-violet-400 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'
                      }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            <pre className="whitespace-pre-wrap text-sm text-neutral-300 bg-neutral-950/50 border border-neutral-800/60 rounded-xl p-5 font-mono leading-relaxed max-h-72 overflow-y-auto">
              {result && result.scriptOptions && result.scriptOptions[activeOption]
                ? result.scriptOptions[activeOption]
                : result.finalScript}
            </pre>

            {/* Lens Results / Semáforo */}
            <div className="mt-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-3">Análisis de Lentes (Semáforo)</p>
              <div className="flex flex-wrap gap-2">
                {LENS_ORDER.map((lens: string) => (
                  <LensBadge
                    key={lens}
                    lens={lens}
                    status={lensStatuses[lens]?.status || 'idle'}
                    verdict={lensStatuses[lens]?.verdict}
                  />
                ))}
              </div>
            </div>

            {/* Buyer Persona Summary if approved */}
            {result?.checklistResults && (
              <div className="mt-6 p-4 bg-emerald-950/20 border border-emerald-800/30 rounded-xl space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">✅ Verificación de Mercado (Auditores)</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[result.checklistResults.profile1, result.checklistResults.profile2, result.checklistResults.profile3, result.checklistResults.profile4].map((p, i) => (
                    <div key={i} className="text-center p-2 bg-neutral-900/60 rounded-lg border border-neutral-800">
                      <p className="text-[9px] font-bold text-neutral-500 truncate mb-1">{p.name}</p>
                      <span className="text-xs">{p.passed ? '🟢' : '🔴'}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-400 italic">El guion ha sido validado por 4 perfiles de clientes potenciales.</p>
              </div>
            )}

            {/* Final Actions: Save and Export */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSaveAll}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] flex items-center justify-center gap-2"
              >
                {loading ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" /> : '💾 Guardar Todo en BD'}
              </button>
              <button
                onClick={handleExport}
                className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-xl text-sm border border-neutral-700 transition-all flex items-center justify-center gap-2"
              >
                📄 Exportar para Producción
              </button>
            </div>
          </section>

        )}

        {/* ── STEP 3: Visual Style ──────────────────────────────────────── */}
        {result && (
          <section className="bg-neutral-900/60 backdrop-blur border border-neutral-800/60 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">3</span>
              <h2 className="text-lg font-bold text-neutral-100">Estilo Visual</h2>
              <span className="ml-auto text-xs text-neutral-500">{styles.length} estilos</span>
            </div>

            {/* Search + Category filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input
                type="search"
                placeholder="Buscar estilo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-violet-500 focus:outline-none"
              />
              <div className="flex gap-1.5 overflow-x-auto">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                      ? 'bg-violet-600 text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                      : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
              {filteredStyles.map(st => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStyle(st)}
                  className={`relative overflow-hidden rounded-xl aspect-square group transition-all border-2
                    ${selectedStyle?.id === st.id
                      ? 'border-violet-500 ring-2 ring-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                      : 'border-transparent hover:border-neutral-600'}`}
                >
                  <img src={st.image} alt={st.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2 flex flex-col justify-end opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                    <p className="text-[9px] text-violet-400 font-bold uppercase tracking-tighter leading-none">{st.category}</p>
                    <p className="text-white text-[10px] font-bold leading-tight mt-0.5">{st.title}</p>
                  </div>
                </button>
              ))}
              {filteredStyles.length === 0 && (
                <div className="col-span-full py-10 text-center text-neutral-600 text-sm">Sin resultados para "{searchQuery}"</div>
              )}
            </div>

            {/* Selected style info + Generate button */}
            {selectedStyle && (
              <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-violet-950/20 border border-violet-800/30 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-violet-400 font-bold uppercase tracking-wider">{selectedStyle.category}</p>
                  <p className="font-bold text-neutral-100 truncate">{selectedStyle.title}</p>
                </div>
                <button
                  onClick={handleGenerateFrames}
                  disabled={generatingFrames}
                  className="flex-shrink-0 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center gap-2"
                >
                  {generatingFrames ? (
                    <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" /> Generando...</>
                  ) : '🎬 Crear Secuencia'}
                </button>
              </div>
            )}

            {/* Frames output */}
            {frames.length > 0 && (
              <div className="mt-6 space-y-4 border-t border-neutral-800/60 pt-6">
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Secuencia de Escenas — {frames.length} frames</p>
                {frames.map((frame, idx) => (
                  <div key={idx} className="bg-neutral-950/50 border border-neutral-800/60 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-[10px] font-bold text-violet-400">{idx + 1}</span>
                      <p className="text-xs text-neutral-500 font-mono truncate">{frame.scene?.substring(0, 60)}...</p>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Prompt de Imagen</p>
                          <button onClick={() => navigator.clipboard.writeText(frame.imagePrompt)} className="text-[10px] text-violet-500 hover:text-violet-400 font-bold">Copiar</button>
                        </div>
                        <div className="text-xs font-mono text-neutral-400 bg-neutral-800/50 rounded-lg p-3 leading-relaxed">{frame.imagePrompt}</div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Instrucciones de Movimiento</p>
                        <div className="text-xs italic text-neutral-400 bg-neutral-800/50 rounded-lg p-3 leading-relaxed">{frame.motionInstructions}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── STEP 4: Voice + Music ─────────────────────────────────────── */}
        {result && (
          <section className="bg-neutral-900/60 backdrop-blur border border-neutral-800/60 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Voice Off */}
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">4a</span>
                <h2 className="text-lg font-bold text-neutral-100">Voz en Off</h2>
              </div>

              <button
                onClick={handleExtractVoice}
                disabled={extractingVoice}
                className="mb-4 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                {extractingVoice
                  ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" /> Extrayendo narración...</>
                  : '✍️ Extraer Texto de Voz en Off'}
              </button>

              {voiceProfile && (
                <div className="mb-4 p-3 bg-indigo-950/30 border border-indigo-800/30 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5">Perfil de Voz Sugerido</p>
                  <pre className="text-xs text-neutral-400 font-mono whitespace-pre-wrap">{voiceProfile}</pre>
                </div>
              )}

              {voiceScript && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Texto Narrado (Editable)</label>
                    <textarea
                      rows={7}
                      value={voiceScript}
                      onChange={(e) => setVoiceScript(e.target.value)}
                      className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-mono text-neutral-300 focus:border-indigo-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-100 focus:border-indigo-500 focus:outline-none"
                    >
                      {GEMINI_VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                    </select>
                    <button
                      onClick={handleSynthesizeVoice}
                      disabled={synthesizing}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                      {synthesizing
                        ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" /> Generando...</>
                        : '🔊 Generar Audio'}
                    </button>
                  </div>

                  {audioBase64 && (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-800/30 rounded-xl space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">✅ Audio Listo</p>
                      <audio controls className="w-full" src={`data:${audioMime};base64,${audioBase64}`} />
                      <a
                        href={`data:${audioMime};base64,${audioBase64}`}
                        download="voiceover-activaqr.wav"
                        className="inline-block px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors"
                      >
                        ⬇️ Descargar WAV
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Music */}
            <div className="border-t border-neutral-800/60 pt-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">4b</span>
                <h2 className="text-lg font-bold text-neutral-100">Música ({duration})</h2>
              </div>

              <div className="flex flex-wrap gap-3 mb-5">
                <button
                  onClick={handleGenerateMusicPrompt}
                  disabled={generatingMusic}
                  className="px-4 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                >
                  {generatingMusic
                    ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" /> Generando prompts...</>
                    : '🎼 Prompts Suno / Udio'}
                </button>

                <button
                  onClick={handleGenerateGeminiMusic}
                  disabled={generatingGeminiMusic}
                  className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                >
                  {generatingGeminiMusic
                    ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" /> Generando música...</>
                    : '✨ Generar Música (Gemini)'}
                </button>
              </div>

              {geminiMusicUrl && (
                <div className="mb-5 p-4 bg-blue-950/30 border border-blue-800/30 rounded-xl space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">✅ Música Generada por Gemini</p>
                  <audio controls className="w-full" src={geminiMusicUrl} />
                </div>
              )}

              {sunoPrompt && (
                <div className="space-y-3">
                  {[
                    { label: 'Suno', content: sunoPrompt, color: 'purple' },
                    { label: 'Udio', content: udioPrompt, color: 'blue' },
                  ].filter(p => p.content).map(({ label, content, color }) => (
                    <div key={label} className={`p-4 bg-${color}-950/20 border border-${color}-800/30 rounded-xl`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={`text-[10px] font-bold uppercase tracking-wider text-${color}-400`}>Prompt para {label}</p>
                        <button onClick={() => navigator.clipboard.writeText(content)} className={`text-[10px] text-${color}-500 hover:text-${color}-400 font-bold`}>Copiar</button>
                      </div>
                      <p className="text-xs font-mono text-neutral-400 whitespace-pre-wrap leading-relaxed">{content}</p>
                    </div>
                  ))}
                  {mixNotes && (
                    <div className="p-4 bg-amber-950/20 border border-amber-800/30 rounded-xl">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">📊 Instrucciones de Mezcla</p>
                      <p className="text-sm text-neutral-400 whitespace-pre-wrap leading-relaxed">{mixNotes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
