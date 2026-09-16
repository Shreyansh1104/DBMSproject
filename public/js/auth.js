// Screen Switching
function showSignup() {
  document.getElementById('login-box').style.display = 'none';
  document.getElementById('signup-box').style.display = 'block';
  document.getElementById('login-error').style.display = 'none';
}

function showLogin() {
  document.getElementById('signup-box').style.display = 'none';
  document.getElementById('login-box').style.display = 'block';
  document.getElementById('login-error').style.display = 'none';
  document.getElementById('signup-error').style.display = 'none';
  document.getElementById('signup-success').style.display = 'none';
}

// Login
async function handleLogin() {
  const email = document.getElementById('login-email').value.trim().toLowerCase();
  const pass = document.getElementById('login-password').value;
  const errorMsg = document.getElementById('login-error');

  if (!email || !pass) {
    errorMsg.textContent = 'Please enter both email and password.';
    errorMsg.style.display = 'block';
    return;
  }

  try {
    const user = await API.post('login', { email, password: pass });
    currentUser = user;
    errorMsg.style.display = 'none';
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('dashboard-screen').style.display = 'block';
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    await loadAll();
    initDashboard();
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.style.display = 'block';
  }
}

// Signup
async function handleSignup() {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim().toLowerCase();
  const pass = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  const errorMsg = document.getElementById('signup-error');
  const successMsg = document.getElementById('signup-success');

  errorMsg.style.display = 'none';
  successMsg.style.display = 'none';

  if (!name || !email || !pass) { errorMsg.textContent = 'Please fill in all fields.'; errorMsg.style.display = 'block'; return; }
  if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
    errorMsg.textContent = 'Email must be a valid @gmail.com address.';
    errorMsg.style.display = 'block';
    return;
  }
  if (pass.length < 6) { errorMsg.textContent = 'Password must be at least 6 characters.'; errorMsg.style.display = 'block'; return; }
  if (pass !== confirm) { errorMsg.textContent = 'Passwords do not match.'; errorMsg.style.display = 'block'; return; }

  try {
    await API.post('signup', { name, email, password: pass });
    successMsg.style.display = 'block';
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-confirm').value = '';

    setTimeout(() => {
      showLogin();
      document.getElementById('login-email').value = email;
      document.getElementById('signup-success').style.display = 'none';
    }, 1500);
  } catch (err) {
    errorMsg.textContent = err.message;
    errorMsg.style.display = 'block';
  }
}

// Logout
function handleLogout() {
  currentUser = null;
  document.getElementById('dashboard-screen').style.display = 'none';
  document.getElementById('auth-container').style.display = 'flex';
  showLogin();
}