import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'student' | 'faculty' | 'admin';
          avatar_url: string;
          phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role?: 'student' | 'faculty' | 'admin';
          avatar_url?: string;
          phone?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          user_id: string;
          student_id: string;
          batch: string;
          department: string;
          enrollment_date: string;
          status: 'active' | 'inactive' | 'suspended' | 'graduated';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          student_id?: string;
          batch?: string;
          department?: string;
          enrollment_date?: string;
          status?: 'active' | 'inactive' | 'suspended' | 'graduated';
          created_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          title: string;
          description: string;
          thumbnail_url: string;
          instructor_id: string | null;
          price: number;
          duration_weeks: number;
          level: 'beginner' | 'intermediate' | 'advanced';
          category: string;
          status: 'draft' | 'published' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          thumbnail_url?: string;
          instructor_id?: string | null;
          price?: number;
          duration_weeks?: number;
          level?: 'beginner' | 'intermediate' | 'advanced';
          category?: string;
          status?: 'draft' | 'published' | 'archived';
          created_at?: string;
          updated_at?: string;
        };
      };
      modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string;
          order_index?: number;
          created_at?: string;
        };
      };
      lessons: {
        Row: {
          id: string;
          module_id: string;
          title: string;
          description: string;
          video_url: string;
          pdf_url: string;
          duration_minutes: number;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          title: string;
          description?: string;
          video_url?: string;
          pdf_url?: string;
          duration_minutes?: number;
          order_index?: number;
          created_at?: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          enrolled_at: string;
          progress: number;
          status: 'active' | 'completed' | 'dropped';
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          enrolled_at?: string;
          progress?: number;
          status?: 'active' | 'completed' | 'dropped';
        };
      };
      lesson_progress: {
        Row: {
          id: string;
          enrollment_id: string;
          lesson_id: string;
          completed: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          enrollment_id: string;
          lesson_id: string;
          completed?: boolean;
          completed_at?: string | null;
        };
      };
      assignments: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string;
          max_score: number;
          due_date: string;
          file_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string;
          max_score?: number;
          due_date: string;
          file_url?: string;
          created_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          file_url: string;
          submitted_at: string;
          score: number | null;
          feedback: string;
          status: 'submitted' | 'graded' | 'returned';
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          file_url?: string;
          submitted_at?: string;
          score?: number | null;
          feedback?: string;
          status?: 'submitted' | 'graded' | 'returned';
        };
      };
      payments: {
        Row: {
          id: string;
          student_id: string;
          course_id: string | null;
          amount: number;
          payment_type: 'course' | 'fee' | 'subscription';
          status: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_method: string;
          transaction_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id?: string | null;
          amount: number;
          payment_type?: 'course' | 'fee' | 'subscription';
          status?: 'pending' | 'completed' | 'failed' | 'refunded';
          payment_method?: string;
          transaction_id?: string;
          created_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          date: string;
          status: 'present' | 'absent' | 'late' | 'excused';
          notes: string;
          marked_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          date: string;
          status?: 'present' | 'absent' | 'late' | 'excused';
          notes?: string;
          marked_by?: string | null;
          created_at?: string;
        };
      };
      certificates: {
        Row: {
          id: string;
          student_id: string;
          course_id: string;
          issued_at: string;
          certificate_id: string;
          download_url: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          course_id: string;
          issued_at?: string;
          certificate_id?: string;
          download_url?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'warning' | 'success' | 'error' | 'assignment' | 'payment' | 'announcement';
          read: boolean;
          action_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: 'info' | 'warning' | 'success' | 'error' | 'assignment' | 'payment' | 'announcement';
          read?: boolean;
          action_url?: string;
          created_at?: string;
        };
      };
    };
  };
}
