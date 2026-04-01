import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyApeOHAmMRqnDmZt3xSkX2ljQBaMktRFoo",
    authDomain: "clinica-neurofisioreabilith.firebaseapp.com",
    projectId: "clinica-neurofisioreabilith",
    storageBucket: "clinica-neurofisioreabilith.firebasestorage.app",
    messagingSenderId: "1001666937244",
    appId: "1:1001666937244:web:1c262f4a996e64904dc859"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);