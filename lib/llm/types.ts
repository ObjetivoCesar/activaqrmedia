export interface LLMMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface LLMRequestOptions {
    system?: string
    messages: LLMMessage[]
    maxTokens?: number
    temperature?: number
    modelLevel?: 'standard' | 'advanced' // standard = cheaper/faster, advanced = reasoner
}

export interface LLMResponse {
    content: string
    tokensUsed: number
    model: string
}

export interface LLMAdapter {
    complete(options: LLMRequestOptions): Promise<LLMResponse>
}
