import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.28.0'

const SYSTEM_PROMPT = `You are Mentar, an AI business mentor. Do not introduce yourself again. Start from the message above. If the user knows what they want to build, reply with: 'Starting module...'. If they're unsure, ask direct questions to help them choose from: eCommerce, Digital Products, Freelancing, or Content Creation. Keep replies short and clear.`;

serve(async (req) => {
  try {
    // Get the request body
    const { messages } = await req.json()

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 500
    })

    const aiResponse = completion.choices[0]?.message?.content

    // Return the response
    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
}) 