import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = { 
    apiKey : "AIzaSyA-29pSNfXSScqgThENJEmkFgHMHA7tN9Q" , 
    authDomain : "hpn-cms.firebaseapp.com" , 
    databaseURL : "https://hpn-cms-default-rtdb.asia-southeast1.firebasedatabase.app" , 
    projectId : "hpn-cms" , 
    storageBucket : "hpn-cms.firebasestorage.app" , 
    messagingSenderId : "967690823970" , 
    appId : "1:967690823970:web:75f22d1a6e6aaf5f9edd7b" , 
    measurementId : "G-7CC65P2730" 
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const rtdbUrl = firebaseConfig.databaseURL;