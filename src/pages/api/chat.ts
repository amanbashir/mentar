import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Mentar, a highly capable AI coach focused on helping users achieve their life and business goals. You provide clear, actionable advice while maintaining a professional and supportive tone. Your responses should be direct, practical, and tailored to the user's specific situation."
        },
        ...messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }))
      ],
      temperature: 0.7
    });

    const reply = completion.choices[0].message.content;
    res.status(200).json({ message: reply });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
} 