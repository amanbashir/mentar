import { Handler } from '@netlify/functions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const MENTOR_PROMPTS = {
  ecommerce: {
    role: "system" as const,
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
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed'
    };
  }

  try {
    const { messages } = JSON.parse(event.body || '{}');

    if (!Array.isArray(messages)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Messages must be an array' })
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        MENTOR_PROMPTS.ecommerce,
        ...messages
      ],
      temperature: 0.7,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reply: response.choices[0]?.message?.content || "I apologize, but I'm unable to respond at the moment."
      })
    };

  } catch (error) {
    console.error('Mentor chat error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process mentor chat' })
    };
  }
}; 