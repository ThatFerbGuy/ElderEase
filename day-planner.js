// DOM Elements - Calendar
const calendarDays = document.getElementById('calendar-days');
const currentMonthEl = document.getElementById('current-month');
const prevMonthBtn = document.getElementById('prev-month');
const nextMonthBtn = document.getElementById('next-month');
const todayBtn = document.getElementById('today-btn');

// DOM Elements - Events
const selectedDateEl = document.getElementById('selected-date');
const eventsList = document.getElementById('events-list');
const addEventBtn = document.getElementById('add-event-btn');

// DOM Elements - Modal
const eventModal = document.getElementById('event-modal');
const modalTitle = document.getElementById('modal-title');
const eventForm = document.getElementById('event-form');
const eventId = document.getElementById('event-id');
const eventDate = document.getElementById('event-date');
const eventTitle = document.getElementById('event-title');
const eventStartTime = document.getElementById('event-start-time');
const eventEndTime = document.getElementById('event-end-time');
const eventLocation = document.getElementById('event-location');
const eventDescription = document.getElementById('event-description');
const eventReminder = document.getElementById('event-reminder');
const reminderOptions = document.querySelector('.reminder-options');
const reminderTime = document.getElementById('reminder-time');
const deleteEventBtn = document.getElementById('delete-event-btn');
const closeModalBtn = document.querySelector('.close');

// DOM Elements - Status
const statusMessage = document.getElementById('statusMessage');

// State variables
let currentDate = new Date();
let selectedDate = new Date();
let events = [];
let reminders = [];

// Initialize the calendar
function initCalendar() {
    loadEventsFromStorage();
    renderCalendar();
    renderEvents();
    setupEventListeners();
    checkReminders();

    // Check for reminders every minute
    setInterval(checkReminders, 60000);
}

// Load events from storage
function loadEventsFromStorage() {
    // Use sessionStorage for authenticated user data
    const storedEvents = sessionStorage.getItem('events');
    events = storedEvents ? JSON.parse(storedEvents) : [];
    
    // Convert date strings back to Date objects
    events.forEach(event => {
        event.date = new Date(event.date);
    });
    
    // Also load any pending reminders
    const storedReminders = sessionStorage.getItem('reminders') || localStorage.getItem('elderEaseReminders');
    reminders = storedReminders ? JSON.parse(storedReminders) : [];
}

// Save events to storage
function saveEventsToStorage() {
    // Save to sessionStorage
    sessionStorage.setItem('events', JSON.stringify(events));
    
    // Use saveUserData from auth-check.js to save to user-specific localStorage
    if (typeof saveUserData === 'function') {
        saveUserData('events', events);
    }
}

// Save reminders to storage
function saveRemindersToStorage() {
    sessionStorage.setItem('reminders', JSON.stringify(reminders));
    localStorage.setItem('elderEaseReminders', JSON.stringify(reminders));
}

// Format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Format date in a friendly way (e.g., "Monday, September 4, 2023")
function formatDateFriendly(date) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Format time from 24h to 12h format
function formatTime(timeString) {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    
    return `${formattedHour}:${minutes} ${period}`;
}

// Render the calendar
function renderCalendar() {
    // Update the month/year display
    const monthYearStr = currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
    });
    currentMonthEl.textContent = monthYearStr;
    
    // Clear previous days
    calendarDays.innerHTML = '';
    
    // Get the first day of the month
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Add empty cells for days before the first day of the month
    const firstDayIndex = firstDay.getDay(); // 0 (Sunday) to 6 (Saturday)
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    
    // Add cells for each day of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = formatDate(dateObj);
        dayEl.dataset.date = dateStr;
        
        // Highlight today's date
        if (
            dateObj.getDate() === new Date().getDate() &&
            dateObj.getMonth() === new Date().getMonth() &&
            dateObj.getFullYear() === new Date().getFullYear()
        ) {
            dayEl.classList.add('today');
        }
        
        // Highlight selected date
        if (
            dateObj.getDate() === selectedDate.getDate() &&
            dateObj.getMonth() === selectedDate.getMonth() &&
            dateObj.getFullYear() === selectedDate.getFullYear()
        ) {
            dayEl.classList.add('selected');
        }
        
        // Check if there are events on this day
        const hasEvents = events.some(event => 
            formatDate(event.date) === dateStr
        );
        
        if (hasEvents) {
            dayEl.classList.add('has-events');
        }
        
        calendarDays.appendChild(dayEl);
    }
}

