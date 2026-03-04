'use client'

import { useState, useEffect, useRef } from 'react'
import { generateDraftAction, runLensAction, runOrchestratorAction, saveFullPipelineAction, generateVideoFrames } from './actions'
import { formatPipelineForExport } from '@/lib/utils/export'
import { extractVoiceScript, synthesizeVoiceOff, generateMusicPrompt, generateGeminiMusic } from './voice-actions'
import { logout } from './login/actions'
import { GEMINI_VOICES } from '@/lib/audio/voices'
import { LENS_ORDER, LENSES } from '@/lib/pipeline/lenses'
import type { PipelineResult, LensResult } from '@/lib/pipeline/executor'

export const maxDuration = 300;

// ── Types ────────────────────────────────────────────────────────────────
interface VideoStyle {
  id: string
  title: string
  prompt: string
  image: string
  category: string
}

interface LensStepState {
  lensId: string
  status: 'pending' | 'running' | 'done' | 'error'
  feedback?: string
  verdict?: 'green' | 'yellow' | 'red'
  userOpinion: string
}

// Pipeline phases
type PipelinePhase =
  | 'idle'
  | 'drafting'
  | 'draft_done'
  | 'running_lenses'
  | 'lenses_done'
  | 'orchestrating'
  | 'done'

// ── Helpers ───────────────────────────────────────────────────────────────
const LENS_META: Record<string, { name: string; emoji: string; description: string }> = {
  lens_clarity: { emoji: '🧒', name: 'Claridad', description: 'Niño de 10 años — ¿se entiende todo?' },
  lens_neuro: { emoji: '🧠', name: 'Neuroventas', description: 'Ganchos emocionales y triggers de dolor/placer' },
  lens_ad_copy: { emoji: '✍️', name: 'Ad-Copywriter', description: 'Hooks irresistibles que detienen el scroll' },
  lens_pricing: { emoji: '💰', name: 'Estratega de Precios', description: 'Valor de ActivaQR vs métodos tradicionales' },
  lens_closer: { emoji: '🤝', name: 'El Closer', description: 'Cierre para maximizar conversión inmediata' },
  lens_seo: { emoji: '🔍', name: 'SEO & Branding', description: 'Presencia de marca y keywords estratégicos' },
  lens_content: { emoji: '📱', name: 'Estratega de Contenido', description: 'Compartible y altamente recordable' },
}

const VERDICT_CONFIG = {
  green: { label: '✅ Aprobado', classes: 'bg-emerald-950/40 border-emerald-700/40 text-emerald-400' },
  yellow: { label: '⚠️ Con Reservas', classes: 'bg-amber-950/40 border-amber-700/40 text-amber-400' },
  red: { label: '❌ Rechazado', classes: 'bg-red-950/40 border-red-700/40 text-red-400' },
}

const MAX_IDEA_LENGTH = 1500

