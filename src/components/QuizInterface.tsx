import { useState } from 'react'
import { RetroWindow } from './Layout/RetroWindow'
import { RetroButton } from './UI/RetroButton'
import type { Subject, Question } from '../hooks/useSubjects'

interface QuizInterfaceProps {
  subject: Subject
  onExit: () => void
  isDarkMode: boolean
  toggleDarkMode: () => void
}

export function QuizInterface({ subject, onExit, isDarkMode, toggleDarkMode }: QuizInterfaceProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const questions: Question[] = Array.isArray(subject.json_data) ? subject.json_data : []
  const totalQuestions = questions.length

  const handleSelectAnswer = (qIndex: number, optionIndex: number) => {
    if (isSubmitted) return
    setSelectedAnswers(prev => ({ ...prev, [qIndex]: optionIndex }))
    setErrorMsg(null)
  }

  const handleSubmit = (forced = false) => {
    const answeredCount = Object.keys(selectedAnswers).length
    if (!forced && answeredCount < totalQuestions) {
      setErrorMsg(`SYSTEM ERROR: You have ${totalQuestions - answeredCount} unanswered question(s). Please complete the quiz.`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    
    let correctCount = 0
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.answer) correctCount++
    })
    
    setScore(correctCount)
    setIsSubmitted(true)
    
    // SAVE SCORE TO LOCAL STORAGE
    const savedScores = JSON.parse(localStorage.getItem('quiz_scores') || '{}')
    savedScores[subject.code] = { 
      score: correctCount, 
      total: totalQuestions, 
      date: new Date().toISOString() 
    }
    localStorage.setItem('quiz_scores', JSON.stringify(savedScores))
    
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0

  return (
    <div className="min-h-screen bg-midnight text-lavender font-mono relative pb-24 pt-[72px] transition-colors duration-500">
      
      {/* FIXED HEADER WITH SUBJECT CODE */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-royal/95 backdrop-blur-md border-b-2 border-indigo shadow-hard px-3 sm:px-4 h-[72px] flex justify-between items-center gap-2 sm:gap-4">
        
        {/* Left Side: Back Button + Subject Code */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <button 
            onClick={onExit}
            className="font-pixel text-[9px] sm:text-[10px] px-2 sm:px-3 py-1.5 border border-lavender hover:bg-violet hover:text-white transition-all shadow-hard-sm active:translate-y-[2px] active:shadow-none whitespace-nowrap shrink-0"
          >
            &lt; BACK
          </button>
          
          <div className="font-pixel text-xs sm:text-sm text-neonCyan truncate">
            {subject.code}.exe
          </div>
        </div>

        {/* Right Side: Theme Toggle + Submit (Desktop) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button 
            onClick={toggleDarkMode}
            className="font-pixel text-[9px] sm:text-[10px] px-2 sm:px-3 py-1.5 border border-lavender hover:bg-violet hover:text-white transition-all shadow-hard-sm active:translate-y-[2px] active:shadow-none whitespace-nowrap"
          >
            {isDarkMode ? 'LIGHT' : 'DARK'}
          </button>

          {!isSubmitted && (
            <RetroButton onClick={() => handleSubmit(false)} variant="danger" size="sm" className="hidden sm:block">
              SUBMIT
            </RetroButton>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 max-w-3xl relative z-10 space-y-6">
        
        {/* Error Message Display */}
        {errorMsg && (
          <div className="bg-red-500/20 border-2 border-red-500 p-4 shadow-hard-sm animate-pulse">
            <p className="font-pixel text-xs text-red-400 text-center">{errorMsg}</p>
          </div>
        )}

        {/* RESULTS SUMMARY */}
        {isSubmitted && (
          <RetroWindow title="QUIZ_RESULTS.exe">
            <div className="text-center py-6 space-y-4">
              <h2 className="font-pixel text-lg text-glowYellow uppercase">
                SCORE: {percentage}%
              </h2>
              <p className="font-mono text-xl text-lavender">
                You got <span className="text-neonCyan font-bold">{score}</span> out of <span className="font-bold">{totalQuestions}</span> correct
              </p>
              
              <div className="flex justify-center gap-4 text-sm font-mono mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-neonCyan rounded-full"></div>
                  <span>Correct</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Incorrect</span>
                </div>
              </div>

              <RetroButton onClick={onExit} variant="primary" className="mt-6">
                RETURN TO DASHBOARD
              </RetroButton>
            </div>
          </RetroWindow>
        )}

        {/* ALL QUESTIONS LIST */}
        <div className="space-y-6">
          {questions.map((q, qIdx) => {
            const userAnswer = selectedAnswers[qIdx]
            const isCorrect = userAnswer === q.answer
            const isSkipped = userAnswer === undefined

            return (
              <RetroWindow 
                key={qIdx} 
                title={`QUESTION ${qIdx + 1}`}
                className={`${isSubmitted && !isSkipped ? (isCorrect ? 'border-neonCyan' : 'border-red-500') : ''}`}
              >
                <div className="space-y-4">
                  <p className="font-mono text-sm sm:text-base text-lavender leading-relaxed">
                    <span className="text-neonCyan font-bold mr-2">{qIdx + 1}.</span>
                    {q.q}
                  </p>

                  <div className="grid grid-cols-1 gap-3">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = userAnswer === optIdx
                      
                      let containerClass = "bg-violet/20 border-indigo text-lavender hover:bg-violet/40"
                      let indicatorClass = "border-lavender/50 text-lavender/50"
                      
                      if (isSubmitted) {
                        if (optIdx === q.answer) {
                          containerClass = "bg-neonCyan/20 border-neonCyan text-neonCyan"
                          indicatorClass = "bg-neonCyan border-neonCyan text-indigo"
                        } else if (isSelected && optIdx !== q.answer) {
                          containerClass = "bg-red-500/20 border-red-500 text-red-400"
                          indicatorClass = "bg-red-500 border-red-500 text-white"
                        } else {
                          containerClass = "bg-indigo/30 border-indigo/50 text-lavender/40 opacity-60"
                        }
                      } else {
                        if (isSelected) {
                          containerClass = "bg-neonCyan/20 border-neonCyan text-neonCyan"
                          indicatorClass = "bg-neonCyan border-neonCyan text-indigo"
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleSelectAnswer(qIdx, optIdx)}
                          disabled={isSubmitted}
                          className={`group relative flex items-start gap-3 p-3 text-left border-2 transition-all shadow-hard-sm 
                            ${isSubmitted ? 'cursor-default' : 'active:translate-y-[2px] active:shadow-none'}
                            ${containerClass}`}
                        >
                          <div className={`w-6 h-6 flex items-center justify-center border-2 font-pixel text-[10px] shrink-0 mt-0.5
                            ${indicatorClass}`}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          
                          <span className="font-mono text-sm pt-0.5">{opt}</span>
                          
                          {isSubmitted && optIdx === q.answer && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neonCyan font-bold">✓</div>
                          )}
                          {isSubmitted && isSelected && optIdx !== q.answer && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 font-bold"></div>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {isSubmitted && (
                    <div className={`mt-4 p-3 border-l-4 text-xs font-mono leading-relaxed
                      ${isCorrect 
                        ? 'bg-neonCyan/10 border-neonCyan text-neonCyan/90' 
                        : 'bg-red-500/10 border-red-500 text-red-300'}`}>
                      <span className="font-bold uppercase mr-2">
                        {isCorrect ? 'Correct!' : 'Explanation:'}
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </div>
              </RetroWindow>
            )
          })}
        </div>

        {/* Bottom Submit Button (Mobile Only) */}
        {!isSubmitted && (
          <div className="fixed bottom-0 left-0 right-0 bg-royal/95 backdrop-blur-md border-t-2 border-indigo p-4 z-40 flex justify-center sm:hidden">
            <RetroButton onClick={() => handleSubmit(false)} variant="danger" size="md" className="w-full">
              SUBMIT ({Object.keys(selectedAnswers).length}/{totalQuestions})
            </RetroButton>
          </div>
        )}

      </main>
    </div>
  )
}