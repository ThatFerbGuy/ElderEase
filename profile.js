// Get DOM elements
const profileImage = document.getElementById('profileImage');
const profileDetails = document.getElementById('profileDetails');
const profileEditModal = document.getElementById('profileEditModal');
const profileEditForm = document.getElementById('profileEditForm');
const closeBtns = document.getElementsByClassName('close');
const profileImageUpload = document.getElementById('profileImageUpload');

// Current user profile data
let currentProfile = JSON.parse(localStorage.getItem('currentProfile')) || {
    fullName: '',
    age: '',
    bloodType: 'A+',
    diseases: '',
    prescriptions: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    profileImage: 'https://via.placeholder.com/150'
};

// Close modal functionality
Array.from(closeBtns).forEach(btn => {
    btn.onclick = function() {
        profileEditModal.style.display = 'none';
        document.getElementById('profileDetailsPopup')?.remove();
    };
});

// Close modal when clicking outside
window.onclick = (event) => {
    if (event.target === profileEditModal) {
        profileEditModal.style.display = 'none';
    }
    if (event.target.id !== 'profileImage' && 
        event.target.id !== 'profileDetailsPopup' && 
        !event.target.closest('#profileDetailsPopup')) {
        document.getElementById('profileDetailsPopup')?.remove();
    }
};

// Display profile data
function displayProfile() {
    // Update profile image
    profileImage.src = currentProfile.profileImage || 'https://via.placeholder.com/150';
    
    // Add click event to profile image
    profileImage.addEventListener('click', showProfilePopup);
    
    // Display profile details
    profileDetails.innerHTML = `
        <div class="profile-detail-item">
            <h3>Full Name</h3>
            <p>${currentProfile.fullName || 'Not provided'}</p>
        </div>
        <div class="profile-detail-item">
            <h3>Age</h3>
            <p>${currentProfile.age || 'Not provided'}</p>
        </div>
        <div class="profile-detail-item">
            <h3>Blood Type</h3>
            <p>${currentProfile.bloodType || 'Not provided'}</p>
        </div>
        <div class="profile-detail-item">
            <h3>Medical Conditions</h3>
            <p>${currentProfile.diseases || 'None'}</p>
        </div>
        <div class="profile-detail-item">
            <h3>Current Medications</h3>
            <p>${currentProfile.prescriptions || 'None'}</p>
        </div>
        <div class="profile-detail-item">
            <h3>Address</h3>
            <p>${currentProfile.address || 'Not provided'}</p>
        </div>
        <div class="profile-detail-item">
            <h3>Emergency Contact</h3>
            <p>${currentProfile.emergencyContact || 'Not provided'}</p>
        </div>
        <div class="profile-detail-item">
            <h3>Emergency Phone</h3>
            <p>${currentProfile.emergencyPhone || 'Not provided'}</p>
        </div>
        <button id="editProfileBtn" class="edit-profile-btn">Edit Profile</button>
    `;

    // Add event listener to edit button
    document.getElementById('editProfileBtn').addEventListener('click', openEditModal);
}

