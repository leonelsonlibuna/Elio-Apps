import React, { useState } from 'react';
import { Course, PriorityLevel } from '../../types';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Flame,
  Clock,
  Layers,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { playNotificationChime } from '../../utils/audio';

interface CoursePrioritizationProps {
  courses: Course[];
  onUpdateCourses: (courses: Course[]) => void;
  onSelectCourse: (course: Course) => void;
}

export const CoursePrioritization: React.FC<CoursePrioritizationProps> = ({
  courses,
  onUpdateCourses,
  onSelectCourse,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Reorder helper
  const moveCourse = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= courses.length) return;

    const newCourses = [...courses];
    const [movedItem] = newCourses.splice(index, 1);
    newCourses.splice(targetIndex, 0, movedItem);

    // Update order sequence
    const updated = newCourses.map((c, i) => ({ ...c, order: i + 1 }));
    onUpdateCourses(updated);
    playNotificationChime('tink');
  };

  // Change priority level
  const setCoursePriority = (courseId: string, priority: PriorityLevel) => {
    const updated = courses.map((c) => (c.id === courseId ? { ...c, priority } : c));
    onUpdateCourses(updated);
    playNotificationChime('tink');
  };

  // Drag & drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newCourses = [...courses];
    const [movedItem] = newCourses.splice(draggedIndex, 1);
    newCourses.splice(index, 0, movedItem);

    const updated = newCourses.map((c, i) => ({ ...c, order: i + 1 }));
    onUpdateCourses(updated);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    playNotificationChime('tink');
  };

  return (
    <div id="course-prioritization-section" className="w-full space-y-5">
      {/* Header */}
      <div className="p-6 rounded-[32px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-semibold text-[#f5f5f7] tracking-tight">
              Drag-and-Drop Course Prioritization
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Rank your courses by academic urgency, exam weight, or difficulty to spotlight them on iPhone widgets.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>{courses.length} Active Courses Ranked</span>
        </div>
      </div>

      {/* Priority Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { level: 'critical', label: 'Critical Tier', desc: 'Core Major / Prerequisite', badge: 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.2)]' },
          { level: 'high', label: 'High Priority', desc: 'Heavy Study Load (3-4u)', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
          { level: 'medium', label: 'Medium Priority', desc: 'General Education / Elective', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
          { level: 'low', label: 'Standard Focus', desc: 'PE / Physical Activity', badge: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
        ].map((tier) => (
          <div key={tier.level} className="p-4 rounded-[24px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl text-xs shadow-md">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${tier.badge}`}>
              {tier.label}
            </span>
            <p className="text-[11px] text-zinc-400 mt-2">{tier.desc}</p>
          </div>
        ))}
      </div>

      {/* Interactive Drag and Drop Course List */}
      <div className="space-y-3">
        {courses.map((course, index) => (
          <div
            key={course.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`p-5 rounded-[28px] bg-zinc-900/40 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl shadow-lg ${
              draggedIndex === index
                ? 'opacity-40 border-dashed border-blue-500 scale-[0.99]'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            {/* Left: Drag Handle + Ranking Number + Course Details */}
            <div className="flex items-center gap-3.5 min-w-0">
              {/* Drag Grip icon */}
              <div
                className="cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-300 p-1"
                title="Drag to reorder priority"
              >
                <GripVertical className="w-5 h-5" />
              </div>

              {/* Priority Rank Circle */}
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-zinc-300 shrink-0">
                #{index + 1}
              </div>

              {/* Course Color Tag & Info */}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: course.color }}
                  />
                  <h3 className="font-semibold text-sm text-[#f5f5f7] truncate">{course.title}</h3>
                  <span className="text-xs font-mono text-zinc-400">({course.code})</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                  <span>{course.units} Credits</span>
                  <span>•</span>
                  <span>{course.instructor}</span>
                  <span>•</span>
                  <span>{course.sessions.map((s) => `${s.day} ${s.displayTime}`).join(' | ')}</span>
                </div>
              </div>
            </div>

            {/* Right: Priority Level Selector + Up/Down buttons + Actions */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
              {/* Priority Dropdown */}
              <select
                value={course.priority}
                onChange={(e) => setCoursePriority(course.id, e.target.value as PriorityLevel)}
                aria-label={`Set priority for ${course.title}`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase border bg-zinc-900/80 backdrop-blur-md focus:outline-none cursor-pointer ${
                  course.priority === 'critical'
                    ? 'text-red-400 border-red-500/40'
                    : course.priority === 'high'
                    ? 'text-amber-400 border-amber-500/40'
                    : course.priority === 'medium'
                    ? 'text-blue-400 border-blue-500/40'
                    : 'text-zinc-400 border-zinc-500/40'
                }`}
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              {/* Up/Down buttons for touch devices */}
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-full border border-white/10 backdrop-blur-md">
                <button
                  disabled={index === 0}
                  onClick={() => moveCourse(index, 'up')}
                  aria-label={`Move ${course.title} up in priority`}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white disabled:opacity-20 hover:bg-white/10"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={index === courses.length - 1}
                  onClick={() => moveCourse(index, 'down')}
                  aria-label={`Move ${course.title} down in priority`}
                  className="p-1.5 rounded-full text-zinc-400 hover:text-white disabled:opacity-20 hover:bg-white/10"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* View Syllabus Details */}
              <button
                onClick={() => onSelectCourse(course)}
                className="px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-300 border border-white/10 flex items-center gap-1.5 transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Details</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
