// src/components/MissionVisionQuiz.tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

interface QuizData {
  mission_text: string
  vision_text: string
  mission_pool: string[]
  vision_pool: string[]
}

interface MissionVisionQuizProps {
  subjectCode: string
  onExit: () => void
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export default function MissionVisionQuiz({ subjectCode, onExit, isDarkMode, toggleDarkMode }: MissionVisionQuizProps) {
  const [quizData, setQuizData] = useState<QuizData | null>(null)
  const [missionBlanks, setMissionBlanks] = useState<string[]>([])
  const [visionBlanks, setVisionBlanks] = useState<string[]>([])
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({}) 
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null) // ✅ Added error state

  // 1. Fetch Data with Offline Fallback
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      
      try {
        // Try fetching from Supabase first
        const { data, error } = await supabase
          .from('subjects')
          .select('json_data')
          .eq('code', subjectCode)
          .single()

        if (!error && data?.json_data) {
          const dataObj = data.json_data as QuizData
          
          // ✅ CACHE THIS DATA FOR OFFLINE USE
          localStorage.setItem(`cached_subject_${subjectCode}`, JSON.stringify(dataObj))
          
          processQuizData(dataObj)
        } else {
          throw new Error("Fetch failed")
        }
      } catch (err) {
        console.warn("Online fetch failed, trying offline cache...", err)
        
        // ✅ OFFLINE FALLBACK: Load from localStorage
        const cachedData = localStorage.getItem(`cached_subject_${subjectCode}`)
        
        if (cachedData) {
          try {
            const dataObj = JSON.parse(cachedData) as QuizData
            processQuizData(dataObj)
          } catch (parseErr) {
            console.error("Failed to parse cached MV data:", parseErr)
            setError("Corrupted cache data.")
          }
        } else {
          setError("No internet & no cached data. Please connect to load this quiz first.")
        }
      } finally {
        setLoading(false)
      }
    }

    // Helper to process data after fetching or loading from cache
    const processQuizData = (dataObj: QuizData) => {
      const mShuffled = [...(dataObj.mission_pool || [])].sort(() => Math.random() - 0.5)
      setMissionBlanks(mShuffled.slice(0, 8))
      
      const vShuffled = [...(dataObj.vision_pool || [])].sort(() => Math.random() - 0.5)
      setVisionBlanks(vShuffled.slice(0, 7))
      
      setQuizData(dataObj)
    }

    fetchData()
  }, [subjectCode])

  // 2. Handle Input Changes
  const handleInputChange = (uniqueId: string, value: string) => {
    setUserAnswers(prev => ({ ...prev, [uniqueId]: value }))
  }

  // 3. Submit & Calculate Score
  const handleSubmit = () => {
    let correctCount = 0
    
    const checkSection = (text: string, blanks: string[], type: string) => {
      const words = text.split(/(\s+)/)
      words.forEach((segment, idx) => {
        if (/^\s+$/.test(segment)) return
        
        const cleanSegment = segment.toLowerCase().replace(/[.,]/g, '').trim()
        const isBlank = blanks.some(b => b.toLowerCase() === cleanSegment)
        
        if (isBlank) {
          const uniqueId = `${type}-${idx}`
          const userVal = (userAnswers[uniqueId] || '').toLowerCase().trim()
          if (userVal === cleanSegment) {
            correctCount++
          }
        }
      })
    }

    if (quizData) {
      checkSection(quizData.mission_text, missionBlanks, 'mission')
      checkSection(quizData.vision_text, visionBlanks, 'vision')
    }

    setScore(correctCount)
    setSubmitted(true)
    
    // ✅ SAVE SCORE TO LOCALSTORAGE
    const scoreData = {
      score: correctCount,
      total: 15,
      date: new Date().toISOString()
    }
    
    const existingScores = JSON.parse(localStorage.getItem('quiz_scores') || '{}')
    existingScores['UEP_MV'] = scoreData
    localStorage.setItem('quiz_scores', JSON.stringify(existingScores))
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 4. Render Text with Inline Inputs
  const renderTextWithBlanks = (text: string, activeBlanks: string[], type: 'mission' | 'vision') => {
    if (!quizData) return null
    
    const words = text.split(/(\s+)/) 
    
    return words.map((segment, idx) => {
      if (/^\s+$/.test(segment)) return <span key={`${type}-${idx}`}>{segment}</span>
      
      const cleanSegment = segment.toLowerCase().replace(/[.,]/g, '').trim()
      const isBlank = activeBlanks.some(b => b.toLowerCase() === cleanSegment)
      const uniqueId = `${type}-${idx}`
      
      if (isBlank && !submitted) {
        return (
          <input
            key={uniqueId}
            type="text"
            autoComplete="off" 
            spellCheck="false"
            value={userAnswers[uniqueId] || ''}
            onChange={(e) => handleInputChange(uniqueId, e.target.value)}
            placeholder="_____"
            className="retro-blank-input bg-black/80 border-b-2 border-neonCyan text-neonCyan font-mono text-base sm:text-lg px-1 py-0.5 min-w-[50px] max-w-[120px] focus:outline-none focus:border-glowYellow transition-colors text-center mx-0.5 sm:mx-1 rounded-none inline-block"
          />
        )
      } else if (isBlank && submitted) {
        const userVal = (userAnswers[uniqueId] || '').toLowerCase().trim()
        const isCorrect = userVal === cleanSegment
        
        return (
          <span 
            key={uniqueId} 
            className={`font-bold ${isCorrect ? 'text-terminalGreen' : 'text-red-400'} mx-0.5 sm:mx-1`}
          >
            {segment}
          </span>
        )
      } else {
        return <span key={`${type}-${idx}`}>{segment}</span>
      }
    })
  }

  // ✅ LOADING STATE
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-midnight text-neonCyan font-pixel">
      LOADING MISSION...
    </div>
  )

  // ✅ ERROR STATE (Prevents infinite loading)
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-midnight text-red-400 font-pixel p-8 text-center">
      <div>
        <p className="text-xl mb-6 animate-pulse">️ {error}</p>
        <button 
          onClick={onExit}
          className="font-pixel text-sm px-6 py-3 bg-neonCyan text-indigo border-2 border-indigo shadow-hard-sm hover:bg-white uppercase"
        >
          BACK TO DASHBOARD
        </button>
      </div>
    </div>
  )

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-midnight text-lavender' : 'bg-white text-black'} font-mono`}>
      
      {/* CSS TO KILL AUTOFILL HIGHLIGHT */}
      <style>{`
        .retro-blank-input:-webkit-autofill,
        .retro-blank-input:-webkit-autofill:hover, 
        .retro-blank-input:-webkit-autofill:focus, 
        .retro-blank-input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 1000px #000 inset !important;
            -webkit-text-fill-color: #00F5D4 !important;
            caret-color: #00F5D4;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* FIXED TOP NAVIGATION BAR */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-royal/95 backdrop-blur-md border-b-2 border-indigo shadow-hard px-4 sm:px-6 py-2 sm:py-3 flex justify-between items-center gap-2 h-[52px] sm:h-auto">
        <button onClick={onExit} className="font-pixel text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 border border-lavender hover:bg-violet hover:text-white shadow-hard-sm whitespace-nowrap">
          ← BACK
        </button>
        
        <div className="hidden sm:block font-pixel text-lg text-neonCyan">
          {!submitted ? 'FILL IN THE BLANKS' : 'RESULTS'}
        </div>
        
        <div className="flex gap-2 sm:gap-3">
          <button 
            onClick={toggleDarkMode}
            className="font-pixel text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 border border-lavender hover:bg-violet hover:text-white shadow-hard-sm whitespace-nowrap"
          >
            {isDarkMode ? 'LIGHT' : 'DARK'}
          </button>
          
          {!submitted && (
            <button 
              onClick={handleSubmit}
              className="hidden sm:block font-pixel text-[10px] sm:text-xs px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 text-white border-2 border-indigo shadow-hard-sm hover:bg-red-600 whitespace-nowrap"
            >
              SUBMIT
            </button>
          )}
        </div>
      </div>

      {/* SPACER FOR FIXED HEADER */}
      <div className="h-[52px] sm:h-0"></div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6 sm:space-y-8 pb-24 sm:pb-8">
        
        {!submitted ? (
          <>
            {/* MISSION SECTION */}
            <div className="bg-violet/20 border-2 border-neonCyan p-4 sm:p-8 shadow-[0_0_20px_rgba(0,245,212,0.2)]">
              <h2 className="font-pixel text-lg sm:text-xl text-glowYellow mb-4 sm:mb-6 text-center uppercase tracking-widest">MISSION</h2>
              <p className="text-base sm:text-lg leading-relaxed sm:leading-loose text-center">
                {renderTextWithBlanks(quizData!.mission_text, missionBlanks, 'mission')}
              </p>
            </div>

            {/* VISION SECTION */}
            <div className="bg-violet/20 border-2 border-neonCyan p-4 sm:p-8 shadow-[0_0_20px_rgba(0,245,212,0.2)]">
              <h2 className="font-pixel text-lg sm:text-xl text-glowYellow mb-4 sm:mb-6 text-center uppercase tracking-widest">VISION</h2>
              <p className="text-base sm:text-lg leading-relaxed sm:leading-loose text-center">
                {renderTextWithBlanks(quizData!.vision_text, visionBlanks, 'vision')}
              </p>
            </div>
          </>
        ) : (
          /* RESULTS SCREEN */
          <div className="text-center space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="p-6 sm:p-8 border-2 border-glowYellow bg-royal/50 inline-block w-full sm:w-auto">
              <h2 className="font-pixel text-2xl sm:text-3xl text-glowYellow mb-2 sm:mb-4">MISSION ACCOMPLISHED!</h2>
              <p className="font-mono text-xl sm:text-2xl">
                Score: <span className="text-neonCyan font-bold">{score} / 15</span>
              </p>
            </div>

            <div className="text-left space-y-6 sm:space-y-8">
              <h3 className="font-pixel text-lg sm:text-xl text-neonCyan text-center border-b-2 border-indigo pb-4">FULL TEXT REVEAL</h3>
              
              <div className="bg-midnight/80 border-2 border-indigo p-4 sm:p-8">
                <h4 className="font-pixel text-base sm:text-lg text-glowYellow mb-4 text-center uppercase">Mission</h4>
                <p className="text-base sm:text-lg leading-relaxed sm:leading-loose text-center">
                  {renderTextWithBlanks(quizData!.mission_text, missionBlanks, 'mission')}
                </p>
              </div>

              <div className="bg-midnight/80 border-2 border-indigo p-4 sm:p-8">
                <h4 className="font-pixel text-base sm:text-lg text-glowYellow mb-4 text-center uppercase">Vision</h4>
                <p className="text-base sm:text-lg leading-relaxed sm:leading-loose text-center">
                  {renderTextWithBlanks(quizData!.vision_text, visionBlanks, 'vision')}
                </p>
              </div>
            </div>

            <button 
              onClick={onExit}
              className="font-pixel text-sm px-8 py-3 bg-neonCyan text-indigo border-2 border-indigo shadow-hard-sm hover:bg-white uppercase w-full sm:w-auto"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* FIXED BOTTOM SUBMIT BUTTON - MOBILE ONLY */}
      {!submitted && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-royal/95 backdrop-blur-md border-t-2 border-indigo shadow-hard p-4">
          <button 
            onClick={handleSubmit}
            className="w-full font-pixel text-xs py-3 bg-red-500 text-white border-2 border-indigo shadow-hard-sm hover:bg-red-600 uppercase"
          >
            SUBMIT ({Object.keys(userAnswers).length}/15)
          </button>
        </div>
      )}
    </div>
  )
}
