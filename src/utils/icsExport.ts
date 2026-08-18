import { Course, Assignment } from '../types';

export function generateICSContent(courses: Course[], assignments: Assignment[]): string {
  const dayMap: Record<string, string> = {
    MON: 'MO',
    TUES: 'TU',
    WED: 'WE',
    THUR: 'TH',
    FRI: 'FR',
    SAT: 'SA',
    SUN: 'SU',
  };

  const now = new Date();
  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const nowStr = formatICSDate(now);

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//College Schedule & iPhone 17 Widgets//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:College Academic Schedule & Deadlines',
    'X-WR-TIMEZONE:Asia/Manila',
  ];

  // 1. Export Recurring Class Sessions
  courses.forEach((course) => {
    course.sessions.forEach((session, sIdx) => {
      const byDay = dayMap[session.day] || 'MO';
      const [sH, sM] = session.startTime.split(':').map(Number);
      const [eH, eM] = session.endTime.split(':').map(Number);

      // Find next occurrence date of this day
      const targetDayIndex = ['SUN', 'MON', 'TUES', 'WED', 'THUR', 'FRI', 'SAT'].indexOf(session.day);
      const currentDayIndex = now.getDay();
      let diff = targetDayIndex - currentDayIndex;
      if (diff < 0) diff += 7;

      const startDate = new Date(now);
      startDate.setDate(now.getDate() + diff);
      startDate.setHours(sH, sM, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(eH, eM, 0, 0);

      const dtStart = formatICSDate(startDate);
      const dtEnd = formatICSDate(endDate);

      ics.push(
        'BEGIN:VEVENT',
        `UID:class-${course.id}-${sIdx}-${now.getTime()}@collegeschedule.app`,
        `DTSTAMP:${nowStr}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=20261231T235959Z`,
        `SUMMARY:${course.code} - ${course.title}`,
        `LOCATION:${session.room}`,
        `DESCRIPTION:Instructor: ${course.instructor}\\nUnits: ${course.units}\\nPriority: ${course.priority.toUpperCase()}\\nNotes: ${course.notes || 'N/A'}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT15M',
        'ACTION:DISPLAY',
        `DESCRIPTION:Reminder: ${course.code} in 15 minutes at ${session.room}`,
        'END:VALARM',
        'END:VEVENT'
      );
    });
  });

  // 2. Export Assignments & Deadlines
  assignments.forEach((assignment) => {
    const course = courses.find((c) => c.id === assignment.courseId);
    const [dH, dM] = (assignment.dueTime || '23:59').split(':').map(Number);
    const dueDate = new Date(`${assignment.dueDate}T00:00:00`);
    dueDate.setHours(dH, dM, 0, 0);

    const startDate = new Date(dueDate);
    startDate.setHours(dH - 1, dM, 0, 0);

    const dtStart = formatICSDate(startDate);
    const dtEnd = formatICSDate(dueDate);

    ics.push(
      'BEGIN:VEVENT',
      `UID:assignment-${assignment.id}@collegeschedule.app`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:⚠️ DUE: ${assignment.title} (${course?.code || 'Course'})`,
      `DESCRIPTION:Course: ${course?.title || 'Academic'}\\nType: ${assignment.type.toUpperCase()}\\nPriority: ${assignment.priority.toUpperCase()}\\nWeight: ${assignment.weightPercentage || 0}%\\nStatus: ${assignment.status}\\nDetails: ${assignment.description || ''}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT2H',
      'ACTION:DISPLAY',
      `DESCRIPTION:Deadline in 2 hours: ${assignment.title}`,
      'END:VALARM',
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

export function downloadICSFile(courses: Course[], assignments: Assignment[], filename = 'academic_schedule.ics') {
  const icsContent = generateICSContent(courses, assignments);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const exportScheduleToICS = downloadICSFile;
