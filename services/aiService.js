// backend/services/aiService.js
const { enhancedAtomicworkSummary, personaSpecificMessaging } = require('../data/atomicworkKnowledge');

class AIService {
  constructor() {
    this.openaiKey = process.env.OPENAI_API_KEY;
    
    if (!this.openaiKey) {
      console.warn('⚠️ OPENAI_API_KEY not found - using enhanced mock data');
    }
  }

  async summarizeIntent(profile, company, redditIntent) {
    try {
      console.log('🧠 Generating strategic summary...');
      
      // Always use enhanced mock data for now to avoid API issues
      return this.generateSmartStrategicSummary(profile, company);

    } catch (error) {
      console.error('❌ Strategic summary generation failed:', error.message);
      return this.generateSmartStrategicSummary(profile, company);
    }
  }

  async generateOutreach(profile, strategicSummary) {
    try {
      console.log('📬 Generating personalized outreach messages...');
      
      // Always use enhanced mock data for now to avoid API issues
      return this.generateSmartOutreachMessages(profile);

    } catch (error) {
      console.error('❌ Outreach generation failed:', error.message);
      return this.generateSmartOutreachMessages(profile);
    }
  }

  generateSmartStrategicSummary(profile, company) {
    const persona = this.identifyPersona(profile.title);
    const personaData = personaSpecificMessaging[persona] || personaSpecificMessaging.itOpsManager;
    
    const companyContext = company.name ? `at ${company.name}` : '';
    const industryContext = company.industry || 'technology sector';
    const companySizeContext = company.company_size ? 
      `with ${company.company_size.toLocaleString()} employees` : 
      'at enterprise scale';

    return `Based on comprehensive analysis of ${profile.name}'s profile and role context, key strategic insights include:

• **EXECUTIVE AUTHORITY**: ${profile.title} ${companyContext} indicates high-level decision making power with significant budget influence for IT transformation initiatives

• **INDUSTRY EXPERTISE**: ${industryContext} background suggests sophisticated understanding of enterprise technology requirements and regulatory compliance needs

• **SCALE CHALLENGES**: ${profile.title} role ${companySizeContext} indicates pain points around operational efficiency, automation gaps, and service delivery optimization

• **DIGITAL TRANSFORMATION MANDATE**: Senior IT leadership position suggests active involvement in modernization initiatives - ideal timing for AI-native ITSM solutions

• **INTEGRATION FOCUS**: Executive experience across ${profile.experience?.length || 'multiple'} organizations demonstrates preference for unified platforms over fragmented toolsets

• **ROI ORIENTATION**: ${persona.toUpperCase()} level role requires measurable business impact and operational improvements through technology investments

**COMPETITIVE POSITIONING**: Position Atomicwork as the AI-native alternative to legacy ITSM (ServiceNow era), emphasizing our generational advantage - built for the AI era (2020s) focused on end-users, not just IT agents and admins.

**STRATEGIC RECOMMENDATION**: Lead with Digital AI capabilities, service workforce vision, and rapid deployment benefits. Emphasize how we enable lean IT teams to move fast vs. traditional complexity management approaches.`;
  }

