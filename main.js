// Firebase initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  setPersistence, 
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzmWDaBLZaNE-S1PH-34snH3HmjauJqlM",
  authDomain: "geoinvention-dataset.firebaseapp.com",
  projectId: "geoinvention-dataset",
  storageBucket: "geoinvention-dataset.firebasestorage.app",
  messagingSenderId: "178675075633",
  appId: "1:178675075633:web:465f8487c1078fa97c2310"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence);  // 添加持久化设置
const db = getFirestore(app);

// Mobile menu toggle
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', 
      navLinks.classList.contains('active'));
  });
}

// Responsive menu setup
function setupResponsiveMenu() {
  if (!menuToggle || !navLinks) return;
  
  if (window.innerWidth <= 576) {
    menuToggle.style.display = 'block';
    navLinks.classList.remove('active');
  } else {
    menuToggle.style.display = 'none';
    navLinks.classList.remove('active');
  }
}

// Handle download button clicks
document.addEventListener('DOMContentLoaded', () => {
  setupResponsiveMenu();
  window.addEventListener('resize', setupResponsiveMenu);
  
  const downloadButtons = document.querySelectorAll('.download-btn');
  
  downloadButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
      e.preventDefault();
      const datasetId = button.dataset.id;
      
      // Check auth state
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // User is signed in, record download and proceed
          // Get download URL from button's data-url attribute
          const downloadUrl = button.dataset.url || `https://example.com/datasets/${datasetId}.zip`;
          
          // Get user name from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userName = userDoc.exists() ? userDoc.data().name : 'Unknown';
          
          // Get page title
          const pageTitle = document.querySelector('h1')?.textContent || 'Untitled Dataset';
          
          // Record download in Firestore
          const downloadsRef = collection(db, 'downloads');
          await addDoc(downloadsRef, {
            userId: user.uid,
            datasetId: datasetId,
            timestamp: new Date(),
            email: user.email,
            userName: userName,
            datasetTitle: pageTitle
          });
          
          window.location.href = downloadUrl;
        } else {
          // No user signed in, redirect to login with return URL
          const currentUrl = window.location.pathname;
          window.location.href = `/login.html?return=${encodeURIComponent(currentUrl)}`;
        }
      });
    });
  });
});


// Modal interaction logic
const authModal = document.getElementById('auth-modal');
const loginSection = document.getElementById('login-section');
const registerSection = document.getElementById('register-section');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const closeModal = document.querySelector('.close-modal');

if (authModal) {
  // Toggle between login/register forms
  showRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    loginSection.style.display = 'none';
    registerSection.style.display = 'block';
  });

  showLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    registerSection.style.display = 'none';
    loginSection.style.display = 'block';
  });

  // Close modal
  closeModal?.addEventListener('click', () => {
    authModal.style.display = 'none';
  });

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.style.display = 'none';
    }
  });

  // Login form handler
  document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    signInWithEmailAndPassword(auth, email, password)
      .then(() => {
        authModal.style.display = 'none';
      })
      .catch((error) => {
        document.getElementById('auth-error').textContent = error.message;
      });
  });

  // Register form handler
  document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;
    
    if (password !== confirm) {
      document.getElementById('auth-error').textContent = 'Passwords do not match';
      return;
    }
    
    createUserWithEmailAndPassword(auth, email, password)
      .then(() => {
        authModal.style.display = 'none';
      })
      .catch((error) => {
        document.getElementById('auth-error').textContent = error.message;
      });
  });
}

export { app, auth, db };
