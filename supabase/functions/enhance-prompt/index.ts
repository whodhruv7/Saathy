import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, delegateForm } = await req.json()
    
    if (!query) {
      return new Response(JSON.stringify({ enhanced: query }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const context = delegateForm?.committee || 'a debate committee'
    const topic = delegateForm?.topic || 'this topic'

    const groqKey = Deno.env.get('GROQ_API_KEY')
    if (!groqKey) {
      throw new Error('GROQ_API_KEY not configured')
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        max_tokens: 100,
        temperature: 0.6,
        messages: [
          {
            role: 'system',
            content: `You are a debate query optimizer. Transform vague queries into sharp, specific debate questions. 
Output ONLY the enhanced query. No explanation. Max 1-2 sentences.
Make it relevant to the committee and topic.
Example input: "Is child marriage bad?"
Example output: "What are the legal and human rights arguments against child marriage in a South Asian context, and which statistics most effectively counter cultural relativism defenses?"`
          },
          {
            role: 'user',
            content: `Committee: ${context}\nTopic: ${topic}\nQuery: ${query}` 
          }
        ]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Groq error:', error)
      return new Response(JSON.stringify({ 
        enhanced: `${query} (in context of ${context})` 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    const enhanced = data.choices?.[0]?.message?.content?.trim() || query

    return new Response(JSON.stringify({ enhanced }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Enhancement error:', error)
    const { query } = await req.json().catch(() => ({ query: '' }))
    return new Response(JSON.stringify({ enhanced: query }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
