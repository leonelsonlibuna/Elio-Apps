import React from 'react';
import { Course, Assignment, DegreeProgress, DayOfWeek } from '../../types';
import { CurrentStatusInfo, formatTime12h, timeStringToMinutes } from '../../utils/timeUtils';
import { Clock, MapPin, AlertCircle, GraduationCap, Sparkles } from 'lucide-react';

interface StandByWidgetProps {
  statusInfo: CurrentStatusInfo;
  todayCourses: { course: Course; startTime: string; endTime: string; room: string; displayTime: string }[];
  urgentAssignments: Assignment[];
  degreeProgress: DegreeProgress;
  currentDay: DayOfWeek;
  currentTimeString: string;
}

export const StandByWidget: React.FC<StandByWidgetProps> = ({
  statusInfo,
  todayCourses,
  urgentAssignments,
  degreeProgress,
  currentDay,
  currentTimeString,
}) => {
  const currentMinutes = timeStringToMinutes(currentTimeString);
  const degreePct = Math.round((degreeProgress.completedUnits / degreeProgress.totalUnitsRequired) * 100);

  return (
    <div
      id="standby-mode-display"
      className="w-full max-w-4xl mx-auto p-6 md:p-8 rounded-[36px] bg-zinc-900/40 backdrop-blur-2xl text-white border border-white/10 shadow-2xl select-none ring-1 ring-white/5"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left Side: Massive OLED Typography Clock & Status */}
        <div className="flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 md:pr-8">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-semibold tracking-widest text-xs uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              STANDBY ACADEMIC DISPLAY
            </div>
            <div className="text-6xl md:text-7xl font-bold tracking-tighter font-mono text-zinc-100">
              {currentTimeString}
            </div>
            <div className="text-xl font-medium text-zinc-400 mt-1">
              {currentDay}, Semester 1 • 2026
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-zinc-400">BS ECE Completion</div>
                <div className="text-base font-bold font-mono text-white">{degreePct}% Completed</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-zinc-400">Current GPA</div>
              <div className="text-base font-bold font-mono text-blue-400">
                {degreeProgress.currentGPA} / 4.00
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Next Class & Today's Schedule Flow */}
        <div className="flex flex-col justify-between gap-4">
          {/* Active / Up Next Hero Card */}
          <div className="p-5 rounded-[28px] bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                {statusInfo.status === 'in_class' ? 'Class In Progress' : 'Up Next'}
              </span>
              <span className="text-xs font-mono text-zinc-400">
                {statusInfo.status === 'in_class'
                  ? `${statusInfo.minutesRemaining}m left`
                  : statusInfo.nextSession
                  ? `in ${statusInfo.minutesUntilNext}m`
                  : 'Free'}
              </span>
            </div>

            <h3 className="text-lg font-semibold truncate text-[#f5f5f7]">
              {statusInfo.activeCourse?.title || statusInfo.nextCourse?.title || 'No More Classes Today'}
            </h3>

            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>{statusInfo.activeSession?.room || statusInfo.nextSession?.room || 'Campus'}</span>
              <span>•</span>
              <span>
                {statusInfo.activeCourse?.instructor || statusInfo.nextCourse?.instructor || 'Ready'}
              </span>
            </div>

            {statusInfo.status === 'in_class' && (
              <div className="w-full h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden p-0.5">
                <div
                  className="h-full bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                  style={{ width: `${statusInfo.progressPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Today's Remaining Schedule */}
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Today's Sessions ({todayCourses.length})</span>
              <span className="text-zinc-500 text-[11px]">Timeline</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
              {todayCourses.map((item, idx) => {
                const startMins = timeStringToMinutes(item.startTime);
                const endMins = timeStringToMinutes(item.endTime);
                const isActive = currentMinutes >= startMins && currentMinutes < endMins;
                const isPast = currentMinutes >= endMins;

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2.5 rounded-2xl text-xs transition-all ${
                      isActive
                        ? 'bg-white/20 text-white font-semibold ring-1 ring-white/30 shadow-[0_0_10px_rgba(59,130,246,0.25)]'
                        : isPast
                        ? 'opacity-35 line-through'
                        : 'bg-white/5 text-zinc-300 border border-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.course.color }}
                      />
                      <span className="truncate">{item.course.title}</span>
                    </div>
                    <span className="font-mono text-zinc-400 shrink-0 text-[11px]">
                      {item.displayTime}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Urgent Deadline Footer */}
          {urgentAssignments.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-full bg-red-950/30 border border-red-500/20 text-xs backdrop-blur-md">
              <div className="flex items-center gap-2 truncate text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span className="truncate">
                  <strong>Due Soon:</strong> {urgentAssignments[0].title}
                </span>
              </div>
              <span className="font-mono text-[11px] text-red-400 shrink-0 font-bold px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">
                {urgentAssignments[0].dueDate.slice(5)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
