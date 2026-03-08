import React, { useState, useEffect } from "react";
import { db } from "../firebase"; // Ensure this points to your src/firebase.js
import { ref, onValue } from "firebase/database"; //

function CalendarMonthView() {
  const [allEvents, setAllEvents] = useState([]); // Dynamic storage
  const [viewDate, setViewDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // 1. Fetch live events from Firebase
  useEffect(() => {
    const batch = localStorage.getItem('userBatch') || '2024';
    const calendarRef = ref(db, `calendars/${batch}/events`);

    const unsubscribe = onValue(calendarRef, (snapshot) => {
      if (snapshot.exists()) {
        setAllEvents(snapshot.val()); //
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Navigation logic
  const handlePrev = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNext = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // 3. Filter events for the current viewing month
  const currentEvents = allEvents.filter(item => {
    const [y, m, d] = item.date.split('-').map(Number);
    const itemDate = new Date(y, m - 1, d);
    return (
      itemDate.getMonth() === viewDate.getMonth() &&
      itemDate.getFullYear() === viewDate.getFullYear()
    );
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format

  if (loading) return <div className="loading">Syncing with Google Calendar...</div>;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={handlePrev}>Prev</button>
        <strong>
          {viewDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
        </strong>
        <button onClick={handleNext}>Next</button>
      </div>

      <table border="1" cellPadding="8" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#f4f4f4" }}>
            <th>Date</th>
            <th>Day</th>
            <th>Event</th>
          </tr>
        </thead>
        <tbody>
          {currentEvents.length > 0 ? (
            currentEvents.map((event, idx) => {
              const [y, m, d] = event.date.split('-').map(Number);
              const dateObj = new Date(y, m - 1, d);
              const dayName = dateObj.toLocaleDateString("en-IN", { weekday: "long" });
              const isToday = event.date === todayStr;

              return (
                <tr key={idx} style={isToday ? { backgroundColor: "#d0f0c0", fontWeight: "bold" } : {}}>
                  <td>{event.date}</td>
                  <td>{dayName}</td>
                  <td>{event.title}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                No academic events found for this month.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CalendarMonthView;