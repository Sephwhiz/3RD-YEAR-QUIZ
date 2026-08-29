export interface Subject {
  id: string
  code: string
  name: string
  json_data: any // We'll parse this later for questions
  progress?: number
}

export interface ExamSchedule {
  id: string
  subject_code: string
  date: string
  room: string
  time?: string
}

export interface QuizAttempt {
  id?: string
  subject_id: string
  score: number
  total_questions: number
  answers: Record<string, string>
  taken_at: string
}