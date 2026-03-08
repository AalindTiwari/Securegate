export interface ProviderInfo {
    id: string
    name: string
    description: string
    color: string
    placeholder: string
    docsUrl: string
    category: 'major' | 'cloud-inference' | 'specialized' | 'custom'
    logoUrl?: string
    supportsBaseUrl?: boolean
    supportsCustomName?: boolean
}

export const providers: ProviderInfo[] = [
    // ── Major Providers ──────────────────────────────────────────
    {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4o, GPT-4.1, o3, DALL·E, Whisper',
        color: 'from-green-500 to-emerald-600',
        placeholder: 'sk-...',
        docsUrl: 'https://platform.openai.com/docs',
        category: 'major',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/openai.svg',
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude 4, Claude 3.5 Sonnet, Haiku',
        color: 'from-orange-500 to-amber-600',
        placeholder: 'sk-ant-...',
        docsUrl: 'https://docs.anthropic.com',
        category: 'major',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/anthropic.svg',
    },
    {
        id: 'google',
        name: 'Google AI',
        description: 'Gemini 2.5 Pro, Gemini Flash, PaLM',
        color: 'from-blue-500 to-blue-600',
        placeholder: 'AIza...',
        docsUrl: 'https://ai.google.dev/docs',
        category: 'major',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/google.svg',
    },
    {
        id: 'azure',
        name: 'Azure OpenAI',
        description: 'GPT-4o & OpenAI models via Azure',
        color: 'from-cyan-500 to-blue-500',
        placeholder: 'Your Azure API key',
        docsUrl: 'https://learn.microsoft.com/azure/ai-services/openai',
        category: 'major',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/azure.svg',
    },

    // ── Cloud & Inference ────────────────────────────────────────
    {
        id: 'groq',
        name: 'Groq',
        description: 'Ultra-fast LPU inference for Llama, Mixtral',
        color: 'from-rose-500 to-pink-600',
        placeholder: 'gsk_...',
        docsUrl: 'https://console.groq.com/docs',
        category: 'cloud-inference',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/groq.svg',
    },
    {
        id: 'together',
        name: 'Together AI',
        description: 'Open-source models: Llama, Qwen, DeepSeek',
        color: 'from-indigo-500 to-violet-600',
        placeholder: 'Your Together API key',
        docsUrl: 'https://docs.together.ai',
        category: 'cloud-inference',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/together.svg',
    },
    {
        id: 'fireworks',
        name: 'Fireworks AI',
        description: 'Fast serverless inference for open models',
        color: 'from-amber-500 to-red-500',
        placeholder: 'fw_...',
        docsUrl: 'https://docs.fireworks.ai',
        category: 'cloud-inference',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/fireworks.svg',
    },
    {
        id: 'perplexity',
        name: 'Perplexity',
        description: 'Sonar models with built-in web search',
        color: 'from-teal-500 to-cyan-600',
        placeholder: 'pplx-...',
        docsUrl: 'https://docs.perplexity.ai',
        category: 'cloud-inference',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/perplexity.svg',
    },
    {
        id: 'mistral',
        name: 'Mistral AI',
        description: 'Mistral Large, Medium, Codestral',
        color: 'from-sky-500 to-blue-600',
        placeholder: 'Your Mistral API key',
        docsUrl: 'https://docs.mistral.ai',
        category: 'cloud-inference',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/mistral.svg',
    },
    {
        id: 'deepseek',
        name: 'DeepSeek',
        description: 'DeepSeek-V3, DeepSeek-R1 reasoning',
        color: 'from-blue-600 to-indigo-700',
        placeholder: 'sk-...',
        docsUrl: 'https://platform.deepseek.com/docs',
        category: 'cloud-inference',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/deepseek.svg',
    },

    // ── Specialized Providers ────────────────────────────────────
    {
        id: 'cohere',
        name: 'Cohere',
        description: 'Command R+, Embed, and Rerank APIs',
        color: 'from-purple-500 to-violet-600',
        placeholder: 'Your Cohere API key',
        docsUrl: 'https://docs.cohere.com',
        category: 'specialized',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/cohere.svg',
    },
    {
        id: 'replicate',
        name: 'Replicate',
        description: 'Run open-source models via API',
        color: 'from-neutral-500 to-zinc-600',
        placeholder: 'r8_...',
        docsUrl: 'https://replicate.com/docs',
        category: 'specialized',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/replicate.svg',
    },
    {
        id: 'bedrock',
        name: 'AWS Bedrock',
        description: 'Managed AI models on AWS infrastructure',
        color: 'from-yellow-500 to-orange-500',
        placeholder: 'Your AWS access key',
        docsUrl: 'https://docs.aws.amazon.com/bedrock',
        category: 'specialized',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/aws.svg',
    },
    {
        id: 'huggingface',
        name: 'Hugging Face',
        description: 'Inference API for 200k+ models',
        color: 'from-yellow-400 to-amber-500',
        placeholder: 'hf_...',
        docsUrl: 'https://huggingface.co/docs/api-inference',
        category: 'specialized',
        logoUrl: 'https://unpkg.com/@lobehub/icons-static-svg/icons/huggingface.svg',
    },

    // ── Custom ───────────────────────────────────────────────────
    {
        id: 'custom',
        name: 'Custom / OpenAI-Compatible',
        description: 'Any OpenAI-compatible API — OpenRouter, DeepInfra, Anyscale, Novita, etc.',
        color: 'from-accent to-orange-500',
        placeholder: 'Your API key (if required)',
        docsUrl: 'https://platform.openai.com/docs/api-reference',
        category: 'custom',
        supportsBaseUrl: true,
    },
    {
        id: 'custom-other',
        name: 'Custom / Non-OpenAI',
        description: 'Bring your own code — paste a handler function and inject variables securely.',
        color: 'from-violet-500 to-purple-600',
        placeholder: 'Your API key',
        docsUrl: '',
        category: 'custom',
        supportsBaseUrl: false,
        supportsCustomName: true,
    },
]

export const categoryLabels: Record<string, string> = {
    'major': 'Major Providers',
    'cloud-inference': 'Cloud & Inference',
    'specialized': 'Specialized',
    'custom': 'Custom',
}

export const categoryOrder = ['major', 'cloud-inference', 'specialized', 'custom'] as const

/**
 * Color lookup map for provider cards in the connections list.
 */
export const providerColors: Record<string, string> = Object.fromEntries(
    providers.map((p) => [p.id, p.color])
)

/**
 * Get a provider by ID.
 */
export function getProvider(id: string): ProviderInfo | undefined {
    return providers.find((p) => p.id === id)
}
