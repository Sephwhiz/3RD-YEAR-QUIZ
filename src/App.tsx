import { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { useSubjects } from './hooks/useSubjects'
import { LoginForm } from './components/LoginForm'
import { QuizInterface } from './components/QuizInterface'
import { supabase } from './lib/supabase'
import MissionVisionQuiz from './components/MissionVisionQuiz'

function App() {
  const { user, loading: authLoading, logout } = useAuth()
  const { subjects, loading: subjectsLoading, refetch: refetchSubjects } = useSubjects()
  
  const isAdmin = user?.email === 'mmarkeleazar@gmail.com'

  // State to track active quiz
  const [activeSubject, setActiveSubject] = useState<any>(null) 
  const [isDarkMode, setIsDarkMode] = useState(true)

  // STATE FOR EDIT MODAL
  const [isModalOpen, setIsModalOpen] = useState(false)
  // Use code as fallback identifier since id is undefined
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
  const [editingSubjectCode, setEditingSubjectCode] = useState('')
  const [formData, setFormData] = useState({
    exam_date: '',
    time_slot: '',
    room: ''
  })

  // Initialize Theme on Mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'light') {
      setIsDarkMode(false)
      document.documentElement.classList.remove('dark')
    } else {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !isDarkMode
    setIsDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // OPEN EDIT MODAL - Fixed to handle missing ID
  const handleEditClick = (subject: any) => {
    console.log("🖱️ Edit clicked for:", subject.code, "Full subject:", subject)
    
    // Use subject.id if available, otherwise fall back to subject.code
    const identifier = subject.id || subject.code
    
    console.log("Using identifier:", identifier)
    
    setEditingSubjectId(identifier)
    setEditingSubjectCode(subject.code)
    setFormData({
      exam_date: subject.exam_date || '',
      time_slot: subject.time_slot || '',
      room: subject.room || ''
    })
    setIsModalOpen(true)
  }

  // SAVE CHANGES TO SUBJECTS TABLE - Fixed to match by code if id is missing
  const handleSave = async () => {
    console.log("💾 Save button clicked!")
    console.log("   editingSubjectId:", editingSubjectId)
    console.log("   editingSubjectCode:", editingSubjectCode)
    console.log("   formData:", formData)
    
    if (!editingSubjectId && !editingSubjectCode) {
      console.error("❌ ERROR: No subject selected!")
      alert("Error: No subject selected. Please close and reopen the modal.")
      return
    }

    console.log("🔄 Sending update to Supabase...")

    // Determine which column to match against
    // If editingSubjectId looks like a UUID (>10 chars), use 'id', otherwise use 'code'
    const matchColumn = (editingSubjectId && editingSubjectId.toString().length > 10) ? 'id' : 'code'
    const matchValue = editingSubjectId || editingSubjectCode

    console.log(`Matching by column: ${matchColumn}, value: ${matchValue}`)

    const { data, error } = await supabase
      .from('subjects')
      .update({
        exam_date: formData.exam_date || null,
        time_slot: formData.time_slot || null,
        room: formData.room || null
      })
      .eq(matchColumn, matchValue)
      .select()

    console.log("📡 Supabase Response:")
    console.log("   Data:", data)
    console.log("   Error:", error)

    if (error) {
      alert('Error saving: ' + error.message)
      console.error(" Save failed:", error)
    } else {
      console.log("✅ Save successful!")
      setIsModalOpen(false)
      refetchSubjects()
    }
  }

  // 1. Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-midnight text-lavender font-pixel relative overflow-hidden">
        <div className="sparkle-container">
          {Array.from({ length: 22 }).map((_, i) => (
            <div key={i} className={`sparkle sparkle-${i + 1}`}></div>
          ))}
        </div>
        
        <div className="relative z-10 animate-pulse text-neonCyan mb-6 text-lg">LOADING_SYSTEM...</div>
        <div className="relative z-10 w-64 h-6 border-2 border-indigo p-1 shadow-hard">
          <div 
            className="h-full bg-neonCyan transition-all duration-1000 ease-in-out" 
            style={{ width: '60%' }}
          ></div>
        </div>
      </div>
    )
  }

  // SHARED LAYOUT WRAPPER
  return (
    <div className="min-h-screen bg-midnight text-lavender font-mono relative overflow-hidden transition-colors duration-500">
      
      {/* GLOBAL STARFIELD */}
      <div className="sparkle-container">
        {Array.from({ length: 22 }).map((_, i) => (
          <div key={i} className={`sparkle sparkle-${i + 1}`}></div>
        ))}
      </div>

      {/* CONDITIONAL CONTENT */}
      {!user ? (
        <LoginForm />
      ) : activeSubject ? (
        // CHECK IF IT'S THE MISSION/VISION SUBJECT
        activeSubject.code === 'UEP_MV' ? (
          <MissionVisionQuiz 
            subjectCode="UEP_MV" 
            onExit={() => setActiveSubject(null)}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
        ) : (
          // OTHERWISE USE NORMAL QUIZ
          <QuizInterface 
            subject={activeSubject} 
            onExit={() => setActiveSubject(null)}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
        )
      ) : (
        <>
          {/* HEADER */}
          <header className="sticky top-0 z-50 bg-royal/95 backdrop-blur-md border-b-2 border-indigo shadow-hard px-3 py-3 flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-shrink">
              <div className="w-3 h-3 rounded-full bg-neonCyan animate-pulse shadow-[0_0_8px_#00F5D4] shrink-0"></div>
              <h1 className="font-pixel text-[10px] sm:text-xs text-glowYellow uppercase tracking-wider truncate">
                PRELIM QUIZ.exe
              </h1>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button 
                onClick={toggleDarkMode}
                className="font-pixel text-[9px] sm:text-[10px] px-2 sm:px-3 py-1.5 border border-lavender hover:bg-violet hover:text-white transition-all shadow-hard-sm active:translate-y-[2px] active:shadow-none whitespace-nowrap"
              >
                {isDarkMode ? 'LIGHT' : 'DARK'}
              </button>
              
              <span className="hidden xl:inline font-mono text-[10px] text-lavender/70 truncate max-w-[150px]">
                [{user.email}]
              </span>
              
              <button 
                onClick={logout}
                className="font-pixel text-[9px] sm:text-[10px] px-2 sm:px-3 py-1.5 bg-red-500 border-2 border-indigo text-white hover:bg-red-600 shadow-hard-sm active:translate-y-[2px] active:shadow-none transition-all whitespace-nowrap"
              >
                LOGOUT
              </button>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-6xl relative z-10 min-h-[calc(100vh-80px)] space-y-8 pb-24">
            
            {/* SECTION 1: Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {(() => {
                const savedScores = JSON.parse(localStorage.getItem('quiz_scores') || '{}');
                const completedCount = Object.keys(savedScores).length;
                
                let totalScore = 0;
                let totalQuestions = 0;
                Object.values(savedScores).forEach((s: any) => {
                  totalScore += s.score;
                  totalQuestions += s.total;
                });
                const averagePct = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;

                return (
                  <>
                    <div className="bg-violet/30 border-2 border-indigo shadow-hard p-6 backdrop-blur-sm">
                      <h3 className="font-pixel text-[10px] text-neonCyan uppercase mb-4">Overall Progress</h3>
                      <div className="flex items-end gap-2">
                        <span className="text-4xl font-bold text-lavender">{completedCount} / {subjects.length || 7}</span>
                        <span className="font-mono text-sm text-lavender/60 mb-1">Subjects Completed</span>
                      </div>
                    </div>
                    
                    <div className="bg-violet/30 border-2 border-indigo shadow-hard p-6 backdrop-blur-sm">
                      <h3 className="font-pixel text-[10px] text-neonCyan uppercase mb-4">Average Score</h3>
                      <div className="flex items-end gap-2">
                        <span className={`text-4xl font-bold ${averagePct >= 75 ? 'text-terminalGreen' : averagePct >= 50 ? 'text-glowYellow' : 'text-red-400'}`}>
                          {completedCount > 0 ? `${averagePct}%` : '--%'}
                        </span>
                        <span className="font-mono text-sm text-lavender/60 mb-1">Across all taken quizzes</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </section>

            {/* SECTION 2: EXAM SCHEDULE */}
            <section className="bg-violet/30 border-2 border-indigo shadow-hard p-6 backdrop-blur-sm">
              <h3 className="font-pixel text-[10px] text-glowYellow uppercase mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-glowYellow rounded-full animate-pulse"></span>
                Upcoming Exam Schedule
              </h3>
              
              {subjectsLoading ? (
                <div className="text-center py-8 font-mono text-lavender/60 animate-pulse">LOADING...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                      <tr className="border-b-2 border-indigo">
                        <th className="font-pixel text-[10px] text-neonCyan py-3 pr-4">SUBJECT</th>
                        <th className="font-pixel text-[10px] text-neonCyan py-3 pr-4">DATE</th>
                        <th className="font-pixel text-[10px] text-neonCyan py-3 pr-4">TIME</th>
                        <th className="font-pixel text-[10px] text-neonCyan py-3">ROOM</th>
                        {isAdmin && <th className="font-pixel text-[10px] text-neonCyan py-3 text-right">ACTION</th>}
                      </tr>
                    </thead>
                    <tbody className="font-mono text-sm">
                      {subjects.map((sub: any) => (
                        <tr key={sub.id || sub.code} className="border-b border-indigo/30 hover:bg-indigo/20 transition-colors">
                          <td className="py-3 pr-4 text-lavender font-bold">{sub.code}</td>
                          <td className="py-3 pr-4 text-lavender/80 whitespace-nowrap">
                            {sub.exam_date ? new Date(sub.exam_date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : '--'}
                          </td>
                          <td className="py-3 pr-4 text-lavender/80 whitespace-nowrap">{sub.time_slot || '--'}</td>
                          <td className="py-3 text-lavender/80 whitespace-nowrap">{sub.room || '--'}</td>
                          
                          {isAdmin && (
                            <td className="py-3 text-right">
                              <button 
                                onClick={() => handleEditClick(sub)}
                                className="font-pixel text-[8px] px-2 py-1 bg-glowYellow text-indigo border border-indigo shadow-hard-sm hover:brightness-110 active:translate-y-[1px] active:shadow-none"
                              >
                                EDIT
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* SECTION 3: Subject Cards */}
            <section>
              <h3 className="font-pixel text-[10px] text-glowYellow uppercase mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-glowYellow rounded-full animate-pulse"></span>
                Select Subject to Start Quiz
              </h3>
              
              {subjectsLoading ? (
                <div className="text-center py-12 font-mono text-lavender/60 animate-pulse">LOADING_SUBJECTS...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {subjects.map((subject: any) => {
                    const savedScores = JSON.parse(localStorage.getItem('quiz_scores') || '{}')
                    const subjectScore = savedScores[subject.code]
                    
                    return (
                      <button
                        key={subject.id || subject.code}
                        onClick={() => setActiveSubject(subject)}
                        className="group relative bg-indigo border-2 border-lavender/30 hover:border-neonCyan 
                                   shadow-hard-sm hover:shadow-[0_0_15px_rgba(0,245,212,0.3)] 
                                   p-4 text-left transition-all duration-200 
                                   hover:-translate-y-1 active:translate-y-[2px] active:shadow-none"
                      >
                        <div className="absolute inset-0 bg-neonCyan/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col h-full justify-between min-h-[140px]">
                          <div>
                            <div className="font-pixel text-xs text-neonCyan mb-2 group-hover:text-glowYellow transition-colors">
                              {subject.code}.exe
                            </div>
                            <div className="font-mono text-xs text-lavender/80 mb-3 line-clamp-2">
                              {subject.name}
                            </div>
                          </div>
                          
                          <div className="mt-auto pt-2 border-t border-indigo/50">
                            {subjectScore ? (() => {
                              const pct = Math.round((subjectScore.score / subjectScore.total) * 100);
                              let badgeColor = '';
                              
                              if (pct >= 75) {
                                badgeColor = 'border-terminalGreen text-terminalGreen';
                              } else if (pct >= 50) {
                                badgeColor = 'border-glowYellow text-glowYellow';
                              } else {
                                badgeColor = 'border-red-500 text-red-400';
                              }
                              
                              return (
                                <div className={`inline-block px-2 py-1 text-[10px] font-pixel border shadow-hard-sm bg-midnight/80 ${badgeColor}`}>
                                  Score: {subjectScore.score}/{subjectScore.total} ({pct}%)
                                </div>
                              );
                            })() : (
                              <div className="inline-block px-2 py-1 text-[10px] font-pixel border border-lavender/30 text-lavender/50 bg-indigo/30 shadow-hard-sm">
                                Not Taken Yet
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </section> 

          </main>

          {/* ADMIN EDIT MODAL */}
          {isAdmin && isModalOpen && (
            <>
              <div 
                className="fixed inset-0 z-[99998] bg-black/90 backdrop-blur-md"
                onClick={() => setIsModalOpen(false)}
              />
              
              <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 pointer-events-none">
                <div 
                  className="bg-midnight border-2 border-neonCyan shadow-[0_0_50px_rgba(0,245,212,0.6)] w-full max-w-sm pointer-events-auto flex flex-col"
                  style={{ maxHeight: '80vh' }}
                >
                  
                  {/* HEADER */}
                  <div className="p-4 border-b-2 border-indigo bg-royal/90 shrink-0">
                    <h4 className="font-pixel text-[10px] text-glowYellow uppercase text-center">
                      EDIT SCHEDULE: {editingSubjectCode}
                    </h4>
                  </div>
                  
                  {/* FORM */}
                  <div className="p-4 space-y-3 overflow-y-auto flex-1">
                    <div>
                      <label className="block font-pixel text-[7px] text-neonCyan mb-1 uppercase">Exam Date</label>
                      <input 
                        type="date" 
                        value={formData.exam_date} 
                        onChange={(e) => setFormData({...formData, exam_date: e.target.value})} 
                        className="retro-input text-[10px] py-2 w-full" 
                      />
                    </div>
                    <div>
                      <label className="block font-pixel text-[7px] text-neonCyan mb-1 uppercase">Time Slot</label>
                      <input 
                        type="text" 
                        value={formData.time_slot} 
                        onChange={(e) => setFormData({...formData, time_slot: e.target.value})} 
                        placeholder="e.g., 8:00 AM - 10:00 AM" 
                        className="retro-input text-[10px] py-2 w-full" 
                      />
                    </div>
                    <div>
                      <label className="block font-pixel text-[7px] text-neonCyan mb-1 uppercase">Room</label>
                      <input 
                        type="text" 
                        value={formData.room} 
                        onChange={(e) => setFormData({...formData, room: e.target.value})} 
                        placeholder="e.g., Room 301" 
                        className="retro-input text-[10px] py-2 w-full" 
                      />
                    </div>
                  </div>
                  
                  {/* BUTTONS */}
                  <div className="p-4 border-t-2 border-indigo flex gap-3 bg-royal/90 shrink-0">
                    <button 
                      onClick={handleSave} 
                      className="flex-1 font-pixel text-[8px] py-3 bg-neonCyan text-indigo border-2 border-indigo shadow-hard-sm hover:bg-white transition-colors active:translate-y-[2px] active:shadow-none uppercase"
                    >
                      SAVE
                    </button>
                    <button 
                      onClick={() => setIsModalOpen(false)} 
                      className="flex-1 font-pixel text-[8px] py-3 bg-red-500 text-white border-2 border-indigo shadow-hard-sm hover:bg-red-600 transition-colors active:translate-y-[2px] active:shadow-none uppercase"
                    >
                      CANCEL
                    </button>
                  </div>
                  
                </div>
              </div>
            </>
          )}

        </>
      )}
    </div>
  )
}

export default App