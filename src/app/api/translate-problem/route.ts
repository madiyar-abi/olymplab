import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { problemId } = await req.json()
    if (!problemId) {
      return NextResponse.json({ error: 'Missing problemId' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Check if problem already has Russian translation
    const { data: problem, error: fetchErr } = await supabase
      .from('problems')
      .select('id, title, description, title_ru, description_ru')
      .eq('id', problemId)
      .single()

    if (fetchErr || !problem) {
      return NextResponse.json({ error: 'Problem not found' }, { status: 404 })
    }

    if (problem.description_ru && problem.description_ru.length > 20) {
      return NextResponse.json({
        title_ru: problem.title_ru || problem.title,
        description_ru: problem.description_ru,
      })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        title_ru: problem.title_ru || problem.title,
        description_ru: problem.description_ru || problem.description,
      })
    }

    // 2. Translate using Gemini 2.5 Flash
    const prompt = `You are a competitive programming translator translating a problem into Russian.
Translate the following problem title and statement from English into Russian.

RULES:
1. Preserve all LaTeX formulas ($...$ and $$...$$) exactly without changes.
2. Preserve all sample inputs, outputs, variables, code snippets, numbers, and constraints exactly as they are.
3. Translate the problem narrative and technical explanation into natural, precise Russian competitive programming terminology (e.g., "массив", "подпоследовательность", "дерево отрезков", "вершина", "ребро").
4. Output JSON in this exact format:
{
  "title_ru": "...",
  "description_ru": "..."
}
Do not wrap in markdown quotes or extra text.

Title: ${problem.title}

Statement:
${problem.description}
`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    })

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Gemini API quota exceeded (429), falling back to seeded problem data.')
      } else {
        const errText = await response.text()
        console.warn(`Gemini translation error (${response.status}):`, errText.slice(0, 150))
      }
      return NextResponse.json({
        title_ru: problem.title_ru || problem.title,
        description_ru: problem.description_ru || problem.description,
      })
    }

    const data = await response.json()
    const parts = data?.candidates?.[0]?.content?.parts
    const content = parts?.find((p: { thought?: boolean; text?: string }) => !p.thought)?.text || parts?.slice(-1)[0]?.text
    let parsed: { title_ru: string; description_ru: string }

    try {
      parsed = JSON.parse(content)
    } catch {
      parsed = {
        title_ru: problem.title,
        description_ru: content || problem.description,
      }
    }

    // 3. Cache translation to Supabase
    if (parsed.description_ru) {
      await supabase
        .from('problems')
        .update({
          title_ru: parsed.title_ru || problem.title,
          description_ru: parsed.description_ru,
        })
        .eq('id', problemId)
    }

    return NextResponse.json({
      title_ru: parsed.title_ru || problem.title,
      description_ru: parsed.description_ru || problem.description,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Translation error'
    console.error('Translation route failure:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
