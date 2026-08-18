import React from 'react';
import { Course, Assignment } from '../../types';
import { CurrentStatusInfo, formatTime12h } from '../../utils/timeUtils';
import { BookOpen, MapPin, Sparkles } from 'lucide-react';

interface DynamicIslandProps {
  statusInfo: CurrentStatusInfo;
  isExpanded: boolean;
  onToggleExpand: () => void;
  urgentAssignments: Assignment[];
}

export const DynamicIslandExpanded: React.FC<DynamicIslandProps> = ({
  statusInfo,
  isExpanded,
  onToggleExpand,
  urgentAssignments,
}) => {
  if (!isExpanded) {
    // Compact pill preview on the iPhone notch
    return (
      <div
        onClick={onToggleExpand}
        className="cursor-pointer bg-black text-white h-9 px-4 rounded-full flex items-center justify-between gap-3 shadow-2xl ring-1 ring-white/10 hover:scale-105 transition-all duration-300 select-none"
        style={{ minWidth: '170px' }}
      >
        <div className="flex items-center gap-2">
          {statusInfo.status === 'in_class' ? (
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: statusInfo.activeCourse?.color || '#10b981' }}
            />
          ) : (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          )}
          <span className="text-xs font-bold font-mono truncate max-w-[80px]">
            {statusInfo.activeCourse?.code || statusInfo.nextCourse?.code || 'Academic'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-emerald-400">
          {statusInfo.status === 'in_class' ? (
            <span>{statusInfo.minutesRemaining}m</span>
          ) : statusInfo.nextSession ? (
            <span className="text-amber-300">{statusInfo.minutesUntilNext}m</span>
          ) : (
            <span className="text-zinc-400">Done</span>
          )}
        </div>
      </div>
    );
  }

  // Fully Expanded Live Activity Dropdown
  return (
    <div
      onClick={onToggleExpand}
      className="cursor-pointer bg-black/95 text-white w-[320px] p-4 rounded-[32px] shadow-2xl ring-1 ring-white/20 select-none animate-in fade-in zoom-in duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{
              backgroundColor: statusInfo.activeCourse
                ? `${statusInfo.activeCourse.color}30`
                : '#27272a',
            }}
          >
            <BookOpen
              className="w-4 h-4"
              style={{ color: statusInfo.activeCourse?.color || '#a1a1aa' }}
            />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
              {statusInfo.status === 'in_class' ? 'Live Academic Session' : 'Next Up on Schedule'}
            </span>
            <h4 className="font-bold text-xs leading-tight truncate max-w-[180px]">
              {statusInfo.activeCourse?.title || statusInfo.nextCourse?.title || 'Free Study Block'}
            </h4>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs font-mono font-bold text-emerald-400">
            {statusInfo.status === 'in_class'
              ? `${statusInfo.minutesRemaining}m left`
              : statusInfo.nextSession
              ? `in ${statusInfo.minutesUntilNext}m`
              : 'Synced'}
          </div>
        </div>
      </div>

      {/* Class Details Row */}
      <div className="flex items-center justify-between text-xs text-zinc-400 bg-white/5 p-2 rounded-xl my-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-zinc-400" />
          <span>{statusInfo.activeSession?.room || statusInfo.nextSession?.room || 'Campus'}</span>
        </div>
        <div className="font-mono text-zinc-300">
          {statusInfo.activeSession
            ? statusInfo.activeSession.displayTime
            : statusInfo.nextSession
            ? formatTime12h(statusInfo.nextSession.startTime)
            : 'No upcoming class'}
        </div>
      </div>

      {/* Progress Bar */}
      {statusInfo.status === 'in_class' && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
            <span>Progress: {statusInfo.progressPercent}%</span>
            <span>Ends {statusInfo.activeSession?.endTime}</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${statusInfo.progressPercent}%`,
                backgroundColor: statusInfo.activeCourse?.color || '#10b981',
              }}
            />
          </div>
        </div>
      )}

      {/* Assignment Teaser */}
      {urgentAssignments.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-red-300">
          <span className="truncate flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-red-400 shrink-0" />
            <span className="truncate">{urgentAssignments[0].title}</span>
          </span>
          <span className="font-mono text-[10px] shrink-0 ml-1">Due {urgentAssignments[0].dueDate.slice(5)}</span>
        </div>
      )}
    </div>
  );
};
