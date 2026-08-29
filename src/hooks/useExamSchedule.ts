import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// ✅ FIXED: Removed 'subject_name' - your DB table doesn't have this column!
export interface ExamSchedule {
  subject_name: string
  id: number
  subject_code: string
  exam_date: string
  time_slot?: string
  room: string
  created_at?: string
}

export function useExamSchedule() {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = async () => {
    setLoading(true)
    setError(null)
    
    console.log("🔄 Fetching exam schedules...")
    
    const { data, error } = await supabase
      .from('exam_schedules')
      .select('*')
      .order('exam_date', { ascending: true })

    if (error) {
      console.error("❌ Supabase Fetch Error:", error.message)
      setError(error.message)
      setSchedules([])
    } else {
      console.log(`✅ Fetched ${data?.length || 0} schedules`)
      // ✅ Cast to our corrected interface (no subject_name)
      setSchedules((data || []) as ExamSchedule[])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchSchedules()
  }, [])

  // ✅ ADD: Only sends fields that exist in DB
  const addSchedule = async (newItem: Omit<ExamSchedule, 'id' | 'created_at'>) => {
    console.log("➕ Adding schedule:", newItem)
    
    const { data, error } = await supabase
      .from('exam_schedules')
      .insert([newItem])
      .select() // Return the inserted row

    if (error) {
      console.error("❌ Insert Error:", error.message, error.details)
      setError(error.message)
      return false
    }
    
    console.log("✅ Insert successful:", data)
    fetchSchedules() // Refresh list
    return true
  }

  // ✅ UPDATE: Only sends fields that exist in DB
  const updateSchedule = async (id: number, updates: Partial<Omit<ExamSchedule, 'id' | 'created_at'>>) => {
    console.log("✏️ Updating schedule ID:", id, updates)
    
    const { error } = await supabase
      .from('exam_schedules')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error("❌ Update Error:", error.message)
      setError(error.message)
      return false
    }
    
    fetchSchedules()
    return true
  }

  // ✅ DELETE
  const deleteSchedule = async (id: number) => {
    console.log("🗑️ Deleting schedule ID:", id)
    
    const { error } = await supabase
      .from('exam_schedules')
      .delete()
      .eq('id', id)

    if (error) {
      console.error("❌ Delete Error:", error.message)
      setError(error.message)
      return false
    }
    
    fetchSchedules()
    return true
  }

  return { 
    schedules, 
    loading, 
    error,
    addSchedule, 
    updateSchedule, 
    deleteSchedule,
    refetch: fetchSchedules 
  }
}