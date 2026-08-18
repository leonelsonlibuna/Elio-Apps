import { Course, Assignment } from '../types';

export function generateScriptableWidgetCode(
  appUrl: string,
  courses: Course[],
  assignments: Assignment[]
): string {
  const jsonPayload = JSON.stringify({ courses, assignments }, null, 2);

  return `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: blue; icon-glyph: calendar-alt;

/**
 * 🎓 URS Morong • BS ECE Frosted Glass Widget for iOS 17 / 18 / 19
 * University of Rizal System (Morong Campus) - Electronics Communication Engineering
 * Works on iPhone Home Screen & Lock Screen (Inline, Circular, Rectangular)
 */

const APP_DATA = ${jsonPayload};

const widgetFamily = config.widgetFamily || "medium";
const widget = new ListWidget();
widget.setPadding(12, 14, 12, 14);

// Days mapping
const dayNames = ["SUN", "MON", "TUES", "WED", "THUR", "FRI", "SAT"];
const today = new Date();
const currentDayStr = dayNames[today.getDay()];
const currentMins = today.getHours() * 60 + today.getMinutes();

function timeToMins(tStr) {
  if (!tStr) return 0;
  const [h, m] = tStr.split(":").map(Number);
  return h * 60 + m;
}

// Find today's courses
const todayCourses = [];
for (const course of APP_DATA.courses) {
  for (const session of course.sessions) {
    if (session.day === currentDayStr) {
      todayCourses.push({
        course,
        session,
        startMins: timeToMins(session.startTime),
        endMins: timeToMins(session.endTime),
      });
    }
  }
}
todayCourses.sort((a, b) => a.startMins - b.startMins);

// Determine active or up next
let activeCourse = null;
let nextCourse = null;
for (const item of todayCourses) {
  if (currentMins >= item.startMins && currentMins < item.endMins) {
    activeCourse = item;
    break;
  } else if (currentMins < item.startMins && !nextCourse) {
    nextCourse = item;
  }
}

// ==========================================
// 1. LOCK SCREEN: INLINE (Above Clock)
// ==========================================
if (widgetFamily === "accessoryInline") {
  if (activeCourse) {
    widget.addText("● " + activeCourse.course.code + " (" + (activeCourse.endMins - currentMins) + "m left)");
  } else if (nextCourse) {
    widget.addText("📚 " + nextCourse.course.code + " in " + (nextCourse.startMins - currentMins) + "m @" + nextCourse.session.room);
  } else {
    widget.addText("✨ Free Block (No classes)");
  }
}

// ==========================================
// 2. LOCK SCREEN: CIRCULAR (Below Clock)
// ==========================================
else if (widgetFamily === "accessoryCircular") {
  widget.setPadding(4, 4, 4, 4);
  if (activeCourse) {
    const code = widget.addText(activeCourse.course.code.split(" ")[0]);
    code.font = Font.boldSystemFont(11);
    code.centerAlignText();

    const left = widget.addText((activeCourse.endMins - currentMins) + "m");
    left.font = Font.systemFont(10);
    left.centerAlignText();
  } else if (nextCourse) {
    const code = widget.addText(nextCourse.course.code.split(" ")[0]);
    code.font = Font.boldSystemFont(11);
    code.centerAlignText();

    const left = widget.addText((nextCourse.startMins - currentMins) + "m");
    left.font = Font.systemFont(10);
    left.centerAlignText();
  } else {
    const t = widget.addText("🎓");
    t.font = Font.systemFont(16);
    t.centerAlignText();
    const s = widget.addText("Free");
    s.font = Font.systemFont(9);
    s.centerAlignText();
  }
}

// ==========================================
// 3. LOCK SCREEN: RECTANGULAR (Below Clock)
// ==========================================
else if (widgetFamily === "accessoryRectangular") {
  widget.setPadding(4, 4, 4, 4);
  if (activeCourse) {
    const title = widget.addText("● " + activeCourse.course.code + " • " + (activeCourse.endMins - currentMins) + "m left");
    title.font = Font.boldSystemFont(12);
    title.textColor = Color.white();

    const loc = widget.addText("📍 " + activeCourse.session.room);
    loc.font = Font.systemFont(11);
    loc.textColor = new Color("#cbd5e1");

    const prof = widget.addText("Prof: " + activeCourse.course.instructor);
    prof.font = Font.systemFont(10);
    prof.textColor = new Color("#94a3b8");
  } else if (nextCourse) {
    const title = widget.addText("UP NEXT • in " + (nextCourse.startMins - currentMins) + "m");
    title.font = Font.boldSystemFont(11);
    title.textColor = new Color("#38bdf8");

    const code = widget.addText(nextCourse.course.code + ": " + nextCourse.course.title);
    code.font = Font.semiboldSystemFont(12);
    code.textColor = Color.white();
    code.lineLimit = 1;

    const loc = widget.addText("📍 " + nextCourse.session.room + " (" + nextCourse.session.displayTime + ")");
    loc.font = Font.systemFont(10);
    loc.textColor = new Color("#94a3b8");
  } else {
    const freeText = widget.addText("✨ Free Academic Block");
    freeText.font = Font.boldSystemFont(12);
    freeText.textColor = Color.white();

    const sub = widget.addText("No upcoming lectures today.");
    sub.font = Font.systemFont(10);
    sub.textColor = new Color("#94a3b8");
  }
}

// ==========================================
// 4. HOME SCREEN WIDGETS (Small, Medium, Large)
// ==========================================
else {
  widget.backgroundColor = new Color("#0d1117", 0.95);
  widget.setPadding(16, 16, 16, 16);

  const gradient = new LinearGradient();
  gradient.locations = [0, 1];
  gradient.colors = [
    new Color("#161b22"),
    new Color("#090d13")
  ];
  widget.backgroundGradient = gradient;

  // Header Stack
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();

  const titleText = headerStack.addText("📅 " + currentDayStr + " ACADEMIC");
  titleText.textColor = new Color("#94a3b8");
  titleText.font = Font.boldSystemFont(11);

  headerStack.addSpacer();

  const liveText = headerStack.addText(activeCourse ? "● IN CLASS" : "● LIVE RADAR");
  liveText.textColor = activeCourse ? new Color("#38bdf8") : new Color("#10b981");
  liveText.font = Font.boldSystemFont(10);

  widget.addSpacer(8);

  if (activeCourse) {
    const codeText = widget.addText(activeCourse.course.code);
    codeText.textColor = new Color(activeCourse.course.color || "#38bdf8");
    codeText.font = Font.boldSystemFont(15);

    const title = widget.addText(activeCourse.course.title);
    title.textColor = Color.white();
    title.font = Font.semiboldSystemFont(13);
    title.lineLimit = 1;

    const loc = widget.addText("📍 " + activeCourse.session.room + " • " + (activeCourse.endMins - currentMins) + "m remaining");
    loc.textColor = new Color("#94a3b8");
    loc.font = Font.systemFont(11);
  } else if (nextCourse) {
    const codeText = widget.addText("UP NEXT • in " + (nextCourse.startMins - currentMins) + "m");
    codeText.textColor = new Color("#38bdf8");
    codeText.font = Font.boldSystemFont(11);

    const title = widget.addText(nextCourse.course.code + ": " + nextCourse.course.title);
    title.textColor = Color.white();
    title.font = Font.semiboldSystemFont(13);
    title.lineLimit = 1;

    const loc = widget.addText("📍 " + nextCourse.session.room + " (" + nextCourse.session.displayTime + ")");
    loc.textColor = new Color("#94a3b8");
    loc.font = Font.systemFont(11);
  } else {
    const freeText = widget.addText("✨ Free Block");
    freeText.textColor = Color.white();
    freeText.font = Font.boldSystemFont(14);

    const sub = widget.addText("No more lectures scheduled today.");
    sub.textColor = new Color("#94a3b8");
    sub.font = Font.systemFont(11);
  }

  widget.addSpacer(8);

  // Footer: Urgent Assignments
  const pendingAssignments = (APP_DATA.assignments || []).filter(a => a.status !== "completed");
  if (pendingAssignments.length > 0) {
    const asg = pendingAssignments[0];
    const asgStack = widget.addStack();
    asgStack.layoutHorizontally();
    asgStack.centerAlignContent();

    const icon = asgStack.addText("⚠️ ");
    icon.font = Font.systemFont(10);

    const asgText = asgStack.addText("Due: " + asg.title);
    asgText.textColor = new Color("#f87171");
    asgText.font = Font.semiboldSystemFont(11);
    asgText.lineLimit = 1;
  }
}

if (config.runsInWidget) {
  Script.setWidget(widget);
} else {
  widget.presentMedium();
}
Script.complete();
`;
}
