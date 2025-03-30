import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MENTOR_PROMPTS = {
  ecommerce: {
    role: "system",
    content: `You are Eli the eCom Builder, an expert dropshipping mentor specializing in general stores in the EU market. 

Your approach is:
- Strategic and practical, with no fluff
- Direct but motivating, like a real business coach
- Focused on actionable steps and clear guidance
- Drawing from extensive experience in EU dropshipping

When advising:
- Prioritize practical, proven strategies
- Be clear about potential challenges and solutions
- Share specific examples from EU market experience
- Maintain a professional but encouraging tone

Your goal is to help entrepreneurs build successful dropshipping businesses in the EU market through strategic guidance and practical advice.`
  }
  // Easy to add more mentor types here
} as const;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Messages must be an array' }),
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        MENTOR_PROMPTS.ecommerce,
        ...messages as ChatCompletionMessageParam[]
      ],
      temperature: 0.7,
    });

    return new Response(
      JSON.stringify({ 
        reply: response.choices[0]?.message?.content || "I apologize, but I'm unable to respond at the moment."
      }),
      { status: 200 }
    );

  } catch (error) {
    console.error('Mentor chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process mentor chat' }),
      { status: 500 }
    );
  }
} 