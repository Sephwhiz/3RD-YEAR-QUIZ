import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { RetroWindow } from './Layout/RetroWindow'
import { RetroButton } from './UI/RetroButton'
import { supabase } from '../lib/supabase'

export function LoginForm() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()

  const resetForm = () => {
    setError('')
    setSuccessMsg('')
    setPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
    setIsLoading(false)
  }

  const handleToggleMode = () => {
    setIsRegistering(!isRegistering)
    setIsForgotPassword(false)
    resetForm()
  }

  const handleForgotPasswordClick = () => {
    setIsForgotPassword(true)
    setIsRegistering(false)
    resetForm()
  }

  const handleBackToLogin = () => {
    setIsForgotPassword(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setIsLoading(true)

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`
        })
        if (error) throw error
        setSuccessMsg(`Reset link sent to ${email}. Check your inbox.`)
        
      } else if (isRegistering) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match!')
        }

        // 1. SIGN UP THE USER
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            emailRedirectTo: window.location.origin,
            data: { full_name: email.split('@')[0] } // Temporary name from email
          }
        })
        
        if (authError) throw authError
        
        // 2. MANUALLY CREATE PROFILE ROW (Fixes the empty table issue)
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              full_name: email.split('@')[0], // Using email prefix as name
              section: '3N', // Default section since we don't have an input yet
              role: 'student'
            })
          
          if (profileError) {
            console.error("Profile creation failed:", profileError)
            // Don't throw here, let them know account was created but profile might be missing
          }
        }
        
        setSuccessMsg('Account created! You can now log in.')
        setTimeout(() => {
          setIsRegistering(false)
          resetForm()
        }, 3000)
        
      } else {
        await login(email, password)
      }
    } catch (err: any) {
      console.error("Auth Error:", err)
      setError(err.message || 'Authentication failed.')
    } finally {
      setIsLoading(false)
    }
  }

  // Eye Icon SVG Component
  const EyeIcon = ({ visible }: { visible: boolean }) => (
    <svg className="w-5 h-5 text-lavender/60 hover:text-neonCyan transition-colors cursor-pointer" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {visible ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10 overflow-hidden">
      <RetroWindow title="PRELIM_EXAM_PORTAL.exe" className="w-full max-w-md">
        <div className="space-y-6">
          
          {/* HEADER */}
          <div className="text-center space-y-2">
            <h2 className="font-pixel text-xs sm:text-sm text-lavender uppercase tracking-widest">
              {isForgotPassword ? 'PASSWORD_RECOVERY' 
               : isRegistering ? 'NEW_STUDENT_REGISTRATION' 
               : 'STUDENT_PRELIM_DASHBOARD'}
            </h2>
            <p className="font-mono text-xs text-lavender/70">
              {isForgotPassword ? 'Enter email to receive reset link' 
               : isRegistering ? 'Create account to access quizzes' 
               : 'Enter your credentials to continue'}
            </p>
          </div>

          {/* MESSAGES */}
          {successMsg && (
            <div className="p-3 border-2 border-neonCyan bg-neonCyan/10 shadow-hard-sm animate-pulse">
              <p className="font-mono text-xs text-neonCyan text-center">{successMsg}</p>
            </div>
          )}
          {error && (
            <div className="p-3 border-2 border-red-500 bg-red-900/20 shadow-hard-sm">
              <p className="font-mono text-xs text-red-300 text-center">ERROR: {error}</p>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* EMAIL FIELD */}
            <div className="space-y-1">
              <label className="block font-pixel text-[9px] text-neonCyan uppercase">Email_Address:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="student@bsit3n.edu"
                className="retro-input"
              />
            </div>

            {/* PASSWORD FIELDS (Hidden in Forgot Password mode) */}
            {!isForgotPassword && (
              <>
                {/* PASSWORD WITH EYE TOGGLE */}
                <div className="space-y-1">
                  <label className="block font-pixel text-[9px] text-neonCyan uppercase">Password:</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="••••••••"
                      className="retro-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                </div>

                {/* CONFIRM PASSWORD (Registration Only) */}
                {isRegistering && (
                  <div className="space-y-1">
                    <label className="block font-pixel text-[9px] text-neonCyan uppercase">Confirm_Password:</label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        placeholder="••••••••"
                        className={`retro-input pr-10 ${
                          confirmPassword && password !== confirmPassword 
                            ? 'border-red-500 text-red-300 focus:border-red-500' 
                            : ''
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
                      >
                        <EyeIcon visible={showConfirmPassword} />
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="font-mono text-[8px] text-red-400 mt-1">⚠ Passwords do not match</p>
                    )}
                  </div>
                )}
              </>
            )}

            {/* SUBMIT BUTTON */}
            <RetroButton 
              type="submit" 
              variant="primary" 
              size="md" 
              className="w-full mt-2"
              disabled={isLoading || (isRegistering && password !== confirmPassword)}
            >
              {isLoading ? 'PROCESSING...' 
               : isForgotPassword ? 'SEND_RESET_LINK' 
               : isRegistering ? 'CREATE_ACCOUNT' 
               : 'ACCESS DASHBOARD'}
            </RetroButton>
          </form>

          {/* FOOTER LINKS */}
          <div className="text-center pt-2 border-t border-indigo/50 space-y-2">
            {isForgotPassword ? (
              <p className="font-mono text-[10px] text-lavender/60">
                Remember your password?{' '}
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="text-neonCyan hover:text-glowYellow underline decoration-wavy decoration-1 underline-offset-2 transition-colors font-pixel text-[9px] cursor-pointer bg-transparent border-none p-0 m-0"
                >
                  BACK_TO_LOGIN
                </button>
              </p>
            ) : (
              <>
                <p className="font-mono text-[10px] text-lavender/60">
                  {isRegistering ? 'Already have an account?' : 'New student?'}{' '}
                  <button
                    type="button"
                    onClick={handleToggleMode}
                    className="text-neonCyan hover:text-glowYellow underline decoration-wavy decoration-1 underline-offset-2 transition-colors font-pixel text-[9px] cursor-pointer bg-transparent border-none p-0 m-0"
                  >
                    {isRegistering ? 'LOGIN_HERE' : 'REGISTER_HERE'}
                  </button>
                </p>
                
                {!isRegistering && (
                  <p className="font-mono text-[10px] text-lavender/60">
                    Forgot password?{' '}
                    <button
                      type="button"
                      onClick={handleForgotPasswordClick}
                      className="text-glowYellow hover:text-neonCyan underline decoration-wavy decoration-1 underline-offset-2 transition-colors font-pixel text-[9px] cursor-pointer bg-transparent border-none p-0 m-0"
                    >
                      RESET_HERE
                    </button>
                  </p>
                )}
              </>
            )}
          </div>

        </div>
      </RetroWindow>
    </div>
  )
}
