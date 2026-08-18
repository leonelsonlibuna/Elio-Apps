import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy initialization for Gemini API client
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// In-memory calendar & widget state store for WebCal / Scriptable feeds
let cachedServerSchedule: {
  courses: any[];
  assignments: any[];
  lastUpdated: string;
} = {
  courses: [],
  assignments: [],
  lastUpdated: new Date().toISOString(),
};

// Sync student schedule state to server for WebCal subscription
app.post("/api/calendar/sync-state", (req, res) => {
  const { courses, assignments } = req.body;
  if (Array.isArray(courses)) {
    cachedServerSchedule.courses = courses;
  }
  if (Array.isArray(assignments)) {
    cachedServerSchedule.assignments = assignments;
  }
  cachedServerSchedule.lastUpdated = new Date().toISOString();
  res.json({ success: true, count: cachedServerSchedule.courses.length, lastUpdated: cachedServerSchedule.lastUpdated });
});

// JSON feed for iOS Scriptable Widget & Shortcuts
app.get("/api/widget/data.json", (_req, res) => {
  res.json({
    status: "ok",
    courses: cachedServerSchedule.courses,
    assignments: cachedServerSchedule.assignments,
    lastUpdated: cachedServerSchedule.lastUpdated,
  });
});

// Live .ics iCalendar / WebCal Feed for Apple Calendar & Google Calendar subscriptions
app.get("/api/calendar/feed.ics", (_req, res) => {
  const dayMap: Record<string, string> = {
    MON: "MO",
    TUES: "TU",
    WED: "WE",
    THUR: "TH",
    FRI: "FR",
    SAT: "SA",
    SUN: "SU",
  };

  const now = new Date();
  const formatICSDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const nowStr = formatICSDate(now);

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//College Academic Schedule//iPhone & Google Sync//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:College Academic Schedule & Deadlines",
    "X-WR-TIMEZONE:Asia/Manila",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  // Recurring classes
  for (const course of cachedServerSchedule.courses) {
    for (const session of course.sessions || []) {
      const byDay = dayMap[session.day] || "MO";
      const [sH, sM] = (session.startTime || "08:00").split(":").map(Number);
      const [eH, eM] = (session.endTime || "09:30").split(":").map(Number);

      const targetDayIndex = ["SUN", "MON", "TUES", "WED", "THUR", "FRI", "SAT"].indexOf(session.day);
      const currentDayIndex = now.getDay();
      let diff = targetDayIndex - currentDayIndex;
      if (diff < 0) diff += 7;

      const startDate = new Date(now);
      startDate.setDate(now.getDate() + diff);
      startDate.setHours(sH, sM, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(eH, eM, 0, 0);

      icsLines.push(
        "BEGIN:VEVENT",
        `UID:lecture-${course.id}-${session.id || Math.random()}@collegeschedule.app`,
        `DTSTAMP:${nowStr}`,
        `DTSTART:${formatICSDate(startDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `RRULE:FREQ=WEEKLY;BYDAY=${byDay};UNTIL=20261231T235959Z`,
        `SUMMARY:📚 ${course.code} - ${course.title}`,
        `LOCATION:${session.room || "Room TBA"}`,
        `DESCRIPTION:Instructor: ${course.instructor || "Faculty"}\\nUnits: ${course.units || 3} Credits\\nPriority: ${(course.priority || "high").toUpperCase()}`,
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        `DESCRIPTION:Reminder: ${course.code} starts in 15 mins at ${session.room}`,
        "END:VALARM",
        "END:VEVENT"
      );
    }
  }

  // Assignments & Exams
  for (const asg of cachedServerSchedule.assignments) {
    const course = (cachedServerSchedule.courses || []).find((c) => c.id === asg.courseId);
    const [dH, dM] = (asg.dueTime || "23:59").split(":").map(Number);
    const dueDate = new Date(`${asg.dueDate || "2026-08-25"}T00:00:00`);
    dueDate.setHours(dH, dM, 0, 0);

    const startDate = new Date(dueDate);
    startDate.setHours(dH > 0 ? dH - 1 : 0, dM, 0, 0);

    const isExam = asg.type === "exam" || asg.type === "quiz";

    icsLines.push(
      "BEGIN:VEVENT",
      `UID:deadline-${asg.id}@collegeschedule.app`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(dueDate)}`,
      `SUMMARY:${isExam ? "📝 EXAM" : "⚠️ DUE"}: ${asg.title} (${course?.code || "Course"})`,
      `DESCRIPTION:Course: ${course?.title || "Academic"}\\nType: ${(asg.type || "assignment").toUpperCase()}\\nWeight: ${asg.weightPercentage || 0}%\\nPriority: ${(asg.priority || "high").toUpperCase()}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      `DESCRIPTION:Deadline in 2 hours: ${asg.title}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }

  icsLines.push("END:VCALENDAR");

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'inline; filename="academic_schedule.ics"');
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.send(icsLines.join("\r\n"));
});

// API endpoint to parse syllabus text or uploaded document
app.post("/api/parse-syllabus", async (req, res) => {
  try {
    const { syllabusText, courseName, fileBase64, mimeType } = req.body;

    if (!syllabusText && !fileBase64) {
      return res.status(400).json({ error: "Please provide syllabus text or a file." });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback heuristic parser if no API key is set
      const extracted = fallbackParseSyllabus(syllabusText || "");
      return res.json({ success: true, data: extracted, source: "heuristic" });
    }

    const ai = getAI();
    const prompt = `You are an academic syllabus parser. Analyze this course syllabus for "${courseName || 'College Course'}" and extract structured data in JSON.
Output strictly JSON matching this structure:
{
  "courseCode": "e.g. ECE 312",
  "courseTitle": "e.g. Electronics Devices and Circuits",
  "instructor": "Instructor Name and email/office if found",
  "officeHours": "Office hours string or N/A",
  "gradingBreakdown": [
    { "category": "Quizzes", "percentage": 20 },
    { "category": "Midterm Exam", "percentage": 25 },
    { "category": "Final Exam", "percentage": 30 },
    { "category": "Laboratory Reports", "percentage": 25 }
  ],
  "assignments": [
    {
      "title": "Assignment or Exam Name",
      "description": "Short description / topic",
      "type": "assignment" | "quiz" | "exam" | "lab" | "project",
      "daysFromNow": 3 (estimated days until due, integer between 1 and 45),
      "weightPercentage": 5,
      "priority": "critical" | "high" | "medium" | "low"
    }
  ],
  "keyTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "recommendedStudyHoursPerWeek": 6
}
Syllabus Content:
${syllabusText ? syllabusText.slice(0, 8000) : "Refer to the attached document"}`;

    let response;
    if (fileBase64 && mimeType) {
      response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: fileBase64,
                mimeType: mimeType,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: "application/json",
        },
      });
    } else {
      response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });
    }

    const text = response.text || "{}";
    const parsedData = JSON.parse(text);
    return res.json({ success: true, data: parsedData, source: "gemini" });
  } catch (error: any) {
    console.error("Syllabus parsing error:", error);
    // Fallback if AI call fails
    const fallback = fallbackParseSyllabus(req.body.syllabusText || "");
    return res.json({
      success: true,
      data: fallback,
      source: "fallback",
      warning: error.message,
    });
  }
});

