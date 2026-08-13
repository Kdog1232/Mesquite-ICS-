export type Student = {
  id: string;
  name: string;
  grade: string;
};

/** Privacy-minimized roster. Only records extracted from the official workbook belong here. */
export const students: Student[] = [];

export const grades = ['PK', 'K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
