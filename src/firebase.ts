// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCD0atvl3RZfUhYlD-l2m4BPHo4-F3y9bo",
  authDomain: "gym-id-login.firebaseapp.com",
  projectId: "gym-id-login",
  storageBucket: "gym-id-login.firebasestorage.app",
  messagingSenderId: "120857619975",
  appId: "1:120857619975:web:7c2257c22fb931782b04a2",
  measurementId: "G-K5LFBZV5LD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const auth = getAuth(app);

export { auth };