// Render events for the selected date
function renderEvents() {
    // Update the selected date display
    selectedDateEl.textContent = formatDateFriendly(selectedDate);
    
    // Filter events for the selected date
    const selectedDateStr = formatDate(selectedDate);
    const filteredEvents = events.filter(event => 
        formatDate(event.date) === selectedDateStr
    );
    
    // Sort events by start time
    filteredEvents.sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return a.startTime.localeCompare(b.startTime);
    });
    
    // Clear previous events list
    eventsList.innerHTML = '';
    
    // Display events or empty state
    if (filteredEvents.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <p>No events scheduled for this day</p>
            <p>Click "Add Event" to create a new event</p>
        `;
        eventsList.appendChild(emptyState);
    } else {
        filteredEvents.forEach(event => {
            const eventEl = document.createElement('div');
            eventEl.className = 'event-item';
            eventEl.dataset.id = event.id;
            
            let timeText = 'All day';
            if (event.startTime) {
                timeText = formatTime(event.startTime);
                if (event.endTime) {
                    timeText += ` - ${formatTime(event.endTime)}`;
                }
            }
            
            eventEl.innerHTML = `
                <div class="event-time">${timeText}</div>
                <div class="event-details">
                    <h4 class="event-title">${event.title}</h4>
                    ${event.location ? `<div class="event-location">📍 ${event.location}</div>` : ''}
                </div>
            `;
            
            eventsList.appendChild(eventEl);
        });
    }
}

// Open the event modal
function openEventModal(eventData = null) {
    // Reset the form
    eventForm.reset();
    eventId.value = '';
    eventDate.value = formatDate(selectedDate);
    
    if (eventData) {
        // Edit existing event
        modalTitle.textContent = 'Edit Event';
        eventId.value = eventData.id;
        eventTitle.value = eventData.title;
        eventStartTime.value = eventData.startTime || '';
        eventEndTime.value = eventData.endTime || '';
        eventLocation.value = eventData.location || '';
        eventDescription.value = eventData.description || '';
        eventReminder.checked = eventData.reminder || false;
        
        if (eventData.reminder) {
            reminderOptions.style.display = 'block';
            reminderTime.value = eventData.reminderTime || '30';
        }
        
        deleteEventBtn.style.display = 'block';
    } else {
        // Add new event
        modalTitle.textContent = 'Add New Event';
        deleteEventBtn.style.display = 'none';
    }
    
    // Show the modal
    eventModal.style.display = 'block';
}

// Close the event modal
function closeEventModal() {
    eventModal.style.display = 'none';
}

// Save an event
function saveEvent(eventData) {
    if (eventData.id) {
        // Update existing event
        const index = events.findIndex(e => e.id === eventData.id);
        if (index !== -1) {
            events[index] = eventData;
        }
    } else {
        // Add new event
        eventData.id = Date.now().toString();
        events.push(eventData);
    }
    
    // Save to storage
    saveEventsToStorage();
    
    // Set reminder if enabled
    if (eventData.reminder) {
        setReminder(eventData);
    }
    
    // Update the UI
    renderCalendar();
    renderEvents();
}

// Delete an event
function deleteEvent(eventId) {
    events = events.filter(event => event.id !== eventId);
    saveEventsToStorage();
    
    // Also remove any associated reminders
    reminders = reminders.filter(reminder => reminder.eventId !== eventId);
    saveRemindersToStorage();
    
    renderCalendar();
    renderEvents();
    closeEventModal();
    
    showStatus('Event deleted successfully', 'success');
}

// Set a reminder for an event
function setReminder(eventData) {
    // First remove any existing reminders for this event
    reminders = reminders.filter(reminder => reminder.eventId !== eventData.id);
    
    if (!eventData.startTime) return; // Can't set reminder without a time
    
    const eventDateTime = new Date(eventData.date);
    const [hours, minutes] = eventData.startTime.split(':');
    eventDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    
    // Calculate reminder time (in minutes before event)
    const reminderMinutes = parseInt(eventData.reminderTime, 10);
    const reminderTime = new Date(eventDateTime.getTime() - (reminderMinutes * 60 * 1000));
    
    // Only set reminder if it's in the future
    if (reminderTime > new Date()) {
        reminders.push({
            eventId: eventData.id,
            time: reminderTime.getTime(),
            title: eventData.title,
            reminderMinutes: reminderMinutes
        });
        
        saveRemindersToStorage();
    }
}

// Check for due reminders
function checkReminders() {
    const now = new Date().getTime();
    
    reminders.forEach(reminder => {
        if (reminder.time <= now && !reminder.triggered) {
            triggerReminder(reminder);
            reminder.triggered = true;
        }
    });
    
    // Clean up triggered reminders
    reminders = reminders.filter(reminder => !reminder.triggered);
    saveRemindersToStorage();
}

// Trigger a reminder notification
function triggerReminder(reminder) {
    const event = events.find(event => event.id === reminder.eventId);
    
    if (!event) return;
    
    // Show notification
    showStatus(`Reminder: ${event.title} starts in ${reminder.reminderMinutes} minutes`, 'info', 10000);
    
    // Try to use native notifications if available and permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('ElderEase Reminder', {
            body: `${event.title} starts in ${reminder.reminderMinutes} minutes`,
            icon: '/favicon.ico'
        });
        
        notification.onclick = function() {
            window.focus();
            selectDate(event.date);
        };
    } else if ('Notification' in window && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
    
    // Try to play a sound
    try {
        const audio = new Audio('/notification-sound.mp3');
        audio.play();
    } catch (err) {
        console.log('Could not play notification sound:', err);
    }
}

// Show status message
function showStatus(message, type = 'info', duration = 3000) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, duration);
}

// Navigate to previous month
function goToPrevMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

// Navigate to next month
function goToNextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

// Go to today
function goToToday() {
    currentDate = new Date();
    selectedDate = new Date();
    renderCalendar();
    renderEvents();
}

// Select a specific date
function selectDate(date) {
    selectedDate = new Date(date);
    renderCalendar();
    renderEvents();
}

// Setup event listeners
function setupEventListeners() {
    // Calendar navigation
    prevMonthBtn.addEventListener('click', goToPrevMonth);
    nextMonthBtn.addEventListener('click', goToNextMonth);
    todayBtn.addEventListener('click', goToToday);
    
    // Day selection
    calendarDays.addEventListener('click', (e) => {
        const dayEl = e.target.closest('.calendar-day');
        if (dayEl && !dayEl.classList.contains('empty')) {
            const dateStr = dayEl.dataset.date;
            selectDate(new Date(dateStr));
        }
    });
    
    // Add event button
    addEventBtn.addEventListener('click', () => {
        openEventModal();
    });
    
    // Event selection (for editing)
    eventsList.addEventListener('click', (e) => {
        const eventEl = e.target.closest('.event-item');
        if (eventEl) {
            const eventId = eventEl.dataset.id;
            const eventData = events.find(event => event.id === eventId);
            
            if (eventData) {
                openEventModal(eventData);
            }
        }
    });
    
    // Event reminder toggle
    eventReminder.addEventListener('change', () => {
        reminderOptions.style.display = eventReminder.checked ? 'block' : 'none';
    });
    
    // Form submission (save event)
    eventForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            id: eventId.value,
            date: new Date(eventDate.value),
            title: eventTitle.value,
            startTime: eventStartTime.value,
            endTime: eventEndTime.value,
            location: eventLocation.value,
            description: eventDescription.value,
            reminder: eventReminder.checked,
            reminderTime: eventReminder.checked ? reminderTime.value : null
        };
        
        saveEvent(formData);
        closeEventModal();
        showStatus('Event saved successfully', 'success');
    });
    
    // Delete event button
    deleteEventBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this event?')) {
            deleteEvent(eventId.value);
        }
    });
    
    // Close modal button
    closeModalBtn.addEventListener('click', closeEventModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === eventModal) {
            closeEventModal();
        }
    });
    
    // Request notification permission for reminders
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

// Initialize the calendar when the page loads
document.addEventListener('DOMContentLoaded', initCalendar); 