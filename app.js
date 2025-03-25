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

// Add narration descriptions for each feature
const featureDescriptions = {
    'object-recognition': 'Object Recognition helps you identify objects in images or through your camera. Click to start identifying objects around you.',
    'handwriting': 'Handwriting Recognition converts your handwritten text into digital text. Click to start converting your handwriting.',
    'text-to-speech': 'Text to Speech converts written text into spoken words. Click to hear text read aloud.',
    'medication-reminder': 'Medication Reminder helps you keep track of your medications. Click to set up your medication schedule.',
    'color-identifier': 'Color Identifier helps identify colors for colorblind users. Click to start identifying colors.',
    'magnifier': 'Digital Magnifier helps you enlarge text and images for better visibility. Click to start magnifying.',
    'qr-scanner': 'QR Scanner helps you scan and read QR codes. Click to start scanning.',
    'translator': 'Translator helps you translate text between different languages. Click to start translating.'
};

// Add hover narration to feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    const featureId = card.getAttribute('href').replace('.html', '');
    
    card.addEventListener('mouseenter', () => {
        if (featureDescriptions[featureId]) {
            window.speechService.speak(featureDescriptions[featureId]);
        }
    });

    card.addEventListener('mouseleave', () => {
        window.speechService.stop();
    });

    // Add touch support for mobile devices
    card.addEventListener('touchstart', (e) => {
        if (featureDescriptions[featureId]) {
            e.preventDefault(); // Prevent immediate navigation
            window.speechService.speak(featureDescriptions[featureId]);
            // Allow navigation after narration starts
            setTimeout(() => {
                window.location.href = card.href;
            }, 1500);
        }
    });
});

// Add a global narration button
const narrationBtn = document.createElement('button');
narrationBtn.className = 'narration-btn';
narrationBtn.innerHTML = '🔊';
narrationBtn.title = 'Read Page Description';
document.body.appendChild(narrationBtn);

narrationBtn.addEventListener('click', () => {
    const pageDescription = 'Welcome to Elder Ease. This application provides various accessibility features to help make technology easier to use. Click on any feature to get started.';
    window.speechService.speak(pageDescription);
});

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