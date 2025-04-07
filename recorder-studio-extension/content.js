let isRecording = false;
let isAssertionMode = false;
let currentAssertionType = null;

const TEXT_CONTAINERS = ['BUTTON', 'A', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'P'];

console.log('🎯 Content Script Initialized');

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

// Helper function to get only direct text content of an element
function getDirectTextContent(element) {
  return Array.from(element.childNodes)
    .filter(node => node.nodeType === Node.TEXT_NODE)
    .map(node => node.textContent.trim())
    .join(' ')
    .trim();
}

// Helper function to get the most specific selector
function getSelector(element, level = 0) {
  console.log('🔍 Getting selector for element:', element);

  // Priority 1: data-testid
  if (element.getAttribute('data-testid')) {
    const selector = `[data-testid="${element.getAttribute('data-testid')}"]`;
    console.log('✅ Found data-testid selector:', selector);
    return selector;
  }

  // Priority 2: name attribute for form elements
  if (element.name && (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA')) {
    const selector = `[name="${element.name}"]`;
    console.log('✅ Found name selector:', selector);
    return selector;
  }

  // Priority 3: placeholder for inputs
  if (element.getAttribute('placeholder')) {
    const selector = `input[placeholder="${element.getAttribute('placeholder')}"]`;
    console.log('✅ Found placeholder selector:', selector);
    return selector;
  }

  // Priority 4: aria-label
  if (element.getAttribute('aria-label')) {
    const selector = `[aria-label="${element.getAttribute('aria-label')}"]`;
    console.log('✅ Found aria-label selector:', selector);
    return selector;
  }

  // Priority 5: text content
  if (TEXT_CONTAINERS.includes(element.tagName)) {
    const directText = getDirectTextContent(element);
    if (directText) {
      // Find closest ancestor with data-testid (including self)
      let currentElement = element;
      let testIdAncestor = null;
      while (currentElement && !testIdAncestor) {
        if (currentElement.getAttribute('data-testid')) {
          testIdAncestor = currentElement;
        } else {
          currentElement = currentElement.parentElement;
        }
      }
      
      let selector;
      if (testIdAncestor) {
        const testId = testIdAncestor.getAttribute('data-testid');
        const tagName = element.tagName.toLowerCase();
        selector = `[data-testid="${testId}"] ${tagName}:has-text("${directText}")`;
        console.log('✅ Found text content with data-testid and tag context:', selector);
      } else {
        const tagName = element.tagName.toLowerCase();
        selector = `${tagName}:has-text("${directText}")`;
        console.log('✅ Found direct text content selector with tag:', selector);
      }
      return selector;
    }
  }

  if (level == 0){
    // Priority 6: a child element with text content
    const children = element.childNodes;
    for (const child of children) {
      const selector = getSelector(child, -1);
      if (selector) {
        console.log('✅ Found child element with text content:', selector);
        return selector;
      }
    }

    // Priority 7: tag name with parent context
    let parent = element.parentElement;
    if (parent) {
      const parentSelector = getSelector(parent, 1);

      if (parentSelector) {
      if (TEXT_CONTAINERS.includes(parent.tagName)) {
        return parentSelector;
      }
      
        let selector = `${parentSelector} > ${element.tagName.toLowerCase()}`;
        let index = Array.from(parent.children).indexOf(element);
        
        if (index > 0) {
          selector += `:nth-child(${index + 1})`;
        }
        console.log('✅ Found parent context selector:', selector);

        if (selector){
        return selector;
      }
    }
  }
  
  return null;
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
    
    const selector = getSelector(element);

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
    const selector = getSelector(element);
    
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
    const selector = getSelector(element);
    
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
    'puppeteer-recorder-assertion-visible'
  );
}); 