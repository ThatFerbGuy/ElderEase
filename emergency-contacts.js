// DOM Elements - Container
const contactsList = document.getElementById('contacts-list');
const searchBox = document.getElementById('search-contacts');
const categoryButtons = document.querySelectorAll('.category-btn');
const addContactBtn = document.getElementById('add-contact-btn');
const quickDialBtns = document.querySelectorAll('.quick-dial-button');

// DOM Elements - Modal
const contactModal = document.getElementById('contact-modal');
const modalTitle = document.getElementById('modal-title');
const contactForm = document.getElementById('contact-form');
const contactId = document.getElementById('contact-id');
const contactName = document.getElementById('contact-name');
const contactPhone = document.getElementById('contact-phone');
const contactRelation = document.getElementById('contact-relation');
const contactCategory = document.getElementById('contact-category');
const contactNotes = document.getElementById('contact-notes');
const contactFavorite = document.getElementById('contact-favorite');
const deleteContactBtn = document.getElementById('delete-contact-btn');
const closeModalBtn = document.querySelector('.close');

// DOM Elements - Status
const statusMessage = document.getElementById('statusMessage');

// State variables
let contacts = [];
let currentFilter = 'all';
let searchQuery = '';

// Initialize contacts
function initContacts() {
    loadContactsFromStorage();
    renderContacts();
    setupEventListeners();
}

// Load contacts from storage
function loadContactsFromStorage() {
    // Use sessionStorage for authenticated user data
    const storedContacts = sessionStorage.getItem('contacts');
    contacts = storedContacts ? JSON.parse(storedContacts) : [];
    
    // If no contacts exist, add some example contacts for elderly users
    if (contacts.length === 0) {
        addExampleContacts();
    }
}

// Add example contacts to help users get started
function addExampleContacts() {
    const exampleContacts = [
        {
            id: 'family1',
            name: 'Primary Caregiver',
            phone: 'Add phone number',
            relation: 'Family Member',
            category: 'family',
            notes: 'Main person responsible for daily care',
            favorite: true
        },
        {
            id: 'medical1',
            name: 'Dr. Smith',
            phone: 'Add phone number',
            relation: 'Primary Physician',
            category: 'medical',
            notes: 'Primary care doctor - regular check-ups',
            favorite: true
        },
        {
            id: 'medical2',
            name: 'Memory Care Specialist',
            phone: 'Add phone number',
            relation: 'Neurologist',
            category: 'medical',
            notes: 'Specialist for Alzheimer\'s care',
            favorite: true
        },
        {
            id: 'services1',
            name: 'Home Care Service',
            phone: 'Add phone number',
            relation: 'Care Provider',
            category: 'services',
            notes: 'In-home assistance service',
            favorite: false
        }
    ];
    
    contacts = exampleContacts;
    saveContactsToStorage();
}

// Save contacts to storage
function saveContactsToStorage() {
    // Save to sessionStorage
    sessionStorage.setItem('contacts', JSON.stringify(contacts));
    
    // Use saveUserData from auth-check.js to save to user-specific localStorage
    if (typeof saveUserData === 'function') {
        saveUserData('contacts', contacts);
    }
}

// Filter and sort contacts based on current filter and search
function getFilteredContacts() {
    let filtered = [...contacts];
    
    // Apply category filter
    if (currentFilter !== 'all') {
        filtered = filtered.filter(contact => contact.category === currentFilter);
    }
    
    // Apply search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(contact =>
            contact.name.toLowerCase().includes(query) ||
            contact.phone.toLowerCase().includes(query) ||
            contact.relation.toLowerCase().includes(query)
        );
    }
    
    // Sort contacts: favorites first, then alphabetically
    filtered.sort((a, b) => {
        if (a.favorite && !b.favorite) return -1;
        if (!a.favorite && b.favorite) return 1;
        return a.name.localeCompare(b.name);
    });
    
    return filtered;
}

// Render the contacts list
function renderContacts() {
    // Get filtered contacts
    const filteredContacts = getFilteredContacts();
    
    // Clear current list
    contactsList.innerHTML = '';
    
    // Show empty state if no contacts
    if (filteredContacts.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        
        if (searchQuery) {
            emptyState.innerHTML = `
                <p>No contacts found for "${searchQuery}"</p>
                <p>Try a different search term</p>
            `;
        } else if (currentFilter !== 'all') {
            emptyState.innerHTML = `
                <p>No ${currentFilter} contacts found</p>
                <p>Click "Add Contact" to add a new ${currentFilter} contact</p>
            `;
        } else {
            emptyState.innerHTML = `
                <p>No contacts added yet</p>
                <p>Click "Add Contact" to get started</p>
            `;
        }
        
        contactsList.appendChild(emptyState);
        return;
    }
    
    // Create contact elements
    filteredContacts.forEach(contact => {
        const contactEl = document.createElement('div');
        contactEl.className = `contact-card ${contact.favorite ? 'favorite' : ''}`;
        contactEl.dataset.id = contact.id;
        
        // Determine icon based on category
        let categoryIcon = '👤'; // Default icon
        if (contact.category === 'family') categoryIcon = '👪';
        if (contact.category === 'friends') categoryIcon = '🤝';
        if (contact.category === 'medical') categoryIcon = '⚕️';
        if (contact.category === 'services') categoryIcon = '🛠️';
        
        contactEl.innerHTML = `
            <div class="contact-info">
                <div class="contact-header">
                    <div class="contact-name">
                        ${contact.favorite ? '⭐ ' : ''}${contact.name}
                    </div>
                    <div class="contact-category">
                        <span class="category-icon">${categoryIcon}</span>
                        ${contact.category.charAt(0).toUpperCase() + contact.category.slice(1)}
                    </div>
                </div>
                <div class="contact-relation">${contact.relation}</div>
                <div class="contact-phone">${formatPhoneNumber(contact.phone)}</div>
                ${contact.notes ? `<div class="contact-notes">${contact.notes}</div>` : ''}
            </div>
            <div class="contact-actions">
                <button class="call-btn" data-number="${contact.phone}">Call</button>
                <button class="edit-btn">Edit</button>
            </div>
        `;
        
        contactsList.appendChild(contactEl);
    });
}

