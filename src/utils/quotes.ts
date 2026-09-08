/**
 * Rotating daily motivational quotes for the Home header. Deterministically
 * picked by day-of-year so it's stable throughout the day but changes daily.
 */
const QUOTES = [
  'Small steps every day lead to big changes.',
  "Discipline is choosing what you want most over what you want now.",
  'Progress, not perfection.',
  "You don't have to be extreme, just consistent.",
  'Every workout is a deposit into your future self.',
  'The only bad workout is the one you didn\u2019t do.',
  'Motivation gets you started. Habit keeps you going.',
  'Take care of your body — it\u2019s the only place you have to live.',
  'A little progress each day adds up to big results.',
  'Your body can do it. It\u2019s your mind you have to convince.',
  'Sore today, strong tomorrow.',
  'Success starts with showing up.',
  'Fall in love with taking care of yourself.',
  'One day or day one — you decide.',
  'Consistency beats intensity.',
]

export function dailyQuote(date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date.getTime() - start.getTime()
  const dayOfYear = Math.floor(diff / 86400000)
  return QUOTES[dayOfYear % QUOTES.length]
}
