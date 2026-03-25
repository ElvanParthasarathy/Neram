import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC56yIPyKr3GZMc27T-2xGN0N1wslJB2kQ",
  authDomain: "rmdneramportal.firebaseapp.com",
  databaseURL: "https://rmdneramportal-default-rtdb.firebaseio.com",
  projectId: "rmdneramportal",
  storageBucket: "rmdneramportal.firebasestorage.app",
  messagingSenderId: "85578742222",
  appId: "1:85578742222:web:03470e1ebe449d6c2c139f"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function migrate() {
  console.log("Starting migration...");
  
  // 1. Migrate Global Calendars (Academic Calendar)
  const calsSnap = await get(ref(db, "calendars"));
  const updates = {};

  if (calsSnap.exists()) {
    const cals = calsSnap.val();
    
    for (const batch of Object.keys(cals)) {
      const events = cals[batch].events || [];
      let changed = false;
      const newEvents = events.map(ev => {
        if (ev.title && ev.title.toLowerCase().includes("holiday") && ev.type !== "Holiday") {
          changed = true;
          return { ...ev, type: "Holiday" };
        }
        return ev;
      });
      if (changed) {
        updates[`calendars/${batch}/events`] = newEvents;
      }
    }
  }
    
  // 2. Migrate Section Events (EventManager)
  const eventsSnap = await get(ref(db, "events"));
  if (eventsSnap.exists()) {
    const allEvents = eventsSnap.val();
    for (const batch of Object.keys(allEvents)) {
      for (const dept of Object.keys(allEvents[batch])) {
        for (const sec of Object.keys(allEvents[batch][dept])) {
            const secEvents = allEvents[batch][dept][sec];
            if (!secEvents || typeof secEvents !== 'object') continue;

            let changed = false;
            let newSecEvents = Array.isArray(secEvents) ? [] : {};

            if (Array.isArray(secEvents)) {
              newSecEvents = secEvents.map(ev => {
                let evChanged = false;
                if (ev.title && ev.title.toLowerCase().includes("holiday") && ev.type !== "Holiday") {
                  ev.type = "Holiday";
                  evChanged = true;
                }
                if (ev.events && Array.isArray(ev.events)) {
                  ev.events = ev.events.map(innerEv => {
                    if (innerEv.title && innerEv.title.toLowerCase().includes("holiday") && innerEv.type !== "Holiday") {
                      evChanged = true;
                      return { ...innerEv, type: "Holiday" };
                    }
                    return innerEv;
                  });
                }
                if (evChanged) changed = true;
                return ev;
              });
            } else {
              for(const key of Object.keys(secEvents)) {
                if (key === 'initialized' || key === '_master') {
                    newSecEvents[key] = secEvents[key];
                    continue;
                }
                
                const ev = secEvents[key];
                let evChanged = false;
                if (ev.title && ev.title.toLowerCase().includes("holiday") && ev.type !== "Holiday") {
                  ev.type = "Holiday";
                  evChanged = true;
                }
                if (ev.events && Array.isArray(ev.events)) {
                  ev.events = ev.events.map(innerEv => {
                    if (innerEv.title && innerEv.title.toLowerCase().includes("holiday") && innerEv.type !== "Holiday") {
                      evChanged = true;
                      return { ...innerEv, type: "Holiday" };
                    }
                    return innerEv;
                  });
                }
                if (evChanged) changed = true;
                newSecEvents[key] = ev;
              }
            }
            if (changed) {
              updates[`events/${batch}/${dept}/${sec}`] = newSecEvents;
            }
        }
      }
    }
  }
  
  if (Object.keys(updates).length > 0) {
    console.log("Updating paths:", Object.keys(updates));
    await update(ref(db), updates);
    console.log("Migration complete!");
  } else {
    console.log("No events needed migration.");
  }
  
  process.exit(0);
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
