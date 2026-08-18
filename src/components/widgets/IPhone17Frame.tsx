import React, { useState } from 'react';
import { Course, Assignment, DegreeProgress, DayOfWeek, WidgetSize, AppTheme } from '../../types';
import { CurrentStatusInfo } from '../../utils/timeUtils';
import { SmallWidget } from './SmallWidget';
import { MediumWidget } from './MediumWidget';
import { LargeWidget } from './LargeWidget';
import { LockScreenWidget } from './LockScreenWidget';
import { DynamicIslandExpanded } from './DynamicIslandExpanded';
import { StandByWidget } from './StandByWidget';
import {
  Wifi,
  Battery,
  Lock,
  Flashlight,
  Camera,
  Layers,
  Smartphone,
  Sparkles,
  Maximize2,
  Clock,
  BookOpen,
  Calculator,
  Compass,
} from 'lucide-react';

interface IPhone17FrameProps {
  statusInfo: CurrentStatusInfo;
  todayCourses: { course: Course; startTime: string; endTime: string; room: string; displayTime: string }[];
  urgentAssignments: Assignment[];
  degreeProgress: DegreeProgress;
  courses: Course[];
  currentDay: DayOfWeek;
  currentTimeString: string;
  onToggleAssignment: (id: string) => void;
  activeWidgetSize: WidgetSize;
  onSelectWidgetSize: (size: WidgetSize) => void;
  theme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const IPhone17Frame: React.FC<IPhone17FrameProps> = ({
  statusInfo,
  todayCourses,
  urgentAssignments,
  degreeProgress,
  courses,
  currentDay,
  currentTimeString,
  onToggleAssignment,
  activeWidgetSize,
  onSelectWidgetSize,
  theme,
  onSelectTheme,
}) => {
  const [screenMode, setScreenMode] = useState<'home' | 'lock' | 'standby'>(
    activeWidgetSize === 'standby' ? 'standby' : activeWidgetSize === 'lockscreen' ? 'lock' : 'home'
  );
  const [isDynamicIslandExpanded, setIsDynamicIslandExpanded] = useState(false);

  const isPastel = theme === 'aesthetic-pastel';

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Control Bar: Widget Size & View Mode Switcher */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 p-4 rounded-[32px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-xl">
        {/* Screen Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md shadow-inner">
          <button
            onClick={() => {
              setScreenMode('home');
              if (activeWidgetSize === 'lockscreen' || activeWidgetSize === 'standby') {
                onSelectWidgetSize('medium');
              }
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              screenMode === 'home'
                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20 border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Home Screen</span>
          </button>

          <button
            onClick={() => {
              setScreenMode('lock');
              onSelectWidgetSize('lockscreen');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              screenMode === 'lock'
                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20 border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Lock Screen</span>
          </button>

          <button
            onClick={() => {
              setScreenMode('standby');
              onSelectWidgetSize('standby');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all ${
              screenMode === 'standby'
                ? 'bg-white/15 text-white shadow-sm ring-1 ring-white/20 border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>StandBy Desk Mode</span>
          </button>
        </div>

        {/* Widget Size Tabs (When on Home Screen) */}
        {screenMode === 'home' && (
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-black/40 border border-white/10 backdrop-blur-md shadow-inner">
            <span className="text-[11px] text-zinc-400 font-medium px-2.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-blue-400" /> Size:
            </span>
            {(['small', 'medium', 'large'] as WidgetSize[]).map((size) => (
              <button
                key={size}
                onClick={() => onSelectWidgetSize(size)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                  activeWidgetSize === size
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {size} {size === 'small' ? '(2x2)' : size === 'medium' ? '(4x2)' : '(4x4)'}
              </button>
            ))}
          </div>
        )}

        {/* Theme Aesthetic Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-zinc-400 font-medium hidden sm:inline">Theme:</span>
          <select
            value={theme}
            onChange={(e) => onSelectTheme(e.target.value as AppTheme)}
            aria-label="Widget Theme Style"
            className="px-3 py-1.5 rounded-full text-xs bg-zinc-900/60 text-zinc-200 border border-white/10 backdrop-blur-md focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
          >
            <option value="dark-titanium">Titanium Dark (Default)</option>
            <option value="oled-black">OLED Pure Black</option>
            <option value="midnight-indigo">Midnight Indigo</option>
            <option value="cyber-emerald">Cyber Emerald</option>
            <option value="aesthetic-pastel">Cozy Pastel (User Aesthetic)</option>
          </select>
        </div>
      </div>

      {/* StandBy Mode View (Horizontal) */}
      {screenMode === 'standby' ? (
        <StandByWidget
          statusInfo={statusInfo}
          todayCourses={todayCourses}
          urgentAssignments={urgentAssignments}
          degreeProgress={degreeProgress}
          currentDay={currentDay}
          currentTimeString={currentTimeString}
        />
      ) : (
        /* iPhone 17 Device Chassis (Portrait) */
        <div className="relative w-full max-w-[390px] aspect-[9/19.5] min-h-[740px] rounded-[55px] p-3.5 bg-zinc-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] border-[5px] border-zinc-700/80 ring-1 ring-white/20 select-none overflow-hidden flex flex-col justify-between">
          {/* Action Button & Volume rocker indicators (visual hardware accents) */}
          <div className="absolute -left-[7px] top-28 w-[3px] h-8 bg-zinc-600 rounded-l-sm" />
          <div className="absolute -left-[7px] top-40 w-[3px] h-12 bg-zinc-600 rounded-l-sm" />
          <div className="absolute -left-[7px] top-56 w-[3px] h-12 bg-zinc-600 rounded-l-sm" />
          <div className="absolute -right-[7px] top-36 w-[3px] h-16 bg-zinc-600 rounded-r-sm" />

          {/* Screen Glass Area */}
          <div
            className={`relative w-full h-full rounded-[45px] overflow-hidden flex flex-col justify-between p-5 transition-all duration-300 ${
              isPastel
                ? 'bg-gradient-to-b from-rose-100/90 via-pink-50 to-orange-50 text-zinc-900'
                : theme === 'oled-black'
                ? 'bg-black text-white'
                : theme === 'midnight-indigo'
                ? 'bg-gradient-to-b from-slate-950 via-indigo-950/40 to-slate-950 text-white'
                : theme === 'cyber-emerald'
                ? 'bg-gradient-to-b from-zinc-950 via-emerald-950/30 to-black text-white'
                : 'bg-gradient-to-b from-zinc-950 via-zinc-900 to-black text-white'
            }`}
          >
            {/* Top iOS Status Bar + Dynamic Island */}
            <div className="relative z-30 flex items-center justify-between pt-1 px-1">
              <span className="text-xs font-semibold tracking-tight">{currentTimeString}</span>

              {/* Dynamic Island Capsule in Center */}
              <div className="absolute left-1/2 -translate-x-1/2 -top-1">
                <DynamicIslandExpanded
                  statusInfo={statusInfo}
                  isExpanded={isDynamicIslandExpanded}
                  onToggleExpand={() => setIsDynamicIslandExpanded(!isDynamicIslandExpanded)}
                  urgentAssignments={urgentAssignments}
                />
              </div>

              {/* Cellular, WiFi, Battery icons */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                <span className="text-[10px] font-semibold">5G</span>
                <Wifi className="w-3.5 h-3.5" />
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
            </div>

            {/* SCREEN MODE CONTENT: LOCK SCREEN vs HOME SCREEN */}
            {screenMode === 'lock' ? (
              /* --- LOCK SCREEN VIEW --- */
              <div className="flex-1 flex flex-col justify-between my-auto py-6 z-10">
                {/* Lock Icon + Big Clock */}
                <div className="flex flex-col items-center text-center mt-4">
                  <Lock className="w-4 h-4 text-zinc-400 mb-1" />
                  <span className="text-xs font-medium uppercase tracking-widest text-zinc-400">
                    {currentDay}, AUG 18
                  </span>
                  <div className="text-6xl font-light tracking-tight font-sans my-1">
                    {currentTimeString}
                  </div>
                  <span className="text-xs text-zinc-400">BS ECE • Semester 1</span>
                </div>

                {/* Lock Screen Live Widget Area */}
                <div className="my-auto w-full">
                  <LockScreenWidget
                    statusInfo={statusInfo}
                    urgentAssignments={urgentAssignments}
                    courses={courses}
                    theme={theme}
                  />
                </div>

                {/* Bottom Lockscreen Buttons: Flashlight & Camera */}
                <div className="flex items-center justify-between px-3 pt-4">
                  <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white">
                    <Flashlight className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium">Swipe up to open</span>
                  <div className="w-11 h-11 rounded-full bg-black/40 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ) : (
              /* --- HOME SCREEN VIEW WITH ACTIVE WIDGET --- */
              <div className="flex-1 flex flex-col justify-between my-2 z-10">
                {/* Active Selected Widget */}
                <div className="w-full flex-1 flex flex-col justify-center">
                  {activeWidgetSize === 'small' && (
                    <div className="w-[170px] h-[170px] mx-auto">
                      <SmallWidget
                        statusInfo={statusInfo}
                        urgentAssignments={urgentAssignments}
                        courses={courses}
                        theme={theme}
                      />
                    </div>
                  )}

                  {activeWidgetSize === 'medium' && (
                    <div className="w-full h-[180px]">
                      <MediumWidget
                        statusInfo={statusInfo}
                        todayCourses={todayCourses}
                        urgentAssignments={urgentAssignments}
                        currentDay={currentDay}
                        currentTimeString={currentTimeString}
                        theme={theme}
                      />
                    </div>
                  )}

                  {activeWidgetSize === 'large' && (
                    <div className="w-full h-[360px]">
                      <LargeWidget
                        statusInfo={statusInfo}
                        todayCourses={todayCourses}
                        urgentAssignments={urgentAssignments}
                        degreeProgress={degreeProgress}
                        currentDay={currentDay}
                        currentTimeString={currentTimeString}
                        onToggleAssignment={onToggleAssignment}
                        theme={theme}
                      />
                    </div>
                  )}
                </div>

                {/* iOS App Icons Row (To simulate real Home Screen ambiance) */}
                {activeWidgetSize !== 'large' && (
                  <div className="grid grid-cols-4 gap-3 px-2 pt-4">
                    {[
                      { name: 'Syllabus', icon: BookOpen, color: 'bg-indigo-500' },
                      { name: 'Schedule', icon: Clock, color: 'bg-emerald-500' },
                      { name: 'Circuits', icon: Calculator, color: 'bg-violet-500' },
                      { name: 'Campus', icon: Compass, color: 'bg-rose-500' },
                    ].map((app, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-12 h-12 rounded-2xl ${app.color} text-white flex items-center justify-center shadow-lg shadow-black/40 hover:scale-105 transition-transform`}
                        >
                          <app.icon className="w-6 h-6" />
                        </div>
                        <span className="text-[10px] font-medium truncate">{app.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* iOS Dock Bar */}
                <div className="mt-4 p-2.5 rounded-3xl bg-white/10 backdrop-blur-2xl border border-white/10 grid grid-cols-4 gap-2">
                  <div className="w-11 h-11 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-md">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div className="w-11 h-11 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-white shadow-md">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div className="w-11 h-11 mx-auto rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="w-11 h-11 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-400 flex items-center justify-center text-white shadow-md">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </div>
              </div>
            )}

            {/* Bottom iOS Home Indicator Bar */}
            <div className="w-32 h-1 bg-white/40 rounded-full mx-auto mb-0.5" />
          </div>
        </div>
      )}
    </div>
  );
};
