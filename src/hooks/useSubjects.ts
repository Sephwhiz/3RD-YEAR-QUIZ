import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Question {
  q: string
  options: string[]
  answer: number
  explanation: string
}

export interface Subject {
  id: number
  code: string
  name: string
  json_data: Question[] | string // Can be array or string from DB
  updated_at: string
  exam_date?: string | null      // NEW
  time_slot?: string | null      // NEW
  room?: string | null           // NEW
}

// Helper: Convert "8:00 AM" or "14:00" to total minutes since midnight for sorting
const parseTimeToMinutes = (timeStr: string | null): number => {
  if (!timeStr) return Infinity;
  
  // Try to extract hours and minutes from formats like "8:00 AM", "2:30 PM", "14:00"
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return Infinity;
  
  let hours = parseInt(match[1]);
  const minutes = parseInt(match[2]);
  const period = match[3]?.toUpperCase();
  
  // Convert 12-hour format to 24-hour for accurate comparison
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  
  return hours * 60 + minutes;
};

// Helper to safely parse and sort subjects
const processSubjects = (rawData: any[]) => {
  let parsedSubjects = rawData.map(subject => ({
    ...subject,
    json_data: typeof subject.json_data === 'string' 
      ? JSON.parse(subject.json_data) 
      : subject.json_data
  }))

  // CUSTOM SORTING LOGIC: Date → Time → No Schedule
  parsedSubjects.sort((a, b) => {
    // PRIMARY SORT: By Exam Date
    const dateA = a.exam_date ? new Date(a.exam_date).getTime() : Infinity;
    const dateB = b.exam_date ? new Date(b.exam_date).getTime() : Infinity;
    
    if (dateA !== dateB) {
      return dateA - dateB;
    }
    
    // SECONDARY SORT: By Time Slot (only if dates are identical)
    const timeA = parseTimeToMinutes(a.time_slot);
    const timeB = parseTimeToMinutes(b.time_slot);
    
    return timeA - timeB;
  });

  return parsedSubjects as Subject[]
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Extract fetch logic into a reusable function
  const fetchSubjects = async () => {
    setLoading(true)
    try {
      // Fetch all subjects (order doesn't matter here since we sort manually)
      const { data, error } = await supabase
        .from('subjects')
        .select('*')

      if (error) throw error
      
      // ✅ SUCCESS: Parse, Sort, and CACHE for offline use
      const processed = processSubjects(data || [])
      
      // Save raw data to localStorage for offline fallback
      localStorage.setItem('cached_subjects', JSON.stringify(data))
      
      setSubjects(processed)
      setError(null)
      
    } catch (err: any) {
      console.error("Error fetching subjects:", err)
      
      // ✅ OFFLINE FALLBACK: Try to load from cache
      const cached = localStorage.getItem('cached_subjects')
      
      if (cached) {
        try {
          const cachedData = JSON.parse(cached)
          const processed = processSubjects(cachedData)
          
          setSubjects(processed)
          setError("You are offline. Showing cached data.")
        } catch (parseErr) {
          console.error("Failed to parse cached data:", parseErr)
          setError("Offline mode active but cache is corrupted.")
          setSubjects([])
        }
      } else {
        // No internet AND no cache
        setError("No internet connection and no cached data available.")
        setSubjects([])
      }
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchSubjects()
  }, [])

  // Return refetch so App.tsx can refresh data after updates
  return { subjects, loading, error, refetch: fetchSubjects }
}