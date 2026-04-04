import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

type AuditResponse = {
  mutation: string
  rationale: string
  impact: string
  summary?: string
}

export class GeminiService {
  private static ai =
    API_KEY && API_KEY !== 'YOUR_GEMINI_API_KEY_HERE'
      ? new GoogleGenerativeAI(API_KEY)
      : null;

  private static MOCK_BLUEPRINT = {
    poolTotal: "Rs 24,00,000",
    monthlyInstallment: "Rs 20,000",
    riskLevel: "Low",
    dividendEstimate: "Rs 1,450",
    confidence: "94%"
  };

  private static MOCK_AUDIT: AuditResponse = {
    mutation: "Reminder Escalation Rule",
    rationale: "Contribution and auction activity suggest the fund stays healthier when grace members get earlier nudges and auction closure is tightly enforced.",
    impact: "Better collection discipline",
    summary: "AI sees a stable fund with room to improve reminders and payout discipline.",
  }

  static async synthesizeBlueprint(intent: string) {
    if (!this.ai) {
      console.warn("Gemini API Key missing/placeholder. Using mock blueprint.");
      return this.MOCK_BLUEPRINT;
    }

    const model = this.ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: "You are ArthaNetra AI. Architect chit funds. Return JSON only."
    });

    try {
      const result = await model.generateContent(intent);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.MOCK_BLUEPRINT;
    } catch (error) {
      console.error("Gemini blueprint error:", error);
      return this.MOCK_BLUEPRINT;
    }
  }

  static async auditProtocol(fundState: any): Promise<AuditResponse> {
    if (!this.ai) {
      return this.MOCK_AUDIT;
    }

    const model = this.ai.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction:
        "You are an AI auditor for a chit fund platform. Be concise, practical, and return JSON only.",
    });

    const prompt = `
Audit this live fund state and return JSON with exactly these keys:
mutation, rationale, impact, summary

Focus on:
- collections
- overdue or grace members
- trust health
- auction stability

Keep each field short and simple.

Fund state:
${JSON.stringify(fundState)}
`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : this.MOCK_AUDIT;
    } catch (error) {
      console.error("Gemini audit error:", error);
      return this.MOCK_AUDIT;
    }
  }
}
