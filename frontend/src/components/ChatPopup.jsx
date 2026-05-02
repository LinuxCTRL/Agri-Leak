import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { askAI } from '../services/api'

const STORAGE_KEY = 'agri-ai-chat-history'

function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : [
      { role: 'bot', text: 'Hi! I am your Agri AI Assistant. How can I help you today?' }
    ]
  } catch {
    return [{ role: 'bot', text: 'Hi! I am your Agri AI Assistant. How can I help you today?' }]
  }
}

function saveHistory(messages) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)))
  } catch {}
}

// ─── Icons ───────────────────────────────────────────────────────────────
function IconBot() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 8V4H8" />
      <rect x="2" y="8" width="20" height="12" rx="2" />
      <circle cx="7" cy="13" r="1" />
      <circle cx="17" cy="13" r="1" />
      <path d="M7 17h10" />
    </svg>
  )
}

function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function IconFullscreen() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  )
}

function IconMinimize() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 14h6m0 0v6m0-6L3 21m17-7h-6m0 0V4m0 6l7-7" />
    </svg>
  )
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function IconClose() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconChat() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function ChatPopup() {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (messages.length > 1) {
      saveHistory(messages)
    }
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Click outside to close (disabled in fullscreen)
  useEffect(() => {
    if (!isOpen || isFullscreen) return
    const handleClickOutside = (e) => {
      if (!e.target.closest('[data-chat-container]')) {
        setIsOpen(false)
      }
    }
    // Small delay to prevent immediate close on toggle click
    const timer = setTimeout(() => document.addEventListener('click', handleClickOutside), 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen, isFullscreen])

  const handleSend = async (text) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg = { role: 'user', text: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const { data } = await askAI(trimmed)
      setMessages(prev => [...prev, { role: 'bot', text: data.answer || data.error }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Error: ' + (err.response?.data?.error || err.message) }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(input)
    }
  }

  const clearChat = () => {
    const initial = [{ role: 'bot', text: 'Hi! I am your Agri AI Assistant. How can I help you today?' }]
    setMessages(initial)
    saveHistory(initial)
  }

  return (
    <div className="chat-container" data-chat-container>
      {isOpen && (
        <div className={`chat-box ${isFullscreen ? 'chat-box--fullscreen' : ''}`}>
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-title">
              <IconBot />
              <span>Agri AI Assistant</span>
            </div>
            <div className="chat-header-actions">
              <button
                className="chat-header-btn"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Minimize' : 'Fullscreen'}
              >
                {isFullscreen ? <IconMinimize /> : <IconFullscreen />}
              </button>
              <button
                className="chat-header-btn"
                onClick={clearChat}
                title="Clear chat"
              >
                <IconTrash />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chat-message ${msg.role === 'user' ? 'chat-message--user' : 'chat-message--bot'}`}
              >
                {msg.role === 'bot' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-loading">
                Assistant is thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about farms, tonnage, costs..."
              autoFocus
            />
            <button
              className="chat-send-btn"
              onClick={() => handleSend(input)}
              disabled={loading || !input.trim()}
              title="Send message"
            >
              <IconSend />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        className="chat-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? <IconClose /> : <IconChat />}
      </button>
    </div>
  )
}

export default ChatPopup
