// --- DOM Elements ---
const htmlCode = document.getElementById('html-code');
const cssCode = document.getElementById('css-code');
const jsCode = document.getElementById('js-code');
const previewFrame = document.getElementById('preview-frame');
const consoleOutput = document.getElementById('console-output');

// --- Run & Live Preview ---
function runCode() {
    const html = htmlCode.value;
    
    // Inject matching dark/light background based on app theme
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const themeBaseCSS = currentTheme === 'dark' 
        ? `body { background-color: #1e1e1e; color: #d4d4d4; font-family: sans-serif; margin: 0; padding: 10px; min-height: 100vh; box-sizing: border-box; }`
        : `body { background-color: #ffffff; color: #333333; font-family: sans-serif; margin: 0; padding: 10px; min-height: 100vh; box-sizing: border-box; }`;
    
    const css = `<style>${themeBaseCSS}\n${cssCode.value}</style>`;
    
    // Inject script to hijack console.log inside the iframe
    const js = `
        <script>
            const originalLog = console.log;
            const originalError = console.error;
            
            console.log = function(...args) {
                window.parent.postMessage({ type: 'log', message: args.join(' ') }, '*');
                originalLog.apply(console, args);
            };
            
            console.error = function(...args) {
                window.parent.postMessage({ type: 'error', message: args.join(' ') }, '*');
                originalError.apply(console, args);
            };
            
            window.onerror = function(msg, url, line) {
                window.parent.postMessage({ type: 'error', message: msg + ' on line ' + line }, '*');
            };

            try {
                ${jsCode.value}
            } catch(e) {
                console.error(e.toString());
            }
        <\/script>
    `;

    const documentContent = html + css + js;
    previewFrame.srcdoc = documentContent;
}

// --- Event Listeners ---

// Listen for Console Messages from Iframe
window.addEventListener('message', (e) => {
    if (e.data && (e.data.type === 'log' || e.data.type === 'error')) {
        const msgDiv = document.createElement('div');
        msgDiv.className = e.data.type === 'error' ? 'console-msg console-err' : 'console-msg';
        msgDiv.textContent = `> ${e.data.message}`;
        consoleOutput.appendChild(msgDiv);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
});

// Clear Console
document.getElementById('btn-clear-console').addEventListener('click', () => {
    consoleOutput.innerHTML = '';
});

// Run Button
document.getElementById('btn-run').addEventListener('click', () => {
    consoleOutput.innerHTML = ''; 
    runCode();
});

// Save Code (LocalStorage)
document.getElementById('btn-save').addEventListener('click', () => {
    localStorage.setItem('saved-html', htmlCode.value);
    localStorage.setItem('saved-css', cssCode.value);
    localStorage.setItem('saved-js', jsCode.value);
    alert('Code saved locally!');
});

// Load Saved Code on Init
window.onload = () => {
    if (localStorage.getItem('saved-html') !== null) htmlCode.value = localStorage.getItem('saved-html');
    if (localStorage.getItem('saved-css') !== null) cssCode.value = localStorage.getItem('saved-css');
    if (localStorage.getItem('saved-js') !== null) jsCode.value = localStorage.getItem('saved-js');
    runCode();
};

// Reset Button
document.getElementById('btn-reset').addEventListener('click', () => {
    if(confirm('Are you sure you want to reset all code?')) {
        htmlCode.value = ''; cssCode.value = ''; jsCode.value = '';
        localStorage.clear();
        consoleOutput.innerHTML = '';
        runCode();
    }
});

// Copy Code 
document.getElementById('btn-copy').addEventListener('click', () => {
    const combined = `${htmlCode.value}\n<style>\n${cssCode.value}\n</style>\n<script>\n${jsCode.value}\n<\/script>`;
    navigator.clipboard.writeText(combined).then(() => {
        alert('All code copied to clipboard!');
    }).catch(err => {
        alert('Failed to copy to clipboard.');
    });
});

// Download .html File
document.getElementById('btn-download').addEventListener('click', () => {
    const combined = `<!DOCTYPE html>\n<html>\n<head>\n<style>\n${cssCode.value}\n</style>\n</head>\n<body>\n${htmlCode.value}\n<script>\n${jsCode.value}\n<\/script>\n</body>\n</html>`;
    const blob = new Blob([combined], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.html';
    a.click();
    URL.revokeObjectURL(url);
});

// Open/Upload .html File
document.getElementById('file-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        htmlCode.value = e.target.result; 
        cssCode.value = ''; 
        jsCode.value = '';
        alert('File loaded into HTML editor. Please split CSS/JS manually if needed.');
        runCode();
    };
    reader.readAsText(file);
});

