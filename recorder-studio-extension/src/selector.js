// Expose selector utilities for content scripts.
// (Content scripts can't reliably use ES module imports without bundling/module registration.)
(() => {
  console.log('🔍 Selector script initialized');
  const TEXT_CONTAINERS = ['BUTTON', 'A', 'DIV', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'P'];

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

  window.RecorderStudioSelector = {
    run: getSelector,
  };
})();