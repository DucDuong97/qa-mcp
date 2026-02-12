// Store recorded actions globally so we can regenerate code when page selection changes
let recordedActions = [];

// Get the recorded actions from the URL and generate code
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const actionsParam = urlParams.get('actions');
    
    if (actionsParam) {
        try {
            // Decode and parse the recorded actions
            recordedActions = JSON.parse(decodeURIComponent(actionsParam));
            
            // Generate the initial code with the selected page
            generateAndDisplayCode();
        } catch (error) {
            console.error('❌ Error parsing actions:', error);
            document.getElementById('codeBlock').textContent = `Error parsing actions: ${error.message}`;
        }
    } else {
        document.getElementById('codeBlock').textContent = 'No actions provided.';
    }

    // Add change event listener for page select dropdown
    document.getElementById('pageSelect').addEventListener('change', generateAndDisplayCode);

    // Add click event listener for copy button
    document.getElementById('copyButton').addEventListener('click', copyCode);
});

// Function to generate and display code based on current page selection
function generateAndDisplayCode() {
    const pageSelect = document.getElementById('pageSelect');
    const selectedPage = pageSelect.value;
    
    try {
        // Generate the Playwright code
        console.log('⚙️ Generating test code in code-viewer with page:', selectedPage);
        const code = generatePlaywrightCode(recordedActions, selectedPage);
        
        // Display the generated code
        document.getElementById('codeBlock').textContent = code;
    } catch (error) {
        console.error('❌ Error generating code:', error);
        document.getElementById('codeBlock').textContent = `Error generating code: ${error.message}`;
    }
}

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