import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, remove, set } from "firebase/database";

// Copy this configuration from your web/src/firebase.js
// MAKE SURE TO FILL THESE IN WITH YOUR ACTUAL FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function cleanLegacyCalendarData() {
    console.log("Starting legacy Calendar data cleanup...");

    try {
        // 1. Get the academic hierarchy to know which batches exist
        const hierarchySnap = await get(ref(db, 'academic_hierarchy'));
        if (!hierarchySnap.exists()) {
            console.log("❌ No academic hierarchy found. Exiting.");
            return;
        }

        // Get all batches (excluding 'initialized')
        const batches = Object.keys(hierarchySnap.val()).filter(k => k !== 'initialized');
        console.log(`Found ${batches.length} batches to check: ${batches.join(', ')}`);

        for (const batch of batches) {
            console.log(`\n--- Checking Batch: ${batch} ---`);

            const calendarRef = ref(db, `calendars/${batch}`);
            const calSnap = await get(calendarRef);

            if (!calSnap.exists()) {
                console.log(`No calendar data found for batch ${batch}.`);
                continue;
            }

            const data = calSnap.val();

            // 2. Remove legacy Google Calendar configurations
            let hasLegacyConfig = false;

            if (data.config) {
                console.log(`🗑️ Removing legacy API config for batch ${batch}...`);
                await remove(ref(db, `calendars/${batch}/config`));
                hasLegacyConfig = true;
            }

            if (data.semConfig) {
                console.log(`🗑️ Removing legacy semConfig for batch ${batch}...`);
                await remove(ref(db, `calendars/${batch}/semConfig`));
                hasLegacyConfig = true;
            }

            if (!hasLegacyConfig) {
                console.log(`No legacy config found to clean.`);
            }

            // 3. (Optional) Wipe old events before pushing new ones via Agazhi
            // If you want to wipe the old events too, uncomment the block below:

            /*
            if (data.events) {
              console.log(`🗑️ Wiping existing events for batch ${batch}...`);
               await remove(ref(db, `calendars/${batch}/events`));
            }
            */

            console.log(`✅ Cleaned up batch ${batch}`);
        }

        console.log("\n🎉 Cleanup complete! You can now use Elvan Agazhi to push fresh data.");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error during cleanup:", error);
        process.exit(1);
    }
}

// Run the script
cleanLegacyCalendarData();
