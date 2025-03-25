// Check for notification permission
if ('Notification' in window) {
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

// DOM Elements
const medicationsList = document.getElementById('medicationsList');
const remindersList = document.getElementById('remindersList');
const addMedicationBtn = document.getElementById('addMedicationBtn');
const addMedicationModal = document.getElementById('addMedicationModal');
const editMedicationModal = document.getElementById('editMedicationModal');
const medicationForm = document.getElementById('medicationForm');
const editMedicationForm = document.getElementById('editMedicationForm');
const frequency = document.getElementById('frequency');
const editFrequency = document.getElementById('editFrequency');
const customFrequency = document.getElementById('customFrequency');
const editCustomFrequency = document.getElementById('editCustomFrequency');
const cancelAddBtns = document.querySelectorAll('#cancelAdd');
const cancelEditBtns = document.querySelectorAll('#cancelEdit');
const reminderSound = document.getElementById('reminderSound');
const alertVolume = document.getElementById('alertVolume');
const testAlertBtn = document.getElementById('testAlertBtn');
const alertEnabled = document.getElementById('alertEnabled');
const statusMessage = document.getElementById('statusMessage');

// State
let medications = JSON.parse(localStorage.getItem('medications') || '[]');
let reminders = [];
let activeReminders = new Set(); // Track active reminders to avoid duplicates
let alertSettings = JSON.parse(localStorage.getItem('alertSettings') || '{"volume": 0.5, "enabled": true}');

// Initialize
function initialize() {
    // Load alert settings
    alertVolume.value = alertSettings.volume;
    alertEnabled.checked = alertSettings.enabled;
    reminderSound.volume = alertSettings.volume;
    
    updateMedicationsList();
    updateRemindersList();
    setupNotifications();
    
    // Update reminders every minute
    setInterval(() => {
        updateRemindersList();
        checkForDueReminders();
    }, 60000); // 60000 ms = 1 minute
    
    // Check reminders immediately
    checkForDueReminders();
    
    showStatus('Medication reminder is active', 'info');
}

// Event Listeners
addMedicationBtn.addEventListener('click', () => {
    addMedicationModal.style.display = 'block';
});

cancelAddBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        addMedicationModal.style.display = 'none';
        medicationForm.reset();
    });
});

cancelEditBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        editMedicationModal.style.display = 'none';
        editMedicationForm.reset();
    });
});

frequency.addEventListener('change', () => {
    customFrequency.style.display = frequency.value === 'custom' ? 'block' : 'none';
});

editFrequency.addEventListener('change', () => {
    editCustomFrequency.style.display = editFrequency.value === 'custom' ? 'block' : 'none';
});

// Alert settings
alertVolume.addEventListener('change', () => {
    reminderSound.volume = alertVolume.value;
    saveAlertSettings();
});

testAlertBtn.addEventListener('click', () => {
    playAlertSound();
});

alertEnabled.addEventListener('change', () => {
    saveAlertSettings();
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === addMedicationModal) {
        addMedicationModal.style.display = 'none';
        medicationForm.reset();
    }
    if (e.target === editMedicationModal) {
        editMedicationModal.style.display = 'none';
        editMedicationForm.reset();
    }
});

// Form submissions
medicationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addMedication();
});

editMedicationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    updateMedication();
});

// Add medication
function addMedication() {
    const medication = {
        id: Date.now(),
        name: document.getElementById('medName').value,
        dosage: document.getElementById('dosage').value,
        frequency: frequency.value,
        time: document.getElementById('time').value,
        notes: document.getElementById('notes').value,
        lastTaken: null,
        customDays: frequency.value === 'custom' ? 
            Array.from(document.querySelectorAll('#customFrequency input[type="checkbox"]:checked'))
                .map(cb => parseInt(cb.value)) : [],
        takenLog: []
    };

    medications.push(medication);
    saveMedications();
    addMedicationModal.style.display = 'none';
    medicationForm.reset();
    updateMedicationsList();
    updateRemindersList();
    setupNotifications();
    showStatus(`Added ${medication.name} to your medications`, 'success');
}

// Update medication
function updateMedication() {
    const id = parseInt(document.getElementById('editMedId').value);
    const index = medications.findIndex(med => med.id === id);
    
    if (index !== -1) {
        const updatedMed = {
            id,
            name: document.getElementById('editMedName').value,
            dosage: document.getElementById('editDosage').value,
            frequency: editFrequency.value,
            time: document.getElementById('editTime').value,
            notes: document.getElementById('editNotes').value,
            lastTaken: medications[index].lastTaken,
            takenLog: medications[index].takenLog || [],
            customDays: editFrequency.value === 'custom' ?
                Array.from(document.querySelectorAll('#editCustomFrequency input[type="checkbox"]:checked'))
                    .map(cb => parseInt(cb.value)) : []
        };
        
        medications[index] = updatedMed;
        
        saveMedications();
        editMedicationModal.style.display = 'none';
        editMedicationForm.reset();
        updateMedicationsList();
        updateRemindersList();
        setupNotifications();
        showStatus(`Updated ${updatedMed.name}`, 'success');
    }
}

