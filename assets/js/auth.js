console.log('auth.js loaded')
const authBtn = document.getElementById('auth-btn');
const userEmail = document.getElementById('user-email');

async function checkSession() {
  console.log('Checking session...')
  if (!authBtn || !userEmail) return;
  
  // Show loading state
  authBtn.disabled = true;
  authBtn.textContent = 'Checking...';
  
  try {
    // Ensure Appwrite is loaded
    if (typeof Appwrite === 'undefined') {
      await new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/appwrite@16.0.0';
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    
    // Initialize Appwrite if not already done
    if (!window.client || !window.account) {
      const { Client, Account } = Appwrite;
      window.client = new Client();
      window.client
        .setEndpoint("http://117.50.71.62/v1")
        .setProject("67e68a8e00363ae05db0");
      window.account = new Account(window.client);
    }

    // Check session with timeout
    const user = await Promise.race([
      window.account.get(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session check timeout')), 5000)
      )
    ]);
    
    userEmail.textContent = user.email;
    authBtn.textContent = 'Logout';
    authBtn.onclick = async () => {
      await window.account.deleteSession('current');
      window.location.reload();
    };
  } catch (error) {
    console.error('Session check failed:', error);
    
    // Clear any existing session
    try {
      await window.account?.deleteSession('current');
    } catch (e) {
      console.log('Failed to clear session:', e.message);
    }
    
    userEmail.textContent = '';
    authBtn.textContent = 'Login';
    authBtn.onclick = () => {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login.html?return=${returnUrl}`;
    };
  } finally {
    authBtn.disabled = false;
  }
}

// Check session on load
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  
  // Handle login success redirect
  if (window.location.search.includes('login=success')) {
    const url = new URL(window.location.href);
    url.searchParams.delete('login');
    window.history.replaceState({}, '', url.toString());
    
    // Force UI update
    authBtn.textContent = 'Logout';
    authBtn.onclick = async () => {
      await window.account.deleteSession('current');
      window.location.reload();
    };
    
    // Get and display user email
    window.account.get().then(user => {
      userEmail.textContent = user.email;
    }).catch(console.error);
  }
});
