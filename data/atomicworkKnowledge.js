// backend/data/atomicworkKnowledge.js
const enhancedAtomicworkSummary = `
Atomicwork is an AI-native employee service management platform purpose-built to unify IT, HR, finance, and business operations into a single system of engagement. Designed for modern enterprises, Atomicwork replaces fragmented ticketing tools with a conversational-first experience powered by Universal AI.

**CORE MISSION & POSITIONING:**

Our singular mission as a company is to make work easy for service teams, power IT teams to operate smarter with AI, and enable faster business through agentic service management. Unlike competitors with multiple product focus areas, we wake up every day thinking exclusively about ITSM and ESM problems.

**GENERATIONAL POSITIONING FRAMEWORK:**

• **ServiceNow Era (2000s):** Purpose-built for IT admins in the old era where everything must be customized
• **Jira/Fresh Era (2010s):** Purpose-built for IT agents in the SaaS era with very little customization support  
• **Atomicwork Era (2020s):** Purpose-built for end-users in the AI era, not just IT agents and admins

**TRADITIONAL vs MODERN ITSM DIFFERENTIATION:**

**Digital AI vs Analog AI:**
- Building Digital AI (multi-modal with voice, vision, and chat) not just Analog AI (chat assistants or co-pilots)
- End-users get fast help and service teams have full context when requests come in

**Flow of Work Integration:**
- Operate in the flow of work like a browser for faster support with full context understanding
- Not just a portal for people to visit or an app in Slack/Teams

**Built-in Intelligence:**
- Bring built-in knowledge for IT teams using Okta/AD context of software used
- Eliminate traditional knowledge management overhead for everything

**Self-Service First Philosophy:**
- Focused on delivering faster self-service first to people
- Don't force everything to become a ticket in the portal

**Context Management Data Lake:**
- Building comprehensive context management (Users, Assets, Config, Vulnerabilities, Access)
- Beyond traditional configuration management (CMDB)

**KEY DIFFERENTIATORS:**

• **Universal AI Agent:** Single front door across Slack, Teams, and web for employees to get help
• **Agentic Service Management:** AI does the heavy lifting in toiling work, interrupting work, reducing escalations
• **Built-in Knowledge + Workflows:** Integrated knowledge bases, approvals, forms, and task automation
• **Rapid Deployment:** Go-live in <30 days without complex configurations
• **Unified Service Hub:** Consolidate multiple service desks across IT, HR, and operations
• **Context-Aware Intelligence:** Full understanding of user context and organizational structure

**OUR LONG-TERM VISION:**
Deliver a service workforce to you, not just service workflows. Atomicwork should do more work for your end users, service teams, and IT - we don't want to just give software where you need to do a lot of work.
`;

const competitiveMessaging = {
  serviceNow: {
    context: "Great for Fortune 500-1000 companies with large IT teams, substantial budgets, and multiple delivery partners to manage complexity",
    positioning: "Atomicwork is built for Modern Enterprises who want to move fast with lean IT teams handling significant workloads",
    differentiator: "Simplicity and speed vs. complexity management"
  },
  
  atlassian: {
    context: "Multiple products and focus areas where ITSM/ESM is not their core company focus",
    positioning: "We wake up every day thinking exclusively about ITSM and ESM problems",
    differentiator: "Singular mission focus vs. diversified product portfolio"
  },
  
  freshworks: {
    context: "SaaS era solution built for IT agents with limited customization",
    positioning: "AI era solution built for end-users with intelligent automation",
    differentiator: "Digital AI with context understanding vs. traditional ticketing"
  }
};

const talkTrackFramework = {
  opening: {
    generationalPositioning: "We're in the third generation of service management - ServiceNow for the admin era, Jira/Fresh for the agent era, and Atomicwork for the AI era focused on end-users",
    missionStatement: "Our singular mission is making work easy for service teams and enabling faster business through agentic service management"
  },
  
  differentiation: {
    digitalVsAnalogAI: "We're building Digital AI - multi-modal with voice, vision, and chat - not just Analog AI chat assistants",
    flowOfWork: "We operate in the flow of work like a browser with full context understanding, not just a portal to visit",
    builtInKnowledge: "Built-in knowledge using your Okta/AD context eliminates traditional knowledge management overhead",
    selfServiceFirst: "Focused on faster self-service first, not forcing everything to become a ticket",
    contextManagement: "Building context management data lake beyond traditional CMDB"
  },
  
  vision: {
    serviceWorkforce: "Long-term goal is delivering a service workforce to you, not just service workflows",
    aiDoesWork: "Atomicwork should do more work for your teams - we don't want to give you software where you do all the work"
  }
};

const personaSpecificMessaging = {
  cio: {
    painPoints: ["Pressure for digital transformation with lean teams", "Need for speed vs. complexity", "Budget efficiency requirements"],
    valueProps: ["Move fast with lean IT teams", "Reduce operational complexity", "Faster ROI than traditional ITSM"],
    messaging: "Built for modern enterprises prioritizing speed and efficiency over complexity management"
  },
  
  itOpsManager: {
    painPoints: ["Overwhelming ticket volumes", "Manual toiling work", "Limited team resources"],
    valueProps: ["AI handles heavy lifting", "Reduced escalations", "Focus on strategic work"],
    messaging: "Let AI do the toiling work so your team can operate smarter and focus on what matters"
  },
  
  cto: {
    painPoints: ["Integration complexity", "Context management challenges", "Scalability concerns"],
    valueProps: ["Digital AI with full context", "Context management data lake", "API-first architecture"],
    messaging: "Digital AI with context understanding vs. analog chat assistants that lack situational awareness"
  },
  
  chro: {
    painPoints: ["Employee experience gaps", "Manual HR processes", "Service delivery silos"],
    valueProps: ["Employee-centric design", "Self-service efficiency", "Unified service experience"],
    messaging: "Deliver service workforce focused on employee experience, not just workflows"
  }
};

module.exports = {
  enhancedAtomicworkSummary,
  competitiveMessaging,
  talkTrackFramework,
  personaSpecificMessaging,
  // Export the main knowledge base for backward compatibility
  enrichedAtomicworkSummary: enhancedAtomicworkSummary
};