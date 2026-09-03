// DOM Elements
const htmlCode = document.getElementById('html-code');
const cssCode = document.getElementById('css-code');
const jsCode = document.getElementById('js-code');
const previewFrame = document.getElementById('preview-frame');
const consoleOutput = document.getElementById('console-output');

// --- Core Functionality ---

// Run & Live Preview
function runCode() {
    const html = htmlCode.value;
    const css = `<style>${cssCode.value}</style>`;
    
    // Inject a script to hijack console.log inside the iframe
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

    // Construct the final document and inject it via srcdoc
    const documentContent = html + css + js;
    previewFrame.srcdoc = documentContent;
}

// Listen for Console Messages from Iframe
window.addEventListener('message', (e) => {
    if (e.data && (e.data.type === 'log' || e.data.type === 'error')) {
        const msgDiv = document.createElement('div');
        msgDiv.className = e.data.type === 'error' ? 'console-msg console-err' : 'console-msg';
        msgDiv.textContent = `> ${e.data.message}`;
        consoleOutput.appendChild(msgDiv);
        consoleOutput.scrollTop = consoleOutput.scrollHeight; // Auto-scroll
    }
});

// Clear Console
document.getElementById('btn-clear-console').addEventListener('click', () => {
    consoleOutput.innerHTML = '';
});

// Event Listeners for Run Button & Auto-run on typing (optional)
document.getElementById('btn-run').addEventListener('click', () => {
    consoleOutput.innerHTML = ''; // Clear console on new run
    runCode();
});

// --- Action Bar Features ---

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

// Copy Code (Combines all code into one block)
document.getElementById('btn-copy').addEventListener('click', () => {
    const combined = `${htmlCode.value}\n<style>\n${cssCode.value}\n</style>\n<script>\n${jsCode.value}\n<\/script>`;
    navigator.clipboard.writeText(combined).then(() => {
        alert('All code copied to clipboard!');
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
        const contents = e.target.result;
        // Basic parser to split content into boxes (very simple logic)
        // For a college project, this demonstrates File API usage.
        htmlCode.value = contents; 
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
    
    // Toggle Icon
    const icon = e.currentTarget.querySelector('i');
    if (newTheme === 'light') {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
});

// Fullscreen Preview
document.getElementById('btn-full').addEventListener('click', () => {
    if (previewFrame.requestFullscreen) {
        previewFrame.requestFullscreen();
    } else if (previewFrame.webkitRequestFullscreen) { /* Safari */
        previewFrame.webkitRequestFullscreen();
    }
});
