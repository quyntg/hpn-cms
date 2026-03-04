import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

//live
// const firebaseConfig = { 
//     apiKey : "AIzaSyA-29pSNfXSScqgThENJEmkFgHMHA7tN9Q" , 
//     authDomain : "hpn-cms.firebaseapp.com" , 
//     databaseURL : "https://hpn-cms-default-rtdb.asia-southeast1.firebasedatabase.app" , 
//     projectId : "hpn-cms" , 
//     storageBucket : "hpn-cms.firebasestorage.app" , 
//     messagingSenderId : "967690823970" , 
//     appId : "1:967690823970:web:75f22d1a6e6aaf5f9edd7b" , 
//     measurementId : "G-7CC65P2730" 
// };

//dev
const firebaseConfig = {
    apiKey: "AIzaSyC8AOsuW2_x-A1dhZ7pAB-yzvvo8mCEg60",
    authDomain: "test-cms-84180.firebaseapp.com",
    databaseURL: "https://test-cms-84180-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "test-cms-84180",
    storageBucket: "test-cms-84180.firebasestorage.app",
    messagingSenderId: "690419256479",
    appId: "1:690419256479:web:3e70dd41699f07de83a6aa",
    measurementId: "G-STBRB8TGSY"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);
export const rtdbUrl = firebaseConfig.databaseURL;