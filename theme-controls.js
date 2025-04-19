/**
 * ElderEase Theme Controls
 * This script handles theme controls across all pages of the ElderEase application.
 * It provides color theme switching and dark/light mode toggle.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Apply saved theme preferences
    applySavedThemePreferences();
    
    // Wait for accessibility controls to be created
    setTimeout(() => {
        enhanceAccessibilityControls();
    }, 100); // Small delay to ensure accessibility controls are loaded
});

/**
 * Apply any saved theme preferences from localStorage
 */
function applySavedThemePreferences() {
    // Load saved color theme preference
    const savedColorTheme = localStorage.getItem('colorTheme');
    if (savedColorTheme) {
        document.documentElement.setAttribute('data-color-theme', savedColorTheme);
    }
    
    // Load saved theme (light/dark) preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
}

/**
 * Add floating background elements to the page
 */
function addBackgroundElements() {
    // Check if background elements already exist
    if (!document.querySelector('.background-elements')) {
        const backgroundElements = document.createElement('div');
        backgroundElements.className = 'background-elements';
        backgroundElements.innerHTML = `
            <div class="floating-bubble"></div>
            <div class="floating-bubble"></div>
            <div class="floating-bubble"></div>
        `;
        document.body.insertBefore(backgroundElements, document.body.firstChild);
    }
}

/**
 * Enhance accessibility controls with color theme options
 */
function enhanceAccessibilityControls() {
    // Add floating background elements
    addBackgroundElements();
    
    const accessibilityControls = document.querySelector('.accessibility-controls');
    
    if (accessibilityControls) {
        // Check if color theme dropdown already exists
        if (!accessibilityControls.querySelector('.color-theme-dropdown')) {
            // Add color theme selector
            const colorThemeDropdown = document.createElement('div');
            colorThemeDropdown.className = 'color-theme-dropdown';
            colorThemeDropdown.innerHTML = `
                <button class="accessibility-btn" aria-label="Change color theme">
                    <i class="fas fa-palette"></i>
                </button>
                <div class="theme-switchers">
                    <button class="theme-btn theme-btn-blue" data-color="blue" title="Blue theme"></button>
                    <button class="theme-btn theme-btn-green" data-color="green" title="Green theme"></button>
                    <button class="theme-btn theme-btn-purple" data-color="purple" title="Purple theme"></button>
                    <button class="theme-btn theme-btn-orange" data-color="orange" title="Orange theme"></button>
                </div>
            `;
            
            accessibilityControls.appendChild(colorThemeDropdown);
            
            // Add event listeners for color theme buttons
            colorThemeDropdown.querySelectorAll('.theme-btn[data-color]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const color = btn.dataset.color;
                    document.documentElement.setAttribute('data-color-theme', color);
                    localStorage.setItem('colorTheme', color);
                });
            });
            
            // Handle color theme dropdown toggle
            const paletteBtn = colorThemeDropdown.querySelector('.accessibility-btn');
            const themeSwitchers = colorThemeDropdown.querySelector('.theme-switchers');
            
            paletteBtn.addEventListener('click', () => {
                themeSwitchers.classList.toggle('show');
            });
            
            // Close the dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!colorThemeDropdown.contains(e.target)) {
                    themeSwitchers.classList.remove('show');
                }
            });
        }
        
        // Override the theme toggle to set data-theme on html element
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                
                // Update icon
                const icon = themeToggle.querySelector('i');
                icon.className = newTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
            }, true);
        }
    }
} 