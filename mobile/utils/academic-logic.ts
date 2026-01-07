// mobile/utils/academic-logic.ts

// Helper to format date as YYYY-MM-DD
export const getTodayStr = () => new Date().toISOString().split('T')[0];

const daysOrder = ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function calculateDaySchedule(date: Date, masterData: any, calendarEvents: any[]) {
  if (!masterData || !masterData.timetable) return { status: "Loading...", schedule: [], isHoliday: false };

  const dateStr = date.toISOString().split('T')[0];
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });

  // 1. Check for Global Events (Holidays / Manual Orders)
  // Ensure calendarEvents is an array
  const events = Array.isArray(calendarEvents) ? calendarEvents : Object.values(calendarEvents || {});
  
  const todayEvent = events.find((e: any) => e.date === dateStr);
  const isHoliday = todayEvent?.title?.toLowerCase().includes("holiday");
  const manualOrder = todayEvent?.title?.toLowerCase().includes("order");

  let resolvedOrder = "";
  let status = "";

  // 2. Resolve Day Order
  if (isHoliday) {
    resolvedOrder = ""; 
    status = `Holiday: ${todayEvent.title}`;
  } else if (manualOrder) {
    // Check if event says "Monday Order", etc.
    const foundDay = ["Monday", ...daysOrder].find(day => todayEvent.title.includes(day));
    if (foundDay) {
      resolvedOrder = foundDay;
      status = `Following ${foundDay} Order`;
    } else {
      resolvedOrder = weekday === "Sunday" ? "" : weekday;
      status = `Special: ${todayEvent.title}`;
    }
  } else {
    // Regular Day
    if (weekday === "Sunday") {
      resolvedOrder = "";
      status = "Sunday";
    } else {
      resolvedOrder = weekday;
      status = `Regular ${weekday}`;
    }
  }

  // 3. Get Periods from Timetable
  // Assuming timetable structure is { "Monday": ["CODE1", "CODE2", ...], ... }
  const scheduleCodes = resolvedOrder ? (masterData.timetable[resolvedOrder] || []) : [];

  // 4. Resolve Subject Names
  const fullSchedule = scheduleCodes.map((code: string) => {
    // Handle "CODE1 / CODE2" split
    const pureCode = code.split('/')[0].trim(); 
    const course = masterData.courses?.find((c: any) => c.code === pureCode);
    return {
      code: code,
      name: course ? course.name : "Subject",
      faculty: course ? course.faculty : ""
    };
  });

  return {
    status,
    schedule: fullSchedule,
    dayOrder: resolvedOrder,
    isHoliday: isHoliday || weekday === "Sunday",
    event: todayEvent
  };
}