import React from 'react';
import { Course, Assignment } from '../../types';
import { CurrentStatusInfo, formatTime12h } from '../../utils/timeUtils';
import { Clock, MapPin, Sparkles, BookOpen, AlertCircle } from 'lucide-react';

interface LockScreenWidgetProps {
  statusInfo: CurrentStatusInfo;
  urgentAssignments: Assignment[];
  courses: Course[];
  theme: string;
}

export const LockScreenWidget: React.FC<LockScreenWidgetProps> = ({
  statusInfo,
  urgentAssignments,
}) => {
  return (
    <div className="w-full flex flex-col gap-3">
      {/* 1. Rectangular Lock Screen Live Activity Widget */}
      <div className="w-full p-4 rounded-[28px] bg-zinc-900/50 backdrop-blur-2xl border border-white/20 text-white shadow-2xl flex items-center justify-between ring-1 ring-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-[20px] flex items-center justify-center shrink-0 shadow-inner"
            style={{
              backgroundColor: statusInfo.activeCourse
                ? `${statusInfo.activeCourse.color}25`
                : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${statusInfo.activeCourse?.color || 'rgba(255,255,255,0.2)'}`,
            }}
          >
            {statusInfo.status === 'in_class' ? (
              <BookOpen
                className="w-5 h-5"
                style={{ color: statusInfo.activeCourse?.color || '#3b82f6' }}
              />
            ) : (
              <Clock className="w-5 h-5 text-blue-400" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                {statusInfo.status === 'in_class' ? 'Class In Progress' : 'Academic Schedule'}
              </span>
              {statusInfo.status === 'in_class' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
              )}
            </div>
            <h4 className="font-semibold text-sm leading-tight truncate text-[#f5f5f7]">
              {statusInfo.activeCourse?.title || statusInfo.nextCourse?.title || 'No upcoming classes'}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
              <MapPin className="w-3 h-3 text-zinc-500 shrink-0" />
              <span className="truncate">
                {statusInfo.activeSession?.room || statusInfo.nextSession?.room || 'Campus'}
              </span>
              <span>•</span>
              <span className="font-mono text-zinc-300">
                {statusInfo.activeSession
                  ? `${statusInfo.minutesRemaining}m left`
                  : statusInfo.nextSession
                  ? `Starts ${formatTime12h(statusInfo.nextSession.startTime)}`
                  : 'Free'}
              </span>
            </div>
          </div>
        </div>

        {/* Live Progress Dial / Countdown Pill */}
        {statusInfo.status === 'in_class' ? (
          <div className="text-right shrink-0 pl-2">
            <div className="text-sm font-bold font-mono text-blue-400">
              {statusInfo.progressPercent}%
            </div>
            <div className="text-[9px] text-zinc-400 uppercase tracking-wider">Elapsed</div>
          </div>
        ) : statusInfo.nextSession ? (
          <div className="px-3 py-1.5 rounded-full bg-white/10 text-right shrink-0 border border-white/10 backdrop-blur-md">
            <div className="text-xs font-bold font-mono text-blue-400">
              in {statusInfo.minutesUntilNext}m
            </div>
          </div>
        ) : null}
      </div>

      {/* 2. Secondary Lockscreen Capsule: Next Deadline Alert */}
      {urgentAssignments.length > 0 && (
        <div className="w-full px-4 py-3 rounded-full bg-red-950/40 backdrop-blur-2xl border border-red-500/30 text-white flex items-center justify-between shadow-[0_0_12px_rgba(239,68,68,0.15)]">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <span className="text-xs font-medium truncate">
              <strong className="text-red-400">Due {urgentAssignments[0].dueDate.slice(5)}:</strong>{' '}
              {urgentAssignments[0].title}
            </span>
          </div>
          <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold bg-red-500/20 text-red-300 shrink-0 ml-2 border border-red-500/30">
            {urgentAssignments[0].dueTime}
          </span>
        </div>
      )}
    </div>
  );
};