// Format phone number for display
function formatPhoneNumber(phoneNumber) {
    // Simple formatting - this could be improved for different formats
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Don't format if it's not a standard number
    if (cleaned.length !== 10 && cleaned.length !== 11) {
        return phoneNumber;
    }
    
    if (cleaned.length === 10) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else {
        return `${cleaned.slice(0, 1)} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
}

// Open contact modal for editing or creating a contact
function openContactModal(contactData = null) {
    // Reset the form
    contactForm.reset();
    contactId.value = '';
    
    if (contactData) {
        // Edit existing contact
        modalTitle.textContent = 'Edit Contact';
        contactId.value = contactData.id;
        contactName.value = contactData.name || '';
        contactPhone.value = contactData.phone || '';
        contactRelation.value = contactData.relation || '';
        contactCategory.value = contactData.category || 'family';
        contactNotes.value = contactData.notes || '';
        contactFavorite.checked = contactData.favorite || false;
        
        deleteContactBtn.style.display = 'block';
    } else {
        // Add new contact
        modalTitle.textContent = 'Add New Contact';
        
        // Pre-select the current category if filtering
        if (currentFilter !== 'all') {
            contactCategory.value = currentFilter;
        }
        
        deleteContactBtn.style.display = 'none';
    }
    
    // Show the modal
    contactModal.style.display = 'block';
    
    // Focus on the name field
    contactName.focus();
}

// Close the contact modal
function closeContactModal() {
    contactModal.style.display = 'none';
}

// Save a contact
function saveContact(contactData) {
    if (contactData.id) {
        // Update existing contact
        const index = contacts.findIndex(c => c.id === contactData.id);
        if (index !== -1) {
            contacts[index] = contactData;
        }
    } else {
        // Add new contact
        contactData.id = Date.now().toString();
        contacts.push(contactData);
    }
    
    // Save to storage
    saveContactsToStorage();
    
    // Update the UI
    renderContacts();
}

// Delete a contact
function deleteContact(contactId) {
    contacts = contacts.filter(contact => contact.id !== contactId);
    saveContactsToStorage();
    renderContacts();
    closeContactModal();
    
    showStatus('Contact deleted successfully', 'success');
}

// Dial a phone number (or show instructions)
function dialPhoneNumber(phoneNumber) {
    // Check if the number appears to be valid
    if (!phoneNumber || phoneNumber.includes('Add phone number')) {
        showStatus('Please add a valid phone number first', 'error');
        return;
    }
    
    // Try to call the number
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
    const callUrl = `tel:${cleanedNumber}`;
    
    try {
        window.location.href = callUrl;
        showStatus(`Calling ${phoneNumber}...`, 'info');
    } catch (error) {
        showStatus('Unable to place call. Please dial manually: ' + phoneNumber, 'error');
        console.error('Call error:', error);
    }
}

// Show status message
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Add contact button
    addContactBtn.addEventListener('click', () => {
        openContactModal();
    });
    
    // Category filter buttons
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update active class
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update filter and render
            currentFilter = button.dataset.category;
            renderContacts();
        });
    });
    
    // Search box
    searchBox.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderContacts();
    });
    
    // Contact card events (using delegation)
    contactsList.addEventListener('click', (e) => {
        // Call button
        if (e.target.classList.contains('call-btn')) {
            const phoneNumber = e.target.dataset.number;
            dialPhoneNumber(phoneNumber);
        }
        
        // Edit button
        if (e.target.classList.contains('edit-btn')) {
            const contactCard = e.target.closest('.contact-card');
            if (contactCard) {
                const contactId = contactCard.dataset.id;
                const contactData = contacts.find(contact => contact.id === contactId);
                
                if (contactData) {
                    openContactModal(contactData);
                }
            }
        }
    });
    
    // Quick dial buttons
    quickDialBtns.forEach(button => {
        button.addEventListener('click', () => {
            const phoneNumber = button.dataset.number;
            dialPhoneNumber(phoneNumber);
        });
    });
    
    // Form submission (save contact)
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formData = {
            id: contactId.value,
            name: contactName.value.trim(),
            phone: contactPhone.value.trim(),
            relation: contactRelation.value.trim(),
            category: contactCategory.value,
            notes: contactNotes.value.trim(),
            favorite: contactFavorite.checked
        };
        
        saveContact(formData);
        closeContactModal();
        showStatus(formData.id ? 'Contact updated successfully' : 'Contact added successfully', 'success');
    });
    
    // Delete contact button
    deleteContactBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this contact?')) {
            deleteContact(contactId.value);
        }
    });
    
    // Close modal button
    closeModalBtn.addEventListener('click', closeContactModal);
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            closeContactModal();
        }
    });
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', initContacts); 