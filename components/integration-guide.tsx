'use client'

import { useState } from 'react'
import { Copy, CheckCircle2, ChevronDown, Frame, Smartphone, Globe, Code2, Database } from 'lucide-react'

interface IntegrationGuideProps {
  baseUrl: string
  apiKey: string
}

type FrameworkKey = 'Next.js' | 'cURL'

const frameworks: Record<FrameworkKey, { icon: React.ReactNode, title: string, code: (url: string, key: string) => string }> = {
  'Next.js': {
    icon: <Globe className="w-4 h-4" />,
    title: 'Next.js (App Router)',
    code: (url, key) => `import OpenAI from 'openai';

// Initialize with your SecureGate Proxy URL and Key
const openai = new OpenAI({
  baseURL: '${url}',
  apiKey: process.env.SG_KEY || '${key}', // Keep key in .env config
});

export async function POST(req: Request) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello SecureGate!' }],
  });
  
  return Response.json(completion.choices[0]);
}`
  },
  'cURL': {
    icon: <Code2 className="w-4 h-4" />,
    title: 'Command Line (cURL)',
    code: (url, key) => `curl ${url}/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${key}" \\
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'`
  }
}

export function IntegrationGuide({ baseUrl, apiKey }: IntegrationGuideProps) {
  const [selected, setSelected] = useState<FrameworkKey>('Next.js')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyCode = async () => {
    const snippet = frameworks[selected].code(baseUrl, apiKey)
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="w-full rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-secondary/10">
        <div>
          <h3 className="font-semibold text-base">Integration Directory</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Select a framework to copy connection string</p>
        </div>

        {/* Custom dropdown directory selector */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-2 bg-secondary/80 hover:bg-secondary border border-border rounded-xl text-sm font-medium transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="text-accent">{frameworks[selected].icon}</span>
              <span>{frameworks[selected].title}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {isDropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-full sm:w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                {Object.keys(frameworks).map((k) => {
                  const key = k as FrameworkKey;
                  return (
                    <button
                      key={key}
                      onClick={() => {
                        setSelected(key);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${selected === key ? 'bg-accent/10 text-accent font-semibold' : 'hover:bg-secondary'}`}
                    >
                      <span className={selected === key ? 'text-accent' : 'text-muted-foreground'}>
                        {frameworks[key].icon}
                      </span>
                      {frameworks[key].title}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="relative group">
        <button
          onClick={copyCode}
          className="absolute right-4 top-4 p-2 rounded-lg bg-secondary border border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all opacity-0 group-hover:opacity-100 z-10 font-medium text-xs flex items-center gap-2 shadow-md"
          title="Copy code"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Snippet
            </>
          )}
        </button>
        <div className="bg-[#0d1117] p-5 overflow-x-auto text-[13px] font-mono leading-relaxed text-[#c9d1d9] custom-scrollbar min-h-[220px]">
          <pre><code>{frameworks[selected].code(baseUrl, apiKey === '••• SECURE •••' ? 'YOUR_SG_KEY' : apiKey)}</code></pre>
        </div>
      </div>
    </div >
  )
}
