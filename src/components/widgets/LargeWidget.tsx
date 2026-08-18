import React from 'react';
import { Course, Assignment, DegreeProgress, DayOfWeek } from '../../types';
import { CurrentStatusInfo, formatTime12h, timeStringToMinutes } from '../../utils/timeUtils';
import {
  Clock,
  MapPin,
  Calendar,
  GraduationCap,
  Sparkles,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface LargeWidgetProps {
  statusInfo: CurrentStatusInfo;
  todayCourses: { course: Course; startTime: string; endTime: string; room: string; displayTime: string }[];
  urgentAssignments: Assignment[];
  degreeProgress: DegreeProgress;
  currentDay: DayOfWeek;
  currentTimeString: string;
  onToggleAssignment: (id: string) => void;
  theme: string;
}

export const LargeWidget: React.FC<LargeWidgetProps> = ({
  statusInfo,
  todayCourses,
  urgentAssignments,
  degreeProgress,
  currentDay,
  currentTimeString,
  onToggleAssignment,
  theme,
}) => {
  const isPastel = theme === 'aesthetic-pastel';
  const isOLED = theme === 'oled-black';

  const currentMinutes = timeStringToMinutes(currentTimeString);
  const degreePct = Math.round((degreeProgress.completedUnits / degreeProgress.totalUnitsRequired) * 100);

  return (
    <div
      id="widget-large-4x4"
      className={`relative w-full h-full p-5 md:p-6 rounded-[32px] flex flex-col justify-between select-none overflow-hidden transition-all duration-300 ${
        isPastel
          ? 'bg-rose-50/95 text-zinc-900 border border-rose-200/80 shadow-2xl shadow-rose-100/60'
          : isOLED
          ? 'bg-black text-white border border-white/10 shadow-2xl'
          : 'bg-zinc-900/40 text-white border border-white/10 backdrop-blur-xl shadow-2xl ring-1 ring-white/5'
      }`}
    >
      {/* 1. Header: Date + Live Countdown Banner */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
            <Calendar className={`w-4 h-4 ${isPastel ? 'text-rose-500' : 'text-blue-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-[#f5f5f7]">{currentDay} SCHEDULE</span>
              <span className="text-zinc-500 text-xs">•</span>
              <span className="text-xs font-mono text-zinc-400 font-medium">
                {formatTime12h(currentTimeString)}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              {todayCourses.length} classes scheduled today
            </p>
          </div>
        </div>

        {/* Degree Mini Gauge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <GraduationCap className="w-4 h-4 text-blue-400" />
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
              Degree
            </div>
            <div className="text-xs font-bold font-mono text-blue-400">{degreePct}%</div>
          </div>
        </div>
      </div>

      {/* 2. Today's Classes List */}
      <div className="my-2 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
          <span>Today's Sessions</span>
          {statusInfo.status === 'in_class' && (
            <span className="text-blue-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {statusInfo.minutesRemaining}m Remaining
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          {todayCourses.length > 0 ? (
            todayCourses.map((item, idx) => {
              const startMins = timeStringToMinutes(item.startTime);
              const endMins = timeStringToMinutes(item.endTime);
              const isActive = currentMinutes >= startMins && currentMinutes < endMins;
              const isPast = currentMinutes >= endMins;

              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-2.5 rounded-2xl text-xs transition-all backdrop-blur-md ${
                    isActive
                      ? isPastel
                        ? 'bg-rose-200/90 text-rose-950 font-bold shadow-md'
                        : 'bg-white/15 text-white font-semibold ring-1 ring-white/20 shadow-[0_0_12px_rgba(59,130,246,0.25)]'
                      : isPast
                      ? 'opacity-40 line-through'
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10 border border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.course.color }}
                    />
                    <div className="min-w-0 truncate">
                      <div className="truncate font-medium text-[#f5f5f7]">{item.course.title}</div>
                      <div className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        <span>{item.room}</span>
                        <span>•</span>
                        <span>{item.course.instructor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[11px] ml-2">
                    <span className="text-zinc-300">{item.displayTime}</span>
                    {isActive && (
                      <div className="text-[9px] text-blue-400 font-sans font-bold uppercase">
                        In Progress
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-3 rounded-2xl bg-white/5 text-center text-xs text-zinc-400">
              No classes today. Perfect day for assignment prep!
            </div>
          )}
        </div>
      </div>

      {/* 3. Deadlines & Assignments Checklist */}
      <div className="pt-2.5 border-t border-white/10">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Upcoming Deadlines ({urgentAssignments.length})</span>
          </span>
          <span className="text-[10px] text-zinc-400">Priority Ranked</span>
        </div>

        <div className="space-y-1.5">
          {urgentAssignments.slice(0, 2).map((assignment) => (
            <div
              key={assignment.id}
              onClick={() => onToggleAssignment(assignment.id)}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 cursor-pointer border border-white/5 transition-all text-xs backdrop-blur-md"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                    assignment.status === 'completed'
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'border-white/30 hover:border-white/60'
                  }`}
                >
                  {assignment.status === 'completed' && <Sparkles className="w-2.5 h-2.5" />}
                </div>
                <div className="min-w-0 truncate">
                  <div
                    className={`truncate font-medium ${
                      assignment.status === 'completed' ? 'line-through text-zinc-500' : 'text-[#f5f5f7]'
                    }`}
                  >
                    {assignment.title}
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                    <span className="capitalize">{assignment.type}</span>
                    <span>•</span>
                    <span className="text-red-400 font-medium">Due {assignment.dueDate}</span>
                  </div>
                </div>
              </div>

              <span
                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  assignment.priority === 'critical'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : assignment.priority === 'high'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}
              >
                {assignment.priority}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Bottom Degree & GPA Status Row */}
      <div className="pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <span>
            Target GPA: <strong className="text-white font-mono">{degreeProgress.targetGPA}</strong>
          </span>
          <span className="text-zinc-600">|</span>
          <span>
            Current: <strong className="text-blue-400 font-mono">{degreeProgress.currentGPA}</strong>
          </span>
        </div>

        <div className="text-right text-[10px] font-mono">
          {degreeProgress.completedUnits}/{degreeProgress.totalUnitsRequired} Units ({degreePct}%)
        </div>
      </div>
    </div>
  );
};
