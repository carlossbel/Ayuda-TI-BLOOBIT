export const DEPARTMENTS = ['Ventas', 'Administración', 'Marketing', 'Administración de Ventas', 'Logística', 'TI'];

export const USERS = [
  { id: 'laura-valle', name: 'Laura Valle', department: 'Ventas' },
  { id: 'jovanna-hernandez', name: 'Jovanna Hernandez', department: 'Ventas' },
  { id: 'leonardo-torredo', name: 'Leonardo Torredo', department: 'Ventas' },
  { id: 'carlos-medina', name: 'Carlos Medina', department: 'Ventas' },
  { id: 'karla-arriaga', name: 'Karla Arriaga', department: 'Administración' },
  { id: 'ana-garcia', name: 'Ana Garcia', department: 'Administración' },
  { id: 'zaira-ali', name: 'Zaira Ali', department: 'Marketing' },
  { id: 'barbara-perez', name: 'Barbara Perez', department: 'Administración de Ventas' },
  { id: 'cuauhtemoc-munoz', name: 'Cuauhtemoc Muñoz', department: 'Administración de Ventas' },
  { id: 'mario-crisanto', name: 'Mario Crisanto', department: 'Administración de Ventas' },
  { id: 'miguel-rincon', name: 'Miguel Rincon', department: 'Logística' },
  { id: 'carlos-beltran', name: 'Carlos Beltran', department: 'TI', role: 'admin' },
];

export const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
