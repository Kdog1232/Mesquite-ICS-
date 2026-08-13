export type Student = {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  section?: string;
};

/** Privacy-minimized roster extracted from the supplied homeroom workbook. */
export const students: Student[] = [
  { id: 'maria-smith-5-5a', firstName: 'Maria', lastName: 'Smith', grade: '5', section: '5A' },
  { id: 'john-jones-8-8b', firstName: 'John', lastName: 'Jones', grade: '8', section: '8B' },
];

export const grades = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
