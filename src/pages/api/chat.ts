import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: prompt },
      ],
      temperature: 0.7,
      presence_penalty: 0.6,
      frequency_penalty: 0.6,
    });

    const message = completion.choices[0].message.content;

    return res.status(200).json({ message });
  } catch (error) {
    console.error('Error in chat API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 