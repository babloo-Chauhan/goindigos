/** Today's date in India as YYYY-MM-DD, the form closing dates are saved in. */
export function istToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}
