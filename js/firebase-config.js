// ===========================
// FIREBASE CONFIGURATION
// ===========================

const firebaseConfig = {
  apiKey: "AIzaSyD9CL6y1_1sRi1t4XIgTeZ6M7j63_EvmZQ",
  authDomain: "food-express-60f2a.firebaseapp.com",
  projectId: "food-express-60f2a",
  storageBucket: "food-express-60f2a.firebasestorage.app",
  messagingSenderId: "368255201191",
  appId: "1:368255201191:web:b7565058f3af519f711082",
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app();
}

console.log("Firebase initialized successfully");
