/**
 * Supabase schema types for the objects used by this application.
 *
 * Keep this file in sync with `supabase/migrations`. It intentionally follows
 * the shape emitted by `supabase gen types typescript` so every query and RPC
 * is checked at compile time.
 */
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; role: Database['public']['Enums']['staff_role']; created_at: string };
        Insert: { id: string; role?: Database['public']['Enums']['staff_role']; created_at?: string };
        Update: { id?: string; role?: Database['public']['Enums']['staff_role']; created_at?: string };
        Relationships: [];
      };
      students: {
        Row: { id: string; first_name: string; last_name: string; grade: string; section: string; active: boolean; created_at: string };
        Insert: { id?: string; first_name: string; last_name: string; grade: string; section?: string; active?: boolean; created_at?: string };
        Update: { id?: string; first_name?: string; last_name?: string; grade?: string; section?: string; active?: boolean; created_at?: string };
        Relationships: [];
      };
      student_status: {
        Row: { student_id: string; status: Database['public']['Enums']['student_presence']; out_since: string | null; updated_at: string; updated_by: string | null };
        Insert: { student_id: string; status?: Database['public']['Enums']['student_presence']; out_since?: string | null; updated_at?: string; updated_by?: string | null };
        Update: { student_id?: string; status?: Database['public']['Enums']['student_presence']; out_since?: string | null; updated_at?: string; updated_by?: string | null };
        Relationships: [{ foreignKeyName: 'student_status_student_id_fkey'; columns: ['student_id']; isOneToOne: true; referencedRelation: 'students'; referencedColumns: ['id'] }];
      };
      bathroom_visits: {
        Row: { id: string; student_id: string; out_at: string; in_at: string | null; duration_minutes: number | null; marked_out_by: string; marked_in_by: string | null; created_at: string };
        Insert: { id?: string; student_id: string; out_at: string; in_at?: string | null; duration_minutes?: number | null; marked_out_by: string; marked_in_by?: string | null; created_at?: string };
        Update: { id?: string; student_id?: string; out_at?: string; in_at?: string | null; duration_minutes?: number | null; marked_out_by?: string; marked_in_by?: string | null; created_at?: string };
        Relationships: [{ foreignKeyName: 'bathroom_visits_student_id_fkey'; columns: ['student_id']; isOneToOne: false; referencedRelation: 'students'; referencedColumns: ['id'] }];
      };
    };
    Views: Record<never, never>;
    Functions: {
      current_user_role: { Args: Record<PropertyKey, never>; Returns: Database['public']['Enums']['staff_role'] | null };
      set_student_bathroom_status: { Args: { p_student_id: string; p_status: Database['public']['Enums']['student_presence'] }; Returns: Database['public']['Tables']['student_status']['Row'] };
    };
    Enums: { staff_role: 'STAFF' | 'ADMIN'; student_presence: 'IN' | 'OUT' };
    CompositeTypes: Record<never, never>;
  };
};
