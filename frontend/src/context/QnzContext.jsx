import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const QnzContext = createContext()

export function QnzProvider({ children }) {
  const [selectedQnz, setSelectedQnz] = useState(null)
  const [availableQnz, setAvailableQnz] = useState([])

  useEffect(() => {
    const saved = localStorage.getItem('selectedQnz')
    api.get('/api/available-qnz').then(res => {
      const qnzList = res.data
      setAvailableQnz(qnzList)
      
      // Default to 0 (All Quinzaines / Cumulative) if none saved
      const defaultQnz = saved !== null ? Number(saved) : 0
      
      setSelectedQnz(defaultQnz)
      localStorage.setItem('selectedQnz', defaultQnz)
    }).catch(() => {
      const fallback = saved ? Number(saved) : 22
      setAvailableQnz([fallback])
      setSelectedQnz(fallback)
    })
  }, [])

  const changeQnz = (q) => {
    setSelectedQnz(q)
    localStorage.setItem('selectedQnz', q)
  }

  return (
    <QnzContext.Provider value={{ selectedQnz, setSelectedQnz: changeQnz, availableQnz }}>
      {children}
    </QnzContext.Provider>
  )
}

export function useQnz() {
  return useContext(QnzContext)
}