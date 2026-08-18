import { Course, ClassSession, DayOfWeek } from '../types';

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string; full: string }[] = [
  { key: 'MON', label: 'Mon', full: 'Monday' },
  { key: 'TUES', label: 'Tue', full: 'Tuesday' },
  { key: 'WED', label: 'Wed', full: 'Wednesday' },
  { key: 'THUR', label: 'Thu', full: 'Thursday' },
  { key: 'FRI', label: 'Fri', full: 'Friday' },
  { key: 'SAT', label: 'Sat', full: 'Saturday' },
  { key: 'SUN', label: 'Sun', full: 'Sunday' },
];

export function dateToDayOfWeek(date: Date): DayOfWeek {
  const dayIndex = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  switch (dayIndex) {
    case 1:
      return 'MON';
    case 2:
      return 'TUES';
    case 3:
      return 'WED';
    case 4:
      return 'THUR';
    case 5:
      return 'FRI';
    case 6:
      return 'SAT';
    case 0:
    default:
      return 'SUN';
  }
}

export function timeStringToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function formatTime12h(timeStr: string): string {
  if (!timeStr) return '';
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
}

export interface CurrentStatusInfo {
  status: 'in_class' | 'upcoming_soon' | 'break' | 'done_for_day' | 'no_classes_today';
  activeSession: ClassSession | null;
  activeCourse: Course | null;
  nextSession: ClassSession | null;
  nextCourse: Course | null;
  progressPercent: number;
  minutesRemaining: number;
  minutesUntilNext: number;
  displayText: string;
  subText: string;
}

export function getCurrentDayString(): DayOfWeek {
  return dateToDayOfWeek(new Date());
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function getTodayCourses(courses: Course[], currentDay: DayOfWeek) {
  const list: { course: Course; startTime: string; endTime: string; room: string; displayTime: string }[] = [];
  courses.forEach((course) => {
    course.sessions.forEach((session) => {
      if (session.day === currentDay) {
        list.push({
          course,
          startTime: session.startTime,
          endTime: session.endTime,
          room: session.room,
          displayTime: session.displayTime,
        });
      }
    });
  });

  list.sort((a, b) => timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime));
  return list;
}

export function calculateCurrentStatus(
  courses: Course[],
  currentDay: DayOfWeek,
  timeInput: number | string
): CurrentStatusInfo {
  const currentMinutes = typeof timeInput === 'string' ? timeStringToMinutes(timeInput) : timeInput;
  // Collect all sessions for today
  const todaySessionsWithCourse: { session: ClassSession; course: Course; startMins: number; endMins: number }[] = [];

  courses.forEach((course) => {
    course.sessions.forEach((session) => {
      if (session.day === currentDay) {
        todaySessionsWithCourse.push({
          session,
          course,
          startMins: timeStringToMinutes(session.startTime),
          endMins: timeStringToMinutes(session.endTime),
        });
      }
    });
  });

  // Sort chronologically
  todaySessionsWithCourse.sort((a, b) => a.startMins - b.startMins);

  if (todaySessionsWithCourse.length === 0) {
    return {
      status: 'no_classes_today',
      activeSession: null,
      activeCourse: null,
      nextSession: null,
      nextCourse: null,
      progressPercent: 0,
      minutesRemaining: 0,
      minutesUntilNext: 0,
      displayText: 'No Classes Today',
      subText: 'Enjoy your free study day & prep assignments',
    };
  }

  // 1. Check if currently inside a session
  for (const item of todaySessionsWithCourse) {
    if (currentMinutes >= item.startMins && currentMinutes < item.endMins) {
      const totalDuration = item.endMins - item.startMins;
      const elapsed = currentMinutes - item.startMins;
      const progress = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
      const remaining = item.endMins - currentMinutes;

      // Find next session after this
      const later = todaySessionsWithCourse.find((s) => s.startMins >= item.endMins);

      return {
        status: 'in_class',
        activeSession: item.session,
        activeCourse: item.course,
        nextSession: later ? later.session : null,
        nextCourse: later ? later.course : null,
        progressPercent: progress,
        minutesRemaining: remaining,
        minutesUntilNext: later ? later.startMins - currentMinutes : 0,
        displayText: `In Class: ${item.course.title}`,
        subText: `${remaining}m left in ${item.session.room} (${progress}% completed)`,
      };
    }
  }

  // 2. Check if before the first or between sessions
  const nextUp = todaySessionsWithCourse.find((s) => s.startMins > currentMinutes);

  if (nextUp) {
    const minsUntil = nextUp.startMins - currentMinutes;
    const isSoon = minsUntil <= 45;

    return {
      status: isSoon ? 'upcoming_soon' : 'break',
      activeSession: null,
      activeCourse: null,
      nextSession: nextUp.session,
      nextCourse: nextUp.course,
      progressPercent: 0,
      minutesRemaining: 0,
      minutesUntilNext: minsUntil,
      displayText: isSoon ? `Starting in ${minsUntil}m` : `Next: ${nextUp.course.title}`,
      subText: `${formatTime12h(nextUp.session.startTime)} at ${nextUp.session.room}`,
    };
  }

  // 3. All sessions for today finished
  return {
    status: 'done_for_day',
    activeSession: null,
    activeCourse: null,
    nextSession: null,
    nextCourse: null,
    progressPercent: 100,
    minutesRemaining: 0,
    minutesUntilNext: 0,
    displayText: 'All Classes Finished for Today',
    subText: 'Great work! Check upcoming assignment deadlines',
  };
}

export function formatRemainingCountdown(secondsTotal: number): string {
  if (secondsTotal <= 0) return '00:00';
  const hours = Math.floor(secondsTotal / 3600);
  const minutes = Math.floor((secondsTotal % 3600) / 60);
  const seconds = secondsTotal % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}