// Show profile popup when clicking on profile image
function showProfilePopup(event) {
    // Remove existing popup if any
    document.getElementById('profileDetailsPopup')?.remove();
    
    // Create popup
    const popup = document.createElement('div');
    popup.id = 'profileDetailsPopup';
    popup.className = 'profile-popup';
    
    // Populate popup with profile data
    popup.innerHTML = `
        <div class="popup-header">
            <h3>${currentProfile.fullName || 'Patient'}'s Profile</h3>
            <button class="edit-profile-btn popup-edit-btn">Edit</button>
        </div>
        <div class="popup-content">
            <div class="popup-detail">
                <strong>Full Name:</strong> ${currentProfile.fullName || 'Not provided'}
            </div>
            <div class="popup-detail">
                <strong>Age:</strong> ${currentProfile.age || 'Not provided'}
            </div>
            <div class="popup-detail">
                <strong>Blood Type:</strong> ${currentProfile.bloodType || 'Not provided'}
            </div>
            <div class="popup-detail">
                <strong>Medical Conditions:</strong> ${currentProfile.diseases || 'None'}
            </div>
            <div class="popup-detail">
                <strong>Current Medications:</strong> ${currentProfile.prescriptions || 'None'}
            </div>
            <div class="popup-detail">
                <strong>Address:</strong> ${currentProfile.address || 'Not provided'}
            </div>
            <div class="popup-detail">
                <strong>Emergency Contact:</strong> ${currentProfile.emergencyContact || 'Not provided'}
            </div>
            <div class="popup-detail">
                <strong>Emergency Phone:</strong> ${currentProfile.emergencyPhone || 'Not provided'}
            </div>
        </div>
    `;
    
    // Position popup relative to image
    const rect = event.target.getBoundingClientRect();
    popup.style.top = `${rect.bottom + window.scrollY + 10}px`;
    popup.style.left = `${rect.left + window.scrollX - 100}px`;
    
    // Add to document
    document.body.appendChild(popup);
    
    // Add event listener to edit button in popup
    document.querySelector('.popup-edit-btn').addEventListener('click', () => {
        openEditModal();
        popup.remove();
    });
}

// Open edit modal and populate with current data
function openEditModal() {
    // Populate form with current profile data
    document.getElementById('editFullName').value = currentProfile.fullName || '';
    document.getElementById('editAge').value = currentProfile.age || '';
    document.getElementById('editBloodType').value = currentProfile.bloodType || 'A+';
    document.getElementById('editDiseases').value = currentProfile.diseases || '';
    document.getElementById('editPrescriptions').value = currentProfile.prescriptions || '';
    document.getElementById('editAddress').value = currentProfile.address || '';
    document.getElementById('editEmergencyContact').value = currentProfile.emergencyContact || '';
    document.getElementById('editEmergencyPhone').value = currentProfile.emergencyPhone || '';
    
    // Display the modal
    profileEditModal.style.display = 'block';
}

// Handle profile image upload
profileImageUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            // Store base64 image temporarily
            currentProfile.newProfileImage = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Handle form submission
profileEditForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    // Update profile data
    currentProfile.fullName = document.getElementById('editFullName').value;
    currentProfile.age = document.getElementById('editAge').value;
    currentProfile.bloodType = document.getElementById('editBloodType').value;
    currentProfile.diseases = document.getElementById('editDiseases').value;
    currentProfile.prescriptions = document.getElementById('editPrescriptions').value;
    currentProfile.address = document.getElementById('editAddress').value;
    currentProfile.emergencyContact = document.getElementById('editEmergencyContact').value;
    currentProfile.emergencyPhone = document.getElementById('editEmergencyPhone').value;
    
    // Update profile image if a new one was uploaded
    if (currentProfile.newProfileImage) {
        currentProfile.profileImage = currentProfile.newProfileImage;
        delete currentProfile.newProfileImage;
    }
    
    // Save to both general and user-specific storage
    localStorage.setItem('currentProfile', JSON.stringify(currentProfile));
    localStorage.setItem(`profile_${currentUser.name}`, JSON.stringify(currentProfile));
    
    // Update the display
    displayProfile();
    
    // Close the modal
    profileEditModal.style.display = 'none';
    
    // Show success message
    showMessage('Profile updated successfully!', 'success');
});

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

// Check if user is logged in before loading profile
// This assumes app.js has a currentUser variable in localStorage
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        // Redirect to homepage if not logged in
        window.location.href = 'index.html';
    } else {
        // Load user-specific profile if it exists
        const userProfile = JSON.parse(localStorage.getItem(`profile_${currentUser.name}`));
        if (userProfile) {
            currentProfile = userProfile;
        }
        
        // Display the profile
        displayProfile();
    }
}); 