// ══════════════════════════════════════════════════════════════
// FIREBASE CONFIG
// ══════════════════════════════════════════════════════════════

const firebaseConfig = {
    apiKey: "AIzaSyCVqsIuEPdYNXAjwxNmNceg3FWQ7BmKlNU",
    authDomain: "stocktracker-60ebf.firebaseapp.com",
    projectId: "stocktracker-60ebf",
    storageBucket: "stocktracker-60ebf.firebasestorage.app",
    messagingSenderId: "159141308489",
    appId: "1:159141308489:web:4e2a3ddc0e7ab5614db798"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
