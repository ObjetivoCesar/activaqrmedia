export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            scripts: {
                Row: {
                    id: string
                    title: string
                    original_idea: string
                    current_body: string
                    version: number
                    status: Database['public']['Enums']['pipeline_status']
                    user_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    original_idea: string
                    current_body?: string
                    version?: number
                    status?: Database['public']['Enums']['pipeline_status']
                    user_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    original_idea?: string
                    current_body?: string
                    version?: number
                    status?: Database['public']['Enums']['pipeline_status']
                    user_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            lens_results: {
                Row: {
                    id: string
                    script_id: string
                    version: number
                    lens: Database['public']['Enums']['lens_type']
                    verdict: Database['public']['Enums']['lens_verdict'] | null
                    feedback: string
                    tokens_used: number | null
                    run_at: string
                }
                Insert: {
                    id?: string
                    script_id: string
                    version: number
                    lens: Database['public']['Enums']['lens_type']
                    verdict?: Database['public']['Enums']['lens_verdict'] | null
                    feedback: string
                    tokens_used?: number | null
                    run_at?: string
                }
                Update: {
                    id?: string
                    script_id?: string
                    version?: number
                    lens?: Database['public']['Enums']['lens_type']
                    verdict?: Database['public']['Enums']['lens_verdict'] | null
                    feedback?: string
                    tokens_used?: number | null
                    run_at?: string
                }
            }
            checklist_results: {
                Row: {
                    id: string
                    script_id: string
                    version: number
                    profile_1: Json
                    profile_2: Json
                    profile_3: Json
                    profile_4: Json
                    overall_pass: boolean
                    raw_output: string | null
                    run_at: string
                }
                Insert: {
                    id?: string
                    script_id: string
                    version: number
                    profile_1: Json
                    profile_2: Json
                    profile_3: Json
                    profile_4: Json
                    overall_pass: boolean
                    raw_output?: string | null
                    run_at?: string
                }
                Update: {
                    id?: string
                    script_id?: string
                    version?: number
                    profile_1?: Json
                    profile_2?: Json
                    profile_3?: Json
                    profile_4?: Json
                    overall_pass?: boolean
                    raw_output?: string | null
                    run_at?: string
                }
            }
            production_outputs: {
                Row: {
                    id: string
                    script_id: string
                    video_prompts: Json
                    voice_prompt: string
                    music_prompt: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    script_id: string
                    video_prompts?: Json
                    voice_prompt?: string
                    music_prompt?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    script_id?: string
                    video_prompts?: Json
                    voice_prompt?: string
                    music_prompt?: string
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            pipeline_status: 'draft' | 'in_pipeline' | 'pending_review' | 'in_checklist' | 'approved' | 'rejected'
            lens_type: 'draft_initial' | 'lens_clarity' | 'lens_neuro' | 'lens_copy' | 'lens_music' | 'lens_seo' | 'lens_visual' | 'checklist_buyer_persona' | 'production_video' | 'production_voice' | 'production_music'
            lens_verdict: 'green' | 'yellow' | 'red' | 'approved' | 'rejected'
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
