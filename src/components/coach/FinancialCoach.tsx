import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, X, Trash2, Send, Loader2 } from 'lucide-react'
import { useFund } from '../../context/FundContext'

const API_BASE = 'http://127.0.0.1:8001/api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export function FinancialCoach() {
  const { state } = useFund()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fundId = state?.fundId
  const actualFundId = fundId || 'global'
  const userEmail = localStorage.getItem('user_email') || 'zara@example.com' // Fallback for demo seed

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadSession()
    }
  }, [isOpen])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadSession = async () => {
    try {
      const res = await fetch(`${API_BASE}/coach/session/${actualFundId}?email=${encodeURIComponent(userEmail)}`)
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages || [])
      }
    } catch (e) {
      console.error('Coach load error', e)
    }
  }

  const clearSession = async () => {
    try {
      await fetch(`${API_BASE}/coach/session/${actualFundId}?email=${encodeURIComponent(userEmail)}`, { method: 'DELETE' })
      setMessages([])
      setError('')
    } catch (e) {
      console.error('Clear error', e)
    }
  }

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return

    const userMsg = text.trim()
    setInput('')
    setError('')
    
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setIsTyping(true)
    
    try {
      const response = await fetch(`${API_BASE}/coach/message?email=${encodeURIComponent(userEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: actualFundId, message: userMsg })
      })
      
      if (!response.ok) throw new Error('Failed to send')
      if (!response.body) throw new Error('No body stream')
        
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      let assistantMsg = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])
      setIsTyping(false)
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        assistantMsg += chunk
        
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1].content = assistantMsg
          return newMessages
        })
      }
    } catch (err: any) {
      console.error(err)
      setIsTyping(false)
      setError('Coach is taking a break. Try again shortly.')
      // remove the temp assistant message if it was added
      setMessages(prev => {
        if (prev.length > 0 && prev[prev.length-1].role === 'assistant' && prev[prev.length-1].content === '') {
          return prev.slice(0, -1)
        }
        return prev
      })
    }
  }

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary hover:bg-primary/90 text-on-primary rounded-full shadow-lg shadow-primary/20 flex items-center justify-center group"
      >
        <span className="absolute inset-0 rounded-full animate-ping bg-primary opacity-20 pointer-events-none"></span>
        <Sparkles size={24} className="group-hover:animate-pulse" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[60] w-[380px] h-[600px] max-h-[85vh] bg-surface-container-high border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-surface flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-headline font-bold text-on-surface text-sm">ChitMind Coach</h3>
                  <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-black opacity-60">Your personal fund advisor</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={clearSession} className="p-2 hover:bg-error/10 hover:text-error rounded-full text-on-surface-variant transition-colors" title="Clear Chat">
                  <Trash2 size={16} />
                </button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-on-surface-variant transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.length === 0 && !isTyping ? (
                <div className="flex-1 flex flex-col justify-end mt-auto">
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      "Should I bid this auction? 💰",
                      "Why is my trust score what it is? 📊",
                      "Am I saving on track? 🎯",
                      "What happens if I miss a payment? ⚠️"
                    ].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => handleSend(chip)}
                        className="text-left px-4 py-3 bg-white/5 hover:bg-primary/10 hover:text-primary border border-white/5 rounded-2xl text-xs font-medium text-on-surface-variant transition-all hover:-translate-y-0.5"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-2 flex-shrink-0 mt-1">
                          <Sparkles size={12} />
                        </div>
                      )}
                      <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary text-on-primary rounded-tr-sm' 
                          : 'bg-white/5 border border-white/5 text-on-surface rounded-tl-sm'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex max-w-[85%] self-start">
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-2 flex-shrink-0 mt-1">
                        <Sparkles size={12} />
                      </div>
                      <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5 rounded-tl-sm flex gap-1">
                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="self-center my-2 text-xs text-error opacity-80">
                      {error}
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-surface border-t border-white/5 relative">
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isTyping}
                  placeholder="Ask me anything about your fund..."
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-4 pr-12 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:bg-white/10 transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 p-2 bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:hover:bg-primary"
                >
                  {isTyping ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
