/** Date locale au format ISO `yyyy-MM-dd`. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Premier jour de la semaine (lundi par défaut), format ISO. */
export function weekStartIso(reference: Date = new Date(), weekStartsOnMonday = true): string {
  const date = new Date(reference);
  const dayIndex = date.getDay();
  const offset = weekStartsOnMonday ? (dayIndex + 6) % 7 : dayIndex;
  date.setDate(date.getDate() - offset);
  return toIsoDate(date);
}

export function isOnOrAfter(isoDate: string, boundaryIso: string): boolean {
  return isoDate >= boundaryIso;
}

/** Décale un mois (`yyyy-MM-01`) de `delta` mois. */
export function shiftMonth(monthIso: string, delta: number): string {
  const date = new Date(monthIso + 'T00:00:00');
  date.setMonth(date.getMonth() + delta);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

/** Tous les jours d'un mois, format ISO. */
export function daysInMonth(monthIso: string): string[] {
  const year = Number.parseInt(monthIso.slice(0, 4), 10);
  const month = Number.parseInt(monthIso.slice(5, 7), 10);
  const dayCount = new Date(year, month, 0).getDate();
  return Array.from({ length: dayCount }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    return `${year}-${String(month).padStart(2, '0')}-${day}`;
  });
}

/** Index du jour de la semaine (0 = lundi … 6 = dimanche). */
export function weekdayMondayFirst(isoDate: string): number {
  const dayIndex = new Date(isoDate + 'T00:00:00').getDay();
  return (dayIndex + 6) % 7;
}

/** Cases vides avant le 1er jour dans une grille lundi → dimanche. */
export function monthGridLeadingBlanks(monthIso: string): number {
  const firstDay = `${monthIso.slice(0, 7)}-01`;
  return weekdayMondayFirst(firstDay);
}

/** Les 7 jours d'une semaine à partir de son premier jour (ISO). */
export function daysInWeek(weekStartIso: string): string[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStartIso + 'T00:00:00');
    date.setDate(date.getDate() + index);
    return toIsoDate(date);
  });
}

/** Libellés courts des jours selon le début de semaine. */
export function weekdayLabels(weekStartsOnMonday: boolean): string[] {
  const mondayFirst = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  if (weekStartsOnMonday) {
    return mondayFirst;
  }
  return ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
}
