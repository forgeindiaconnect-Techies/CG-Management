const { GoogleGenerativeAI } = require('@google/generative-ai');
const Category = require('../models/Category');
const Department = require('../models/Department');

/**
 * Heuristic fallback analysis when the Gemini API is unavailable or fails.
 */
const getHeuristicFallback = (title, description, categories, departments) => {
  const content = `${title} ${description}`.toLowerCase();
  
  // 1. Sentiment Detection
  let sentiment = 'Neutral';
  const negativeWords = ['angry', 'furious', 'terrible', 'worst', 'bad', 'poor', 'slow', 'fail', 'broken', 'not working', 'hate', 'disappointed', 'useless', 'error', 'defect', 'down', 'loss', 'frustrated'];
  const positiveWords = ['good', 'great', 'awesome', 'excellent', 'happy', 'thanks', 'thank you', 'pleased', 'solved', 'resolved', 'appreciate'];
  
  const negCount = negativeWords.filter(w => content.includes(w)).length;
  const posCount = positiveWords.filter(w => content.includes(w)).length;
  
  if (negCount > posCount) {
    sentiment = 'Negative';
  } else if (posCount > negCount) {
    sentiment = 'Positive';
  }
  
  // 2. Priority Detection
  let priority = 'Low';
  const highPriorityWords = ['urgent', 'immediately', 'critical', 'emergency', 'security', 'leak', 'breach', 'harassment', 'abuse', 'losing money', 'legal', 'lawsuit', 'safety', 'danger', 'furious', 'down', 'broken'];
  const mediumPriorityWords = ['slow', 'delay', 'wait', 'issue', 'problem', 'unable', 'cannot', 'help'];
  
  if (highPriorityWords.some(w => content.includes(w))) {
    priority = 'High';
  } else if (mediumPriorityWords.some(w => content.includes(w))) {
    priority = 'Medium';
  }
  
  // 3. Category matching
  let category_id = null;
  if (categories && categories.length > 0) {
    let bestCat = null;
    let maxMatches = 0;
    categories.forEach(c => {
      const keywords = c.name.toLowerCase().split(/[\s/]+/).concat((c.description || '').toLowerCase().split(/[\s/]+/));
      const matches = keywords.filter(kw => kw.length > 2 && content.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCat = c;
      }
    });
    if (bestCat) category_id = bestCat._id.toString();
  }
  
  // 4. Department matching
  let department_id = null;
  if (departments && departments.length > 0) {
    let bestDept = null;
    let maxMatches = 0;
    departments.forEach(d => {
      const keywords = d.name.toLowerCase().split(/[\s/]+/);
      const matches = keywords.filter(kw => kw.length > 2 && content.includes(kw)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestDept = d;
      }
    });
    if (bestDept) department_id = bestDept._id.toString();
  }
  
  // 5. Suggested Resolution
  const suggested_resolution = `[Fallback AI Analysis] 
- Priority: ${priority} (Detected via urgency terms)
- Sentiment: ${sentiment}
- Category Suggestion: ${category_id ? 'Matched to Category' : 'Unmatched'}
- Department Suggestion: ${department_id ? 'Matched to Department' : 'Unmatched'}

Resolution Guide:
Please review the complaint immediately. For technical issues, coordinate with the infrastructure team. For account, billing, or general queries, contact the primary support agent. Detail: "${title}"`;

  // 6. Suggested Reply
  const suggested_reply = `Dear customer,

Thank you for submitting your complaint regarding "${title}". This is to acknowledge that we have received it, and our team is already looking into the matter.

A support representative will contact you soon with updates. Your tracking number is available in your dashboard portal.

Sincerely,
Customer Support Team`;

  return {
    category_id,
    department_id,
    priority,
    sentiment,
    suggested_resolution,
    suggested_reply,
  };
};

/**
 * Analyzes a complaint title and description using Google Gemini.
 * Maps it to the best matching category and department from the DB,
 * determines the priority and sentiment, and drafts a resolution and reply.
 * Fallback to heuristics if API key is invalid/missing or service fails.
 * 
 * @param {string} title 
 * @param {string} description 
 * @returns {Promise<object>}
 */
const analyzeComplaint = async (title, description) => {
  let categories = [];
  let departments = [];
  try {
    categories = await Category.find({}, 'name description');
    departments = await Department.find({}, 'name');
  } catch (dbErr) {
    console.error('Database fetch error during AI analysis:', dbErr);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY is not defined. Using heuristic fallback.');
    return getHeuristicFallback(title, description, categories, departments);
  }

  try {
    const categoriesList = categories.map(c => `- ID: ${c._id}, Name: ${c.name}, Description: ${c.description || ''}`).join('\n');
    const departmentsList = departments.map(d => `- ID: ${d._id}, Name: ${d.name}`).join('\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const systemPrompt = `You are an AI assistant for an Advanced Complaint & Grievance Management System.
Analyze the following complaint title and description:
Title: "${title}"
Description: "${description}"

Available Categories:
${categoriesList || 'None available'}

Available Departments:
${departmentsList || 'None available'}

Classify and analyze. You MUST respond with a valid JSON object ONLY. Do not include any explanation or markdown formatting like \`\`\`json. The response should be pure JSON that can be parsed directly.
The JSON object must have exactly the following keys:
{
  "category_id": "the string ID of the best matching category from the list above, or null if none fit",
  "department_id": "the string ID of the best matching department from the list above, or null if none fit",
  "priority": "Low", "Medium", or "High" (High if the text shows extreme frustration, anger, or mentions urgent issues like security breaches, harassment, safety hazards, or major financial/operational loss),
  "sentiment": "Positive", "Neutral", or "Negative",
  "suggested_resolution": "A detailed paragraph of recommended troubleshooting steps or resolution guidelines for the staff to address this specific issue",
  "suggested_reply": "A polite, professional response draft to the user, acknowledging receipt, summarizing their issue, and assuring them it is being addressed"
}`;

    const result = await model.generateContent(systemPrompt);
    const text = result.response.text();

    let cleanText = text.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
    }
    
    try {
      const parsed = JSON.parse(cleanText);
      // Ensure category_id and department_id mapped correctly
      if (parsed.category_id === 'null' || parsed.category_id === '') parsed.category_id = null;
      if (parsed.department_id === 'null' || parsed.department_id === '') parsed.department_id = null;
      return parsed;
    } catch (parseError) {
      console.error('Failed to parse clean text from Gemini, attempting regex match:', cleanText);
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw parseError;
    }
  } catch (error) {
    console.error('AI Analysis API error, falling back to heuristics:', error.message);
    return getHeuristicFallback(title, description, categories, departments);
  }
};

module.exports = {
  analyzeComplaint,
};
