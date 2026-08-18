import React from 'react';
import { DayOfWeek, SimulationState } from '../types';
import {
  Smartphone,
  Calendar,
  Layers,
  Bell,
  Sparkles,
  GraduationCap,
  Download,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { playNotificationChime } from '../utils/audio';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  simulationState: SimulationState;
  onUpdateSimulation: (state: Partial<SimulationState>) => void;
  onExportICS: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  urgentDeadlinesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  simulationState,
  onUpdateSimulation,
  onExportICS,
  soundEnabled,
  onToggleSound,
  urgentDeadlinesCount,
}) => {
  const tabs = [
    { id: 'widgets', label: 'iPhone 17 Widgets', icon: Smartphone },
    { id: 'schedule', label: 'Mon–Fri Timetable', icon: Calendar },
    { id: 'calendar', label: 'Google Calendar & iPhone Sync', icon: Calendar, isNew: true },
    { id: 'priorities', label: 'Course Prioritization', icon: Layers },
    { id: 'deadlines', label: 'Assignments & Deadlines', icon: Bell, badge: urgentDeadlinesCount },
    { id: 'syllabus', label: 'Syllabus Sync', icon: Sparkles },
    { id: 'degree', label: 'Degree Tracker', icon: GraduationCap },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#050505]/70 backdrop-blur-2xl border-b border-white/10 select-none">
      {/* Top Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-900/30 ring-1 ring-white/20">
            <GraduationCap className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm md:text-base text-[#f5f5f7] tracking-tight flex items-center gap-1.5">
                <span>URS Morong</span>
                <span className="text-zinc-500">•</span>
                <span className="text-blue-400">BS ECE</span>
                <span className="text-zinc-300 font-normal hidden lg:inline">Schedule & Widgets</span>
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                URS Giants
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              University of Rizal System (Morong Campus) • Electronics Communication Engineering
            </p>
          </div>
        </div>

        {/* Right Tools: Time Simulator + Calendar Export + Sound */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Scrubber / Simulation Presets */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/60 backdrop-blur-xl border border-white/10 text-xs shadow-inner">
            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <select
              value={
                simulationState.isSimulated
                  ? `${simulationState.simulatedDay}-${simulationState.simulatedTime}`
                  : 'realtime'
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'realtime') {
                  onUpdateSimulation({ isSimulated: false });
                } else {
                  const [day, time] = val.split('-');
                  onUpdateSimulation({
                    isSimulated: true,
                    simulatedDay: day as DayOfWeek,
                    simulatedTime: time,
                  });
                }
                playNotificationChime('click');
              }}
              aria-label="Simulation Time Preset"
              className="bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="realtime" className="bg-zinc-900 text-white">
                ⏱️ Real System Clock
              </option>
              <option value="TUES-08:15" className="bg-zinc-900 text-white">
                📍 Tue 8:15 AM (15m before ECE Laws)
              </option>
              <option value="MON-11:00" className="bg-zinc-900 text-white">
                📍 Mon 11:00 AM (In Electronics Lab)
              </option>
              <option value="WED-15:45" className="bg-zinc-900 text-white">
                📍 Wed 3:45 PM (In Diff Eq Class)
              </option>
              <option value="THUR-13:15" className="bg-zinc-900 text-white">
                📍 Thu 1:15 PM (Heading to PATHFIT)
              </option>
              <option value="SUN-16:00" className="bg-zinc-900 text-white">
                📍 Sun 4:00 PM (Weekend Prep)
              </option>
            </select>
          </div>

          {/* Audio Chime Toggle */}
          <button
            onClick={() => {
              onToggleSound();
              if (!soundEnabled) playNotificationChime('alert');
            }}
            title={soundEnabled ? 'Mute Alert Chimes' : 'Enable Apple Chimes'}
            className={`p-2 rounded-full border transition-all text-xs flex items-center gap-1 backdrop-blur-xl ${
              soundEnabled
                ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                : 'bg-zinc-900/60 border-white/5 text-zinc-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Export to Apple / Google Calendar (.ics) */}
          <button
            onClick={() => {
              onExportICS();
              playNotificationChime('complete');
            }}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-zinc-200 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm backdrop-blur-md"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Export .ics</span>
            <span className="sm:hidden">.ics</span>
          </button>
        </div>
      </div>

      {/* Bottom Horizontal Tab Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto no-scrollbar pb-2.5">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => {
                onSelectTab(tab.id);
                playNotificationChime('click');
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 shrink-0 transition-all ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20 border border-white/10 backdrop-blur-xl'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-500 text-white shadow-[0_0_6px_rgba(239,68,68,0.7)]">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
