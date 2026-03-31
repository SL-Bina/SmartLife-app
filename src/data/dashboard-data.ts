export type DepartmentStat = {
  id: string;
  name: string;
  completed: number;
  total: number;
};

export function getDepartmentStats(): DepartmentStat[] {
  return [
    { id: '1', name: 'Support', completed: 46, total: 58 },
    { id: '2', name: 'Finance', completed: 31, total: 40 },
    { id: '3', name: 'Operations', completed: 24, total: 37 },
    { id: '4', name: 'Community', completed: 19, total: 28 },
  ];
}
