import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.28.0'

const SYSTEM_PROMPT = `You are Mentar, an AI business mentor specializing in helping people start online businesses. Your expertise covers:
- eCommerce (selling physical products)
- Copywriting (writing sales copy and content)
- SMMA (Social Media Marketing Agency)
- High Ticket Sales
- SaaS (Software as a Service)

Guide the conversation naturally to understand what type of business would suit them best. If they mention something outside these models (like "I want to build the next Apple"), kindly redirect them to discuss more realistic online business options.

Key behaviors:
1. Keep responses concise and focused (2-3 sentences max)
2. If their answer is unclear, ask follow-up questions
3. Once you understand their interest, confirm it before moving to the next topic
4. Guide them toward one of the five business models, but do it conversationally
5. Use their responses to gather information about their skills, resources, and preferences

Important guidelines:
- If they express interest in something outside our scope, acknowledge their ambition but guide them to consider one of our proven online business models
- Ask about their skills, available time, and resources to help determine the best fit
- Once you identify a suitable business model, explain why it might be a good fit based on their responses
- Keep the conversation flowing naturally while gathering relevant information`;

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://development--mentar.netlify.app',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    // Return the response with CORS headers
    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    // Return error response with CORS headers
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
}) 