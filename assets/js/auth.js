console.log('auth.js loaded')
const authBtn = document.getElementById('auth-btn');
const userEmail = document.getElementById('user-email');

async function checkSession() {
  console.log('Checking session...');
  if (!authBtn || !userEmail)  {
    console.log('Checking failed. ');
    return;
  }
  console.log('Checking passed. ');
  
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
        .setEndpoint("https://appwrite.szdisinfo.com/v1")
        .setProject("67e68a8e00363ae05db0");
      window.account = new Account(window.client);
    }

    // Check session with timeout
    let user = null;
    try {
      user = await Promise.race([
        window.account.get(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        )
      ]);
    } catch (error) {
      console.warn('Session check failed, falling back to guest mode:', error);
    }
    
    if (user) {
      userEmail.textContent = user.email;
      authBtn.textContent = 'Logout';
      authBtn.onclick = async () => {
        try {
          await window.account.deleteSession('current');
          // 完全重置客户端状态
          window.client = null;
          window.account = null;
        } catch (e) {
          console.warn('Logout failed:', e);
        }
        // 强制刷新页面以完全重置状态
        window.location.href = window.location.pathname;
      };
    } else {
      // Guest mode
      userEmail.textContent = '';
      authBtn.textContent = 'Login';
      authBtn.onclick = () => {
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `/login.html?return=${returnUrl}`;
      };
    }
  } catch (error) {
    console.error('Session check failed:', error);
    // No need to duplicate guest mode handling here
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
      try {
        await window.account.deleteSession('current');
        window.client = null;
        window.account = null;
        window.location.href = window.location.pathname;
      } catch (e) {
        console.warn('Logout failed:', e);
      }
    };
    
    // Get and display user email
    window.account.get().then(user => {
      userEmail.textContent = user.email;
    }).catch(console.error);
  }
});
