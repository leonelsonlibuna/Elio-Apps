import React, { useState, useEffect, useMemo } from 'react';
import {
  Course,
  Assignment,
  DegreeProgress,
  DayOfWeek,
  SimulationState,
  WidgetSize,
  AppTheme,
  NotificationItem,
} from './types';
import {
  INITIAL_COURSES,
  INITIAL_ASSIGNMENTS,
  INITIAL_DEGREE_PROGRESS,
} from './data/initialData';
import {
  calculateCurrentStatus,
  getCurrentDayString,
  getCurrentTimeString,
  getTodayCourses,
} from './utils/timeUtils';
import { exportScheduleToICS } from './utils/icsExport';
import { playNotificationChime } from './utils/audio';

import { Navbar } from './components/Navbar';
import { IPhone17Frame } from './components/widgets/IPhone17Frame';
import { WeeklyTimetable } from './components/schedule/WeeklyTimetable';
import { CalendarSyncHub } from './components/calendar/CalendarSyncHub';
import { CoursePrioritization } from './components/priorities/CoursePrioritization';
import { DeadlineManager } from './components/deadlines/DeadlineManager';
import { SyllabusSyncModal } from './components/syllabus/SyllabusSyncModal';
import { DegreeTracker } from './components/degree/DegreeTracker';
import { NotificationBanner } from './components/notifications/NotificationBanner';
import { CourseDetailModal } from './components/CourseDetailModal';