// Delete medication
function deleteMedication(id) {
    if (confirm('Are you sure you want to delete this medication?')) {
        const medName = medications.find(med => med.id === id)?.name || "Medication";
        medications = medications.filter(med => med.id !== id);
        saveMedications();
        updateMedicationsList();
        updateRemindersList();
        setupNotifications();
        showStatus(`Deleted ${medName}`, 'info');
    }
}

// Edit medication
function editMedication(id) {
    const medication = medications.find(med => med.id === id);
    if (medication) {
        document.getElementById('editMedId').value = medication.id;
        document.getElementById('editMedName').value = medication.name;
        document.getElementById('editDosage').value = medication.dosage;
        document.getElementById('editFrequency').value = medication.frequency;
        document.getElementById('editTime').value = medication.time;
        document.getElementById('editNotes').value = medication.notes;

        editCustomFrequency.style.display = medication.frequency === 'custom' ? 'block' : 'none';
        
        // Uncheck all checkboxes first
        document.querySelectorAll('#editCustomFrequency input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        
        // Check the ones that should be checked
        if (medication.frequency === 'custom') {
            medication.customDays.forEach(day => {
                const checkbox = document.querySelector(`#editCustomFrequency input[value="${day}"]`);
                if (checkbox) checkbox.checked = true;
            });
        }

        editMedicationModal.style.display = 'block';
    }
}

// Mark medication as taken
function markAsTaken(id, reminderTime) {
    const medication = medications.find(med => med.id === id);
    if (medication) {
        const now = new Date();
        const takenEntry = {
            date: now.toISOString(),
            scheduled: reminderTime ? new Date(reminderTime).toISOString() : null
        };
        
        medication.lastTaken = now.toISOString();
        if (!medication.takenLog) medication.takenLog = [];
        medication.takenLog.push(takenEntry);
        
        saveMedications();
        updateMedicationsList();
        updateRemindersList();
        setupNotifications();
        
        showStatus(`Marked ${medication.name} as taken`, 'success');
        
        // Remove this reminder from activeReminders
        if (reminderTime) {
            activeReminders.delete(`${id}-${reminderTime}`);
        }
    }
}

// Update medications list
function updateMedicationsList() {
    medicationsList.innerHTML = medications.length ? '' : '<p class="empty-message">No medications added yet.</p>';
    
    medications.forEach(med => {
        const nextDose = getNextDosageTime(med);
        const isMissed = nextDose && new Date() > nextDose;
        const isDue = nextDose && (new Date() > new Date(nextDose.getTime() - 15 * 60000)); // Due if within 15 minutes
        
        const div = document.createElement('div');
        div.className = `medication-item ${isMissed ? 'missed' : ''} ${isDue && !isMissed ? 'due' : ''}`;
        
        const lastTakenText = med.lastTaken 
            ? `Last taken: ${formatFullDateTime(new Date(med.lastTaken))}`
            : 'Not taken yet';
            
        const nextDoseText = nextDose 
            ? `Next dose: ${formatFullDateTime(nextDose)}`
            : 'No upcoming doses';
        
        div.innerHTML = `
            <div class="medication-info">
                <h3>${med.name}</h3>
                <p><strong>Dosage:</strong> ${med.dosage}</p>
                <p><strong>Time:</strong> ${formatTime(med.time)}</p>
                <p><strong>Frequency:</strong> ${formatFrequency(med)}</p>
                ${med.notes ? `<p><strong>Notes:</strong> ${med.notes}</p>` : ''}
                <p class="status-text ${med.lastTaken ? 'taken' : ''}">${lastTakenText}</p>
                <p class="status-text ${isMissed ? 'missed' : isDue ? 'due' : ''}">${nextDoseText}</p>
            </div>
            <div class="medication-actions">
                <button onclick="markAsTaken(${med.id})" class="control-btn take-btn" title="Mark as Taken">
                    <span class="btn-icon">✓</span>
                </button>
                <button onclick="editMedication(${med.id})" class="control-btn edit-btn" title="Edit">
                    <span class="btn-icon">✏️</span>
                </button>
                <button onclick="deleteMedication(${med.id})" class="control-btn delete-btn" title="Delete">
                    <span class="btn-icon">🗑️</span>
                </button>
            </div>
        `;
        medicationsList.appendChild(div);
    });
}

// Update reminders list
function updateRemindersList() {
    reminders = [];
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    medications.forEach(med => {
        const times = getNextDosageTimes(med, now, tomorrow);
        reminders.push(...times.map(time => ({
            ...med,
            nextDose: time
        })));
    });

    reminders.sort((a, b) => a.nextDose - b.nextDose);

    remindersList.innerHTML = reminders.length ? '' : '<p class="empty-message">No upcoming reminders.</p>';
    
    reminders.slice(0, 5).forEach(reminder => {
        const isMissed = new Date() > reminder.nextDose;
        const isDue = new Date() > new Date(reminder.nextDose.getTime() - 15 * 60000); // Due if within 15 minutes
        
        const div = document.createElement('div');
        div.className = `reminder-item ${isMissed ? 'missed' : ''} ${isDue && !isMissed ? 'due' : ''}`;
        
        const timeDiff = getTimeDifferenceText(reminder.nextDose);
        
        div.innerHTML = `
            <div class="reminder-time">
                <div class="time">${formatTime(reminder.nextDose.toTimeString().slice(0, 5))}</div>
                <div class="date">${formatDate(reminder.nextDose)}</div>
                <div class="time-remaining">${timeDiff}</div>
            </div>
            <div class="reminder-info">
                <div class="med-name">${reminder.name}</div>
                <div class="med-dosage">${reminder.dosage}</div>
            </div>
            <div class="reminder-actions">
                <button onclick="markAsTaken(${reminder.id}, '${reminder.nextDose.toISOString()}')" class="take-btn" title="Mark as Taken">
                    <span class="btn-icon">✓</span>
                </button>
            </div>
        `;
        remindersList.appendChild(div);
    });
}

// Check for due reminders and trigger alerts
function checkForDueReminders() {
    const now = new Date();
    
    reminders.forEach(reminder => {
        const reminderKey = `${reminder.id}-${reminder.nextDose.toISOString()}`;
        const reminderTime = reminder.nextDose;
        const timeDiff = reminderTime - now;
        
        // Check if it's due now (within the last minute) and not already active
        if (timeDiff >= 0 && timeDiff <= 60000 && !activeReminders.has(reminderKey)) {
            // Mark this reminder as active
            activeReminders.add(reminderKey);
            
            // Trigger notification and sound
            triggerMedicationAlert(reminder);
            
            // Schedule a repeating alert for missed medications
            scheduleRepeatingAlert(reminder);
        }
    });
}

// Trigger medication alert
function triggerMedicationAlert(reminder) {
    // Play sound if enabled
    if (alertSettings.enabled) {
        playAlertSound();
    }
    
    // Show notification
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(`Time to take ${reminder.name}`, {
            body: `Dosage: ${reminder.dosage}`,
            icon: '/icon.png',
            tag: `med-${reminder.id}-${reminder.nextDose.getTime()}`
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
    }
    
    // Also show in-app alert
    showStatus(`Time to take ${reminder.name}: ${reminder.dosage}`, 'info', 0); // 0 means don't auto-hide
}

// Schedule repeating alerts for missed medications
function scheduleRepeatingAlert(reminder) {
    const reminderKey = `${reminder.id}-${reminder.nextDose.toISOString()}`;
    const now = new Date();
    
    // Check every 5 minutes for missed medications (up to 30 minutes)
    let repeatCount = 0;
    
    const repeatInterval = setInterval(() => {
        repeatCount++;
        
        // Don't repeat if marked as taken
        if (!activeReminders.has(reminderKey)) {
            clearInterval(repeatInterval);
            return;
        }
        
        // Current time
        const currentTime = new Date();
        
        // If it's been more than 5 minutes and not taken yet
        if (currentTime > new Date(reminder.nextDose.getTime() + 5 * 60000)) {
            // Alert again
            playAlertSound();
            showStatus(`REMINDER: ${reminder.name} is due!`, 'error', 10000);
        }
        
        // Stop after 6 alerts (30 minutes)
        if (repeatCount >= 6) {
            clearInterval(repeatInterval);
        }
    }, 5 * 60000); // Check every 5 minutes
}

// Play alert sound
function playAlertSound() {
    if (reminderSound) {
        reminderSound.volume = alertSettings.volume;
        
        // Reset the audio to the beginning
        reminderSound.pause();
        reminderSound.currentTime = 0;
        
        // Play the sound
        reminderSound.play().catch(err => console.error('Error playing sound:', err));
    }
}

// Setup notifications
function setupNotifications() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
        const permissionButton = document.createElement('button');
        permissionButton.className = 'primary-btn';
        permissionButton.textContent = 'Enable Notifications';
        permissionButton.addEventListener('click', () => {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    permissionButton.remove();
                }
            });
        });
        
        if (!document.querySelector('.permissions-request') && Notification.permission !== 'denied') {
            const permissionsDiv = document.createElement('div');
            permissionsDiv.className = 'permissions-request';
            permissionsDiv.innerHTML = '<p>Enable notifications for medication reminders:</p>';
            permissionsDiv.appendChild(permissionButton);
            document.querySelector('.reminder-dashboard').prepend(permissionsDiv);
        }
    }

    // Clear existing notifications
    if (window.scheduledNotifications) {
        window.scheduledNotifications.forEach(timeout => clearTimeout(timeout));
    }
    window.scheduledNotifications = [];

    reminders.forEach(reminder => {
        const timeUntilReminder = reminder.nextDose - new Date();
        if (timeUntilReminder > 0) {
            const timeout = setTimeout(() => {
                checkForDueReminders();
                updateRemindersList();
            }, timeUntilReminder);
            window.scheduledNotifications.push(timeout);
        }
    });
}

