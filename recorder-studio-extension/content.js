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

// Helper function to check if an XPath selector is ambiguous (returns more than one element)
function isAmbiguousSelector(selector) {
  try {
    const result = document.evaluate(
      selector,
      document,
      null,
      XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
      null
    );
    
    console.log(`🔍 XPath "${selector}" matches ${result.snapshotLength} elements`);
    return result.snapshotLength > 1;
  } catch (error) {
    console.error(`❌ Error evaluating XPath: ${error}`);
    return true; // Consider invalid XPath as ambiguous
  }
}

// Helper function to get the most specific selector
function getSelector(element, level = 0) {
  console.log('🔍 Getting selector for element:', element);

  // Return null for non-element nodes
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  // Stop at the body tag
  if (element.tagName === 'BODY') {
    return '//body';
  }

  // Priority 0: id
  if (element.id && !element.id.startsWith(':') && !element.id.endsWith(':')) {
    const selector = `//*[@id="${element.id}"]`;
    console.log('✅ Found id xpath:', selector);
    return selector;
  }

  // Priority 1: data-testid
  if (element.getAttribute('data-testid')) {
    const selector = `//*[@data-testid="${element.getAttribute('data-testid')}"]`;
    console.log('✅ Found data-testid xpath:', selector);
    if (!isAmbiguousSelector(selector)) {
      return selector;
    }
  }

  // Priority 2: name attribute for form elements
  if (element.name && (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA')) {
    const selector = `//*[local-name()="${element.tagName.toLowerCase()}"][@name="${element.name}"]`;
    console.log('✅ Found name xpath:', selector);
    if (!isAmbiguousSelector(selector)) {
      return selector;
    }
  }

  // Priority 3: placeholder for inputs
  if (element.getAttribute('placeholder')) {
    const selector = `//*[local-name()="input"][normalize-space(@placeholder)="${element.getAttribute('placeholder')}"]`;
    console.log('✅ Found placeholder xpath:', selector);
    if (!isAmbiguousSelector(selector)) {
      return selector;
    }
  }

  // Priority 4: aria-label
  if (element.getAttribute('aria-label')) {
    const selector = `//*[normalize-space(@aria-label)="${element.getAttribute('aria-label')}"]`;
    console.log('✅ Found aria-label xpath:', selector);
    if (!isAmbiguousSelector(selector)) {
      return selector;
    }
  }

  // Priority 5: text content
  if (TEXT_CONTAINERS.includes(element.tagName)) {
    const directText = getDirectTextContent(element);
    if (directText) {
      const tagName = element.tagName.toLowerCase();
      const selector = `//*[local-name()="${tagName}"][normalize-space(text())="${directText}"]`;
      console.log('✅ Found direct text content xpath with tag:', selector);
      if (!isAmbiguousSelector(selector)) {
        return selector;
      }
    }
  }

  if (level == 0){
    // Priority 6: a child element
    const children = element.childNodes;
    for (const child of children) {
      // Skip non-element nodes
      if (child.nodeType !== Node.ELEMENT_NODE) continue;
      
      const selector = getSelector(child, -1);
      if (selector) {
        const parentSelector = selector + "/..";
        console.log('✅ Found child element with text content:', parentSelector);
        if (!isAmbiguousSelector(parentSelector)) {
          return parentSelector;
        }
      }
    }
  }

  if (level < 0){
    return null;
  }

  // Priority 7: recursive path to the body
  const parent = element.parentNode;
  if (parent) {
    const parentSelector = getSelector(parent, level + 1);
    if (parentSelector) {
      // Get the index of the element among siblings of the same type
      const siblings = Array.from(parent.children).filter(
        child => child.tagName === element.tagName
      );
      const index = siblings.indexOf(element) + 1;
      
      // Build the selector
      const tagName = element.tagName.toLowerCase();
      const selector = siblings.length > 1 
        ? `${parentSelector}/*[local-name()="${tagName}"][${index}]` 
        : `${parentSelector}/*[local-name()="${tagName}"]`;
      
      console.log('✅ Found recursive xpath:', selector);
      // No need to check for ambiguity here as this should be specific enough
      return selector;
    }
  }

  // Fallback: create a full path from the root with indices
  let currentElem = element;
  let fullPath = '';
  
  while (currentElem && currentElem.nodeType === Node.ELEMENT_NODE) {
    if (currentElem.tagName === 'BODY') {
      fullPath = '//BODY' + fullPath;
      break;
    }
    
    let tagName = currentElem.tagName.toLowerCase();
    let siblings = Array.from(currentElem.parentNode.children).filter(
      child => child.tagName === currentElem.tagName
    );
    
    let index = siblings.length > 1 ? `[${siblings.indexOf(currentElem) + 1}]` : '';
    fullPath = `/*[local-name()="${tagName}"]${index}` + fullPath;
    
    currentElem = currentElem.parentNode;
  }
  
  console.log('✅ Created absolute xpath as fallback:', fullPath);
  return fullPath;
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