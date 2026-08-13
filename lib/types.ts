export type Role = 'STAFF' | 'ADMIN';
export type StatusValue = 'IN' | 'OUT';
export interface StudentStatus { student_id:string; status:StatusValue; out_since:string|null; updated_at:string; updated_by:string|null }
export interface Student { id:string; first_name:string; last_name:string; grade:string; section:string; active:boolean; student_status:StudentStatus|null }
export interface Visit { id:string; student_id:string; out_at:string; in_at:string|null; duration_minutes:number|null; students:Pick<Student,'first_name'|'last_name'|'grade'|'section'> }
export const GRADES=['PK','K','1','2','3','4','5','6','7','8','9','10','11','12'] as const;