export default function App() {
  // Local storage persisted state
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem('college_courses_v1');
    return saved ? JSON.parse(saved) : INITIAL_COURSES;
  });

  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    const saved = localStorage.getItem('college_assignments_v1');
    return saved ? JSON.parse(saved) : INITIAL_ASSIGNMENTS;
  });

  const [degreeProgress, setDegreeProgress] = useState<DegreeProgress>(() => {
    const saved = localStorage.getItem('college_degree_progress_v1');
    return saved ? JSON.parse(saved) : INITIAL_DEGREE_PROGRESS;
  });

  const [activeTab, setActiveTab] = useState<string>('widgets');
  const [activeWidgetSize, setActiveWidgetSize] = useState<WidgetSize>('medium');
  const [theme, setTheme] = useState<AppTheme>('dark-titanium');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Time & Simulation State
  const [simulationState, setSimulationState] = useState<SimulationState>({
    isSimulated: true, // Default to a populated schedule slot so widgets show rich live content immediately
    simulatedDay: 'TUES',
    simulatedTime: '08:15',
  });

  const [realClock, setRealClock] = useState<{ day: DayOfWeek; time: string }>({
    day: getCurrentDayString(),
    time: getCurrentTimeString(),
  });

  // Notifications Queue
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Update clock every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRealClock({
        day: getCurrentDayString(),
        time: getCurrentTimeString(),
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('college_courses_v1', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('college_assignments_v1', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('college_degree_progress_v1', JSON.stringify(degreeProgress));
  }, [degreeProgress]);

  // Current Active Day & Time (either simulated or real)
  const currentDay = simulationState.isSimulated ? simulationState.simulatedDay : realClock.day;
  const currentTimeString = simulationState.isSimulated
    ? simulationState.simulatedTime
    : realClock.time;

  // Real-time status calculation
  const statusInfo = useMemo(() => {
    return calculateCurrentStatus(courses, currentDay, currentTimeString);
  }, [courses, currentDay, currentTimeString]);

  // Today's course schedule
  const todayCourses = useMemo(() => {
    return getTodayCourses(courses, currentDay);
  }, [courses, currentDay]);

  // Urgent pending assignments
  const urgentAssignments = useMemo(() => {
    return assignments
      .filter((a) => a.status !== 'completed')
      .sort((a, b) => {
        // Critical / High priority first, then closest due date
        const pOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
        return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
      });
  }, [assignments]);

  // Check and trigger deadline notifications
  useEffect(() => {
    const uncompletedUrgent = assignments.filter(
      (a) => a.status !== 'completed' && (a.priority === 'critical' || a.priority === 'high')
    );

    if (uncompletedUrgent.length > 0 && notifications.length === 0) {
      const first = uncompletedUrgent[0];
      const course = courses.find((c) => c.id === first.courseId);

      setNotifications([
        {
          id: `alert-${first.id}`,
          title: `Deadline Alert: ${first.title}`,
          body: `Due ${first.dueDate} at ${first.dueTime} (${course?.code || 'Course'}). Weight: ${
            first.weightPercentage || 5
          }% of total grade.`,
          timestamp: 'Just now',
          read: false,
          type: 'urgent',
        },
      ]);
    }
  }, [assignments, courses]);

  // Handlers
  const handleToggleAssignment = (id: string) => {
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: a.status === 'completed' ? 'pending' : 'completed',
              completedAt: a.status === 'completed' ? undefined : new Date().toISOString(),
            }
          : a
      )
    );
  };

  const handleAddAssignment = (newAssignment: Omit<Assignment, 'id'>) => {
    const created: Assignment = {
      ...newAssignment,
      id: `asg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setAssignments((prev) => [created, ...prev]);

    // Push notification alert
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: `New Assignment Alert: ${created.title}`,
        body: `Due on ${created.dueDate} at ${created.dueTime}. Added to iOS Widget radar.`,
        timestamp: 'Just now',
        read: false,
        type: 'deadline',
      },
      ...prev,
    ]);
  };

  const handleDeleteAssignment = (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    playNotificationChime('tink');
  };

  const handleImportSyllabusAssignments = (newItems: Omit<Assignment, 'id'>[]) => {
    const created: Assignment[] = newItems.map((item, idx) => ({
      ...item,
      id: `syllabus-asg-${Date.now()}-${idx}`,
    }));
    setAssignments((prev) => [...created, ...prev]);
  };

  const handleUpdateCourseGrading = (
    courseId: string,
    breakdown: { category: string; percentage: number }[],
    summary: string
  ) => {
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId
          ? {
              ...c,
              gradingBreakdown: breakdown,
              syllabusSummary: summary,
            }
          : c
      )
    );
  };

  const handleExportICS = () => {
    exportScheduleToICS(courses, assignments);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#f5f5f7] flex flex-col font-sans selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Ambient Frosted Background Glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px] pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-10 w-[450px] h-[450px] bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Top Notification Dropdown Alert */}
      <NotificationBanner
        notifications={notifications}
        onDismissNotification={(id) =>
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
        }
        onActionNotification={(id) =>
          setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
        }
      />

      {/* Main Navbar */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        simulationState={simulationState}
        onUpdateSimulation={(st) => setSimulationState((prev) => ({ ...prev, ...st }))}
        onExportICS={handleExportICS}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        urgentDeadlinesCount={urgentAssignments.length}
      />

      {/* Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {/* TAB 1: iPhone 17 Widgets Studio */}
        {activeTab === 'widgets' && (
          <div className="space-y-6">
            {/* Quick Status Bar */}
            <div className="p-4 rounded-[28px] bg-zinc-900/40 border border-white/10 flex flex-wrap items-center justify-between gap-3 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                </span>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                    Live Schedule Engine Active
                  </span>
                  <div className="text-sm font-semibold text-white">
                    {currentDay} • {currentTimeString} —{' '}
                    {statusInfo.status === 'in_class'
                      ? `In ${statusInfo.activeCourse?.code} (${statusInfo.minutesRemaining}m left in ${statusInfo.activeSession?.room})`
                      : statusInfo.nextSession
                      ? `Next: ${statusInfo.nextCourse?.code} in ${statusInfo.minutesUntilNext}m`
                      : 'All classes completed for today'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('schedule')}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-zinc-200 border border-white/5 transition-all backdrop-blur-md"
                >
                  View Mon–Fri Table
                </button>
              </div>
            </div>

            {/* iPhone 17 Interactive Device Simulator */}
            <IPhone17Frame
              statusInfo={statusInfo}
              todayCourses={todayCourses}
              urgentAssignments={urgentAssignments}
              degreeProgress={degreeProgress}
              courses={courses}
              currentDay={currentDay}
              currentTimeString={currentTimeString}
              onToggleAssignment={handleToggleAssignment}
              activeWidgetSize={activeWidgetSize}
              onSelectWidgetSize={setActiveWidgetSize}
              theme={theme}
              onSelectTheme={setTheme}
            />
          </div>
        )}

        {/* TAB 2: Monday to Friday Timetable Visualization */}
        {activeTab === 'schedule' && (
          <WeeklyTimetable
            courses={courses}
            currentDay={currentDay}
            currentTimeString={currentTimeString}
            onSelectCourse={setSelectedCourse}
          />
        )}

        {/* TAB: Google Calendar & iPhone Widget Sync Hub */}
        {activeTab === 'calendar' && (
          <CalendarSyncHub
            courses={courses}
            assignments={assignments}
          />
        )}

        {/* TAB 3: Course Prioritization & Drag-and-Drop */}
        {activeTab === 'priorities' && (
          <CoursePrioritization
            courses={courses}
            onUpdateCourses={setCourses}
            onSelectCourse={setSelectedCourse}
          />
        )}

        {/* TAB 4: Assignments & Notification Alerts */}
        {activeTab === 'deadlines' && (
          <DeadlineManager
            assignments={assignments}
            courses={courses}
            onToggleAssignment={handleToggleAssignment}
            onAddAssignment={handleAddAssignment}
            onDeleteAssignment={handleDeleteAssignment}
          />
        )}

        {/* TAB 5: Syllabus Document Sync */}
        {activeTab === 'syllabus' && (
          <SyllabusSyncModal
            courses={courses}
            onImportAssignments={handleImportSyllabusAssignments}
            onUpdateCourseGrading={handleUpdateCourseGrading}
          />
        )}

        {/* TAB 6: Degree Progress Tracker */}
        {activeTab === 'degree' && (
          <DegreeTracker
            degreeProgress={degreeProgress}
            courses={courses}
            onUpdateDegree={setDegreeProgress}
          />
        )}
      </main>

      {/* Course Details Modal */}
      <CourseDetailModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />

      {/* Footer */}
      <footer className="w-full border-t border-white/10 py-6 px-4 text-center text-xs text-zinc-500 select-none bg-zinc-950/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-zinc-400">BS Electronics & Communications Engineering • Academic Year 2026</span>
          <span className="flex items-center gap-1.5 font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
            iPhone 17 Pro Widget Engine • Frosted Glass Dark Mode
          </span>
        </div>
      </footer>
    </div>
  );
}
