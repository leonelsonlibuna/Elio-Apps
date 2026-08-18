import { Course, Assignment } from '../types';

export interface GoogleCalendarItem {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
  htmlLink?: string;
}

export interface GoogleCalendarInfo {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
}

export interface SyncStats {
  calendarId: string;
  calendarName: string;
  classesSynced: number;
  assignmentsSynced: number;
  totalSynced: number;
  calendarLink: string;
  timestamp: string;
}

const GOOGLE_CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';

export async function listGoogleCalendars(accessToken: string): Promise<GoogleCalendarInfo[]> {
  const response = await fetch(`${GOOGLE_CALENDAR_BASE}/users/me/calendarList`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to fetch calendars (${response.status})`);
  }

  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary,
    description: item.description,
    primary: item.primary,
    backgroundColor: item.backgroundColor,
  }));
}

export async function getOrCreateAcademicCalendar(
  accessToken: string,
  calendarTitle = 'College Schedule & Deadlines'
): Promise<GoogleCalendarInfo> {
  const calendars = await listGoogleCalendars(accessToken);
  const existing = calendars.find((c) => c.summary.toLowerCase() === calendarTitle.toLowerCase());

  if (existing) {
    return existing;
  }

  // Create new dedicated calendar
  const createResponse = await fetch(`${GOOGLE_CALENDAR_BASE}/calendars`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: calendarTitle,
      description: 'Synchronized with College Schedule & iPhone 17 Widgets App',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Manila',
    }),
  });

  if (!createResponse.ok) {
    const errorData = await createResponse.json().catch(() => ({}));
    throw new Error(errorData.error?.message || 'Failed to create dedicated academic calendar');
  }

  const newCal = await createResponse.json();
  return {
    id: newCal.id,
    summary: newCal.summary,
    description: newCal.description,
    primary: false,
  };
}

export async function fetchCalendarEvents(
  accessToken: string,
  calendarId: string,
  maxResults = 25
): Promise<GoogleCalendarItem[]> {
  const now = new Date().toISOString();
  const url = `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(
    calendarId
  )}/events?timeMin=${encodeURIComponent(now)}&singleEvents=true&orderBy=startTime&maxResults=${maxResults}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to fetch calendar events');
  }

  const data = await response.json();
  return data.items || [];
}

const DAY_RRULE_MAP: Record<string, string> = {
  MON: 'MO',
  TUES: 'TU',
  WED: 'WE',
  THUR: 'TH',
  FRI: 'FR',
  SAT: 'SA',
  SUN: 'SU',
};

export async function syncScheduleToGoogle(
  accessToken: string,
  targetCalendarId: string,
  targetCalendarName: string,
  courses: Course[],
  assignments: Assignment[],
  onProgress?: (msg: string, current: number, total: number) => void
): Promise<SyncStats> {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Manila';
  const now = new Date();

  // Total items to sync
  const totalSessions = courses.reduce((acc, c) => acc + c.sessions.length, 0);
  const totalAssignments = assignments.length;
  const totalItems = totalSessions + totalAssignments;

  let currentProgress = 0;
  let classesSynced = 0;
  let assignmentsSynced = 0;

  // 1. Sync Class Sessions (as recurring weekly events)
  for (const course of courses) {
    for (const session of course.sessions) {
      currentProgress++;
      if (onProgress) {
        onProgress(`Adding recurring lecture for ${course.code}...`, currentProgress, totalItems);
      }

      const byDay = DAY_RRULE_MAP[session.day] || 'MO';
      const [sH, sM] = session.startTime.split(':').map(Number);
      const [eH, eM] = session.endTime.split(':').map(Number);

      const targetDayIndex = ['SUN', 'MON', 'TUES', 'WED', 'THUR', 'FRI', 'SAT'].indexOf(session.day);
      const currentDayIndex = now.getDay();
      let diff = targetDayIndex - currentDayIndex;
      if (diff < 0) diff += 7;

      const startDate = new Date(now);
      startDate.setDate(now.getDate() + diff);
      startDate.setHours(sH, sM, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(eH, eM, 0, 0);

      const payload = {
        summary: `📚 ${course.code}: ${course.title}`,
        location: session.room,
        description: `Course: ${course.title} (${course.code})\nInstructor: ${course.instructor}\nUnits: ${course.units} Credits\nPriority: ${course.priority.toUpperCase()}\nNotes: ${course.notes || 'None'}\n\nAuto-synced from College Schedule & iPhone 17 Widgets`,
        start: {
          dateTime: startDate.toISOString(),
          timeZone,
        },
        end: {
          dateTime: endDate.toISOString(),
          timeZone,
        },
        recurrence: [
          `RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=20261231T235959Z`,
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 15 },
            { method: 'popup', minutes: 60 },
          ],
        },
        colorId: '9', // Blueberry / Blue in Google Calendar palette
      };

      const res = await fetch(
        `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(targetCalendarId)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        classesSynced++;
      }
    }
  }

  // 2. Sync Assignments and Exams
  for (const assignment of assignments) {
    currentProgress++;
    if (onProgress) {
      onProgress(`Adding deadline: ${assignment.title}...`, currentProgress, totalItems);
    }

    const course = courses.find((c) => c.id === assignment.courseId);
    const [dH, dM] = (assignment.dueTime || '23:59').split(':').map(Number);
    const dueDate = new Date(`${assignment.dueDate}T00:00:00`);
    dueDate.setHours(dH, dM, 0, 0);

    const startDate = new Date(dueDate);
    startDate.setHours(dH > 0 ? dH - 1 : 0, dM, 0, 0);

    const isExam = assignment.type === 'exam' || assignment.type === 'quiz';

    const payload = {
      summary: `${isExam ? '📝 EXAM' : '⚠️ DEADLINE'}: ${assignment.title} (${course?.code || 'Course'})`,
      location: course?.room || 'Campus / Online Portal',
      description: `Type: ${assignment.type.toUpperCase()}\nCourse: ${course?.title || 'Academic'}\nPriority: ${assignment.priority.toUpperCase()}\nWeight: ${assignment.weightPercentage || 0}% of Final Grade\nStatus: ${assignment.status.toUpperCase()}\n\nDescription: ${assignment.description || 'N/A'}\n\nAuto-synced from College Schedule & iPhone 17 Widgets`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone,
      },
      end: {
        dateTime: dueDate.toISOString(),
        timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 120 }, // 2 hours
          { method: 'popup', minutes: 1440 }, // 1 day
          { method: 'popup', minutes: 2880 }, // 2 days
        ],
      },
      colorId: isExam ? '11' : assignment.priority === 'critical' ? '11' : '5', // Flamingo (red) or Banana (yellow)
    };

    const res = await fetch(
      `${GOOGLE_CALENDAR_BASE}/calendars/${encodeURIComponent(targetCalendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (res.ok) {
      assignmentsSynced++;
    }
  }

  return {
    calendarId: targetCalendarId,
    calendarName: targetCalendarName,
    classesSynced,
    assignmentsSynced,
    totalSynced: classesSynced + assignmentsSynced,
    calendarLink: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(targetCalendarId)}`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
