import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Persistent Ledger Service
export const LedgerService = {
  async saveTransaction(data: any) {
    const { error } = await supabase
      .from('ledger')
      .insert([data])
    
    if (error) {
      console.error('Ledger Error:', error)
      // Fallback to local storage or state
    }
  },

  async syncFundState(fundId: string, state: any) {
    const { error } = await supabase
      .from('funds')
      .update({ state })
      .eq('id', fundId)
    
    if (error) console.error('Sync Error:', error)
  }
}
