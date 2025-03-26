// Auth check utility for protected pages
document.addEventListener('DOMContentLoaded', function() {
    // Check if the current page is one of the protected pages
    const protectedPages = [
        'medication-reminder.html',
        'day-planner.html',
        'notes.html',
        'emergency-contacts.html'
    ];
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        checkAuthAndRedirect();
    }
    
    // Add click handlers to protected feature cards on homepage
    if (currentPage === 'index.html' || currentPage === '') {
        addProtectedFeatureHandlers();
    }
});

// Check if user is authenticated and handle accordingly
function checkAuthAndRedirect() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        // User is not logged in, redirect to homepage with message
        localStorage.setItem('loginRedirect', window.location.href);
        localStorage.setItem('loginMessage', 'You need to log in to access this feature.');
        window.location.href = 'index.html';
        return false;
    }
    
    // User is logged in, load user-specific data
    loadUserData();
    return true;
}

// Load user-specific data for the current feature
function loadUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const currentPage = window.location.pathname.split('/').pop();
    
    // Load the appropriate data based on current page
    switch(currentPage) {
        case 'medication-reminder.html':
            loadMedicationData(currentUser.name);
            break;
        case 'day-planner.html':
            loadPlannerData(currentUser.name);
            break;
        case 'notes.html':
            loadNotesData(currentUser.name);
            break;
        case 'emergency-contacts.html':
            loadContactsData(currentUser.name);
            break;
    }
}

// Helper functions to load user-specific data
function loadMedicationData(username) {
    const key = `medications_${username}`;
    const medications = JSON.parse(localStorage.getItem(key)) || [];
    // Store in session storage for the current session
    sessionStorage.setItem('medications', JSON.stringify(medications));
}

function loadPlannerData(username) {
    const key = `planner_${username}`;
    const events = JSON.parse(localStorage.getItem(key)) || [];
    // Store in session storage for the current session
    sessionStorage.setItem('events', JSON.stringify(events));
}

function loadNotesData(username) {
    const key = `notes_${username}`;
    const notes = JSON.parse(localStorage.getItem(key)) || [];
    // Store in session storage for the current session
    sessionStorage.setItem('notes', JSON.stringify(notes));
}

function loadContactsData(username) {
    const key = `contacts_${username}`;
    const contacts = JSON.parse(localStorage.getItem(key)) || [];
    // Store in session storage for the current session
    sessionStorage.setItem('contacts', JSON.stringify(contacts));
}

// Add click handlers to protected feature cards on homepage
function addProtectedFeatureHandlers() {
    const protectedFeatures = [
        { url: 'medication-reminder.html', selector: 'a[href="medication-reminder.html"]' },
        { url: 'day-planner.html', selector: 'a[href="day-planner.html"]' },
        { url: 'notes.html', selector: 'a[href="notes.html"]' },
        { url: 'emergency-contacts.html', selector: 'a[href="emergency-contacts.html"]' }
    ];
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    protectedFeatures.forEach(feature => {
        const link = document.querySelector(feature.selector);
        if (link) {
            link.addEventListener('click', function(e) {
                if (!currentUser) {
                    e.preventDefault();
                    showLoginPrompt();
                    return false;
                }
            });
        }
    });
}

// Show login prompt popup
function showLoginPrompt() {
    // Remove existing popup if any
    document.getElementById('loginPromptPopup')?.remove();
    
    // Create popup
    const popup = document.createElement('div');
    popup.id = 'loginPromptPopup';
    popup.className = 'modal';
    popup.style.display = 'block';
    
    popup.innerHTML = `
        <div class="modal-content" style="text-align: center;">
            <span class="close">&times;</span>
            <h2>Login Required</h2>
            <p style="margin: 20px 0;">You need to be logged in to access this feature.</p>
            <button id="loginPromptBtn" class="auth-btn" style="margin: 10px auto; display: block;">Login Now</button>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(popup);
    
    // Add event listeners
    document.querySelector('#loginPromptPopup .close').addEventListener('click', () => {
        popup.remove();
    });
    
    document.getElementById('loginPromptBtn').addEventListener('click', () => {
        popup.remove();
        document.getElementById('loginBtn').click();
    });
    
    // Close when clicking outside
    window.addEventListener('click', function closePrompt(e) {
        if (e.target === popup) {
            popup.remove();
            window.removeEventListener('click', closePrompt);
        }
    });
}

// Function to save data back to localStorage
// This should be called when user makes changes to data
function saveUserData(dataType, data) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    let key;
    switch(dataType) {
        case 'medications':
            key = `medications_${currentUser.name}`;
            break;
        case 'events':
            key = `planner_${currentUser.name}`;
            break;
        case 'notes':
            key = `notes_${currentUser.name}`;
            break;
        case 'contacts':
            key = `contacts_${currentUser.name}`;
            break;
        default:
            return;
    }
    
    localStorage.setItem(key, JSON.stringify(data));
    // Update session storage too
    sessionStorage.setItem(dataType, JSON.stringify(data));
}

// Check for login messages when the page loads
document.addEventListener('DOMContentLoaded', function() {
    const loginMessage = localStorage.getItem('loginMessage');
    if (loginMessage) {
        showMessage(loginMessage, 'error');
        localStorage.removeItem('loginMessage');
    }
});

// Show message function (reused from app.js)
function showMessage(message, type) {
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.className = `message message-${type}`;
    messageElement.textContent = message;
    
    // Add to DOM
    document.body.appendChild(messageElement);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageElement.remove();
    }, 3000);
} 