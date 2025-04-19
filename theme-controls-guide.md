# How to Add Theme Controls to ElderEase Pages

This guide explains how to add the theme controls to any page on the ElderEase website.

## Step 1: Add HTML Attributes

In the opening `<html>` tag, add the data attributes for theme color:

```html
<html lang="en" data-theme="light" data-color-theme="blue">
```

## Step 2: Add Font Awesome

Ensure the Font Awesome library is included in the `<head>` section:

```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
```

## Step 3: Include Required JavaScript Files

Add these two script tags near the end of your page, just before the closing `</body>` tag:

```html
<script src="accessibility.js"></script>
<script src="theme-controls.js"></script>
```

## Step 4: Add Help Button (Optional)

If you want the help button in the bottom right corner, add this HTML:

```html
<!-- Help Button -->
<a href="help.html" class="help-btn" title="Help & Tutorials">
    <i class="fas fa-question"></i>
</a>
```

## Example Implementation

Here's a minimal example of a page with theme controls:

```html
<!DOCTYPE html>
<html lang="en" data-theme="light" data-color-theme="blue">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Page Title - ElderEase</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="container">
        <header>
            <a href="index.html" class="back-button">← Back to Home</a>
            <h1>Page Title</h1>
            <p class="tagline">Page description</p>
        </header>

        <!-- Page content here -->

        <footer>
            <p>ElderEase - Empowering Independence Through Technology</p>
        </footer>
    </div>

    <!-- Help Button -->
    <a href="help.html" class="help-btn" title="Help & Tutorials">
        <i class="fas fa-question"></i>
    </a>

    <script src="accessibility.js"></script>
    <script src="theme-controls.js"></script>
</body>
</html>
```

## How It Works

- The `theme-controls.js` script automatically adds the floating background bubbles and enhances the accessibility controls with color theme options.
- User preferences are saved in localStorage and applied consistently across all pages.
- The theme controls will appear in the top-right corner alongside other accessibility controls.
- When a user changes the theme, the selection will be remembered and applied to all pages.

## Troubleshooting

If the theme controls don't appear:

1. Check that both `accessibility.js` and `theme-controls.js` are included and accessible
2. Verify that Font Awesome is loading correctly
3. Ensure the HTML attributes are correctly added to the `<html>` tag
4. Check the browser console for any JavaScript errors 