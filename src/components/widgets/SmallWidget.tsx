import React from 'react';
import { Course, Assignment } from '../../types';
import { CurrentStatusInfo, formatTime12h } from '../../utils/timeUtils';
import { Clock, MapPin, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface SmallWidgetProps {
  statusInfo: CurrentStatusInfo;
  urgentAssignments: Assignment[];
  courses: Course[];
  theme: string;
}

export const SmallWidget: React.FC<SmallWidgetProps> = ({
  statusInfo,
  urgentAssignments,
  theme,
}) => {
  const isPastel = theme === 'aesthetic-pastel';
  const isOLED = theme === 'oled-black';

  const nextAssignment = urgentAssignments[0];

  return (
    <div
      id="widget-small-2x2"
      className={`relative w-full h-full p-4 rounded-[28px] flex flex-col justify-between select-none overflow-hidden transition-all duration-300 ${
        isPastel
          ? 'bg-rose-50/90 text-zinc-800 border border-rose-200/60 shadow-lg shadow-rose-100/50'
          : isOLED
          ? 'bg-black text-white border border-white/10 shadow-2xl'
          : 'bg-zinc-900/40 text-white border border-white/10 backdrop-blur-xl shadow-2xl ring-1 ring-white/5'
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            style={{
              backgroundColor:
                statusInfo.status === 'in_class'
                  ? statusInfo.activeCourse?.color || '#3b82f6'
                  : '#3b82f6',
            }}
          />
          <span
            className={`text-[11px] font-semibold tracking-wider uppercase ${
              isPastel ? 'text-rose-600' : 'text-zinc-400'
            }`}
          >
            {statusInfo.status === 'in_class'
              ? 'In Class'
              : statusInfo.status === 'upcoming_soon'
              ? 'Starting Soon'
              : statusInfo.status === 'break'
              ? 'Next Session'
              : 'Status'}
          </span>
        </div>

        {urgentAssignments.length > 0 && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              isPastel
                ? 'bg-rose-200 text-rose-800'
                : 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
            }`}
          >
            <AlertCircle className="w-2.5 h-2.5" />
            <span>{urgentAssignments.length}</span>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {statusInfo.status === 'in_class' && statusInfo.activeCourse ? (
        <div className="my-auto">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold"
              style={{
                backgroundColor: `${statusInfo.activeCourse.color}25`,
                color: statusInfo.activeCourse.color,
                border: `1px solid ${statusInfo.activeCourse.color}40`,
              }}
            >
              {statusInfo.activeCourse.code}
            </span>
          </div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 tracking-tight text-[#f5f5f7]">
            {statusInfo.activeCourse.title}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400">
            <MapPin className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="truncate">{statusInfo.activeSession?.room}</span>
          </div>
        </div>
      ) : statusInfo.nextCourse && statusInfo.nextSession ? (
        <div className="my-auto">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold"
              style={{
                backgroundColor: `${statusInfo.nextCourse.color}25`,
                color: statusInfo.nextCourse.color,
                border: `1px solid ${statusInfo.nextCourse.color}40`,
              }}
            >
              {statusInfo.nextCourse.code}
            </span>
            <span className="text-[10px] font-medium text-blue-400">
              in {statusInfo.minutesUntilNext}m
            </span>
          </div>
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 tracking-tight text-[#f5f5f7]">
            {statusInfo.nextCourse.title}
          </h3>
          <div className="flex items-center gap-1 mt-1 text-[11px] text-zinc-400">
            <Clock className="w-3 h-3 text-zinc-400 shrink-0" />
            <span className="truncate">{formatTime12h(statusInfo.nextSession.startTime)}</span>
          </div>
        </div>
      ) : (
        <div className="my-auto flex flex-col items-center justify-center text-center p-1">
          <div className={`p-2.5 rounded-full mb-1 ${isPastel ? 'bg-rose-100 text-rose-500' : 'bg-white/5 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]'}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-zinc-200">Free Block</span>
          <span className="text-[10px] text-zinc-400">No classes active</span>
        </div>
      )}

      {/* Bottom Progress Bar or Urgent Deadline indicator */}
      <div className="pt-1.5 border-t border-white/10 flex flex-col gap-1">
        {statusInfo.status === 'in_class' ? (
          <div>
            <div className="flex justify-between text-[10px] text-zinc-400 mb-0.5">
              <span>Progress</span>
              <span className="font-mono">{statusInfo.minutesRemaining}m left</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                style={{
                  width: `${statusInfo.progressPercent}%`,
                  backgroundColor: statusInfo.activeCourse?.color || '#3b82f6',
                }}
              />
            </div>
          </div>
        ) : nextAssignment ? (
          <div className="flex items-center justify-between text-[10px] truncate">
            <span className="text-zinc-400 truncate flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-blue-400 shrink-0" />
              <span className="truncate">{nextAssignment.title}</span>
            </span>
            <span className="text-blue-400 font-medium shrink-0 ml-1">Due soon</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[10px] text-zinc-400">
            <span>Schedule Synced</span>
            <span className="text-blue-400 font-medium">● Live</span>
          </div>
        )}
      </div>
    </div>
  );
};
