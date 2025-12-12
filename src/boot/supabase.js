
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yeagmfnhncefqjrepabk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllYWdtZm5obmNlZnFqcmVwYWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3NjYwOTQsImV4cCI6MjA1NzM0MjA5NH0.38OlIrL9Q-bFCXAcKn1jkG6mC7StKIN2aMGoiaO8UZE'
export const supabase = createClient(supabaseUrl, supabaseKey)