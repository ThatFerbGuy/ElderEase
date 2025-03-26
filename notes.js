// DOM Elements - Sidebar
const notesList = document.getElementById('notes-list');
const addNoteBtn = document.getElementById('add-note-btn');
const allNotesBtn = document.getElementById('all-notes-btn');
const listNotesBtn = document.getElementById('list-notes-btn');
const checklistNotesBtn = document.getElementById('checklist-notes-btn');

// DOM Elements - Editor
const noteTitle = document.getElementById('note-title');
const noteTypeRadios = document.querySelectorAll('input[name="note-type"]');
const noteItems = document.getElementById('note-items');
const addItemBtn = document.getElementById('add-item-btn');
const saveNoteBtn = document.getElementById('save-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');

// DOM Elements - Status
const statusMessage = document.getElementById('statusMessage');

// State variables
let notes = [];
let currentNoteId = null;
let currentFilter = 'all';

// Initialize notes
function initNotes() {
    loadNotesFromStorage();
    renderNotesList();
    setupEventListeners();
    resetEditor();
}

// Load notes from storage
function loadNotesFromStorage() {
    // Use sessionStorage for authenticated user data
    const storedNotes = sessionStorage.getItem('notes');
    notes = storedNotes ? JSON.parse(storedNotes) : [];
}

// Save notes to storage
function saveNotesToStorage() {
    // Save to sessionStorage
    sessionStorage.setItem('notes', JSON.stringify(notes));
    
    // Use saveUserData from auth-check.js to save to user-specific localStorage
    if (typeof saveUserData === 'function') {
        saveUserData('notes', notes);
    }
}

