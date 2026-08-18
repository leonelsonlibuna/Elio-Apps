import React, { useState } from 'react';
import { Course, ClassSession, DayOfWeek } from '../../types';
import { DAYS_OF_WEEK, formatTime12h, timeStringToMinutes } from '../../utils/timeUtils';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  List,
  Grid,
  Sparkles,
  Info,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface WeeklyTimetableProps {
  courses: Course[];
  currentDay: DayOfWeek;
  currentTimeString: string;
  onSelectCourse: (course: Course) => void;
}

export const WeeklyTimetable: React.FC<WeeklyTimetableProps> = ({
  courses,
  currentDay,
  currentTimeString,
  onSelectCourse,
}) => {
  const [viewMode, setViewMode] = useState<'grid' | 'day' | 'list'>('grid');
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(currentDay);

  // Time grid slots from 8:00 AM (8.0) to 6:00 PM (18.0)
  const timeSlots = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
  ];

  const currentMinutes = timeStringToMinutes(currentTimeString);
  const monToFriDays: DayOfWeek[] = ['MON', 'TUES', 'WED', 'THUR', 'FRI'];

  // Flatten all sessions with course info
  const allSessions: { session: ClassSession; course: Course }[] = [];
  courses.forEach((course) => {
    course.sessions.forEach((session) => {
      allSessions.push({ session, course });
    });
  });

  return (
    <div id="weekly-schedule-view" className="w-full space-y-5">
      {/* Header & View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-[32px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold text-[#f5f5f7] tracking-tight">
              URS Morong • BS ECE Weekly Schedule
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            University of Rizal System (Morong Campus) • Bachelor of Science in Electronics Communication Engineering (BS ECE)
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md shadow-inner">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Mon–Fri Grid</span>
          </button>

          <button
            onClick={() => setViewMode('day')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'day'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Day View</span>
          </button>

          <button
            onClick={() => setViewMode('list')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Agenda List</span>
          </button>
        </div>
      </div>

      {/* Day Selector Pills (For Day & List view, or Quick Highlight) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {monToFriDays.map((day) => {
          const isToday = currentDay === day;
          const isSelected = selectedDay === day;
          const dayCount = allSessions.filter((s) => s.session.day === day).length;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 border backdrop-blur-xl ${
                isSelected
                  ? 'bg-white/15 text-white border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                  : 'bg-zinc-900/40 text-zinc-400 border-white/5 hover:bg-white/10 hover:text-zinc-200'
              }`}
            >
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span>{day}</span>
                  {isToday && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-400 uppercase shadow-[0_0_6px_rgba(59,130,246,0.3)]">
                      Today
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-zinc-500 font-normal">
                  {dayCount} {dayCount === 1 ? 'class' : 'classes'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 1. MONDAY TO FRIDAY GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="w-full overflow-x-auto rounded-[32px] bg-zinc-900/40 border border-white/10 p-6 backdrop-blur-xl shadow-2xl">
          <div className="min-w-[760px]">
            {/* Grid Header Columns */}
            <div className="grid grid-cols-6 gap-2 pb-3 border-b border-white/10 text-xs font-bold text-zinc-400 uppercase tracking-wider">
              <div className="text-center">Time</div>
              {monToFriDays.map((d) => (
                <div
                  key={d}
                  className={`text-center py-2 rounded-2xl ${
                    currentDay === d
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                      : 'text-zinc-300'
                  }`}
                >
                  <span>{d}</span>
                  {currentDay === d && (
                    <span className="block text-[9px] font-normal text-blue-300">● Today</span>
                  )}
                </div>
              ))}
            </div>

            {/* Time Rows */}
            <div className="relative mt-2 space-y-3">
              {timeSlots.slice(0, -1).map((slot, sIdx) => {
                const nextSlot = timeSlots[sIdx + 1];
                const slotStartMins = timeStringToMinutes(slot);
                const slotEndMins = timeStringToMinutes(nextSlot);

                return (
                  <div key={slot} className="grid grid-cols-6 gap-2 min-h-[72px] items-stretch">
                    {/* Time Label */}
                    <div className="text-right pr-3 text-xs font-mono text-zinc-500 pt-1 border-r border-white/5">
                      {formatTime12h(slot)}
                    </div>

                    {/* Columns for Monday to Friday */}
                    {monToFriDays.map((d) => {
                      // Find sessions starting or overlapping in this hour
                      const matchingSessions = allSessions.filter((item) => {
                        if (item.session.day !== d) return false;
                        const sStart = timeStringToMinutes(item.session.startTime);
                        const sEnd = timeStringToMinutes(item.session.endTime);
                        return sStart < slotEndMins && sEnd > slotStartMins;
                      });

                      return (
                        <div
                          key={d}
                          className={`rounded-2xl border transition-all p-1.5 flex flex-col justify-center backdrop-blur-md ${
                            currentDay === d
                              ? 'bg-zinc-800/30 border-white/10'
                              : 'bg-black/20 border-white/5'
                          }`}
                        >
                          {matchingSessions.map(({ session, course }) => {
                            const sStart = timeStringToMinutes(session.startTime);
                            const sEnd = timeStringToMinutes(session.endTime);
                            const isActive =
                              currentDay === d &&
                              currentMinutes >= sStart &&
                              currentMinutes < sEnd;

                            // Render main card if it starts in this hour slot
                            if (sStart >= slotStartMins && sStart < slotEndMins) {
                              return (
                                <div
                                  key={session.id}
                                  onClick={() => onSelectCourse(course)}
                                  className={`p-2.5 rounded-xl text-xs cursor-pointer hover:scale-[1.02] transition-all border shadow-md flex flex-col justify-between backdrop-blur-md ${
                                    isActive
                                      ? 'ring-2 ring-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                                      : ''
                                  }`}
                                  style={{
                                    backgroundColor: `${course.color}25`,
                                    borderColor: `${course.color}55`,
                                    color: '#ffffff',
                                  }}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span
                                      className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
                                      style={{
                                        backgroundColor: `${course.color}40`,
                                        color: '#ffffff',
                                      }}
                                    >
                                      {course.code}
                                    </span>
                                    {isActive && (
                                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_red]" />
                                    )}
                                  </div>

                                  <div className="font-bold text-xs leading-tight line-clamp-2">
                                    {course.title}
                                  </div>

                                  <div className="flex items-center justify-between text-[10px] text-zinc-300 mt-1 pt-1 border-t border-white/10 font-mono">
                                    <span>{session.displayTime}</span>
                                    <span className="truncate ml-1 font-sans">{session.room}</span>
                                  </div>
                                </div>
                              );
                            }

                            // Secondary slot continuation
                            return (
                              <div
                                key={session.id}
                                className="text-[10px] text-zinc-500 font-mono italic text-center py-1"
                              >
                                ↓ ({course.code} continued)
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. DAY VIEW (Hourly Detail for Selected Day) */}
      {viewMode === 'day' && (
        <div className="space-y-3">
          <div className="p-4 rounded-[28px] bg-zinc-900/40 border border-white/10 flex items-center justify-between backdrop-blur-xl shadow-xl">
            <span className="text-sm font-semibold text-white">
              {selectedDay} Detailed Schedule
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {allSessions.filter((s) => s.session.day === selectedDay).length} Sessions Scheduled
            </span>
          </div>

          <div className="space-y-2.5">
            {allSessions
              .filter((s) => s.session.day === selectedDay)
              .sort(
                (a, b) =>
                  timeStringToMinutes(a.session.startTime) -
                  timeStringToMinutes(b.session.startTime)
              )
              .map(({ session, course }) => {
                const sStart = timeStringToMinutes(session.startTime);
                const sEnd = timeStringToMinutes(session.endTime);
                const isActive =
                  currentDay === selectedDay &&
                  currentMinutes >= sStart &&
                  currentMinutes < sEnd;

                return (
                  <div
                    key={session.id}
                    onClick={() => onSelectCourse(course)}
                    className={`p-5 rounded-[28px] bg-zinc-900/40 border transition-all cursor-pointer hover:border-white/20 flex flex-col md:flex-row md:items-center justify-between gap-3 backdrop-blur-xl shadow-lg ${
                      isActive
                        ? 'border-blue-500/60 ring-1 ring-blue-500/40 bg-zinc-800/50 shadow-[0_0_16px_rgba(59,130,246,0.2)]'
                        : 'border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-bold text-xs shrink-0 shadow-md"
                        style={{
                          backgroundColor: `${course.color}25`,
                          border: `1px solid ${course.color}60`,
                          color: course.color,
                        }}
                      >
                        {course.code}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-white">{course.title}</h3>
                          {isActive && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                              Active Now
                            </span>
                          )}
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              course.priority === 'critical'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            }`}
                          >
                            {course.priority} Priority
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <strong className="text-zinc-200 font-mono">{session.displayTime}</strong>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                            <span>{session.room}</span>
                          </span>
                          <span>•</span>
                          <span>{course.instructor}</span>
                          <span>•</span>
                          <span>{course.units} Credits</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-zinc-200 border border-white/5 flex items-center gap-1 backdrop-blur-md">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Syllabus</span>
                        <ChevronRight className="w-3 h-3 text-zinc-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* 3. AGENDA LIST VIEW */}
      {viewMode === 'list' && (
        <div className="space-y-4">
          {monToFriDays.map((day) => {
            const daySessions = allSessions.filter((s) => s.session.day === day);
            if (daySessions.length === 0) return null;

            return (
              <div key={day} className="p-6 rounded-[32px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{day}</span>
                    {currentDay === day && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                        Today
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500">{daySessions.length} classes</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {daySessions.map(({ session, course }) => (
                    <div
                      key={session.id}
                      onClick={() => onSelectCourse(course)}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-white/20 cursor-pointer flex items-center justify-between transition-all backdrop-blur-md"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: course.color }}
                        />
                        <div className="min-w-0 truncate">
                          <div className="text-xs font-bold text-white truncate">{course.title}</div>
                          <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono">
                            <span>{session.displayTime}</span>
                            <span>•</span>
                            <span className="text-zinc-500 font-sans">{session.room}</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 text-zinc-300 shrink-0 ml-2 border border-white/5">
                        {course.code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
