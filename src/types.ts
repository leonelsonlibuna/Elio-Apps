export type DayOfWeek = 'MON' | 'TUES' | 'WED' | 'THUR' | 'FRI' | 'SAT' | 'SUN';

export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

export type AssignmentType = 'assignment' | 'lab' | 'quiz' | 'exam' | 'project' | 'reading';

export type AssignmentStatus = 'pending' | 'in_progress' | 'completed';

export interface ClassSession {
  id: string;
  courseId: string;
  day: DayOfWeek;
  startTime: string; // e.g. "08:30" (24-hour format "08:30")
  endTime: string;   // e.g. "10:00"
  displayTime: string; // e.g. "8:30 - 10:00"
  room: string;
  building?: string;
  isLab?: boolean;
}

export interface GradingCategory {
  category: string;
  percentage: number;
}

export interface Course {
  id: string;
  code: string;        // e.g. "ECE 312"
  title: string;       // e.g. "Electronics Devices and Circuits"
  instructor: string;  // e.g. "Engr. Dela Cruz"
  email?: string;
  room: string;
  units: number;       // credits e.g. 4
  color: string;       // Hex or Tailwind class
  glowColor: string;
  priority: PriorityLevel;
  order: number;
  sessions: ClassSession[];
  gradingBreakdown?: GradingCategory[];
  syllabusSummary?: string;
  notes?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  dueDate: string; // ISO date "2026-08-20"
  dueTime: string; // "23:59" or "17:00"
  weightPercentage?: number;
  priority: PriorityLevel;
  type: AssignmentType;
  status: AssignmentStatus;
  scoreEarned?: number;
  maxScore?: number;
  completedAt?: string;
}

export interface DegreeProgress {
  university?: string;
  campus?: string;
  college?: string;
  major: string;
  degreeType: string;
  totalUnitsRequired: number;
  completedUnits: number;
  currentSemesterUnits: number;
  currentGPA: number;
  targetGPA: number;
  academicYear: string;
  semester: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  courseId?: string;
  assignmentId?: string;
  read: boolean;
  type: 'urgent' | 'upcoming' | 'info' | 'completed';
  timeBadge?: string;
}

export type WidgetSize = 'small' | 'medium' | 'large' | 'lockscreen' | 'dynamic-island' | 'standby';

export type AppTheme = 'dark-titanium' | 'oled-black' | 'midnight-indigo' | 'cyber-emerald' | 'aesthetic-pastel';

export interface WidgetConfig {
  activeWidgetSize: WidgetSize;
  theme: AppTheme;
  showSeconds: boolean;
  showWeather: boolean;
  soundAlertsEnabled: boolean;
  activeTab: 'home' | 'schedule' | 'priorities' | 'deadlines' | 'syllabus' | 'degree';
}

export interface SimulationState {
  isSimulated: boolean;
  simulatedDay: DayOfWeek;
  simulatedTime: string; // "10:45"
  speed: number; // 1 = real, 60 = fast
}
