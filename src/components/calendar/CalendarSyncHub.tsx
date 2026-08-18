import React, { useState, useEffect } from 'react';
import { Course, Assignment } from '../../types';
import {
  googleSignIn,
  logout,
  initAuth,
  getAccessToken,
  getCurrentUser,
} from '../../utils/firebaseAuth';
import {
  listGoogleCalendars,
  getOrCreateAcademicCalendar,
  syncScheduleToGoogle,
  fetchCalendarEvents,
  GoogleCalendarInfo,
  GoogleCalendarItem,
  SyncStats,
} from '../../utils/googleCalendar';
import { downloadICSFile } from '../../utils/icsExport';
import { generateScriptableWidgetCode } from '../../utils/scriptableWidgetCode';
import { playNotificationChime } from '../../utils/audio';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  ExternalLink,
  Copy,
  Download,
  ShieldCheck,
  Zap,
  Code2,
  Clock,
  Layers,
  Sparkles,
  HelpCircle,
  LogOut,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import type { User } from 'firebase/auth';

interface CalendarSyncHubProps {
  courses: Course[];
  assignments: Assignment[];
  onTriggerGlobalSync?: () => void;
}

export const CalendarSyncHub: React.FC<CalendarSyncHubProps> = ({
  courses,
  assignments,
}) => {
  // Active sub-tab
  const [activeHubTab, setActiveHubTab] = useState<'google' | 'apple' | 'lockscreen' | 'widget_guide' | 'scriptable'>('lockscreen');

  // Auth & Google state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Google Calendar state
  const [calendars, setCalendars] = useState<GoogleCalendarInfo[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('create_new');
  const [isSyncingGoogle, setIsSyncingGoogle] = useState<boolean>(false);
  const [syncProgressMsg, setSyncProgressMsg] = useState<string>('');
  const [syncProgressPct, setSyncProgressPct] = useState<number>(0);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(() => {
    const saved = localStorage.getItem('last_gcal_sync_stats');
    return saved ? JSON.parse(saved) : null;
  });
  const [syncedEvents, setSyncedEvents] = useState<GoogleCalendarItem[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);

  // Confirmation Modal for Destructive/Mutating Google Sync
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Sync to backend for WebCal live feed
  const [webcalFeedUrl, setWebcalFeedUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Sync settings
  const [syncClasses, setSyncClasses] = useState<boolean>(true);
  const [syncAssignments, setSyncAssignments] = useState<boolean>(true);
  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(true);

  // Sync payload to backend for live .ics feed
  useEffect(() => {
    const origin = window.location.origin;
    setWebcalFeedUrl(`${origin}/api/calendar/feed.ics`);

    // Sync latest courses and assignments to Express server
    fetch('/api/calendar/sync-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courses, assignments }),
    }).catch((err) => console.warn('Webcal state sync notice:', err));
  }, [courses, assignments]);

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (authUser, authToken) => {
        setUser(authUser);
        setToken(authToken);
        loadUserCalendars(authToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadUserCalendars = async (accessToken: string) => {
    try {
      const list = await listGoogleCalendars(accessToken);
      setCalendars(list);
    } catch (err: any) {
      console.warn('Could not list Google calendars:', err);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setToken(res.accessToken);
        playNotificationChime('complete');
        await loadUserCalendars(res.accessToken);
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setAuthError(err.message || 'Failed to sign in with Google.');
      playNotificationChime('tink');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setCalendars([]);
    playNotificationChime('click');
  };

  // Perform Google Calendar Push Sync (after confirmation)
  const executeGoogleSync = async () => {
    setShowConfirmModal(false);
    let activeToken = token;
    if (!activeToken) {
      activeToken = await getAccessToken();
    }

    if (!activeToken) {
      setAuthError('Please sign in to Google Calendar first.');
      return;
    }

    setIsSyncingGoogle(true);
    setSyncProgressMsg('Connecting to Google Calendar API...');
    setSyncProgressPct(5);

    try {
      let targetCalId = selectedCalendarId;
      let targetCalName = 'College Schedule & Deadlines';

      if (targetCalId === 'create_new') {
        setSyncProgressMsg('Verifying or creating dedicated "College Schedule" calendar...');
        const newCal = await getOrCreateAcademicCalendar(activeToken, 'College Schedule & Deadlines');
        targetCalId = newCal.id;
        targetCalName = newCal.summary;
      } else {
        const found = calendars.find((c) => c.id === targetCalId);
        if (found) targetCalName = found.summary;
      }

      // Filter courses and assignments based on options
      const coursesToSync = syncClasses ? courses : [];
      const assignmentsToSync = syncAssignments ? assignments : [];

      const stats = await syncScheduleToGoogle(
        activeToken,
        targetCalId,
        targetCalName,
        coursesToSync,
        assignmentsToSync,
        (msg, cur, tot) => {
          setSyncProgressMsg(msg);
          setSyncProgressPct(Math.round((cur / tot) * 90) + 5);
        }
      );

      setSyncStats(stats);
      localStorage.setItem('last_gcal_sync_stats', JSON.stringify(stats));
      setSyncProgressPct(100);
      setSyncProgressMsg(`Successfully synced ${stats.totalSynced} items!`);
      playNotificationChime('complete');

      // Refresh events
      fetchEventsFromCalendar(activeToken, targetCalId);
    } catch (err: any) {
      console.error('Google Calendar sync failed:', err);
      setAuthError(err.message || 'Failed to sync with Google Calendar.');
      playNotificationChime('alert');
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const fetchEventsFromCalendar = async (accessToken: string, calendarId: string) => {
    setIsLoadingEvents(true);
    try {
      const items = await fetchCalendarEvents(accessToken, calendarId, 15);
      setSyncedEvents(items);
    } catch (err: any) {
      console.warn('Could not fetch preview events:', err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleCopyLink = (link: string, key: string) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(key);
    playNotificationChime('tink');
    setTimeout(() => setCopiedLink(null), 2500);
  };

  const handleCopyScriptableCode = () => {
    const code = generateScriptableWidgetCode(window.location.origin, courses, assignments);
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    playNotificationChime('complete');
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const totalSessionsCount = courses.reduce((acc, c) => acc + c.sessions.length, 0);

  return (
    <div className="w-full space-y-6 max-w-6xl mx-auto">
      {/* Top Header Card */}
      <div className="p-6 md:p-8 rounded-[32px] bg-zinc-900/40 border border-white/10 backdrop-blur-2xl shadow-2xl relative overflow-hidden ring-1 ring-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                Calendar & iOS Ecosystem
              </span>
              <span className="text-xs text-zinc-400">• Real-Time Sync</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#f5f5f7]">
              Google Calendar & iPhone Widget Integration
            </h2>
            <p className="text-sm text-zinc-300 max-w-2xl mt-1.5 leading-relaxed">
              Automatically sync all lecture sessions, assignment deadlines, and exam schedules to Google
              Calendar, Apple Calendar, and native iOS Lock Screen / Home Screen widgets.
            </p>
          </div>

          {/* Quick Action Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => downloadICSFile(courses, assignments)}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white border border-white/10 flex items-center gap-2 transition-all backdrop-blur-md shadow-sm"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Download .ics</span>
            </button>
            <a
              href={`webcal://${window.location.host}/api/calendar/feed.ics`}
              className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-lg shadow-blue-900/30"
            >
              <Smartphone className="w-4 h-4" />
              <span>1-Tap Apple Calendar</span>
            </a>
          </div>
        </div>

        {/* Hub Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'lockscreen', label: 'iPhone Lock Screen Setup', icon: Sparkles, isHighlight: true },
            { id: 'google', label: 'Google Calendar API', icon: CalendarIcon },
            { id: 'apple', label: 'Apple Calendar (iPhone & Mac)', icon: Smartphone },
            { id: 'widget_guide', label: 'Home Screen Widgets Guide', icon: HelpCircle },
            { id: 'scriptable', label: 'iOS Scriptable Widget Code', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeHubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveHubTab(tab.id as any);
                  playNotificationChime('click');
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shrink-0 transition-all ${
                  isActive
                    ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/30 border border-white/15 backdrop-blur-xl'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
                {(tab as any).isHighlight && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    iOS 17/18
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 0: iPhone Lock Screen Setup & Live Simulation */}
      {activeHubTab === 'lockscreen' && (
        <div className="space-y-6">
          {/* Top Banner */}
          <div className="p-6 md:p-8 rounded-[32px] bg-zinc-900/40 border border-white/10 backdrop-blur-2xl shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  iOS 16 / 17 / 18 Lock Screen Widgets
                </span>
                <h3 className="text-xl md:text-2xl font-semibold text-white mt-2">
                  Display Your College Schedule on iPhone Lock Screen
                </h3>
                <p className="text-sm text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                  See your active lecture, next classroom, and assignment countdowns without even unlocking your phone.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveHubTab('apple')}
                  className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>1. Subscribe Feed</span>
                </button>
                <button
                  onClick={() => setActiveHubTab('scriptable')}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white border border-white/10 flex items-center gap-2 transition-all"
                >
                  <Code2 className="w-4 h-4 text-purple-400" />
                  <span>Scriptable Code</span>
                </button>
              </div>
            </div>

            {/* Interactive Lock Screen Simulator & Visual Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-2">
              {/* Left 5 Cols: Visual iPhone Lock Screen Simulator */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-72 sm:w-80 rounded-[44px] bg-[#090d14] border-[6px] border-zinc-800 p-5 shadow-2xl relative overflow-hidden ring-1 ring-white/10 select-none">
                  {/* Dynamic Island Pill */}
                  <div className="w-24 h-5 bg-black rounded-full mx-auto mb-4 border border-white/10 flex items-center justify-between px-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[9px] font-mono text-zinc-400">CS 301</span>
                  </div>

                  {/* Lock Screen Header: INLINE WIDGET (Above Clock) */}
                  <div className="text-center mb-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-[11px] font-medium text-zinc-200 shadow-sm">
                      <span>📅 Mon, Aug 17</span>
                      <span className="text-blue-400">•</span>
                      <span className="text-blue-300 font-semibold">📚 CS 301 in 25m</span>
                    </div>
                  </div>

                  {/* iOS Clock Typography */}
                  <div className="text-center my-2">
                    <div className="text-5xl font-bold tracking-tight text-white font-mono drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                      09:41
                    </div>
                  </div>

                  {/* ACCESSORY WIDGET ROW (Below Clock) */}
                  <div className="grid grid-cols-3 gap-2 my-4">
                    {/* Rectangular Widget */}
                    <div className="col-span-2 p-2.5 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl text-left">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-blue-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span>CS 301 • 25m left</span>
                      </div>
                      <div className="text-[11px] font-semibold text-white truncate mt-0.5">
                        Algorithms & Data
                      </div>
                      <div className="text-[9px] text-zinc-300 flex items-center justify-between mt-1">
                        <span>📍 Lab 402</span>
                        <span className="text-zinc-400">Prof. Martinez</span>
                      </div>
                    </div>

                    {/* Circular Widget */}
                    <div className="col-span-1 p-2 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-xl flex flex-col items-center justify-center text-center">
                      <div className="w-7 h-7 rounded-full border-2 border-blue-400 border-t-transparent flex items-center justify-center text-[9px] font-bold font-mono text-white">
                        25m
                      </div>
                      <span className="text-[8px] text-zinc-300 font-semibold mt-1 uppercase">Remains</span>
                    </div>
                  </div>

                  {/* LIVE ACTIVITY / Dynamic Island Capsule (Bottom of Lock Screen) */}
                  <div className="mt-6 p-3.5 rounded-2xl bg-zinc-900/90 border border-blue-500/30 shadow-xl backdrop-blur-2xl">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-xs font-bold text-white">Active Class Session</span>
                      </div>
                      <span className="text-[10px] font-mono text-blue-400 font-bold">50m / 90m</span>
                    </div>

                    <div className="text-xs text-zinc-300 font-medium">
                      CS 301: Algorithms & Data Structures
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      📍 Science Hall Lab 402 • Ending at 10:30 AM
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 w-[55%] rounded-full" />
                    </div>
                  </div>

                  {/* Lock Screen Bottom Shortcut Icons */}
                  <div className="flex items-center justify-between px-2 pt-6">
                    <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-xs">
                      🔦
                    </div>
                    <div className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white text-xs">
                      📷
                    </div>
                  </div>
                </div>
              </div>

              {/* Right 7 Cols: 3 Official Lock Screen Setup Methods */}
              <div className="lg:col-span-7 space-y-4">
                {/* Method 1: Apple Calendar / Google Lock Screen Widget (Zero App Installs) */}
                <div className="p-5 rounded-[24px] bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold font-mono">
                        1
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Native Calendar Lock Screen Widget (Recommended)
                        </h4>
                        <span className="text-[10px] text-blue-300 font-medium">Zero extra apps required</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      Easiest
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
                    <p>
                      1. Go to the <strong>Google Calendar</strong> or <strong>Apple Calendar</strong> tab and sync your timetable.
                    </p>
                    <p>
                      2. Turn on your iPhone, <strong>long-press the Lock Screen</strong>, and tap <strong>Customize</strong>.
                    </p>
                    <p>
                      3. Tap the widget box below the clock &gt; Select <strong>Calendar</strong> &gt; Add <strong>"Next Event"</strong> or <strong>"Upcoming"</strong>.
                    </p>
                    <p>
                      4. Tap <strong>Done</strong>. Your live classes, lecture rooms, and assignment deadlines will automatically show on the Lock Screen!
                    </p>
                  </div>
                </div>

                {/* Method 2: Scriptable Accessory Lock Screen Widgets */}
                <div className="p-5 rounded-[24px] bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold font-mono">
                        2
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">
                          Scriptable Lock Screen Accessory Widgets
                        </h4>
                        <span className="text-[10px] text-purple-300 font-medium">Supports Inline, Circular & Rectangular sizes</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                      Custom Script
                    </span>
                  </div>

                  <div className="text-xs text-zinc-300 space-y-2 leading-relaxed">
                    <p>
                      1. Copy the widget code from the <strong>iOS Scriptable Widget Code</strong> tab.
                    </p>
                    <p>
                      2. In Scriptable, tap <strong>+</strong>, paste the code, and name it <strong>College</strong>.
                    </p>
                    <p>
                      3. On your Lock Screen, tap <strong>Customize &gt; Add Widgets &gt; Scriptable</strong>.
                    </p>
                    <p>
                      4. Choose <strong>Inline</strong> (above clock) or <strong>Rectangular</strong> (below clock), tap the widget, and pick <strong>College</strong>.
                    </p>
                  </div>

                  <button
                    onClick={handleCopyScriptableCode}
                    className="w-full py-2 rounded-full bg-purple-600/80 hover:bg-purple-600 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all"
                  >
                    {copiedCode ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Code Copied!' : 'Copy Scriptable Lock Screen Code'}</span>
                  </button>
                </div>

                {/* Method 3: StandBy Mode & Live Activity Lock Display */}
                <div className="p-5 rounded-[24px] bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold font-mono">
                      3
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        iOS StandBy Mode (Desk Clock Widget)
                      </h4>
                      <span className="text-[10px] text-amber-300 font-medium">When iPhone is charging horizontally</span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    When your iPhone is charging horizontally on a MagSafe stand or desk dock, swipe to the Calendar widget view to turn your iPhone into a full-screen smart timetable clock with live class countdowns.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: Google Calendar Integration */}
      {activeHubTab === 'google' && (
        <div className="space-y-6">
          {/* Auth Card */}
          <div className="p-6 rounded-[28px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-blue-400 shadow-inner">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Google Calendar Authorization</h3>
                  <p className="text-xs text-zinc-400">
                    {user
                      ? `Connected as ${user.displayName || user.email}`
                      : 'Connect your Google account to automatically push and synchronize your timetable.'}
                  </p>
                </div>
              </div>

              {/* Sign in with Google Button (Official Style) */}
              <div>
                {!user ? (
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoggingIn}
                    className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 font-medium text-xs shadow-lg transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path
                        fill="#EA4335"
                        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                      />
                      <path
                        fill="#34A853"
                        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                      />
                    </svg>
                    <span>{isLoggingIn ? 'Connecting...' : 'Sign in with Google'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      Google Connected
                    </span>
                    <button
                      onClick={handleGoogleLogout}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white border border-white/10 text-xs transition-all"
                      title="Disconnect Google Account"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {authError && (
              <div className="mt-4 p-3 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
          </div>

          {/* Sync Configuration & Action */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Sync Options & Trigger */}
            <div className="md:col-span-2 p-6 rounded-[28px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-xl space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white mb-1">Calendar Sync Options</h3>
                <p className="text-xs text-zinc-400">
                  Select what items and reminders will be pushed into your Google Calendar.
                </p>
              </div>

              {/* Target Calendar Selector */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-2">
                  Target Google Calendar
                </label>
                <select
                  value={selectedCalendarId}
                  onChange={(e) => setSelectedCalendarId(e.target.value)}
                  disabled={!user || isSyncingGoogle}
                  className="w-full px-4 py-2.5 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-all disabled:opacity-50"
                >
                  <option value="create_new">
                    ✨ Create dedicated "College Schedule & Deadlines" calendar (Recommended)
                  </option>
                  {calendars.map((cal) => (
                    <option key={cal.id} value={cal.id}>
                      📅 {cal.summary} {cal.primary ? '(Primary)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Item Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <div>
                      <div className="text-xs font-medium text-white">Recurring Weekly Classes</div>
                      <div className="text-[11px] text-zinc-400">
                        {courses.length} courses ({totalSessionsCount} weekly lectures with 15m notification)
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={syncClasses}
                    onChange={(e) => setSyncClasses(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <div>
                      <div className="text-xs font-medium text-white">Assignment & Exam Deadlines</div>
                      <div className="text-[11px] text-zinc-400">
                        {assignments.length} assignments & exams with 2h & 1d reminder alerts
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={syncAssignments}
                    onChange={(e) => setSyncAssignments(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="text-xs font-medium text-white">High-Priority Alert Alarms</div>
                      <div className="text-[11px] text-zinc-400">
                        Attach popup reminders to prevent missed lectures and exam submissions
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={remindersEnabled}
                    onChange={(e) => setRemindersEnabled(e.target.checked)}
                    className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Sync Trigger Button (Triggers mandatory user confirmation modal) */}
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    if (!user) {
                      handleGoogleLogin();
                    } else {
                      setShowConfirmModal(true);
                    }
                  }}
                  disabled={isSyncingGoogle}
                  className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-900/40 disabled:opacity-50 cursor-pointer"
                >
                  {isSyncingGoogle ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{syncProgressMsg || 'Syncing Events...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>
                        {user
                          ? `Sync All Scheduled Events to Google Calendar (${totalSessionsCount + assignments.length} Items)`
                          : 'Sign In & Sync to Google Calendar'}
                      </span>
                    </>
                  )}
                </button>

                {isSyncingGoogle && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1">
                      <span>{syncProgressMsg}</span>
                      <span className="font-mono">{syncProgressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${syncProgressPct}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Sync Status & Summary */}
            <div className="p-6 rounded-[28px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-base font-semibold text-white mb-2">Sync Status</h3>
                {syncStats ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center gap-2 text-blue-400 font-bold text-xs mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Synchronized</span>
                      </div>
                      <div className="text-xs text-zinc-300">
                        Target: <strong className="text-white">{syncStats.calendarName}</strong>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-1">
                        Last synced at {syncStats.timestamp}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center text-xs">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="text-lg font-bold font-mono text-blue-400">
                          {syncStats.classesSynced}
                        </div>
                        <div className="text-[10px] text-zinc-400 uppercase">Classes</div>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="text-lg font-bold font-mono text-red-400">
                          {syncStats.assignmentsSynced}
                        </div>
                        <div className="text-[10px] text-zinc-400 uppercase">Deadlines</div>
                      </div>
                    </div>

                    <a
                      href="https://calendar.google.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white border border-white/10 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>Open Google Calendar Web</span>
                    </a>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center text-xs text-zinc-400">
                    <Clock className="w-8 h-8 text-zinc-500 mx-auto mb-2 opacity-50" />
                    <span>No active sync recorded yet. Click "Sync All Scheduled Events" to push your timetable.</span>
                  </div>
                )}
              </div>

              <div className="text-[11px] text-zinc-500 pt-4 border-t border-white/10">
                🔒 Synced events include room numbers, instructor info, units, and automatic 15-min and 2-hr notification triggers.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Apple Calendar & Native iOS Integration */}
      {activeHubTab === 'apple' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Direct 1-Tap Subscription Card */}
            <div className="p-6 rounded-[28px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-xl space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Apple Calendar 1-Tap Subscribe</h3>
                  <p className="text-xs text-zinc-400">Directly connect to iPhone, iPad & Mac Calendar app</p>
                </div>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Subscribing to the live calendar feed allows iOS to automatically pull timetable changes,
                room adjustments, and new assignment deadlines in the background every 15 minutes.
              </p>

              <div className="space-y-3">
                <a
                  href={`webcal://${window.location.host}/api/calendar/feed.ics`}
                  className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/40"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Subscribe on iPhone (webcal://)</span>
                </a>

                <button
                  onClick={() => downloadICSFile(courses, assignments)}
                  className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white font-medium text-xs border border-white/10 flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Download Offline .ics Calendar File</span>
                </button>
              </div>

              {/* Live WebCal URL Feed Box */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Live iCalendar Subscription URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={webcalFeedUrl}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-300 focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopyLink(webcalFeedUrl, 'feed_url')}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-medium text-white border border-white/10 shrink-0 flex items-center gap-1"
                  >
                    {copiedLink === 'feed_url' ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedLink === 'feed_url' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Step-by-Step iPhone Setup Instructions */}
            <div className="p-6 rounded-[28px] bg-zinc-900/40 border border-white/10 backdrop-blur-xl shadow-xl space-y-4">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>How to Add to iPhone Native Calendar</span>
              </h3>

              <div className="space-y-3 text-xs text-zinc-300">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    1
                  </div>
                  <div>
                    <strong className="text-white">Copy the Calendar URL</strong>: Tap the copy button above to
                    copy your personal WebCal feed link.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    2
                  </div>
                  <div>
                    <strong className="text-white">Open iPhone Settings</strong>: Go to{' '}
                    <code className="text-blue-300 bg-white/5 px-1.5 py-0.5 rounded">Settings &gt; Calendar &gt; Accounts</code>.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    3
                  </div>
                  <div>
                    <strong className="text-white">Add Subscribed Calendar</strong>: Tap{' '}
                    <strong className="text-white">Add Account &gt; Other &gt; Add Subscribed Calendar</strong> and paste the URL.
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    4
                  </div>
                  <div>
                    <strong className="text-white">Set Auto-Refresh</strong>: Set "Auto-Refresh" to{' '}
                    <strong className="text-white">Every 15 Minutes</strong>. Your classes and deadlines will
                    now appear on Apple Calendar & iPhone widgets!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: iPhone Widget Explanation Guide ("Can it be a widget inside iphone? How?") */}
      {activeHubTab === 'widget_guide' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-[32px] bg-zinc-900/40 border border-white/10 backdrop-blur-2xl shadow-xl space-y-6">
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                iOS Widget Architecture Explained
              </span>
              <h3 className="text-xl md:text-2xl font-semibold text-white mt-3">
                How to Put This App as a Widget on Your iPhone
              </h3>
              <p className="text-sm text-zinc-300 mt-2 leading-relaxed">
                Yes! There are <strong>3 official and practical ways</strong> to display your real-time classes,
                countdown timers, and assignment alerts on your physical iPhone Home Screen, Lock Screen, and
                StandBy display.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Method 1: Apple Calendar Native Widget (Zero App Installs) */}
              <div className="p-5 rounded-[24px] bg-white/5 border border-white/10 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    Method 1: Apple Calendar Widget
                  </h4>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300">
                    Easiest • 0 Extra Apps
                  </span>
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    Once you sync with Google Calendar or subscribe to our WebCal link, iOS's built-in{' '}
                    <strong className="text-zinc-200">Calendar Widget</strong> (Small, Medium, Large, Lock
                    Screen, and StandBy) automatically shows your active lectures, next room, and deadlines.
                  </p>
                </div>

                <button
                  onClick={() => setActiveHubTab('apple')}
                  className="w-full py-2 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-white flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>View Apple Setup</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Method 2: Scriptable App (Exact Frosted Glass Look) */}
              <div className="p-5 rounded-[24px] bg-white/5 border border-white/10 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    Method 2: iOS Scriptable Widget
                  </h4>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300">
                    Custom Frosted Glass Aesthetic
                  </span>
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    Download the free <strong className="text-zinc-200">Scriptable</strong> app from the App
                    Store and paste our generated widget code. It renders our exact Frosted Glass / Titanium card
                    with live countdown timers directly on your iOS Home Screen.
                  </p>
                </div>

                <button
                  onClick={() => setActiveHubTab('scriptable')}
                  className="w-full py-2 rounded-full bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <span>Get Scriptable Code</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Method 3: Progressive Web App (Add to Home Screen) */}
              <div className="p-5 rounded-[24px] bg-white/5 border border-white/10 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">
                    Method 3: Safari PWA App
                  </h4>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
                    Full Screen Native Feel
                  </span>
                  <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
                    Open this app in Mobile Safari, tap the <strong className="text-zinc-200">Share</strong> icon,
                    and choose <strong className="text-zinc-200">"Add to Home Screen"</strong>. It launches as a
                    standalone native app with custom icon, offline storage, and interactive widget view.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white/5 text-[11px] text-zinc-400 text-center">
                  Safari &gt; Share &gt; Add to Home Screen
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: Scriptable Widget Code */}
      {activeHubTab === 'scriptable' && (
        <div className="space-y-6">
          <div className="p-6 md:p-8 rounded-[32px] bg-zinc-900/40 border border-white/10 backdrop-blur-2xl shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">iOS Scriptable App Widget Code</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Copy this complete JavaScript code and paste it into the free "Scriptable" app on iPhone.
                </p>
              </div>

              <button
                onClick={handleCopyScriptableCode}
                className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-2 transition-all shadow-lg shadow-blue-900/40 shrink-0"
              >
                {copiedCode ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Code Copied to Clipboard!' : 'Copy Scriptable Widget Code'}</span>
              </button>
            </div>

            {/* Code Preview Window */}
            <div className="relative rounded-2xl bg-black/60 border border-white/10 p-4 font-mono text-xs text-zinc-300 max-h-96 overflow-y-auto custom-scrollbar">
              <pre className="whitespace-pre">{generateScriptableWidgetCode(window.location.origin, courses, assignments)}</pre>
            </div>

            {/* Quick 3-Step Guide */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="font-bold text-blue-400">Step 1</span>
                <p className="text-zinc-400 mt-1">Install "Scriptable" from the iOS App Store (100% free).</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="font-bold text-blue-400">Step 2</span>
                <p className="text-zinc-400 mt-1">Create a new script, paste the code, and tap Save.</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                <span className="font-bold text-blue-400">Step 3</span>
                <p className="text-zinc-400 mt-1">Add a Scriptable widget on your iPhone Home Screen and pick this script!</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL (Required by workspace-integration guidelines for Google Calendar mutations) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg p-6 rounded-[32px] bg-zinc-900 border border-white/15 text-white shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Confirm Google Calendar Sync</h3>
                <p className="text-xs text-zinc-400">Please review the events to be added</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2 text-xs text-zinc-300">
              <p>
                The app will add or update the following items in your Google Calendar:
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-300 font-medium">
                {syncClasses && (
                  <li>
                    <strong className="text-white">{totalSessionsCount} Recurring Weekly Class Sessions</strong> (Mon–Fri lecture schedules with room locations and 15m reminder popups)
                  </li>
                )}
                {syncAssignments && (
                  <li>
                    <strong className="text-white">{assignments.length} Assignment & Exam Deadlines</strong> (with priority tags, syllabus details, and 2-hr / 1-day notification alerts)
                  </li>
                )}
              </ul>
              <p className="text-[11px] text-zinc-400 pt-1">
                Target Calendar: <span className="text-blue-300 font-semibold">{selectedCalendarId === 'create_new' ? 'New "College Schedule & Deadlines" calendar' : 'Selected Google Calendar'}</span>
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-xs font-medium text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeGoogleSync}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-900/40 transition-all cursor-pointer"
              >
                Confirm & Sync Events
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
