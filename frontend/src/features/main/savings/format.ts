export function formatSavingsDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return `${year}년 ${month}월 ${day}일`;
}

export function monthsBetween(openedAt: string, maturityAt: string): number {
  const opened = new Date(`${openedAt}T00:00:00`);
  const maturity = new Date(`${maturityAt}T00:00:00`);
  if (Number.isNaN(opened.getTime()) || Number.isNaN(maturity.getTime())) return 0;
  return Math.max(0, (maturity.getFullYear() - opened.getFullYear()) * 12
    + maturity.getMonth() - opened.getMonth());
}
