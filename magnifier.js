document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const camera = document.getElementById('camera');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const magnifiedArea = document.getElementById('magnified-area');
    const imageUpload = document.getElementById('imageUpload');
    const cameraBtn = document.getElementById('cameraBtn');
    const freezeBtn = document.getElementById('freezeBtn');
    const captureBtn = document.getElementById('captureBtn');
    const saveBtn = document.getElementById('saveBtn');
    
    // Settings Elements
    const zoomRange = document.getElementById('zoom-range');
    const contrastRange = document.getElementById('contrast-range');
    const brightnessRange = document.getElementById('brightness-range');
    const zoomValue = document.getElementById('zoom-value');
    const contrastValue = document.getElementById('contrast-value');
    const brightnessValue = document.getElementById('brightness-value');

    let stream = null;
    let isFrozen = false;
    let isUsingCamera = false;

    // Set initial canvas size
    function setCanvasSize() {
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.5;
    }
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Handle image upload
    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    stopCamera();
                    drawImageToCanvas(img);
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Camera controls
    cameraBtn.addEventListener('click', toggleCamera);
    freezeBtn.addEventListener('click', toggleFreeze);
    
    async function toggleCamera() {
        if (!isUsingCamera) {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                camera.srcObject = stream;
                isUsingCamera = true;
                cameraBtn.innerHTML = '<span class="btn-icon">📷</span> Stop Camera';
                freezeBtn.style.display = 'inline-block';
                startCameraLoop();
            } catch (err) {
                console.error('Error accessing camera:', err);
                alert('Unable to access camera. Please ensure camera permissions are granted.');
            }
        } else {
            stopCamera();
        }
    }

    function stopCamera() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            camera.srcObject = null;
            stream = null;
        }
        isUsingCamera = false;
        isFrozen = false;
        cameraBtn.innerHTML = '<span class="btn-icon">📷</span> Use Camera';
        freezeBtn.style.display = 'none';
    }

    function toggleFreeze() {
        isFrozen = !isFrozen;
        freezeBtn.innerHTML = isFrozen ? 
            '<span class="btn-icon">▶️</span> Unfreeze' : 
            '<span class="btn-icon">⏸️</span> Freeze';
    }

    function startCameraLoop() {
        if (!isUsingCamera) return;
        
        if (!isFrozen) {
            ctx.drawImage(camera, 0, 0, canvas.width, canvas.height);
            applyFilters();
        }
        requestAnimationFrame(startCameraLoop);
    }

    // Drawing and filters
    function drawImageToCanvas(img) {
        const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width - img.width * scale) / 2;
        const y = (canvas.height - img.height * scale) / 2;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        applyFilters();
    }

    function applyFilters() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const contrast = contrastRange.value / 100;
        const brightness = brightnessRange.value / 100;
        
        for (let i = 0; i < data.length; i += 4) {
            // Apply brightness
            data[i] = data[i] * brightness;
            data[i + 1] = data[i + 1] * brightness;
            data[i + 2] = data[i + 2] * brightness;
            
            // Apply contrast
            data[i] = ((data[i] - 128) * contrast) + 128;
            data[i + 1] = ((data[i + 1] - 128) * contrast) + 128;
            data[i + 2] = ((data[i + 2] - 128) * contrast) + 128;
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // Magnifier functionality
    let isDragging = false;
    const magnifierSize = 200;
    
    canvas.addEventListener('mousedown', startMagnifier);
    canvas.addEventListener('mousemove', updateMagnifier);
    canvas.addEventListener('mouseup', () => isDragging = false);
    canvas.addEventListener('mouseleave', () => {
        isDragging = false;
        magnifiedArea.style.display = 'none';
    });

    function startMagnifier(e) {
        isDragging = true;
        updateMagnifier(e);
    }

    function updateMagnifier(e) {
        if (!isDragging) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        magnifiedArea.style.display = 'block';
        magnifiedArea.style.left = (e.clientX + 20) + 'px';
        magnifiedArea.style.top = (e.clientY + 20) + 'px';

        const zoomLevel = parseFloat(zoomRange.value);
        const size = magnifierSize / zoomLevel;
        const sourceX = Math.max(0, Math.min(x - size/2, canvas.width - size));
        const sourceY = Math.max(0, Math.min(y - size/2, canvas.height - size));

        magnifiedArea.style.width = magnifierSize + 'px';
        magnifiedArea.style.height = magnifierSize + 'px';
        magnifiedArea.style.backgroundImage = `url(${canvas.toDataURL()})`;
        magnifiedArea.style.backgroundPosition = 
            `-${sourceX * zoomLevel}px -${sourceY * zoomLevel}px`;
        magnifiedArea.style.backgroundSize = 
            `${canvas.width * zoomLevel}px ${canvas.height * zoomLevel}px`;
    }

    // Save functionality
    saveBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = 'magnified-image.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    // Capture button functionality
    captureBtn.addEventListener('click', () => {
        if (isUsingCamera) {
            toggleFreeze();
        }
    });

    // Settings event listeners
    zoomRange.addEventListener('input', () => {
        zoomValue.textContent = `${zoomRange.value}x`;
    });

    contrastRange.addEventListener('input', () => {
        contrastValue.textContent = `${contrastRange.value}%`;
        applyFilters();
    });

    brightnessRange.addEventListener('input', () => {
        brightnessValue.textContent = `${brightnessRange.value}%`;
        applyFilters();
    });
}); 