function fallbackParseSyllabus(text: string) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const assignments: any[] = [];
  
  // Basic heuristic scan
  lines.forEach((line, idx) => {
    const lower = line.toLowerCase();
    if (lower.includes("quiz") || lower.includes("exam") || lower.includes("problem set") || lower.includes("project") || lower.includes("lab") || lower.includes("due")) {
      const type = lower.includes("exam")
        ? "exam"
        : lower.includes("quiz")
        ? "quiz"
        : lower.includes("lab")
        ? "lab"
        : lower.includes("project")
        ? "project"
        : "assignment";
      assignments.push({
        title: line.slice(0, 60),
        description: `Extracted from syllabus item ${idx + 1}`,
        type,
        daysFromNow: (idx % 14) + 2,
        weightPercentage: type === "exam" ? 25 : type === "quiz" ? 10 : 5,
        priority: type === "exam" ? "critical" : "high",
      });
    }
  });

  if (assignments.length === 0) {
    assignments.push(
      { title: "Chapter Reading & Conceptual Check", description: "Review weekly lecture modules", type: "assignment", daysFromNow: 3, weightPercentage: 5, priority: "medium" },
      { title: "Mid-Term Examination", description: "Comprehensive coverage of Units 1-4", type: "exam", daysFromNow: 18, weightPercentage: 30, priority: "critical" },
      { title: "Final Term Project Submission", description: "Design project and documentation", type: "project", daysFromNow: 35, weightPercentage: 25, priority: "high" }
    );
  }

  return {
    courseCode: "ECE 312",
    courseTitle: "Course Syllabus",
    instructor: "Faculty In-Charge",
    officeHours: "TTH 2:00 PM - 4:00 PM",
    gradingBreakdown: [
      { category: "Quizzes & Problem Sets", percentage: 25 },
      { category: "Midterm Exam", percentage: 25 },
      { category: "Final Exam", percentage: 30 },
      { category: "Laboratory & Projects", percentage: 20 },
    ],
    assignments,
    keyTopics: ["Core Foundations", "Circuit Analysis", "Semiconductor Physics", "Frequency Response"],
    recommendedStudyHoursPerWeek: 6,
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Schedule & Widget Studio server running at http://localhost:${PORT}`);
  });
}

startServer();
