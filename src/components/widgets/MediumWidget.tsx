import React from 'react';
import { Course, Assignment, DayOfWeek } from '../../types';
import { CurrentStatusInfo, formatTime12h, timeStringToMinutes } from '../../utils/timeUtils';
import { Clock, MapPin, Calendar, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';

interface MediumWidgetProps {
  statusInfo: CurrentStatusInfo;
  todayCourses: { course: Course; startTime: string; endTime: string; room: string; displayTime: string }[];
  urgentAssignments: Assignment[];
  currentDay: DayOfWeek;
  currentTimeString: string;
  theme: string;
}

export const MediumWidget: React.FC<MediumWidgetProps> = ({
  statusInfo,
  todayCourses,
  urgentAssignments,
  currentDay,
  currentTimeString,
  theme,
}) => {
  const isPastel = theme === 'aesthetic-pastel';
  const isOLED = theme === 'oled-black';

  const dayNames: Record<DayOfWeek, string> = {
    MON: 'Monday',
    TUES: 'Tuesday',
    WED: 'Wednesday',
    THUR: 'Thursday',
    FRI: 'Friday',
    SAT: 'Saturday',
    SUN: 'Sunday',
  };

  const currentMinutes = timeStringToMinutes(currentTimeString);

  return (
    <div
      id="widget-medium-4x2"
      className={`relative w-full h-full p-4 rounded-[28px] flex flex-col justify-between select-none overflow-hidden transition-all duration-300 ${
        isPastel
          ? 'bg-rose-50/95 text-zinc-900 border border-rose-200/70 shadow-xl shadow-rose-100/50'
          : isOLED
          ? 'bg-black text-white border border-white/10 shadow-2xl'
          : 'bg-zinc-900/40 text-white border border-white/10 backdrop-blur-xl shadow-2xl ring-1 ring-white/5'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Calendar className={`w-3.5 h-3.5 ${isPastel ? 'text-rose-500' : 'text-blue-400'}`} />
            <span className="text-xs font-semibold tracking-tight text-[#f5f5f7]">
              {dayNames[currentDay]}, {currentDay}
            </span>
          </div>
          <span className="text-zinc-500 text-xs">•</span>
          <span className="text-xs font-mono text-zinc-400 font-medium">
            {formatTime12h(currentTimeString)}
          </span>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          {statusInfo.status === 'in_class' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              LIVE CLASS
            </span>
          ) : statusInfo.status === 'upcoming_soon' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
              IN {statusInfo.minutesUntilNext}M
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-white/5 text-zinc-400 border border-white/5">
              {todayCourses.length} {todayCourses.length === 1 ? 'class' : 'classes'} today
            </span>
          )}

          {urgentAssignments.length > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.3)]">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{urgentAssignments.length} due</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content: 2 Columns (Timeline List + Active Spotlight) */}
      <div className="grid grid-cols-12 gap-3 my-1">
        {/* Left Column: Today's Class Timeline List */}
        <div className="col-span-7 flex flex-col gap-1.5 justify-center">
          {todayCourses.length > 0 ? (
            todayCourses.slice(0, 3).map((item, idx) => {
              const startMins = timeStringToMinutes(item.startTime);
              const endMins = timeStringToMinutes(item.endTime);
              const isActive = currentMinutes >= startMins && currentMinutes < endMins;
              const isPast = currentMinutes >= endMins;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-2xl text-xs transition-all ${
                    isActive
                      ? isPastel
                        ? 'bg-rose-200/80 text-rose-950 font-semibold shadow-sm'
                        : 'bg-white/15 text-white font-semibold ring-1 ring-white/20 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                      : isPast
                      ? 'opacity-45 line-through decoration-zinc-500'
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.course.color }}
                    />
                    <span className="truncate">{item.course.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-1 text-[11px] font-mono text-zinc-400">
                    <span>{item.startTime}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse ml-0.5" />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 rounded-2xl bg-white/5 flex items-center gap-2 text-xs text-zinc-400">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>No lectures scheduled for {dayNames[currentDay]}.</span>
            </div>
          )}
        </div>

        {/* Right Column: Active Card / Up Next Spotlight */}
        <div className="col-span-5 flex flex-col justify-center">
          {statusInfo.status === 'in_class' && statusInfo.activeCourse ? (
            <div
              className="p-3 rounded-[20px] flex flex-col justify-between h-full relative overflow-hidden backdrop-blur-md"
              style={{
                backgroundColor: isPastel ? '#fff' : `${statusInfo.activeCourse.color}20`,
                border: `1px solid ${statusInfo.activeCourse.color}40`,
              }}
            >
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-blue-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
                  Active Now
                </span>
                <h4 className="font-semibold text-xs leading-tight line-clamp-1 mt-0.5 text-[#f5f5f7]">
                  {statusInfo.activeCourse.title}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-zinc-400 shrink-0" />
                  <span className="truncate">{statusInfo.activeSession?.room}</span>
                </div>
              </div>

              <div className="mt-1">
                <div className="flex justify-between text-[9px] text-zinc-400 mb-0.5 font-mono">
                  <span>{statusInfo.progressPercent}%</span>
                  <span>{statusInfo.minutesRemaining}m left</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                    style={{
                      width: `${statusInfo.progressPercent}%`,
                      backgroundColor: statusInfo.activeCourse.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : statusInfo.nextCourse && statusInfo.nextSession ? (
            <div className="p-3 rounded-[20px] bg-white/5 border border-white/10 flex flex-col justify-between h-full backdrop-blur-md">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
                  Up Next • {statusInfo.minutesUntilNext}m
                </span>
                <h4 className="font-semibold text-xs leading-tight line-clamp-1 mt-0.5 text-[#f5f5f7]">
                  {statusInfo.nextCourse.title}
                </h4>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  <span>{formatTime12h(statusInfo.nextSession.startTime)}</span>
                  <span>• {statusInfo.nextSession.room}</span>
                </div>
              </div>
              <div className="text-[10px] text-zinc-400 flex items-center justify-between mt-1 pt-1 border-t border-white/5">
                <span>{statusInfo.nextCourse.code}</span>
                <ChevronRight className="w-3 h-3 text-zinc-500" />
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-[20px] bg-white/5 border border-white/10 flex flex-col justify-center items-center text-center h-full backdrop-blur-md">
              <CheckCircle2 className="w-5 h-5 text-blue-400 mb-1" />
              <span className="text-[11px] font-semibold text-zinc-200">Done for Today</span>
              <span className="text-[9px] text-zinc-400">Syllabus synced</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Ticker: Upcoming Deadline */}
      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
        {urgentAssignments.length > 0 ? (
          <div className="flex items-center gap-1.5 truncate text-zinc-300">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span className="font-semibold text-red-400">Due:</span>
            <span className="truncate">{urgentAssignments[0].title}</span>
            <span className="text-zinc-500 text-[10px] shrink-0 font-mono">
              ({urgentAssignments[0].dueDate.slice(5)})
            </span>
          </div>
        ) : (
          <div className="text-zinc-400 text-[10px] flex items-center justify-between w-full">
            <span>All assignments up to date</span>
            <span className="text-blue-400 font-medium">Academic Calendar Active</span>
          </div>
        )}
      </div>
    </div>
  );
};
