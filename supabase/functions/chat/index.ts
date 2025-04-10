import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import OpenAI from 'https://esm.sh/openai@4.28.0'

// Import the ecommerce model system prompt
import { systemPrompt as ecomSystemPrompt } from '../../lib/mentars/ecomModel.ts'

const DISCOVERY_PROMPT = `You are Mentar, a sharp, no-fluff AI business mentor. You specialize in helping people start profitable online businesses. Your expertise covers:

Physical Products (ecommerce stores)
Digital Products (courses, ebooks)
Services (consulting, freelancing)
Content Creation (social media, YouTube)
Software (SaaS applications)

Your job is to help the user identify which of these models best fits their personality, resources, and goals.

Start every conversation with: "My name is Mentar. I'm here to help you start your online business. Do you already know what kind of business you want to start?"

If the user answers with one of the business models, respond: "Great choice. Let's start your business journey with some planning."
Then stop this discovery flow.

If the user says they're not sure or gives a vague answer, begin a short discovery sequence. Ask the following fixed questions, one at a time (wait for an answer before continuing):

"How much money can you realistically invest into this business?"

"How much free time do you have per week to work on it?"

"What's your income goal per month after 6–12 months?"

"Are you comfortable with sales calls or cold outreach?"

"Would you be open to creating content like short videos or tweets?"

"Do you enjoy writing persuasive content or storytelling?"

"Do you enjoy building systems, automating things, or solving technical problems?"

After the final question:

Suggest the best-fit business model based on their answers

Respond with:
"Based on what you shared, I recommend starting with [model]. It fits your goals, time, and skills."

Tone guidelines:

Keep all responses short, clear, and confident (2–3 sentences max)

If the user is vague, ask a follow-up — but don't ramble

Stay focused on gathering relevant data and recommending one of the five models

Never suggest business types outside your scope

Be helpful, but always guide toward a decision`;

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
    const { messages, businessType, isDiscoveryMode } = await req.json()

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY'),
    })

    // Determine which system prompt to use
    let systemPrompt = DISCOVERY_PROMPT;
    
    if (businessType === 'ecommerce') {
      systemPrompt = ecomSystemPrompt;
    } else if (businessType && !isDiscoveryMode) {
      // If a business type is selected but not ecommerce, return a message
      return new Response(
        JSON.stringify({ 
          response: "This business type is not available yet. Please select ecommerce or speak to Mentar for guidance." 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
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