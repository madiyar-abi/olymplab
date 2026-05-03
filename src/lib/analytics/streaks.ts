export function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // Convert to sorted unique dates (YYYY-MM-DD)
  const uniqueDates = Array.from(new Set(dates.map(d => d.split('T')[0])))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // If the last solved date is not today or yesterday, the streak is broken
  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0;
  }

  let streak = 0;
  const currentDate = new Date(uniqueDates[0]);

  for (let i = 0; i < uniqueDates.length; i++) {
    const dateStr = uniqueDates[i];
    
    // Check if this date is exactly what we expect
    const expectedDateStr = currentDate.toISOString().split('T')[0];
    
    if (dateStr === expectedDateStr) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
