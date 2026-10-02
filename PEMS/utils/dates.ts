/** Today's date as PEMS displays it, e.g. 01/10/2026. */
export function todayDdMmYyyy(): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${now.getFullYear()}`;
}

/** Today's day of month as the date picker labels it, e.g. "01". */
export function todayDayButtonLabel(): string {
  return String(new Date().getDate()).padStart(2, '0');
}
