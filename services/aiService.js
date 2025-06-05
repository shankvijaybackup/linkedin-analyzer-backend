// backend/services/aiService.js
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const removeMarkdown = require('remove-markdown');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

class AIService {
  constructor() {
    this.knowledgePath = path.resolve('data', 'knowledge-base.json');
    this.founders = ['Vijay R', 'Kiran D', 'Lenin G', 'Parsu M'];
    this.discMapping = {
      'Vijay R': 'D/I',
      'Kiran D': 'I/S',
      'Lenin G': 'S/C',
      'Parsu M': 'C/D'
    };
    this.cachedKnowledge = this.loadKnowledge();
  }

  loadKnowledge() {
  if (fs.existsSync(this.knowledgePath)) {
    try {
      const raw = fs.readFileSync(this.knowledgePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map(item => `${item.title}\n${removeMarkdown(item.body).slice(0, 500)}`);
      } else {
        console.warn('⚠️ knowledge-base.json is not an array. Ignoring...');
        return [];
      }
    } catch (err) {
      console.error('❌ Failed to parse knowledge-base.json:', err.message);
      return [];
    }
  }
  return [];
}


  async summarizeIntent(profile, company, redditIntent) {
    const context = this.cachedKnowledge.slice(0, 5).join('\n\n');

    const prompt = `
You're an enterprise IT strategist at Atomicwork. Based on the LinkedIn profile, company info, and Reddit-like intent signals, generate a strategic prep brief.

--- Profile ---
Name: ${profile.name}
Title: ${profile.title}
Company: ${company.name}
Summary: ${profile.summary}
Location: ${profile.location}
Experience: ${profile.experience?.map(e => `${e.title} at ${e.company}`).join(', ')}

--- Company ---
Industry: ${company.industry}
Size: ${company.company_size}
Intent Signals: ${JSON.stringify(redditIntent)}

--- Atomicwork Positioning ---
Atomicwork is purpose-built for modern IT and service teams in the AI era. We are:
- Microsoft-native (Azure AD, Intune, Defender integrations).
- Built for Digital AI (voice, chat, vision).
- Designed for self-service-first operations (not ticketing-first).
- Reducing toil, alerts, escalations with intelligent agentic workflows.
- Differentiated from ServiceNow (complex, legacy), Jira/Freshworks (multi-product, not focused).

--- Existing Knowledge ---
${context}

Create a meeting prep brief including:
- Connection Angle
- Common Ground
- Talking Points
- Ice Breakers
- Key Questions
- ROI Pitch for Atomicwork
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.choices[0].message.content.trim();
  }

  async generateOutreach(profile, summary, company, redditIntent, tonePersona) {
    const messages = [];

    for (const founder of this.founders) {
      const discTone = this.discMapping[founder];

      const prompt = `
You're ${founder} from Atomicwork. Based on this prospect’s profile, company, DISC tone (${discTone}), and our mission — write a concise, personalized LinkedIn DM.

--- Prospect ---
Name: ${profile.name}
Title: ${profile.title}
Company: ${profile.company}
Location: ${profile.location}
Summary: ${profile.summary}
Company Size: ${company.company_size}
Industry: ${company.industry}

--- Signals ---
Reddit Signals: ${JSON.stringify(redditIntent)}
Summary Notes: ${summary}

--- Our Value ---
- Agentic ITSM for modern teams
- Digital AI for contextual self-service
- Native Microsoft integrations
- Simpler than ServiceNow, more focused than Freshworks/Jira

Write a message with:
Subject: <short>
Message: <300–500 character DM, crisp, actionable>
Tone: ${discTone} founder tone (be specific, bold, or analytical depending on DISC type).
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        temperature: 0.6,
        messages: [{ role: 'user', content: prompt }]
      });

      const lines = completion.choices[0].message.content.trim().split('\n');
      const subject = lines.find(l => l.startsWith('Subject:'))?.replace('Subject:', '').trim() || 'Let’s connect';
      const message = lines.find(l => l.startsWith('Message:'))?.replace('Message:', '').trim();

      messages.push({
        sender: founder,
        focus: discTone,
        subject,
        message
      });
    }

    return messages;
  }

  inferDISC(profile) {
    const summary = (profile.summary || '').toLowerCase();
    if (summary.includes('growth') || summary.includes('results')) return 'D/I';
    if (summary.includes('collaboration') || summary.includes('team')) return 'I/S';
    if (summary.includes('process') || summary.includes('stability')) return 'S/C';
    if (summary.includes('systems') || summary.includes('data')) return 'C/D';
    return 'S/C';
  }
}

module.exports = AIService;
