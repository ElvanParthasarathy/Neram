import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

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

const featureCards = {
  enabled: true,
  cards: [
    {
      id: "card_one_handed_ui",
      title: "New UI Experience",
      titleTa: "புதிய இடைமுக அனுபவம்",
      description: "Reach everything with ease using the new one-handed One UI design.",
      descriptionTa: "ஒரு கை பயன்பாட்டிற்கான புதிய ஒன் யுஐ வடிவமைப்புடன் எளிதாகப் பயன்படுத்துங்கள்.",
      badge: "NEW",
      icon: "sparkle",
      actionRoute: "notes",
      actionText: "Explore",
      actionTextTa: "பார்",
      enabled: true
    },
    {
      id: "card_languages_support",
      title: "New Language Support",
      titleTa: "புதிய மொழி ஆதரவு",
      description: "Tamil, English, and Malayalam are now supported in both native and Latin scripts.",
      descriptionTa: "தமிழ், ஆங்கிலம், மலையாளம் மொழிகள் இயல்பு மற்றும் லத்தீன் எழுத்துருக்களில் ஆதரிக்கப்படுகின்றன.",
      badge: "UPDATE",
      icon: "language",
      actionRoute: "language",
      actionText: "Change Language",
      actionTextTa: "மொழியை மாற்று",
      enabled: true
    }
  ]
};

async function updateCards() {
  try {
    await set(ref(db, "settings/feature_cards"), featureCards);
    console.log("SUCCESS: Feature cards saved directly to Firebase RTDB!");
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err.message);
    process.exit(1);
  }
}

updateCards();
