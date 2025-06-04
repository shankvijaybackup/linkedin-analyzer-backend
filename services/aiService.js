const OpenAI = require("openai");
require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class AIService {
  async summarizeIntent(profile, company, redditIntent) {
    const prompt = `Given this LinkedIn profile:

Name: ${profile.name}
Title: ${profile.title}
Summary: ${profile.summary}
Company: ${company.name} (${company.industry})

And external signals:
Reddit Signals: ${redditIntent.keywords?.join(', ')}
Sentiment: ${redditIntent.sentiment}
Pain Points: ${redditIntent.painPoints?.join(', ')}

Write a strategic intent summary highlighting their likely goals, pain points, and IT priorities.`;

    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an enterprise B2B sales analyst helping personalize outreach."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.6
    });

    return response.choices[0].message.content;
  }

  inferDISC(profile) {
    const title = (profile.title || '').toLowerCase();
    if (title.includes('cto') || title.includes('founder')) return 'D/I'; // Vijay style
    if (title.includes('engineer') || title.includes('infra')) return 'C/D'; // Parsu style
    if (title.includes('director') || title.includes('business')) return 'I/S'; // Lenin style
    return 'S/C'; // default fallback
  }

  async generateOutreach(profile, strategicSummary, company, redditIntent, tonePersona) {
    const prompt = `Generate 8 DISC-personalized LinkedIn outreach messages for ${profile.name}, a ${profile.title} at ${company.name}.

They care about topics like: ${redditIntent.keywords?.join(', ') || 'N/A'}
Pain points: ${redditIntent.painPoints?.join(', ') || 'N/A'}

Summary insights: ${strategicSummary}
Tone: ${tonePersona} — based on Atomicwork founder personas

Each message should:
- Be under 500 characters
- Include common ground, icebreaker, talking point, ROI angle, and a key question
- Be labeled by the inferred persona (e.g., How Vijay R would outreach)

Output only the 8 messages as an array.`;

    const response = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a GTM expert writing founder-persona-based LinkedIn outreach."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.7
    });

    return JSON.parse(response.choices[0].message.content);
  }
}

module.exports = AIService;
