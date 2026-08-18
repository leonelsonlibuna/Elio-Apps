import React from 'react';
import { Course } from '../types';
import {
  BookOpen,
  MapPin,
  Clock,
  User,
  Mail,
  GraduationCap,
  PieChart,
  X,
  FileText,
  Flame,
} from 'lucide-react';

interface CourseDetailModalProps {
  course: Course | null;
  onClose: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({ course, onClose }) => {
  if (!course) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-[32px] bg-zinc-900/60 border border-white/20 p-6 md:p-8 backdrop-blur-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] space-y-5 max-h-[90vh] overflow-y-auto ring-1 ring-white/10">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-[20px] flex items-center justify-center font-mono font-bold text-sm shadow-md backdrop-blur-md"
              style={{
                backgroundColor: `${course.color}25`,
                border: `1px solid ${course.color}60`,
                color: course.color,
              }}
            >
              {course.code}
            </div>
            <div>
              <h3 className="text-base font-semibold text-white leading-tight">{course.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    course.priority === 'critical'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : course.priority === 'high'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}
                >
                  {course.priority} Priority
                </span>
                <span className="text-xs text-zinc-400 font-mono">{course.units} Credit Units</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructor & Location Row */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-[24px] bg-black/40 border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <User className="w-3.5 h-3.5 text-zinc-500" />
              <span>Instructor</span>
            </div>
            <div className="font-semibold text-white">{course.instructor}</div>
            {course.email && <div className="text-[11px] text-zinc-500 mt-0.5">{course.email}</div>}
          </div>

          <div className="p-4 rounded-[24px] bg-black/40 border border-white/5 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <span>Primary Room / Lab</span>
            </div>
            <div className="font-semibold text-white">{course.room}</div>
            <div className="text-[11px] text-blue-400 mt-0.5">Engineering Complex</div>
          </div>
        </div>

        {/* Class Sessions */}
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Weekly Class Meetings
          </span>
          <div className="space-y-2">
            {course.sessions.map((s) => (
              <div
                key={s.id}
                className="p-3 rounded-[20px] bg-white/5 border border-white/5 flex items-center justify-between text-xs backdrop-blur-md"
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="font-semibold text-white">{s.day}</span>
                  <span className="text-zinc-400 font-mono">({s.displayTime})</span>
                </div>
                <span className="font-mono text-zinc-300 bg-black/30 px-2.5 py-0.5 rounded-full text-[11px] border border-white/5">
                  {s.room}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Grading Breakdown */}
        {course.gradingBreakdown && (
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
              Syllabus Grading Breakdown
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              {course.gradingBreakdown.map((g, i) => (
                <div key={i} className="p-3 rounded-[20px] bg-black/40 border border-white/5 text-xs backdrop-blur-md">
                  <div className="flex justify-between font-medium text-zinc-300">
                    <span className="truncate">{g.category}</span>
                    <span className="font-mono text-blue-400 font-bold ml-1">
                      {g.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                      style={{ width: `${g.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Syllabus Description / Notes */}
        {course.syllabusSummary && (
          <div className="p-4 rounded-[24px] bg-white/5 border border-white/5 text-xs backdrop-blur-md">
            <span className="font-semibold text-zinc-300 block mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span>Syllabus Summary & Scope</span>
            </span>
            <p className="text-zinc-400 leading-relaxed">{course.syllabusSummary}</p>
          </div>
        )}

        {course.notes && (
          <div className="p-3.5 rounded-[20px] bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 backdrop-blur-md">
            <strong>Professor Note:</strong> {course.notes}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white transition-all backdrop-blur-md"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
