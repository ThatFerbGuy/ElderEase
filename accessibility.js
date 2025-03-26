// Accessibility Controls
document.addEventListener('DOMContentLoaded', function() {
    // Initialize accessibility controls
    initializeAccessibilityControls();
});

function initializeAccessibilityControls() {
    // Create accessibility controls container
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'accessibility-controls';
    controlsContainer.innerHTML = `
        <button id="themeToggle" class="accessibility-btn" aria-label="Toggle dark/light mode">
            <i class="fas fa-moon"></i>
        </button>
        <button id="fontSizeToggle" class="accessibility-btn" aria-label="Toggle font size">
            <i class="fas fa-text-height"></i>
        </button>
    `;

    // Add controls to the page
    document.body.appendChild(controlsContainer);

    // Theme toggle functionality
    const themeToggle = document.getElementById('themeToggle');
    const icon = themeToggle.querySelector('i');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.body.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // Font size toggle functionality
    const fontSizeToggle = document.getElementById('fontSizeToggle');
    let currentFontSize = localStorage.getItem('fontSize') || 'normal';
    
    fontSizeToggle.addEventListener('click', () => {
        const sizes = ['normal', 'large', 'xlarge'];
        const currentIndex = sizes.indexOf(currentFontSize);
        const nextIndex = (currentIndex + 1) % sizes.length;
        
        currentFontSize = sizes[nextIndex];
        document.body.setAttribute('data-font-size', currentFontSize);
        localStorage.setItem('fontSize', currentFontSize);
    });

    // Apply saved font size
    document.body.setAttribute('data-font-size', currentFontSize);
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
} 