// Dark/Light Theme Toggle
document.getElementById('btn-theme').addEventListener('click', (e) => {
    const htmlEl = document.documentElement;
    const currentTheme = htmlEl.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', newTheme);
    
    const icon = e.currentTarget.querySelector('i');
    if (newTheme === 'light') {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
    runCode(); // Apply theme to preview
});

// Fullscreen Preview
document.getElementById('btn-full').addEventListener('click', () => {
    if (previewFrame.requestFullscreen) previewFrame.requestFullscreen();
    else if (previewFrame.webkitRequestFullscreen) previewFrame.webkitRequestFullscreen();
});

// --- Panel Minimize/Maximize Logic ---
const editorLayout = document.getElementById('editor-layout');
const panelStates = { html: true, css: true, js: true }; 

document.querySelectorAll('.btn-minimize').forEach(btn => {
    btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-panel');
        const panelEl = document.getElementById(`panel-${target}`);
        
        panelStates[target] = !panelStates[target];
        panelEl.classList.toggle('minimized-panel');
        btn.classList.toggle('rotated');
        
        const htmlRow = panelStates.html ? '1fr' : '34px';
        const cssRow = panelStates.css ? '1fr' : '34px';
        const jsRow = panelStates.js ? '1fr' : '34px';
        
        editorLayout.style.gridTemplateRows = `${htmlRow} ${cssRow} ${jsRow}`;
    });
});

// --- Helper Function: Safely extract iframe visual content ---
async function getPreviewImage() {
    try {
        // Attempt to access the iframe document
        const iframeDoc = previewFrame.contentDocument || previewFrame.contentWindow.document;
        
        if (!iframeDoc || !iframeDoc.body) {
            throw new Error("Browser blocked access to iframe document.");
        }

        const originalOverflow = iframeDoc.body.style.overflow;
        iframeDoc.body.style.overflow = 'hidden'; // Hide scrollbars for the shot
        
        const canvas = await html2canvas(iframeDoc.body, {
            backgroundColor: document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e1e1e' : '#ffffff',
            scale: 2,
            useCORS: true // Attempts to load external images safely
        });
        
        iframeDoc.body.style.overflow = originalOverflow; // Restore scrollbars
        
        // This line throws a DOMException if the canvas contains cross-origin images
        return canvas.toDataURL('image/png'); 
        
    } catch (err) {
        console.warn("Iframe capture blocked by browser security. Using fallback.", err);
        
        // Create a fallback image dynamically so the PDF doesn't crash
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = 800;
        fallbackCanvas.height = 300;
        const ctx = fallbackCanvas.getContext('2d');
        
        // Draw a warning box
        ctx.fillStyle = '#252526';
        ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
        ctx.fillStyle = '#f85149';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('⚠️ Output capture blocked by mobile browser security.', 400, 140);
        ctx.fillStyle = '#d4d4d4';
        ctx.fillText('(Usually caused by external images in your HTML code)', 400, 170);
        
        return fallbackCanvas.toDataURL('image/png');
    }
}

// --- macOS Screenshot Capture Logic ---
document.getElementById('btn-screenshot').addEventListener('click', async () => {
    const targetElement = document.getElementById('macos-preview');
    const macBody = document.querySelector('.macos-body');
    const btn = document.getElementById('btn-screenshot');
    const originalBtnText = btn.innerHTML;
    
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Capturing...';

    try {
        // 1. Get the image of the code output
        const iframeImgSrc = await getPreviewImage();
        
        // 2. Temporarily swap the iframe with an image element
        const img = document.createElement('img');
        img.src = iframeImgSrc;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        
        previewFrame.style.display = 'none';
        macBody.appendChild(img);

        // 3. Take a picture of the whole macOS window container
        const canvas = await html2canvas(targetElement, { backgroundColor: null, scale: 2, useCORS: true });
        
        // 4. Trigger download
        const downloadLink = document.createElement('a');
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = 'mac-preview-shot.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // 5. Clean up and restore the live preview
        macBody.removeChild(img);
        previewFrame.style.display = 'block';

    } catch (err) {
        console.error("Screenshot failed: ", err);
        alert("Screenshot failed. Check console.");
    } finally {
        btn.innerHTML = originalBtnText;
    }
});

// --- Assignment PDF Generation Logic ---
document.getElementById('btn-pdf').addEventListener('click', async () => {
    const titleText = document.getElementById('exp-title').value || 'Experiment 01';
    const objText = document.getElementById('exp-objective').value || 'To create a basic HTML document.';
    
    document.getElementById('pdf-render-title').textContent = titleText;
    document.getElementById('pdf-render-obj').textContent = objText;
    
    let combinedCode = htmlCode.value;
    if (cssCode.value.trim()) combinedCode += `\n<style>\n${cssCode.value}\n</style>`;
    if (jsCode.value.trim()) combinedCode += `\n<script>\n${jsCode.value}\n<\/script>`;
    document.getElementById('pdf-render-code').textContent = combinedCode;

    const pdfBtn = document.getElementById('btn-pdf');
    const originalText = pdfBtn.innerHTML;
    pdfBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
    
    try {
        const iframeImgSrc = await getPreviewImage();
        document.getElementById('pdf-render-output-img').src = iframeImgSrc;

        const element = document.getElementById('pdf-export-wrapper');
        const opt = {
            margin:       [10, 10, 15, 10], 
            filename:     'Assignment_Project.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2 },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak:    { mode: 'avoid-all' }
        };

        element.style.left = '0';
        element.style.zIndex = '-1'; 
        
        await html2pdf().set(opt).from(element).save();
        
        element.style.left = '-9999px';
        
    } catch (err) {
        console.error("PDF Generation failed: ", err);
        alert("Failed to generate PDF. Check console for details.");
    } finally {
        pdfBtn.innerHTML = originalText;
    }
});
