import React, { useState } from 'react';
import { DegreeProgress, Course } from '../../types';
import {
  GraduationCap,
  TrendingUp,
  Award,
  BookOpen,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Flame,
} from 'lucide-react';
import { playNotificationChime } from '../../utils/audio';

interface DegreeTrackerProps {
  degreeProgress: DegreeProgress;
  courses: Course[];
  onUpdateDegree: (progress: DegreeProgress) => void;
}

export const DegreeTracker: React.FC<DegreeTrackerProps> = ({
  degreeProgress,
  courses,
  onUpdateDegree,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [university, setUniversity] = useState(degreeProgress.university || 'University of Rizal System (URS)');
  const [campus, setCampus] = useState(degreeProgress.campus || 'Morong, Rizal Campus');
  const [major, setMajor] = useState(degreeProgress.major || 'Electronics Communication Engineering');
  const [degreeType, setDegreeType] = useState(degreeProgress.degreeType || 'Bachelor of Science in Electronics Communication Engineering (BS ECE)');
  const [academicYear, setAcademicYear] = useState(degreeProgress.academicYear || '3rd Year');
  const [semester, setSemester] = useState(degreeProgress.semester || '1st Semester');
  const [completedUnits, setCompletedUnits] = useState(degreeProgress.completedUnits);
  const [totalUnits, setTotalUnits] = useState(degreeProgress.totalUnitsRequired);
  const [targetGPA, setTargetGPA] = useState(degreeProgress.targetGPA);
  const [currentGPA, setCurrentGPA] = useState(degreeProgress.currentGPA);

  const degreePct = Math.min(100, Math.round((degreeProgress.completedUnits / degreeProgress.totalUnitsRequired) * 100));
  const currentSemesterUnits = courses.reduce((acc, c) => acc + c.units, 0);
  const unitsRemaining = degreeProgress.totalUnitsRequired - degreeProgress.completedUnits;

  // Year level milestones
  const milestones = [
    { label: '1st Year (Freshman)', units: 40, completed: degreeProgress.completedUnits >= 40 },
    { label: '2nd Year (Sophomore)', units: 80, completed: degreeProgress.completedUnits >= 80 },
    { label: '3rd Year (Junior)', units: 122, completed: degreeProgress.completedUnits >= 122 },
    { label: '4th Year (Senior/Graduation)', units: degreeProgress.totalUnitsRequired, completed: degreeProgress.completedUnits >= degreeProgress.totalUnitsRequired },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateDegree({
      ...degreeProgress,
      university,
      campus,
      major,
      degreeType,
      academicYear,
      semester,
      completedUnits: Number(completedUnits),
      totalUnitsRequired: Number(totalUnits),
      targetGPA: Number(targetGPA),
      currentGPA: Number(currentGPA),
      currentSemesterUnits,
    });
    setIsEditing(false);
    playNotificationChime('complete');
  };

  return (
    <div id="degree-tracker-section" className="w-full space-y-5">
      {/* Header */}
      <div className="p-6 rounded-[32px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-[#f5f5f7] tracking-tight">
                  {degreeProgress.university || 'University of Rizal System (URS)'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {degreeProgress.campus || 'Morong Campus'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            {degreeProgress.degreeType} • {degreeProgress.academicYear}, {degreeProgress.semester}
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 text-xs font-medium text-zinc-200 border border-white/10 transition-all backdrop-blur-md"
        >
          {isEditing ? 'Cancel Edit' : 'Edit Degree Progress'}
        </button>
      </div>

      {/* Main Progress Bar & Hero Metric Card */}
      <div className="p-6 md:p-8 rounded-[32px] bg-zinc-900/40 border border-white/10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Background gradient glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Overall Degree Completion</span>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl md:text-6xl font-bold font-mono tracking-tight text-[#f5f5f7]">
                {degreePct}%
              </span>
              <span className="text-sm font-medium text-zinc-400">
                ({degreeProgress.completedUnits} of {degreeProgress.totalUnitsRequired} units completed)
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1.5">
              You need <strong className="text-white font-mono">{unitsRemaining} units</strong> remaining to complete your engineering bachelor degree.
            </p>
          </div>

          {/* GPA Stats Capsule */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            <div className="p-4 rounded-[24px] bg-black/40 border border-white/10 text-center backdrop-blur-md shadow-inner">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Current GPA</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">
                {degreeProgress.currentGPA}
              </div>
              <div className="text-[10px] text-zinc-500">Scale: 4.00</div>
            </div>

            <div className="p-4 rounded-[24px] bg-black/40 border border-white/10 text-center backdrop-blur-md shadow-inner">
              <div className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Target GPA</div>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-0.5">
                {degreeProgress.targetGPA}
              </div>
              <div className="text-[10px] text-zinc-500">Cum Laude Goal</div>
            </div>
          </div>
        </div>

        {/* Big Progress Bar */}
        <div className="mt-6">
          <div className="w-full h-3.5 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 transition-all duration-1000 shadow-[0_0_12px_rgba(59,130,246,0.5)]"
              style={{ width: `${degreePct}%` }}
            />
          </div>
        </div>

        {/* Milestone Steps */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          {milestones.map((m, i) => (
            <div
              key={i}
              className={`p-4 rounded-[24px] border transition-all text-xs backdrop-blur-md ${
                m.completed
                  ? 'bg-blue-950/20 border-blue-500/30 text-zinc-200 shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                  : 'bg-black/30 border-white/5 text-zinc-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold">{m.label}</span>
                {m.completed ? (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                ) : (
                  <span className="text-[10px] font-mono text-zinc-500">{m.units}u</span>
                )}
              </div>
              <div className="text-[11px] text-zinc-400">
                {m.completed ? 'Completed 100%' : 'In Progress'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Current Semester Load & Unit Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-[28px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Current Semester Load</span>
            <BookOpen className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {currentSemesterUnits} Units
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Across {courses.length} enrolled subjects
          </div>
        </div>

        <div className="p-5 rounded-[28px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Estimated Semesters Left</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {Math.ceil(unitsRemaining / 21)} Semesters
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Based on ~21 units/term pacing
          </div>
        </div>

        <div className="p-5 rounded-[28px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span>Academic Honors Track</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            Dean's List Eligible
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Current GPA ({degreeProgress.currentGPA}) exceeds 3.50 cutoff
          </div>
        </div>
      </div>

      {/* Edit Degree Progress Modal */}
      {isEditing && (
        <form onSubmit={handleSave} className="p-6 rounded-[32px] bg-zinc-900/95 border border-white/20 space-y-4 backdrop-blur-2xl shadow-2xl">
          <h3 className="text-sm font-semibold text-white">Edit Academic Program & Degree Requirements</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">University Name</label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="University of Rizal System (URS)"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Campus</label>
              <input
                type="text"
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                placeholder="Morong, Rizal Campus"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Degree Title</label>
              <input
                type="text"
                value={degreeType}
                onChange={(e) => setDegreeType(e.target.value)}
                placeholder="Bachelor of Science (BS ECE)"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Major / Specialization</label>
              <input
                type="text"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                placeholder="Electronics Communication Engineering"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Academic Year & Term</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="3rd Year"
                  className="w-1/2 px-3 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white"
                />
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="1st Semester"
                  className="w-1/2 px-3 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Completed Units</label>
              <input
                type="number"
                value={completedUnits}
                onChange={(e) => setCompletedUnits(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Total Required Units</label>
              <input
                type="number"
                value={totalUnits}
                onChange={(e) => setTotalUnits(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Current GPA</label>
              <input
                type="number"
                step="0.01"
                value={currentGPA}
                onChange={(e) => setCurrentGPA(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Target GPA</label>
              <input
                type="number"
                step="0.01"
                value={targetGPA}
                onChange={(e) => setTargetGPA(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-black/50 border border-white/15 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-full bg-white/5 text-xs font-medium text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/30"
            >
              Save Degree Progress
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