// ── Component ─────────────────────────────────────────────────────────────
export default function PipelinePage() {
  // ── Form state ──
  const [idea, setIdea] = useState('')
  const [duration, setDuration] = useState('30s')
  const [style, setStyle] = useState('retorical')
  const [llmProvider, setLlmProvider] = useState<'gemini' | 'deepseek'>('gemini')

  // ── Pipeline orchestration state ──
  const [phase, setPhase] = useState<PipelinePhase>('idle')
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<string>('')
  const [lensSteps, setLensSteps] = useState<LensStepState[]>([])
  const [currentLensIdx, setCurrentLensIdx] = useState(0)
  const [lensResults, setLensResults] = useState<LensResult[]>([])
  const [scriptOptions, setScriptOptions] = useState<string[]>([])
  const [activeOption, setActiveOption] = useState(0)
  const [finalScript, setFinalScript] = useState('')
  const [isRunning, setIsRunning] = useState(false)

  // Director's global note (added to orchestrator)
  const [directorNote, setDirectorNote] = useState('')

  // ── Result state ──
  const [result, setResult] = useState<PipelineResult | null>(null)

  // ── Visual style state ──
  const [styles, setStyles] = useState<VideoStyle[]>([])
  const [selectedStyle, setSelectedStyle] = useState<VideoStyle | null>(null)
  const [frames, setFrames] = useState<any[]>([])
  const [generatingFrames, setGeneratingFrames] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // ── Voice & Music state ──
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
  const lensResultsRef = useRef(lensResults)
  lensResultsRef.current = lensResults

  const categories = ['All', '3D & Cartoon', 'Photo-realistic', 'Satirical & Art', 'Creative Pixels']

  // ── Load styles and localStorage on mount ──
  useEffect(() => {
    fetch('/video-styles/styles.json').then(r => r.json()).then(setStyles).catch(console.error)
    const savedIdea = localStorage.getItem('pipeline_idea')
    const savedDuration = localStorage.getItem('pipeline_duration')
    const savedStyle = localStorage.getItem('pipeline_style')
    if (savedIdea) setIdea(savedIdea)
    if (savedDuration) setDuration(savedDuration)
    if (savedStyle) setStyle(savedStyle)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('pipeline_idea', idea)
    localStorage.setItem('pipeline_duration', duration)
    localStorage.setItem('pipeline_style', style)
  }, [idea, duration, style, mounted])

  const filteredStyles = styles.filter(st => {
    const matchesCategory = selectedCategory === 'All' || st.category === selectedCategory
    const matchesSearch = st.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // ── Initialize lens steps list ──
  const initLensSteps = (): LensStepState[] =>
    LENS_ORDER.map(id => ({ lensId: id, status: 'pending' as const, userOpinion: '' }))

  // ── STEP 1: Generate draft ──
  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idea.trim() || idea.length > MAX_IDEA_LENGTH) return

    setIsRunning(true)
    setError(null)
    setPhase('drafting')
    setDraft('')
    setLensSteps(initLensSteps())
    setLensResults([])
    setScriptOptions([])
    setFinalScript('')
    setResult(null)
    setCurrentLensIdx(0)
    setFrames([])
    setSelectedStyle(null)
    setVoiceScript('')
    setAudioBase64(null)

    const res = await generateDraftAction(idea, { duration, style, preferredProvider: llmProvider })
    setIsRunning(false)

    if (!res.success || !res.draft) {
      setError(res.error || 'Error generando el borrador.')
      setPhase('idle')
      return
    }

    setDraft(res.draft)
    setPhase('draft_done')
  }

  // ── STEP 2: Run current lens ──
  const handleRunNextLens = async () => {
    const steps = [...lensSteps]
    if (currentLensIdx >= steps.length) return

    setIsRunning(true)
    setError(null)
    setPhase('running_lenses')

    steps[currentLensIdx].status = 'running'
    setLensSteps([...steps])

    const lensId = steps[currentLensIdx].lensId
    const res = await runLensAction(lensId, draft, llmProvider)

    setIsRunning(false)

    if (!res.success) {
      steps[currentLensIdx].status = 'error'
      setLensSteps([...steps])
      setError(res.error || `Error en ${lensId}`)
      return
    }

    steps[currentLensIdx].status = 'done'
    steps[currentLensIdx].feedback = (res as any).feedback ?? ''
    steps[currentLensIdx].verdict = (res as any).verdict
    setLensSteps([...steps])

    const r = res as any
    const newResult: LensResult = {
      lens: lensId,
      verdict: r.verdict ?? 'yellow',
      feedback: r.feedback ?? '',
      tokensUsed: r.tokensUsed ?? 0,
    }
    const updatedResults = [...lensResultsRef.current, newResult]
    setLensResults(updatedResults)

    const nextIdx = currentLensIdx + 1
    setCurrentLensIdx(nextIdx)
    if (nextIdx >= steps.length) {
      setPhase('lenses_done')
    }
  }

  // ── STEP 3: Run all 3 orchestrations ──
  const handleOrchestrate = async () => {
    setIsRunning(true)
    setError(null)
    setPhase('orchestrating')

    const allCritiques = lensResultsRef.current.map(lr => {
      const step = lensSteps.find(s => s.lensId === lr.lens)
      return {
        ...lr,
        feedback: step?.userOpinion
          ? `${lr.feedback}\n\n[OPINIÓN DEL DIRECTOR]: ${step.userOpinion}`
          : lr.feedback,
      }
    })

    if (directorNote.trim()) {
      allCritiques.push({
        lens: 'director_notes',
        verdict: 'yellow',
        feedback: `[NOTA GLOBAL DEL DIRECTOR]: ${directorNote}`,
        tokensUsed: 0,
      })
    }

    const directions: Array<'classic' | 'conversion' | 'storytelling'> = ['classic', 'conversion', 'storytelling']
    const options: string[] = []

    for (const dir of directions) {
      const res = await runOrchestratorAction(draft, allCritiques, dir, llmProvider)
      if (!res.success) {
        setError(res.error || `Error en orquestación ${dir}`)
        setIsRunning(false)
        return
      }
      options.push((res as any).updatedScript || draft)
    }

    setScriptOptions(options)
    setFinalScript(options[0])
    setActiveOption(0)

    // Build full PipelineResult for save/export
    const pipelineResult: PipelineResult = {
      scriptId: crypto.randomUUID(),
      versions: [{ version: 1, body: draft, triggeredBy: 'draft_initial' }],
      lensResults: lensResultsRef.current,
      finalScript: options[0],
      currentVersion: 1,
      scriptOptions: options,
    }
    setResult(pipelineResult)

    setIsRunning(false)
    setPhase('done')
  }

  // ── Update user opinion for a lens ──
  const updateOpinion = (idx: number, value: string) => {
    const steps = [...lensSteps]
    steps[idx].userOpinion = value
    setLensSteps(steps)
  }

  // ── Save / Export ──
  const handleSaveAll = async () => {
    if (!result || !idea) return
    setIsRunning(true)
    const res = await saveFullPipelineAction(idea, result)
    setIsRunning(false)
    if (!res.success) setError(res?.error || 'Error al guardar.')
    else alert('¡Guardado en base de datos! ✅')
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
    const scriptToUse = scriptOptions[activeOption] || finalScript
    if (!scriptToUse?.trim()) { setError('No hay guion disponible.'); return }
    setError(null); setGeneratingFrames(true)
    const res = await generateVideoFrames(scriptToUse, selectedStyle.prompt)
    if (res.success) setFrames(res.data || [])
    else setError(res.error || 'Error al generar escenas.')
    setGeneratingFrames(false)
  }

  const handleExtractVoice = async () => {
    const script = scriptOptions[activeOption] || finalScript
    if (!script) return
    setExtractingVoice(true); setError(null)
    const res = await extractVoiceScript(script, duration)
    if (res.success) { setVoiceScript(res.voiceScript || ''); setVoiceProfile(res.voiceProfile || ''); setAudioBase64(null) }
    else setError(res.error || 'Error al extraer narración.')
    setExtractingVoice(false)
  }

  const handleSynthesizeVoice = async () => {
    if (!voiceScript) return
    setSynthesizing(true); setError(null)
    const res = await synthesizeVoiceOff(voiceScript, selectedVoice)
    if (res.success) { setAudioBase64(res.audioBase64 || null); setAudioMime(res.mimeType || 'audio/wav') }
    else setError(res.error || 'Error al generar audio.')
    setSynthesizing(false)
  }

  const handleGenerateMusicPrompt = async () => {
    const musicLens = result?.lensResults?.find((l: any) => l.lens === 'lens_music')
    if (!musicLens?.feedback) { setError('No hay brief musical. Genera el guion completo primero.'); return }
    setGeneratingMusic(true); setError(null)
    const res = await generateMusicPrompt(musicLens.feedback, duration)
    if (res.success) { setSunoPrompt(res.sunoPrompt || ''); setUdioPrompt(res.udioPrompt || ''); setMixNotes(res.mixNotes || '') }
    else setError(res.error || 'Error generando prompt de música.')
    setGeneratingMusic(false)
  }

  const handleGenerateGeminiMusic = async () => {
    const musicLens = result?.lensResults?.find((l: any) => l.lens === 'lens_music')
    if (!musicLens?.feedback) { setError('No hay brief musical.'); return }
    setGeneratingGeminiMusic(true); setError(null)
    try {
      const res = await generateGeminiMusic(musicLens.feedback)
      if (res.success && res.audioBase64) setGeminiMusicUrl(`data:audio/wav;base64,${res.audioBase64}`)
      else setError(res.error || 'Error al generar música.')
    } catch (err: any) { setError(err.message) }
    setGeneratingGeminiMusic(false)
  }

  // ── Computed ──
  const doneLenses = lensSteps.filter(s => s.status === 'done').length
  const totalLenses = lensSteps.length
  const currentLens = lensSteps[currentLensIdx]
  const previousLenses = lensSteps.slice(0, currentLensIdx).filter(s => s.status === 'done')

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-neutral-100 py-12 px-4">
      {/* Background gradient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-900/15 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto space-y-6">

        {/* ── Header ── */}
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
            <span className="text-violet-400 font-semibold">Modo Director</span> — Tú decides cuándo avanzar. Lee cada experto. Agrega tu visión.
          </p>
        </header>

        {/* ── Error banner ── */}
        {error && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/40 text-red-400 text-sm flex items-start gap-3">
            <span className="text-lg">⚠️</span>
            <div>
              <p className="font-bold mb-1">Error en el pipeline</p>
              <p>{error}</p>
              <button onClick={() => setError(null)} className="mt-2 text-xs text-red-300 hover:text-white underline">Cerrar</button>
            </div>
          </div>
        )}

        {/* ── STEP 1: Idea Form ── */}
        <section className="bg-neutral-900/60 backdrop-blur border border-neutral-800/60 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">1</span>
            <h2 className="text-lg font-bold text-neutral-100">Tu idea</h2>
            {phase !== 'idle' && phase !== 'drafting' && (
              <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">✓ Completado</span>
            )}
          </div>

          <form onSubmit={handleGenerateDraft} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Duración</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)}
                  disabled={phase !== 'idle'} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-100 focus:border-violet-500 focus:outline-none transition-colors disabled:opacity-50">
                  <option value="15s">15 seg — Reel Corto</option>
                  <option value="30s">30 seg — Promocional</option>
                  <option value="60s">60 seg — Explicativo</option>
                  <option value="120s">2 min — Landing Page</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Estructura</label>
                <select value={style} onChange={(e) => setStyle(e.target.value)}
                  disabled={phase !== 'idle'} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-100 focus:border-violet-500 focus:outline-none transition-colors disabled:opacity-50">
                  <option value="retorical">Estructura Retórica</option>
                  <option value="narrative">Narrativo / Storytelling</option>
                  <option value="demonstration">Demostración Directa</option>
                  <option value="educational">Educativo / Tutorial</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Motor de IA</label>
                <select value={llmProvider} onChange={(e) => setLlmProvider(e.target.value as any)}
                  disabled={phase !== 'idle'} className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-100 focus:border-violet-500 focus:outline-none transition-colors disabled:opacity-50">
                  <option value="gemini">Turbo (Gemini)</option>
                  <option value="deepseek">Estable (DeepSeek)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Describe tu video</label>
                <span className={`text-[10px] font-mono transition-colors ${idea.length > MAX_IDEA_LENGTH * 0.9 ? 'text-amber-400' : 'text-neutral-600'}`}>
                  {idea.length}/{MAX_IDEA_LENGTH}
                </span>
              </div>
              <textarea
                rows={4} value={idea}
                onChange={(e) => setIdea(e.target.value.slice(0, MAX_IDEA_LENGTH))}
                maxLength={MAX_IDEA_LENGTH}
                disabled={phase !== 'idle'}
                placeholder="Ejemplo: Soy mecánica automotriz con 15 años de experiencia. Quiero un video para TikTok..."
                className={`w-full bg-neutral-800 border rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none transition-colors resize-none disabled:opacity-50 ${idea.length > MAX_IDEA_LENGTH * 0.9 ? 'border-amber-600/60 focus:border-amber-500' : 'border-neutral-700 focus:border-violet-500'}`}
              />
            </div>

            {phase === 'idle' && (
              <button type="submit" disabled={isRunning || !idea.trim() || idea.length > MAX_IDEA_LENGTH}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)] active:scale-[0.98]">
                {isRunning
                  ? <span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />Generando borrador con IA...</span>
                  : '⚡ Generar Borrador Inicial'}
              </button>
            )}

            {phase === 'drafting' && isRunning && (
              <div className="w-full py-3 rounded-xl bg-violet-950/40 border border-violet-800/40 flex items-center justify-center gap-2 text-violet-400 text-sm font-semibold">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-400/30 border-t-violet-400" />
                La IA está construyendo tu borrador...
              </div>
            )}
          </form>
        </section>

        {/* ── STEP 2: Draft Review ── */}
        {(phase !== 'idle' && phase !== 'drafting' && draft) && (
          <section className="bg-neutral-900/60 backdrop-blur border border-neutral-800/60 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold">2</span>
              <h2 className="text-lg font-bold">Borrador Inicial</h2>
              {phase === 'done' && (
                <span className="ml-auto text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">✓ Procesado</span>
              )}
            </div>

            <pre className="whitespace-pre-wrap text-sm text-neutral-300 bg-neutral-950/50 border border-neutral-800/60 rounded-xl p-4 font-mono leading-relaxed max-h-60 overflow-y-auto">
              {draft}
            </pre>

            {phase === 'draft_done' && (
              <button onClick={handleRunNextLens} disabled={isRunning}
                className="mt-4 w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                ▶ Comenzar Análisis de Expertos
              </button>
            )}
          </section>
        )}

        {/* ── STEP 3: Director Mode — Lens by Lens ── */}
        {lensSteps.length > 0 && (phase === 'running_lenses' || phase === 'lenses_done' || phase === 'orchestrating' || phase === 'done') && (
          <section className="bg-neutral-900/60 backdrop-blur border border-neutral-800/60 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">3</span>
              <h2 className="text-lg font-bold">Panel de Expertos</h2>
              <div className="ml-auto flex items-center gap-2">
                <div className="text-xs text-neutral-500 font-mono">{doneLenses}/{totalLenses} expertos</div>
                <div className="h-1.5 w-24 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-500 rounded-full"
                    style={{ width: `${totalLenses > 0 ? (doneLenses / totalLenses) * 100 : 0}%` }} />
                </div>
              </div>
            </div>

            {/* Completed lenses (collapsed accordion) */}
            {previousLenses.map((step, i) => {
              const meta = LENS_META[step.lensId]
              const vc = step.verdict ? VERDICT_CONFIG[step.verdict] : null
              return (
                <details key={step.lensId} className="group mb-3">
                  <summary className={`cursor-pointer list-none flex items-center gap-3 p-3 rounded-xl border transition-all ${vc?.classes || 'border-neutral-800/60 bg-neutral-800/20'}`}>
                    <span className="text-base">{meta?.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{meta?.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{meta?.description}</p>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${step.verdict === 'green' ? 'text-emerald-400' : step.verdict === 'red' ? 'text-red-400' : 'text-amber-400'}`}>
                      {vc?.label}
                    </span>
                    <svg className="w-4 h-4 text-neutral-500 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="mt-2 px-2 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 mt-3">Análisis del experto:</p>
                    <pre className="whitespace-pre-wrap text-xs text-neutral-400 bg-neutral-950/50 border border-neutral-800/50 rounded-xl p-3 font-mono leading-relaxed max-h-48 overflow-y-auto">
                      {step.feedback}
                    </pre>
                    {step.userOpinion && (
                      <div className="p-3 bg-violet-950/30 border border-violet-800/30 rounded-xl">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-1">Tu opinión:</p>
                        <p className="text-xs text-neutral-300">{step.userOpinion}</p>
                      </div>
                    )}
                  </div>
                </details>
              )
            })}

            {/* Current active lens */}
            {currentLens && (phase === 'running_lenses' || phase === 'lenses_done') && (
              <div className="mt-2">
                {currentLens.status === 'running' && (
                  <div className="p-5 rounded-xl border border-violet-600/40 bg-violet-950/20 flex items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400/30 border-t-violet-400 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-violet-300">{LENS_META[currentLens.lensId]?.emoji} {LENS_META[currentLens.lensId]?.name}</p>
                      <p className="text-xs text-neutral-500">Analizando tu guion... esto puede tomar ~15 segundos</p>
                    </div>
                  </div>
                )}

                {currentLens.status === 'done' && (
                  <div className={`p-5 rounded-xl border ${VERDICT_CONFIG[currentLens.verdict!]?.classes || 'border-neutral-700'}`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{LENS_META[currentLens.lensId]?.emoji}</span>
                      <div>
                        <p className="font-bold text-neutral-100">{LENS_META[currentLens.lensId]?.name}</p>
                        <p className="text-[10px] text-neutral-500">{LENS_META[currentLens.lensId]?.description}</p>
                      </div>
                      <span className="ml-auto text-sm font-bold">{VERDICT_CONFIG[currentLens.verdict!]?.label}</span>
                    </div>

                    <p className="text-xs font-bold uppercase tracking-wider text-neutral-600 mb-2">Análisis del experto:</p>
                    <pre className="whitespace-pre-wrap text-xs text-neutral-300 bg-neutral-950/60 border border-neutral-800/60 rounded-xl p-4 font-mono leading-relaxed max-h-64 overflow-y-auto mb-4">
                      {currentLens.feedback}
                    </pre>

                    {/* Director opinion input */}
                    <div className="space-y-2">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                        🎬 Tu opinión como Director <span className="text-neutral-600 normal-case font-normal">(opcional — se inyecta al Orquestador)</span>
                      </label>
                      <textarea
                        rows={2}
                        value={currentLens.userOpinion}
                        onChange={(e) => updateOpinion(currentLensIdx, e.target.value)}
                        placeholder="Ej: Estoy de acuerdo, pero quiero más énfasis en el precio vs la competencia..."
                        className="w-full bg-neutral-900 border border-violet-800/40 rounded-xl px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-violet-500 focus:outline-none resize-none"
                      />
                    </div>

                    {currentLensIdx < totalLenses - 1 ? (
                      <button onClick={handleRunNextLens} disabled={isRunning}
                        className="mt-4 w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                        ▶ Siguiente Experto — {LENS_META[lensSteps[currentLensIdx + 1]?.lensId]?.emoji} {LENS_META[lensSteps[currentLensIdx + 1]?.lensId]?.name}
                      </button>
                    ) : (
                      <button onClick={() => setPhase('lenses_done')} disabled={isRunning}
                        className="mt-4 w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all">
                        ✓ He leído todos los expertos — Ir al Orquestador
                      </button>
                    )}
                  </div>
                )}

                {currentLens.status === 'pending' && (
                  <button onClick={handleRunNextLens} disabled={isRunning}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-violet-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    ▶ Analizar con {LENS_META[currentLens.lensId]?.emoji} {LENS_META[currentLens.lensId]?.name}
                  </button>
                )}
              </div>
            )}

            {/* All lenses done — Director's global note + Orchestrate */}
            {phase === 'lenses_done' && (
              <div className="mt-4 space-y-4 border-t border-neutral-800/60 pt-5">
                <div className="p-4 bg-emerald-950/20 border border-emerald-800/30 rounded-xl">
                  <p className="text-sm font-bold text-emerald-400 mb-1">🎬 ¡Todos los expertos han hablado!</p>
                  <p className="text-xs text-neutral-500">Ahora el Orquestador unificará sus críticas y creará 3 versiones del guion según la dirección creativa.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-violet-400">
                    🎬 Nota Global del Director <span className="text-neutral-600 normal-case font-normal">(opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={directorNote}
                    onChange={(e) => setDirectorNote(e.target.value)}
                    placeholder="Ej: Quiero que el guion final sea más agresivo en el gancho inicial. No mencionar precios en los primeros 5 segundos. Mantener el tono profesional pero accesible..."
                    className="w-full bg-neutral-900 border border-violet-800/40 rounded-xl px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-violet-500 focus:outline-none resize-none"
                  />
                </div>

                <button onClick={handleOrchestrate} disabled={isRunning}
                  className="w-full py-4 rounded-xl font-black text-sm bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 transition-all shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:shadow-[0_0_50px_rgba(168,85,247,0.6)] active:scale-[0.98]">
                  {isRunning
                    ? <span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" /> El Orquestador está creando 3 versiones...</span>
                    : '🎬 ¡Orquestar! Crear las 3 Versiones Finales'}
                </button>
              </div>
            )}

            {phase === 'orchestrating' && isRunning && (
              <div className="mt-4 p-5 bg-purple-950/30 border border-purple-800/40 rounded-xl flex items-center gap-4">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-400/30 border-t-purple-400 flex-shrink-0" />
                <div>
                  <p className="font-bold text-purple-300">Orquestando 3 variantes creativas...</p>
                  <p className="text-xs text-neutral-500">Clásico → Conversión → Storytelling — puede tardar ~45 segundos</p>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── STEP 4: Script Options (3 Bombs) ── */}
        {phase === 'done' && scriptOptions.length > 0 && (
          <section className="bg-neutral-900/60 backdrop-blur border border-neutral-800/60 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-7 h-7 rounded-full bg-pink-600 flex items-center justify-center text-xs font-bold">4</span>
              <h2 className="text-lg font-bold">Guiones Finales</h2>
              <button
                onClick={() => {
                  setPhase('idle')
                  setDraft('')
                  setLensSteps([])
                  setLensResults([])
                  setScriptOptions([])
                  setResult(null)
                  setDirectorNote('')
                }}
                className="ml-auto text-[10px] font-bold uppercase tracking-wider text-neutral-600 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-950/30"
              >✕ Nuevo Pipeline</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 p-1 bg-neutral-950/50 border border-neutral-800/60 rounded-xl">
              {['Clásico', 'Conversión', 'Storytelling'].map((label, idx) => (
                <button key={label} onClick={() => { setActiveOption(idx); setFinalScript(scriptOptions[idx]) }}
                  className={`flex-1 py-2 text-[11px] font-black uppercase tracking-widest rounded-lg transition-all ${activeOption === idx
                    ? 'bg-violet-600/20 text-violet-400 border border-violet-500/40 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                    : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/50'}`}>
                  {label}
                </button>
              ))}
            </div>

            <pre className="whitespace-pre-wrap text-sm text-neutral-300 bg-neutral-950/50 border border-neutral-800/60 rounded-xl p-5 font-mono leading-relaxed max-h-72 overflow-y-auto">
              {scriptOptions[activeOption]}
            </pre>

            {/* Actions */}
            <div className="mt-5 flex flex-col sm:flex-row gap-3">
              <button onClick={handleSaveAll} disabled={isRunning}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                {isRunning ? <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" /> : '💾 Guardar en BD'}
              </button>
              <button onClick={handleExport}
                className="flex-1 py-3 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold rounded-xl text-sm border border-neutral-700 transition-all">
                📄 Exportar Markdown
              </button>
            </div>
          </section>
        )}

        {/* ── STEP 5: Visual Style ── */}
        {phase === 'done' && (
          <section className="bg-neutral-900/60 backdrop-blur border border-neutral-800/60 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">5</span>
              <h2 className="text-lg font-bold">Estilo Visual</h2>
              <span className="ml-auto text-xs text-neutral-500">{styles.length} estilos</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <input type="search" placeholder="Buscar estilo..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-violet-500 focus:outline-none" />
              <div className="flex gap-1.5 overflow-x-auto">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-violet-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 border border-neutral-700'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredStyles.map(st => (
                <button key={st.id} onClick={() => setSelectedStyle(st)}
                  className={`relative overflow-hidden rounded-xl aspect-square group transition-all border-2 ${selectedStyle?.id === st.id ? 'border-violet-500 ring-2 ring-violet-500/50' : 'border-transparent hover:border-neutral-600'}`}>
                  <img src={st.image} alt={st.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-2 flex flex-col justify-end opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                    <p className="text-[9px] text-violet-400 font-bold uppercase tracking-tighter leading-none">{st.category}</p>
                    <p className="text-white text-[10px] font-bold leading-tight mt-0.5">{st.title}</p>
                  </div>
                </button>
              ))}
            </div>

            {selectedStyle && (
              <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-violet-950/20 border border-violet-800/30 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-violet-400 font-bold uppercase">{selectedStyle.category}</p>
                  <p className="font-bold text-neutral-100 truncate">{selectedStyle.title}</p>
                </div>
                <button onClick={handleGenerateFrames} disabled={generatingFrames}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2">
                  {generatingFrames ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" /> Generando...</> : '🎬 Crear Secuencia'}
                </button>
              </div>
            )}

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
                        <div className="text-xs font-mono text-neutral-400 bg-neutral-800/50 rounded-lg p-3">{frame.imagePrompt}</div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-600">Instrucciones de Movimiento</p>
                        <div className="text-xs italic text-neutral-400 bg-neutral-800/50 rounded-lg p-3">{frame.motionInstructions}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── STEP 6: Voice + Music ── */}
        {phase === 'done' && (
          <section className="bg-neutral-900/60 backdrop-blur border border-neutral-800/60 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-5">
                <span className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold">6a</span>
                <h2 className="text-lg font-bold">Voz en Off</h2>
              </div>

              <button onClick={handleExtractVoice} disabled={extractingVoice}
                className="mb-4 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
                {extractingVoice ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" /> Extrayendo...</> : '✍️ Extraer Voz en Off'}
              </button>

              {voiceProfile && (
                <div className="mb-4 p-3 bg-indigo-950/30 border border-indigo-800/30 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-1.5">Perfil de Voz Sugerido</p>
                  <pre className="text-xs text-neutral-400 font-mono whitespace-pre-wrap">{voiceProfile}</pre>
                </div>
              )}

              {voiceScript && (
                <div className="space-y-4">
                  <textarea rows={7} value={voiceScript} onChange={(e) => setVoiceScript(e.target.value)}
                    className="w-full bg-neutral-950/50 border border-neutral-800 rounded-xl px-4 py-3 text-sm font-mono text-neutral-300 focus:border-indigo-500 focus:outline-none resize-none" />
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)}
                      className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-neutral-100 focus:border-indigo-500 focus:outline-none">
                      {GEMINI_VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                    </select>
                    <button onClick={handleSynthesizeVoice} disabled={synthesizing}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all flex items-center gap-2">
                      {synthesizing ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" />Generando...</> : '🔊 Generar Audio'}
                    </button>
                  </div>
                  {audioBase64 && (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-800/30 rounded-xl space-y-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">✅ Audio Listo</p>
                      <audio controls className="w-full" src={`data:${audioMime};base64,${audioBase64}`} />
                      <a href={`data:${audioMime};base64,${audioBase64}`} download="voiceover-activaqr.wav"
                        className="inline-block px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors">
                        ⬇️ Descargar WAV
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-neutral-800/60 pt-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">6b</span>
                <h2 className="text-lg font-bold">Música ({duration})</h2>
              </div>
              <div className="flex flex-wrap gap-3 mb-5">
                <button onClick={handleGenerateMusicPrompt} disabled={generatingMusic}
                  className="px-4 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
                  {generatingMusic ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" /> Generando...</> : '🎼 Prompts Suno/Udio'}
                </button>
                <button onClick={handleGenerateGeminiMusic} disabled={generatingGeminiMusic}
                  className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-2">
                  {generatingGeminiMusic ? <><div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-t-white" /> Generando...</> : '✨ Música con Gemini'}
                </button>
              </div>
              {geminiMusicUrl && (
                <div className="mb-5 p-4 bg-blue-950/30 border border-blue-800/30 rounded-xl space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400">✅ Música Generada</p>
                  <audio controls className="w-full" src={geminiMusicUrl} />
                </div>
              )}
              {sunoPrompt && (
                <div className="space-y-3">
                  {[{ label: 'Suno', content: sunoPrompt, color: 'purple' }, { label: 'Udio', content: udioPrompt, color: 'blue' }]
                    .filter(p => p.content).map(({ label, content, color }) => (
                      <div key={label} className={`p-4 bg-${color}-950/20 border border-${color}-800/30 rounded-xl`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-[10px] font-bold uppercase text-${color}-400`}>Prompt para {label}</p>
                          <button onClick={() => navigator.clipboard.writeText(content)} className={`text-[10px] text-${color}-500 hover:text-${color}-400 font-bold`}>Copiar</button>
                        </div>
                        <p className="text-xs font-mono text-neutral-400 whitespace-pre-wrap">{content}</p>
                      </div>
                    ))}
                  {mixNotes && (
                    <div className="p-4 bg-amber-950/20 border border-amber-800/30 rounded-xl">
                      <p className="text-[10px] font-bold uppercase text-amber-400 mb-2">📊 Instrucciones de Mezcla</p>
                      <p className="text-sm text-neutral-400 whitespace-pre-wrap">{mixNotes}</p>
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