// Render the notes list in the sidebar
function renderNotesList() {
    // Clear the list
    notesList.innerHTML = '';
    
    // Filter notes based on current filter
    let filteredNotes = notes;
    if (currentFilter === 'list') {
        filteredNotes = notes.filter(note => note.type === 'list');
    } else if (currentFilter === 'checklist') {
        filteredNotes = notes.filter(note => note.type === 'checklist');
    }
    
    // Sort notes by last modified date (most recent first)
    filteredNotes.sort((a, b) => b.lastModified - a.lastModified);
    
    // Display notes or empty state
    if (filteredNotes.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <p>No notes found</p>
            <p>Click "New Note" to create one</p>
        `;
        notesList.appendChild(emptyState);
    } else {
        filteredNotes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = `note-item ${note.id === currentNoteId ? 'selected' : ''}`;
            noteEl.dataset.id = note.id;
            
            const itemCount = note.items.length;
            const completedCount = note.type === 'checklist' 
                ? note.items.filter(item => item.checked).length
                : 0;
            
            const statusText = note.type === 'checklist' 
                ? `${completedCount}/${itemCount} completed`
                : `${itemCount} item${itemCount !== 1 ? 's' : ''}`;
            
            noteEl.innerHTML = `
                <div class="note-item-title">${note.title || 'Untitled Note'}</div>
                <div class="note-item-details">
                    <span class="note-type">${note.type === 'list' ? '📋' : '✓'}</span>
                    <span class="note-status">${statusText}</span>
                </div>
            `;
            
            notesList.appendChild(noteEl);
        });
    }
}

// Render the note in the editor
function renderNoteEditor(note) {
    noteTitle.value = note.title || '';
    
    // Set note type
    noteTypeRadios.forEach(radio => {
        if (radio.value === note.type) {
            radio.checked = true;
        }
    });
    
    // Create note items
    noteItems.innerHTML = '';
    if (note.items.length === 0) {
        // Always have at least one empty item
        addEmptyItem(note.type);
    } else {
        note.items.forEach(item => {
            addItemToEditor(item, note.type);
        });
    }
    
    // Enable delete button
    deleteNoteBtn.disabled = false;
    
    // Update editor visuals based on type
    updateEditorType(note.type);
}

// Update editor visuals based on note type
function updateEditorType(type) {
    const itemContainers = document.querySelectorAll('.item-container');
    
    itemContainers.forEach(container => {
        if (type === 'list') {
            container.classList.remove('checklist-item');
            container.classList.add('list-item');
        } else {
            container.classList.remove('list-item');
            container.classList.add('checklist-item');
        }
    });
}

// Add an empty item to the editor
function addEmptyItem(type) {
    const item = { text: '', checked: false };
    addItemToEditor(item, type);
}

// Add an item to the editor
function addItemToEditor(item, type) {
    const li = document.createElement('li');
    li.className = 'note-item';
    
    if (type === 'list') {
        li.innerHTML = `
            <div class="item-container list-item">
                <input type="text" class="item-text" value="${item.text}" placeholder="Type an item...">
                <button class="remove-item-btn">×</button>
            </div>
        `;
    } else {
        li.innerHTML = `
            <div class="item-container checklist-item">
                <input type="checkbox" class="item-checkbox" ${item.checked ? 'checked' : ''}>
                <input type="text" class="item-text" value="${item.text}" placeholder="Type an item...">
                <button class="remove-item-btn">×</button>
            </div>
        `;
    }
    
    noteItems.appendChild(li);
    
    // Focus on newly added empty items
    if (!item.text) {
        li.querySelector('.item-text').focus();
    }
}

// Reset the editor for a new note
function resetEditor() {
    currentNoteId = null;
    noteTitle.value = '';
    noteItems.innerHTML = '';
    
    // Set default type to list
    noteTypeRadios[0].checked = true;
    
    // Add an empty item
    addEmptyItem('list');
    
    // Disable delete button
    deleteNoteBtn.disabled = true;
}

// Create a new note from editor
function createNote() {
    const type = document.querySelector('input[name="note-type"]:checked').value;
    const title = noteTitle.value.trim();
    
    // Collect items
    const itemElements = noteItems.querySelectorAll('.item-container');
    const items = Array.from(itemElements).map(container => {
        const text = container.querySelector('.item-text').value.trim();
        const checked = type === 'checklist' ? container.querySelector('.item-checkbox').checked : false;
        
        return { text, checked };
    }).filter(item => item.text !== ''); // Filter out empty items
    
    // Require at least a title or one item
    if (!title && items.length === 0) {
        showStatus('Please add a title or at least one item', 'error');
        return null;
    }
    
    // Create the note object
    const note = {
        id: Date.now().toString(),
        title,
        type,
        items,
        created: Date.now(),
        lastModified: Date.now()
    };
    
    return note;
}

// Update an existing note from editor
function updateNote(noteId) {
    const type = document.querySelector('input[name="note-type"]:checked').value;
    const title = noteTitle.value.trim();
    
    // Collect items
    const itemElements = noteItems.querySelectorAll('.item-container');
    const items = Array.from(itemElements).map(container => {
        const text = container.querySelector('.item-text').value.trim();
        const checked = type === 'checklist' ? container.querySelector('.item-checkbox').checked : false;
        
        return { text, checked };
    }).filter(item => item.text !== ''); // Filter out empty items
    
    // Require at least a title or one item
    if (!title && items.length === 0) {
        showStatus('Please add a title or at least one item', 'error');
        return false;
    }
    
    // Find the note
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1) {
        showStatus('Note not found', 'error');
        return false;
    }
    
    // Update the note
    notes[noteIndex] = {
        ...notes[noteIndex],
        title,
        type,
        items,
        lastModified: Date.now()
    };
    
    // Save to storage
    saveNotesToStorage();
    
    // Update UI
    renderNotesList();
    
    return true;
}

// Save the current note
function saveCurrentNote() {
    if (currentNoteId) {
        // Update existing note
        if (updateNote(currentNoteId)) {
            showStatus('Note updated successfully', 'success');
        }
    } else {
        // Create new note
        const newNote = createNote();
        if (newNote) {
            notes.push(newNote);
            currentNoteId = newNote.id;
            
            // Save to storage
            saveNotesToStorage();
            
            // Update UI
            renderNotesList();
            deleteNoteBtn.disabled = false;
            
            showStatus('Note created successfully', 'success');
        }
    }
}

// Delete the current note
function deleteCurrentNote() {
    if (!currentNoteId) return;
    
    if (confirm('Are you sure you want to delete this note?')) {
        // Remove the note
        notes = notes.filter(note => note.id !== currentNoteId);
        
        // Save to storage
        saveNotesToStorage();
        
        // Reset editor and update UI
        resetEditor();
        renderNotesList();
        
        showStatus('Note deleted successfully', 'success');
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
    // Add new note button
    addNoteBtn.addEventListener('click', () => {
        resetEditor();
        noteTitle.focus();
    });
    
    // Filter buttons
    allNotesBtn.addEventListener('click', () => {
        currentFilter = 'all';
        
        // Update active button
        allNotesBtn.classList.add('active');
        listNotesBtn.classList.remove('active');
        checklistNotesBtn.classList.remove('active');
        
        renderNotesList();
    });
    
    listNotesBtn.addEventListener('click', () => {
        currentFilter = 'list';
        
        // Update active button
        allNotesBtn.classList.remove('active');
        listNotesBtn.classList.add('active');
        checklistNotesBtn.classList.remove('active');
        
        renderNotesList();
    });
    
    checklistNotesBtn.addEventListener('click', () => {
        currentFilter = 'checklist';
        
        // Update active button
        allNotesBtn.classList.remove('active');
        listNotesBtn.classList.remove('active');
        checklistNotesBtn.classList.add('active');
        
        renderNotesList();
    });
    
    // Note selection
    notesList.addEventListener('click', (e) => {
        const noteItem = e.target.closest('.note-item');
        if (noteItem) {
            const noteId = noteItem.dataset.id;
            currentNoteId = noteId;
            
            // Find the note
            const note = notes.find(note => note.id === noteId);
            if (note) {
                renderNoteEditor(note);
            }
            
            // Update selected item
            document.querySelectorAll('.note-item').forEach(item => {
                item.classList.remove('selected');
            });
            noteItem.classList.add('selected');
        }
    });
    
    // Note type toggle
    noteTypeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            const type = radio.value;
            updateEditorType(type);
        });
    });
    
    // Add item button
    addItemBtn.addEventListener('click', () => {
        const type = document.querySelector('input[name="note-type"]:checked').value;
        addEmptyItem(type);
    });
    
    // Remove item button (delegated event)
    noteItems.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-item-btn')) {
            const item = e.target.closest('.note-item');
            
            // Don't remove if it's the only item
            if (noteItems.children.length > 1) {
                item.remove();
            } else {
                // Clear the text instead
                const input = item.querySelector('.item-text');
                input.value = '';
                input.focus();
            }
        }
    });
    
    // Save note button
    saveNoteBtn.addEventListener('click', saveCurrentNote);
    
    // Delete note button
    deleteNoteBtn.addEventListener('click', deleteCurrentNote);
    
    // Auto-save on input changes (debounced)
    let saveTimeout;
    const debouncedSave = () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            if (currentNoteId) {
                updateNote(currentNoteId);
            }
        }, 1000);
    };
    
    noteTitle.addEventListener('input', debouncedSave);
    noteItems.addEventListener('input', debouncedSave);
    
    // Also save when checkboxes change
    noteItems.addEventListener('change', (e) => {
        if (e.target.classList.contains('item-checkbox')) {
            debouncedSave();
        }
    });
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', initNotes); 