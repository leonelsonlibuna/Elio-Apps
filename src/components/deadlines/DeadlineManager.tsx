import React, { useState } from 'react';
import { Assignment, Course, AssignmentType, PriorityLevel } from '../../types';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  Sparkles,
  Calendar,
  Layers,
  Filter,
  Check,
  Trash2,
  Bell,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playNotificationChime } from '../../utils/audio';

interface DeadlineManagerProps {
  assignments: Assignment[];
  courses: Course[];
  onToggleAssignment: (id: string) => void;
  onAddAssignment: (assignment: Omit<Assignment, 'id'>) => void;
  onDeleteAssignment: (id: string) => void;
}

export const DeadlineManager: React.FC<DeadlineManagerProps> = ({
  assignments,
  courses,
  onToggleAssignment,
  onAddAssignment,
  onDeleteAssignment,
}) => {
  const [filter, setFilter] = useState<'all' | 'urgent' | 'pending' | 'completed'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCourseId, setNewCourseId] = useState(courses[0]?.id || '');
  const [newDueDate, setNewDueDate] = useState('2026-08-20');
  const [newDueTime, setNewDueTime] = useState('23:59');
  const [newType, setNewType] = useState<AssignmentType>('assignment');
  const [newPriority, setNewPriority] = useState<PriorityLevel>('high');
  const [newWeight, setNewWeight] = useState(10);
  const [newDescription, setNewDescription] = useState('');

  const handleToggle = (id: string, currentStatus: string) => {
    onToggleAssignment(id);
    if (currentStatus !== 'completed') {
      // Trigger confetti celebration & sound
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'],
      });
      playNotificationChime('complete');
    } else {
      playNotificationChime('tink');
    }
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddAssignment({
      courseId: newCourseId || courses[0]?.id || 'c-circuits1',
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      dueDate: newDueDate,
      dueTime: newDueTime,
      type: newType,
      priority: newPriority,
      weightPercentage: Number(newWeight) || 5,
      status: 'pending',
      maxScore: 100,
    });

    setNewTitle('');
    setNewDescription('');
    setIsAddModalOpen(false);
    playNotificationChime('alert');
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'pending') return a.status !== 'completed';
    if (filter === 'completed') return a.status === 'completed';
    if (filter === 'urgent') return a.priority === 'critical' || a.priority === 'high';
    return true;
  });

  return (
    <div id="deadline-manager-section" className="w-full space-y-5">
      {/* Header */}
      <div className="p-6 rounded-[32px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Bell className="w-4 h-4 animate-pulse" />
            </div>
            <h2 className="text-lg font-semibold text-[#f5f5f7] tracking-tight">
              Assignments & Notification Alerts
            </h2>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time deadline tracking, syllabus problem sets, and interactive completion milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg shadow-blue-900/30 ring-1 ring-white/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Add Deadline</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Summary Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md shadow-inner">
          {(['all', 'urgent', 'pending', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                filter === tab
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab} (
              {
                assignments.filter((a) => {
                  if (tab === 'pending') return a.status !== 'completed';
                  if (tab === 'completed') return a.status === 'completed';
                  if (tab === 'urgent') return a.priority === 'critical' || a.priority === 'high';
                  return true;
                }).length
              }
              )
            </button>
          ))}
        </div>

        <span className="text-xs text-zinc-400 font-mono">
          {assignments.filter((a) => a.status === 'completed').length} of {assignments.length} Completed
        </span>
      </div>

      {/* Assignment List */}
      <div className="space-y-3">
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map((assignment) => {
            const course = courses.find((c) => c.id === assignment.courseId);
            const isCompleted = assignment.status === 'completed';

            return (
              <div
                key={assignment.id}
                className={`p-5 rounded-[28px] bg-zinc-900/40 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl shadow-lg ${
                  isCompleted
                    ? 'border-emerald-500/30 bg-zinc-900/20 opacity-60'
                    : assignment.priority === 'critical'
                    ? 'border-red-500/40 ring-1 ring-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                    : 'border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left: Checkbox + Title + Metadata */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    onClick={() => handleToggle(assignment.id, assignment.status)}
                    aria-label={`Mark ${assignment.title} as ${isCompleted ? 'pending' : 'completed'}`}
                    className={`w-6 h-6 rounded-full border mt-0.5 flex items-center justify-center transition-all ${
                      isCompleted
                        ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-500/30'
                        : 'border-white/30 hover:border-blue-400 bg-black/40'
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className={`font-semibold text-sm text-[#f5f5f7] truncate ${
                          isCompleted ? 'line-through text-zinc-500' : ''
                        }`}
                      >
                        {assignment.title}
                      </h3>

                      {course && (
                        <span
                          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${course.color}25`,
                            color: course.color,
                          }}
                        >
                          {course.code}
                        </span>
                      )}

                      <span
                        className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          assignment.priority === 'critical'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 shadow-[0_0_6px_rgba(239,68,68,0.3)]'
                            : assignment.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        {assignment.priority}
                      </span>
                    </div>

                    {assignment.description && (
                      <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                        {assignment.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 mt-2 font-mono">
                      <span className="flex items-center gap-1 text-red-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          Due: {assignment.dueDate} at {assignment.dueTime}
                        </span>
                      </span>
                      <span>•</span>
                      <span className="capitalize text-zinc-300 font-sans">{assignment.type}</span>
                      {assignment.weightPercentage && (
                        <>
                          <span>•</span>
                          <span>{assignment.weightPercentage}% Course Grade</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                  <button
                    onClick={() => onDeleteAssignment(assignment.id)}
                    aria-label={`Delete ${assignment.title}`}
                    className="p-2 rounded-full text-zinc-500 hover:text-red-400 hover:bg-white/5 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 rounded-[32px] bg-zinc-900/40 border border-white/5 text-center text-zinc-400 backdrop-blur-xl">
            <CheckCircle2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-sm font-semibold">No assignments matching this filter.</p>
            <p className="text-xs text-zinc-500 mt-1">You are all caught up!</p>
          </div>
        )}
      </div>

      {/* Add Assignment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-[32px] bg-zinc-900/95 border border-white/15 p-6 shadow-2xl space-y-4 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-400" />
                <span>Add Assignment or Exam Deadline</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Assignment / Exam Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Problem Set 4: Op-Amp Feedback Circuits"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-sm text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Course</label>
                  <select
                    value={newCourseId}
                    onChange={(e) => setNewCourseId(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as AssignmentType)}
                    className="w-full px-3 py-2 rounded-2xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none"
                  >
                    <option value="assignment">Assignment / Problem Set</option>
                    <option value="lab">Lab Report</option>
                    <option value="quiz">Quiz</option>
                    <option value="exam">Midterm / Final Exam</option>
                    <option value="project">Course Project</option>
                    <option value="reading">Reading / Reflection</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Due Time</label>
                  <input
                    type="time"
                    required
                    value={newDueTime}
                    onChange={(e) => setNewDueTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-2xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full px-3 py-2 rounded-2xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none uppercase"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Description / Topic Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional details, chapter references, group members..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-2xl bg-black/50 border border-white/15 text-xs text-white focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-zinc-400 hover:text-white bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-full text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/30"
                >
                  Save & Notify Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
