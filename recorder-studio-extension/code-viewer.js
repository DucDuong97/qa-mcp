// Get the code from the URL
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
        const decodedCode = decodeURIComponent(code);
        document.getElementById('codeBlock').textContent = decodedCode;
    }

    // Add click event listener for copy button
    document.getElementById('copyButton').addEventListener('click', copyCode);
});

function copyCode() {
    const codeBlock = document.getElementById('codeBlock');
    const textArea = document.createElement('textarea');
    textArea.value = codeBlock.textContent;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    const button = document.querySelector('.copy-button');
    button.textContent = 'Copied!';
    setTimeout(() => {
        button.textContent = 'Copy Code';
    }, 2000);
} 