const API_BASE = 'http://localhost:8001/api'

export type SynthesizePayload = {
  intent: string
  groupSize: number
  durationMonths: number
}

export type BlueprintResponse = {
  fundName: string
  summary: string
  poolTotal: string
  monthlyInstallment: string
  riskLevel: string
  dividendEstimate: string
  confidence: string
}

export const ApiService = {
  async synthesize(payload: SynthesizePayload): Promise<BlueprintResponse> {
    const response = await fetch(`${API_BASE}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Synthesis failed with status ${response.status}`)
    }

    return response.json()
  },

  async getFundState() {
    const response = await fetch(`${API_BASE}/fund/state`)
    return response.json()
  },

  async placeBid(amount: number, bidder: string) {
    const response = await fetch(`${API_BASE}/auction/bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, bidder })
    })
    return response.json()
  }
}
