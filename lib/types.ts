import type { Database } from './database.types';

export type Role = Database['public']['Enums']['staff_role'];
export type StatusValue = Database['public']['Enums']['student_presence'];
export type StudentStatus = Database['public']['Tables']['student_status']['Row'];
export type Student = Pick<Database['public']['Tables']['students']['Row'], 'id' | 'first_name' | 'last_name' | 'grade' | 'section' | 'active'> & {
  student_status: StudentStatus | null;
};
export const GRADES=['PK','K','1','2','3','4','5','6','7','8','9','10','11','12'] as const;