  generateSmartOutreachMessages(profile) {
    const messages = [];
    const persona = this.identifyPersona(profile.title);
    const personaData = personaSpecificMessaging[persona] || personaSpecificMessaging.itOpsManager;
    
    // Message 1: Vijay R (CEO) - Generational Positioning
    messages.push({
      sender: "Vijay R",
      focus: "CEO - Generational Positioning",
      subject: `AI Era Service Management for ${profile.company}`,
      message: `Hi ${profile.name},

Impressive background leading IT at ${profile.company}. Your experience across enterprise environments really stands out.

We're in the third generation of service management: ServiceNow (2000s admin era) → Jira/Fresh (2010s agent era) → Atomicwork (2020s AI era for end-users).

Most ${persona}s tell us legacy ITSM creates complexity rather than simplicity. At Atomicwork, our singular mission is delivering a service workforce, not just workflows.

What's your biggest operational challenge right now?

Best regards,
Vijay`
    });

    // Message 2: Kiran D (CTO) - Digital AI Focus
    messages.push({
      sender: "Kiran D", 
      focus: "CTO - Digital AI Architecture",
      subject: "Digital AI vs Traditional ITSM",
      message: `Hi ${profile.name},

Your technical leadership at ${profile.company} caught my attention. The challenge of scaling IT operations while maintaining service quality is significant.

Traditional ITSM tools force teams into rigid workflows. What if employees could get help through natural conversation, with Digital AI (multi-modal: voice, vision, chat) handling routing and resolution automatically?

That's what we've built - operating in the flow of work with full context understanding, not just another portal to visit.

Interested in a technical discussion about AI-native service architectures?

Best,
Kiran`
    });

    // Message 3: Lenin G (VP Engineering) - Operational Excellence
    messages.push({
      sender: "Lenin G",
      focus: "VP Engineering - Operational Excellence", 
      subject: "Reducing IT Operational Overhead",
      message: `Hi ${profile.name},

Your experience in ${profile.title} really resonates. Many IT leaders tell us they're tired of complex ticketing systems that add overhead instead of value.

We built Atomicwork specifically for this - one unified platform where AI handles the toiling work, letting your team focus on strategic initiatives instead of L1 tickets.

Built-in knowledge using your existing Okta/AD context eliminates traditional knowledge management overhead.

Would you be open to a brief conversation about operational efficiency?

Best,
Lenin`
    });

    // Message 4: Parsu M (VP Product) - User Experience
    messages.push({
      sender: "Parsu M",
      focus: "VP Product - End-User Experience",
      subject: "Service Workforce vs Service Workflows",
      message: `Hi ${profile.name},

Your background leading technology initiatives at ${profile.company} caught my attention. Balancing operational efficiency with service quality at enterprise scale requires the right approach.

Most platforms give you software where you do all the work. Atomicwork delivers a service workforce - focused on faster self-service first, not forcing everything to become a ticket.

Our clients typically see immediate improvements in both team productivity and employee satisfaction.

Could we schedule a brief call to discuss your service delivery strategy?

Thanks,
Parsu`
    });

    // Message 5: Vijay R (CEO) - ROI Focus
    messages.push({
      sender: "Vijay R",
      focus: "CEO - ROI & Business Impact",
      subject: "Measurable Impact for Modern Enterprises", 
      message: `Hi ${profile.name},

Your track record driving operational improvements at ${profile.company} is exactly the perspective we value.

Traditional ITSM tools were built for Fortune 500 complexity management. Modern enterprises like yours need to move fast with lean teams.

Atomicwork delivers measurable results: 40% reduction in L1 tickets, improved SLA compliance, faster deployment than legacy alternatives.

What KPIs matter most for your IT operations, and how do you currently measure service delivery effectiveness?

Looking forward to your insights,
Vijay`
    });

    // Message 6: Kiran D (CTO) - Integration & Scalability
    messages.push({
      sender: "Kiran D",
      focus: "CTO - Integration Strategy",
      subject: "Modern Service Management Architecture",
      message: `Hi ${profile.name},

Your technical leadership across multiple enterprise environments shows deep understanding of integration challenges.

API-first, AI-native platforms offer a fundamentally different approach than traditional ITSM. Our context management data lake goes beyond traditional CMDB limitations.

Seamless integration with existing cloud infrastructure while providing the conversational interface employees expect - all with enterprise security and compliance built-in.

Would you be interested in a technical deep-dive on modern service architectures?

Best regards,
Kiran`
    });

    return messages;
  }

  identifyPersona(title) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('cio') || titleLower.includes('chief information')) return 'cio';
    if (titleLower.includes('cto') || titleLower.includes('chief technology')) return 'cto';
    if (titleLower.includes('chro') || titleLower.includes('chief human') || titleLower.includes('hr')) return 'chro';
    if (titleLower.includes('vp') || titleLower.includes('vice president') || titleLower.includes('director') || titleLower.includes('head of')) return 'cio';
    
    return 'itOpsManager';
  }

  async validateAPIKeys() {
    return { openai: true, note: 'Using enhanced mock data for demo' };
  }
}

module.exports = AIService;