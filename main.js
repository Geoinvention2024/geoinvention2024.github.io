// Appwrite initialization
const client = new Client()
  .setEndpoint("http://117.50.71.62/v1")
  .setProject("67e68a8e00363ae05db0");

const account = new Account(client);
const databases = new Databases(client);

// Helper functions
async function getCurrentUser() {
  try {
    return await account.get();
  } catch (error) {
    return null;
  }
}

async function recordDownload(datasetId, datasetTitle) {
  const user = await getCurrentUser();
  if (!user) return;

  await databases.createDocument(
    "downloads", // collectionId
    "unique()", // documentId (auto-generated)
    {
      userId: user.$id,
      datasetId: datasetId,
      timestamp: new Date().toISOString(),
      email: user.email,
      userName: user.name,
      datasetTitle: datasetTitle,
    }
  );
}

// Mobile menu toggle
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

if (menuToggle && navLinks) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
    menuToggle.setAttribute(
      "aria-expanded",
      navLinks.classList.contains("active")
    );
  });
}

// Responsive menu setup
function setupResponsiveMenu() {
  if (!menuToggle || !navLinks) return;

  if (window.innerWidth <= 576) {
    menuToggle.style.display = "block";
    navLinks.classList.remove("active");
  } else {
    menuToggle.style.display = "none";
    navLinks.classList.remove("active");
  }
}

// Handle download button clicks
document.addEventListener("DOMContentLoaded", () => {
  setupResponsiveMenu();
  window.addEventListener("resize", setupResponsiveMenu);

  // Download button handlers are now in dataset.html template
});

// Login/Register form interaction logic
const loginSection = document.getElementById("login-section");
const registerSection = document.getElementById("register-section");
const showRegister = document.getElementById("show-register");
const showLogin = document.getElementById("show-login");

if (loginSection && registerSection) {
  // Toggle between login/register forms
  showRegister?.addEventListener("click", (e) => {
    e.preventDefault();
    loginSection.style.display = "none";
    registerSection.style.display = "block";
  });

  showLogin?.addEventListener("click", (e) => {
    e.preventDefault();
    registerSection.style.display = "none";
    loginSection.style.display = "block";
  });

  // Login form handler
  document
    .getElementById("login-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Form submission prevented");

      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const errorElement = document.getElementById("auth-error");
        // Get return URL from query params or referrer
        let returnUrl = new URLSearchParams(window.location.search).get("return");
        if (!returnUrl) {
          // If no explicit return URL, try to get from document.referrer
          try {
            const referrer = new URL(document.referrer);
            if (referrer.origin === window.location.origin) {
              returnUrl = referrer.pathname + referrer.search;
            }
          } catch (e) {
            console.log("Could not parse referrer:", e);
          }
        }
        returnUrl = returnUrl || "/";

        // Clear previous errors
        errorElement.textContent = "";
        errorElement.style.display = "none";

        console.log("Login attempt started for:", email);
        console.log("Using return URL:", returnUrl);

      try {
        if (!email || !password) {
          throw new Error("Please enter both email and password");
        }

        console.log("Checking Appwrite client configuration...");
        console.log("Endpoint:", client.config.endpoint);
        console.log("Project:", client.config.project);

        // Delete any existing sessions first
        console.log("Deleting existing sessions...");
        // await account.deleteSessions();

        console.log("Creating new session...");
        const session = await account.createEmailPasswordSession(
          email,
          password
        );
        console.log("Session created:", session);

        console.log("Login successful, redirecting to:", returnUrl);
        // Add login=success parameter to trigger session check
        const redirectUrl = new URL(returnUrl, window.location.origin);
        redirectUrl.searchParams.set('login', 'success');
        window.location.href = redirectUrl.toString();
      } catch (error) {
        console.error("Login failed:", error);
        console.error("Error details:", {
          message: error.message,
          code: error.code,
          type: error.type,
          response: error.response,
        });

        if (error.message.includes("Invalid credentials")) {
          errorElement.textContent = "Invalid email or password";
        } else if (error.message.includes("missing scope (account)")) {
          errorElement.innerHTML = `
            <div style="text-align: left">
              <p>Account access issue detected. Possible reasons:</p>
              <ul>
                <li>Your account hasn't been activated yet</li>
                <li>You need to <a href='#' id='switch-to-register'>register</a> first</li>
                <li>Your account may be pending approval</li>
              </ul>
              <p>Please contact support if you believe this is an error.</p>
            </div>
          `;
          document.getElementById('switch-to-register')?.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.style.display = "none";
            registerSection.style.display = "block";
          });
        } else {
          errorElement.textContent = "Login failed. Please try again later. If the problem persists, contact support.";
        }
        errorElement.style.display = "block";
      }
    });

  // Register form handler
  document
    .getElementById("register-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("reg-email").value;
      const password = document.getElementById("reg-password").value;
      const confirm = document.getElementById("reg-confirm").value;
      const name = document.getElementById("reg-name").value;
      const errorElement = document.getElementById("auth-error");

      if (password !== confirm) {
        errorElement.textContent = "Passwords do not match";
        return;
      }

      try {
        await account.create("unique()", email, password, name);
        await account.createEmailPasswordSession(email, password);

        // 注册成功提示
        const successMessage = document.getElementById("success-message");
        successMessage.textContent = "Registration successful! Redirecting...";
        successMessage.style.display = "block";

        // 1秒后跳转到首页（或其他页面）
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } catch (error) {
        errorElement.textContent = error.message;
        errorElement.style.display = "block";
      }
    });
}

// Attach to window for global access
window.client = client;
window.account = account;
window.databases = databases;
