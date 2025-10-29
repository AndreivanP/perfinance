export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

// Mapeamento de meses em português
const months = {
  'Jan': 'Jan',
  'Fev': 'Fev',
  'Mar': 'Mar',
  'Abr': 'Abr',
  'Mai': 'Mai',
  'Jun': 'Jun',
  'Jul': 'Jul',
  'Ago': 'Ago',
  'Set': 'Set',
  'Out': 'Out',
  'Nov': 'Nov',
  'Dez': 'Dez'
};

export const formatMonthYear = (date: Date | string): string => {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  const month = date.toLocaleString('pt-BR', { month: 'short' });
  const year = date.getFullYear();
  return `${months[month as keyof typeof months]}/${year}`;
};
