export const getWeekIdentifier = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${weekNumber}`;
};

export const getSessionsCountThisWeek = (sessions, weekIdentifier) => {
  return sessions.filter((session) => getWeekIdentifier(session.date) === weekIdentifier).length;
};

export const updateStreak = (user, allSessions) => {
  const currentWeek = getWeekIdentifier(new Date());
  const sessionsThisWeek = getSessionsCountThisWeek(allSessions, currentWeek);

  if (sessionsThisWeek < user.weeklyGoal) {
    return {
      currentStreak: user.currentStreak,
      lastStreakWeek: user.lastStreakWeek,
    };
  }

  if (user.lastStreakWeek === currentWeek) {
    return {
      currentStreak: user.currentStreak,
      lastStreakWeek: user.lastStreakWeek,
    };
  }

  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const previousWeek = getWeekIdentifier(lastWeekDate);

  const newStreak = user.lastStreakWeek === previousWeek ? user.currentStreak + 1 : 1;

  return {
    currentStreak: newStreak,
    lastStreakWeek: currentWeek,
  };
};