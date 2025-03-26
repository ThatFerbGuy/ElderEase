// User authentication state
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

// Modal elements
const loginModal = document.getElementById('loginModal');
const signupModal = document.getElementById('signupModal');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const closeBtns = document.getElementsByClassName('close');

// Form elements
const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const authButtons = document.querySelector('.auth-buttons');

// Show modals
loginBtn.onclick = () => {
    loginModal.style.display = 'block';
};

signupBtn.onclick = () => {
    signupModal.style.display = 'block';
};

// Close modals
Array.from(closeBtns).forEach(btn => {
    btn.onclick = function() {
        loginModal.style.display = 'none';
        signupModal.style.display = 'none';
    };
});

// Close modal when clicking outside
window.onclick = (event) => {
    if (event.target === loginModal || event.target === signupModal) {
        loginModal.style.display = 'none';
        signupModal.style.display = 'none';
    }
};

// Handle form submissions
loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        // Here you would typically make an API call to your backend
        console.log('Login attempt:', { email, password });
        alert('Login functionality will be implemented soon!');
        loginModal.style.display = 'none';
    } catch (error) {
        alert('Login failed: ' + error.message);
    }
};

signupForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        // Here you would typically make an API call to your backend
        console.log('Signup attempt:', { name, email, password });
        alert('Signup functionality will be implemented soon!');
        signupModal.style.display = 'none';
    } catch (error) {
        alert('Signup failed: ' + error.message);
    }
};

// Check authentication status
function checkAuth() {
    // Here you would typically check if the user is already logged in
    const isLoggedIn = false; // This would come from your auth system
    
    if (isLoggedIn) {
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'none';
        // Show user profile or logout button
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});

// Add feature descriptions for tutorial page
const featureDescriptions = {
    'object-detection': 'Object Recognition helps you identify objects in images or through your camera. It can recognize common household items, furniture, and other objects to help with daily activities.',
    'handwriting': 'Handwriting Recognition converts your handwritten text into digital text. It can be used to digitize notes, letters, or any handwritten content.',
    'text-to-speech': 'Text to Speech converts written text into spoken words. It can read articles, books, or any text content aloud with natural-sounding voices.',
    'speech-to-text': 'Speech to Text converts your voice into written text. It supports multiple languages including Hindi, Tamil, Telugu, and Malayalam.',
    'medication-reminder': 'Medication Reminder helps you keep track of your medications. Set reminders for different medications, dosages, and schedules.',
    'color-identifier': 'Color Identifier helps identify colors in images for users with color vision deficiencies. Upload images to identify colors or use your camera in real-time.',
    'translator': 'Translator helps you translate text between different languages. It supports multiple languages and provides instant translations.',
    'day-planner': 'Day Planner helps you organize your daily schedule. Create events, set reminders, and manage your calendar easily.',
    'notes': 'Notes allows you to keep track of important information. Create, edit, and organize your notes in one convenient place.',
    'emergency-contacts': 'Emergency Contacts provides quick access to important phone numbers. Store and organize contacts for family, medical services, and other emergency numbers.'
};

// Add a help button that links to the tutorial page (except on the tutorial page itself)
if (!window.location.pathname.includes('tutorial.html')) {
    const helpBtn = document.createElement('a');
    helpBtn.className = 'help-btn';
    helpBtn.innerHTML = '❓';
    helpBtn.title = 'Help & Tutorials';
    helpBtn.href = 'tutorial.html';
    document.body.appendChild(helpBtn);
}

// Update auth buttons based on login state
function updateAuthButtons() {
    if (currentUser) {
        authButtons.innerHTML = `
            <span class="welcome-text">Welcome, ${currentUser.name}</span>
            <button id="logoutBtn" class="auth-btn">Logout</button>
        `;
        // Add logout handler
        document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    } else {
        authButtons.innerHTML = `
            <button id="loginBtn" class="auth-btn">Login</button>
            <button id="signupBtn" class="auth-btn">Sign Up</button>
        `;
        // Re-add modal handlers
        document.getElementById('loginBtn').addEventListener('click', () => loginModal.style.display = 'block');
        document.getElementById('signupBtn').addEventListener('click', () => signupModal.style.display = 'block');
    }
}

// Handle login
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('loginName').value;
    const password = document.getElementById('loginPassword').value;

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.name === name && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        loginModal.style.display = 'none';
        loginForm.reset();
        updateAuthButtons();
        showMessage('Login successful!', 'success');
    } else {
        showMessage('Invalid username or password', 'error');
    }
});

// Handle signup
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value;
    const password = document.getElementById('signupPassword').value;

    // Get existing users
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if user already exists
    if (users.some(u => u.name === name)) {
        showMessage('Username already exists', 'error');
        return;
    }

    // Add new user
    const newUser = { name, password };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Auto login after signup
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    
    signupModal.style.display = 'none';
    signupForm.reset();
    updateAuthButtons();
    showMessage('Account created successfully!', 'success');
});

// Handle logout
function handleLogout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateAuthButtons();
    showMessage('Logged out successfully', 'success');
}

// Show status messages
function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Initialize auth state
updateAuthButtons(); 