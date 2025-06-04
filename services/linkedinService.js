// backend/services/linkedinService.js
const axios = require('axios');

class LinkedInService {
  constructor() {
    this.proxycurlKey = process.env.PROXYCURL_API_KEY;
    this.baseURL = 'https://nubela.co/proxycurl/api';
    
    if (!this.proxycurlKey) {
      console.warn('⚠️ PROXYCURL_API_KEY not found - LinkedIn features will be limited');
    }
  }

  async getPersonDetails(linkedinUrl) {
    try {
      console.log(`🔍 Fetching profile: ${linkedinUrl}`);
      
      if (!this.proxycurlKey) {
        return this.getMockProfileData(linkedinUrl);
      }
      
      const response = await axios.get(`${this.baseURL}/v2/linkedin`, {
        params: { url: linkedinUrl },
        headers: {
          'Authorization': `Bearer ${this.proxycurlKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log(`✅ Profile fetched successfully for: ${response.data.full_name}`);
      return response.data;

    } catch (error) {
      console.error('❌ LinkedIn profile fetch failed:', error.message);
      if (error.response) {
        throw new Error(`LinkedIn API Error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('LinkedIn API timeout - please try again');
      } else {
        throw new Error(`LinkedIn fetch error: ${error.message}`);
      }
    }
  }

  async getCompanyDetails(companyLinkedinUrl) {
    try {
      if (!companyLinkedinUrl) {
        console.log('⚠️ No company LinkedIn URL provided');
        return {};
      }

      if (!this.proxycurlKey) {
        return this.getMockCompanyData();
      }

      console.log(`🏢 Fetching company: ${companyLinkedinUrl}`);
      
      const response = await axios.get(`${this.baseURL}/linkedin/company`, {
        params: { url: companyLinkedinUrl },
        headers: { 'Authorization': `Bearer ${this.proxycurlKey}` },
        timeout: 30000
      });

      console.log(`✅ Company fetched: ${response.data.name}`);
      return response.data;

    } catch (error) {
      console.error('❌ Company fetch failed:', error.message);
      return {};
    }
  }

  validateLinkedInURL(url) {
    const linkedinRegex = /^https:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/;
    return linkedinRegex.test(url);
  }

  formatProfileData(rawProfile) {
    try {
      return {
        name: rawProfile.full_name || 'Unknown',
        title: rawProfile.occupation || rawProfile.headline || 'Unknown Title',
        company: rawProfile.experiences?.[0]?.company || 'Unknown Company',
        location: this.formatLocation(rawProfile),
        summary: rawProfile.summary || '',
        expertise: this.extractSkills(rawProfile),
        certifications: this.extractCertifications(rawProfile),
        experience: this.formatExperience(rawProfile.experiences || []),
        education: this.formatEducation(rawProfile.education || []),
        connections: rawProfile.connections || 0,
        followerCount: rawProfile.follower_count || 0
      };
    } catch (error) {
      console.error('Error formatting profile data:', error);
      throw new Error('Failed to format profile data');
    }
  }

  formatLocation(profile) {
    const city = profile.city || '';
    const country = profile.country || '';
    return [city, country].filter(Boolean).join(', ') || 'Unknown Location';
  }

  extractSkills(profile) {
    try {
      const skills = profile.skills || [];
      return skills.slice(0, 8).map(skill =>
        typeof skill === 'string' ? skill : skill.name || skill
      ).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  extractCertifications(profile) {
    try {
      const certifications = profile.certifications || [];
      return certifications.slice(0, 6).map(cert =>
        typeof cert === 'string' ? cert : cert.name || cert.title || cert
      ).filter(Boolean);
    } catch (error) {
      return [];
    }
  }

  formatExperience(experiences) {
    try {
      return experiences.slice(0, 5).map(exp => ({
        title: exp.title || 'Unknown Title',
        company: exp.company || 'Unknown Company',
        duration: this.formatDuration(exp.starts_at, exp.ends_at),
        description: exp.description || `${exp.title} at ${exp.company}`,
        location: exp.location || ''
      }));
    } catch (error) {
      return [];
    }
  }

  formatEducation(education) {
    try {
      return education.slice(0, 3).map(edu => ({
        school: edu.school || 'Unknown School',
        degree: edu.degree_name || 'Unknown Degree',
        field: edu.field_of_study || '',
        duration: this.formatDuration(edu.starts_at, edu.ends_at)
      }));
    } catch (error) {
      return [];
    }
  }

  formatDuration(startDate, endDate) {
    try {
      const start = startDate?.year || '';
      const end = endDate?.year || 'Present';
      return start && end ? `${start} - ${end}` : 'Unknown Duration';
    } catch (error) {
      return 'Unknown Duration';
    }
  }

  getMockProfileData(linkedinUrl) {
    return {
      full_name: "Sarah Chen",
      headline: "VP of IT Operations at TechCorp Solutions",
      occupation: "VP of IT Operations",
      summary: "Technology leader with 12+ years driving digital transformation initiatives across enterprise environments.",
      city: "San Francisco",
      country: "United States",
      connections: 850,
      follower_count: 1200,
      experiences: [
        {
          title: "VP of IT Operations",
          company: "TechCorp Solutions",
          starts_at: { year: 2021 },
          ends_at: null,
          description: "Leading IT operations for 5,000+ employee organization"
        }
      ],
      skills: [
        { name: "Digital Transformation" },
        { name: "Cloud Migration" },
        { name: "ITSM" },
        { name: "Team Leadership" }
      ],
      certifications: [
        { name: "AWS Solutions Architect" },
        { name: "ITIL v4" }
      ]
    };
  }

  getMockCompanyData() {
    return {
      name: "TechCorp Solutions",
      company_size: 5000,
      industry: "Information Technology and Services",
      description: "Leading enterprise technology solutions provider"
    };
  }
}

module.exports = LinkedInService;