// Utility functions
function saveMedications() {
    localStorage.setItem('medications', JSON.stringify(medications));
}

function saveAlertSettings() {
    alertSettings = {
        volume: parseFloat(alertVolume.value),
        enabled: alertEnabled.checked
    };
    localStorage.setItem('alertSettings', JSON.stringify(alertSettings));
    
    reminderSound.volume = alertSettings.volume;
}

function formatTime(time) {
    if (!time) return '';
    try {
        return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
            hour: 'numeric', 
            minute: '2-digit' 
        });
    } catch (e) {
        return time;
    }
}

function formatDate(date) {
    return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
    });
}

function formatFullDateTime(date) {
    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    });
}

function formatFrequency(medication) {
    switch (medication.frequency) {
        case 'daily':
            return 'Daily';
        case 'twice':
            return 'Twice Daily';
        case 'thrice':
            return 'Thrice Daily';
        case 'weekly':
            return 'Weekly';
        case 'custom':
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return medication.customDays.map(d => days[d]).join(', ');
        default:
            return medication.frequency;
    }
}

function getTimeDifferenceText(date) {
    const now = new Date();
    const diff = date - now;
    
    if (diff < 0) {
        // Past
        const minutesAgo = Math.floor(-diff / 60000);
        if (minutesAgo < 60) {
            return `${minutesAgo} minute${minutesAgo !== 1 ? 's' : ''} overdue`;
        } else {
            const hoursAgo = Math.floor(minutesAgo / 60);
            return `${hoursAgo} hour${hoursAgo !== 1 ? 's' : ''} overdue`;
        }
    } else {
        // Future
        const minutesAway = Math.floor(diff / 60000);
        if (minutesAway < 60) {
            return `in ${minutesAway} minute${minutesAway !== 1 ? 's' : ''}`;
        } else {
            const hoursAway = Math.floor(minutesAway / 60);
            return `in ${hoursAway} hour${hoursAway !== 1 ? 's' : ''}`;
        }
    }
}

