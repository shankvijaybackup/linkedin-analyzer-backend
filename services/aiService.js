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
    const prompt = `Generate exactly 8 LinkedIn outreach messages for ${profile.name}, a ${profile.title} at ${company.name}.

Context:
- They care about: ${redditIntent.keywords?.join(', ') || 'efficiency, technology, processes'}
- Pain points: ${redditIntent.painPoints?.join(', ') || 'operational challenges'}
- Summary: ${strategicSummary}
- Tone persona: ${tonePersona}

Requirements for each message:
- Under 400 characters
- Include: common ground, talking point, ROI angle, and question
- Professional but personalized tone
- Reference their role/company when relevant

Return ONLY a valid JSON array of 8 message objects with this exact format:
[
  {
    "from": "How [Persona] would outreach",
    "subject": "Brief subject line",
    "message": "The actual outreach message text"
  }
]

IMPORTANT: Return only the JSON array, no other text.`;

    try {
      const response = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are a GTM expert. Return only valid JSON arrays for outreach messages. No explanatory text, just the JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.7
      });

      const content = response.choices[0].message.content.trim();
      
      try {
        // Try to parse the JSON response
        const parsedMessages = JSON.parse(content);
        
        // Validate it's an array
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          return parsedMessages;
        } else {
          throw new Error('Response is not a valid array');
        }
      } catch (parseError) {
        console.warn('⚠️ AI returned invalid JSON, using fallback messages');
        return this.getFallbackMessages(profile, company, tonePersona);
      }
    } catch (error) {
      console.error('❌ Error generating outreach messages:', error.message);
      return this.getFallbackMessages(profile, company, tonePersona);
    }
  }

  getFallbackMessages(profile, company, tonePersona) {
    const name = profile.name || 'there';
    const companyName = company.name || 'your organization';
    const title = profile.title || 'your role';
    
    return [
      {
        from: `How ${tonePersona} would outreach`,
        subject: "Operational efficiency insights",
        message: `Hi ${name}, noticed your ${title} at ${companyName}. We help similar organizations streamline operations and reduce manual work. What's your biggest operational challenge right now?`
      },
      {
        from: `How ${tonePersona} would outreach`,
        subject: "Process optimization opportunity",
        message: `Hi ${name}, impressed by ${companyName}'s growth. Many ${title}s we work with save 30%+ time on routine tasks. What processes would you most like to automate?`
      },
      {
        from: `How ${tonePersona} would outreach`,
        subject: "Technology modernization",
        message: `Hi ${name}, your experience at ${companyName} is impressive. We're helping similar companies modernize their tech stack. What's driving your technology decisions this year?`
      },
      {
        from: `How ${tonePersona} would outreach`,
        subject: "ROI-focused solutions",
        message: `Hi ${name}, ${companyName} seems focused on efficiency. Our platform delivers measurable ROI within 90 days. What metrics matter most for your team's success?`
      },
      {
        from: `How ${tonePersona} would outreach`,
        subject: "Industry best practices",
        message: `Hi ${name}, working with other ${title}s in your industry, I've seen some interesting efficiency trends. What's your take on automation priorities for ${companyName}?`
      },
      {
        from: `How ${tonePersona} would outreach`,
        subject: "Strategic technology discussion",
        message: `Hi ${name}, your background suggests a strategic approach to technology. We're helping leaders like you achieve operational excellence. What's on your strategic roadmap?`
      },
      {
        from: `How ${tonePersona} would outreach`,
        subject: "Efficiency breakthrough",
        message: `Hi ${name}, ${companyName}'s growth trajectory is impressive. Our clients typically see 40% reduction in manual work. What would that kind of efficiency mean for your team?`
      },
      {
        from: `How ${tonePersona} would outreach`,
        subject: "Innovation partnership",
        message: `Hi ${name}, your role at ${companyName} caught my attention. We partner with forward-thinking leaders to drive innovation. What's your vision for operational excellence?`
      }
    ];
  }
}

module.exports = AIService;