// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// ⬇️ paste your exact config from Firebase console
const firebaseConfig = {
    apiKey: "AIzaSyDeU4_rmeh0gYqQ2NRzeLoOy85pAOw6KH8",
    authDomain: "todoflow-b5d2b.firebaseapp.com",
    projectId: "todoflow-b5d2b",
    storageBucket: "todoflow-b5d2b.appspot.com",
    messagingSenderId: "286493225097",
    appId: "1:286493225097:web:cba42c5f2da31627dc5658"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Export only auth functions (no Firestore)
export {
    auth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
};
