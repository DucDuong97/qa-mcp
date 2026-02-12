let isRecording = false;
let isAssertionMode = false;
let currentAssertionType = null;

console.log('🎯 Content Script Initialized');

function getSelectorForElement(element) {
  const api = globalThis.RecorderStudioSelector;
  if (!api?.run) {
    console.warn(
      '❌ RecorderStudioSelector not found. Possible causes: content script not injected on this page (e.g. chrome://, extensions pages), extension not reloaded, or selector script failed to load.'
    );
    return null;
  }
  return api.run(element);
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Received message from popup:', message);
  
  if (message.type === 'TOGGLE_RECORDING') {
    isRecording = message.isRecording;
    isAssertionMode = false;
    currentAssertionType = null;
    console.log(`🎥 Recording ${isRecording ? 'resumed' : 'paused'}`);
  } else if (message.type === 'ADD_ASSERTION_MODE') {
    isAssertionMode = true;
    currentAssertionType = message.assertionType;
    console.log(`🎯 Entering ${currentAssertionType} assertion mode`);
  }
});

// Helper function to truncate text
function truncateText(text, maxLength = 40) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// Record click events
document.addEventListener('click', (e) => {
  if (!isRecording) return;
  
  // Persist the event to prevent React from nullifying it
  if (e.persist) e.persist();
  
  // Process the event immediately in the next animation frame
  requestAnimationFrame(() => {
    console.log('🖱️ Click event detected');
    const element = e.target;
    
    const selector = getSelectorForElement(element);

    if (!selector) {
      alert('No selector found for the selected element, please contact the developers');
      e.stopImmediatePropagation();
      return;
    }
    
    if (isAssertionMode) {
      console.log('📝 Recording assertion for element:', element);
      
      switch (currentAssertionType) {
        case 'text':
          chrome.runtime.sendMessage({
            type: 'ACTION_RECORDED',
            action: {
              type: 'assertion',
              selector,
              expectedText: element.textContent.trim(),
              description: `Assert text "${truncateText(element.textContent.trim())}" exists`,
            }
          });
          break;
          
        case 'color':
          const computedStyle = window.getComputedStyle(element);
          const color = computedStyle.color;
          chrome.runtime.sendMessage({
            type: 'ACTION_RECORDED',
            action: {
              type: 'color-assertion',
              selector,
              expectedColor: color,
              description: `Assert color is "${color}"`,
            }
          });
          break;
          
        case 'background-color':
          const bgComputedStyle = window.getComputedStyle(element);
          let backgroundColor = bgComputedStyle.backgroundColor;
          let parentElementTag = null;
          
          // If background color is transparent, look for parent element with non-transparent background
          if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
            console.log('🔍 Element has transparent background, checking parent elements');
            let currentElement = element.parentElement;
            let found = false;
            
            while (currentElement && currentElement.tagName !== 'BODY' && !found) {
              const parentStyle = window.getComputedStyle(currentElement);
              const parentBgColor = parentStyle.backgroundColor;
              
              if (parentBgColor !== 'rgba(0, 0, 0, 0)' && parentBgColor !== 'transparent') {
                backgroundColor = parentBgColor;
                found = true;
                console.log(`✅ Found non-transparent background on parent: ${backgroundColor}`);
                // Store the tag name of the parent that has the background color
                parentElementTag = currentElement.tagName.toLowerCase();
              } else {
                currentElement = currentElement.parentElement;
              }
            }
          }
          
          // Create description based on whether we found a background color
          const isFromParent = backgroundColor !== bgComputedStyle.backgroundColor;
          let description;
          
          if (isFromParent) {
            description = `Assert inherited background color "${backgroundColor}" from parent ${parentElementTag}`;
          } else {
            description = `Assert background color is "${backgroundColor}"`;
          }
          
          chrome.runtime.sendMessage({
            type: 'ACTION_RECORDED',
            action: {
              type: 'background-color-assertion',
              selector,
              expectedBgColor: backgroundColor,
              description,
            }
          });
          break;
          
        case 'visible':
          chrome.runtime.sendMessage({
            type: 'ACTION_RECORDED',
            action: {
              type: 'visible',
              selector,
              description: `Assert element is visible`,
            }
          });
          break;
      }
      
      isAssertionMode = false;
      currentAssertionType = null;
      console.log('🎯 Exiting assertion mode');
    } else {
      console.log('📝 Recording click action for element:', element);
      chrome.runtime.sendMessage({
        type: 'ACTION_RECORDED',
        action: {
          type: 'click',
          selector,
          description: `Click on "${truncateText(element.textContent.trim() || element.tagName.toLowerCase())}"`,
        }
      });
    }
  });
}, true);

// Record input events
document.addEventListener('change', (e) => {
  if (!isRecording || isAssertionMode) return;
  
  console.log('📝 Change event detected');
  const element = e.target;
  if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
    console.log('⌨️ Recording input/textarea change:', element.value);
    const selector = getSelectorForElement(element);
    
    chrome.runtime.sendMessage({
      type: 'ACTION_RECORDED',
      action: {
        type: 'type',
        selector,
        value: element.value,
        description: `Type "${element.value}" into ${element.placeholder || element.tagName.toLowerCase()}`,
      }
    });
  } else if (element.tagName === 'SELECT') {
    console.log('🔽 Recording select change:', element.value);
    const selector = getSelectorForElement(element);
    
    chrome.runtime.sendMessage({
      type: 'ACTION_RECORDED',
      action: {
        type: 'select',
        selector,
        value: element.value,
        description: `Select "${element.options[element.selectedIndex].text}" from dropdown`,
      }
    });
  }
});

console.log('💫 Adding visual feedback styles');
// Add visual feedback for recording
const style = document.createElement('style');
style.textContent = `
  .puppeteer-recorder-hover {
    outline: 2px solid #fb98a6 !important;
    cursor: pointer !important;
  }
  .puppeteer-recorder-assertion-text {
    outline: 2px solid #2196F3 !important;
    cursor: crosshair !important;
  }
  .puppeteer-recorder-assertion-color {
    outline: 2px solid #4CAF50 !important;
    cursor: crosshair !important;
  }
  .puppeteer-recorder-assertion-background-color {
    outline: 2px solid #FF9800 !important;
    cursor: crosshair !important;
  }
  .puppeteer-recorder-assertion-visible {
    outline: 2px solid #9C27B0 !important;
    cursor: crosshair !important;
  }
`;
document.head.appendChild(style);

// Add hover effect when recording
document.addEventListener('mouseover', (e) => {
  if (!isRecording) return;
  if (isAssertionMode) {
    e.target.classList.add(`puppeteer-recorder-assertion-${currentAssertionType}`);
  } else {
    e.target.classList.add('puppeteer-recorder-hover');
  }
});

document.addEventListener('mouseout', (e) => {
  if (!isRecording) return;
  e.target.classList.remove(
    'puppeteer-recorder-hover',
    'puppeteer-recorder-assertion-text',
    'puppeteer-recorder-assertion-color',
    'puppeteer-recorder-assertion-background-color',
    'puppeteer-recorder-assertion-visible'
  );
}); 