function getNextDosageTimes(medication, start, end) {
    const times = [];
    const baseTime = new Date(`2000-01-01T${medication.time}`);
    const interval = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    let current = new Date(start);
    current.setHours(baseTime.getHours(), baseTime.getMinutes(), 0, 0);

    // If today's dose time has passed, start from tomorrow
    if (current < start) {
        current = new Date(current.getTime() + interval);
    }

    while (current < end) {
        if (shouldTakeMedication(medication, current)) {
            times.push(new Date(current));

            if (medication.frequency === 'twice') {
                const secondDose = new Date(current);
                secondDose.setHours(secondDose.getHours() + 12);
                if (secondDose < end) {
                    times.push(secondDose);
                }
            } else if (medication.frequency === 'thrice') {
                for (let i = 1; i <= 2; i++) {
                    const nextDose = new Date(current);
                    nextDose.setHours(nextDose.getHours() + (8 * i));
                    if (nextDose < end) {
                        times.push(nextDose);
                    }
                }
            }
        }
        current = new Date(current.getTime() + interval);
    }

    return times;
}

function getNextDosageTime(medication) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 7); // Look ahead a week
    
    const times = getNextDosageTimes(medication, now, tomorrow);
    return times.length > 0 ? times[0] : null;
}

function shouldTakeMedication(medication, date) {
    const day = date.getDay();
    
    switch (medication.frequency) {
        case 'daily':
            return true;
        case 'twice':
        case 'thrice':
            return true;
        case 'weekly':
            return day === 1; // Monday
        case 'custom':
            return medication.customDays.includes(day);
        default:
            return false;
    }
}

// Show status message
function showStatus(message, type = 'info', duration = 3000) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
    
    // Clear the message after the specified duration unless duration is 0
    if (duration > 0) {
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, duration);
    }
}

// Initialize on load
initialize(); 