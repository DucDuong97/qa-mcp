let isRecording = false;
let recordedActions = [];

console.log('🎯 Initializing Recorder Studio Side Panel');

// Function to reset UI state
function resetUIState() {
  const recordBtn = document.getElementById('recordBtn');
  const recordingStatus = document.getElementById('recordingStatus');
  const assertionBtns = document.querySelectorAll('.assertion-btn');
  
  isRecording = false;
  recordBtn.textContent = 'Start Recording';
  recordBtn.classList.remove('recording');
  assertionBtns.forEach(btn => btn.disabled = true);
  recordingStatus.textContent = 'Not Recording';
  document.querySelector('.recording-indicator')?.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('📑 DOM Content Loaded - Setting up UI elements');
  
  const recordBtn = document.getElementById('recordBtn');
  const generateBtn = document.getElementById('generateBtn');
  const clearBtn = document.getElementById('clearBtn');
  const assertTextBtn = document.getElementById('assertTextBtn');
  const assertColorBtn = document.getElementById('assertColorBtn');
  const assertVisibleBtn = document.getElementById('assertVisibleBtn');
  const actionList = document.getElementById('actionList');
  const codeOutput = document.getElementById('codeOutput');
  const recordingStatus = document.getElementById('recordingStatus');
  const actionCount = document.getElementById('actionCount');
  const toolSelect = document.getElementById('toolSelect');
  const pageSelect = document.getElementById('pageSelect');

  // Load saved actions
  console.log('💾 Loading saved data from storage...');
  chrome.storage.local.get(['recordedActions'], (result) => {
    console.log('📦 Loaded data from storage:', result);
    if (result.recordedActions) {
      recordedActions = result.recordedActions;
      console.log('🔄 Restoring recorded actions:', recordedActions);
      updateActionList();
      actionCount.textContent = `${recordedActions.length} actions recorded`;
    }
  });

  // Listen for visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && isRecording) {
      console.log('🔄 Panel hidden while recording, pausing recording');
      isRecording = false;
      resetUIState();
      
      // Notify content script
      chrome.runtime.sendMessage({
        type: 'TOGGLE_RECORDING',
        isRecording: false
      });
    }
  });

  // Listen for beforeunload to cleanup
  window.addEventListener('beforeunload', () => {
    console.log('🧹 Cleaning up before unload');
    if (isRecording) {
      chrome.runtime.sendMessage({
        type: 'TOGGLE_RECORDING',
        isRecording: false
      });
    }
  });

  recordBtn.addEventListener('click', () => {
    isRecording = !isRecording;
    console.log(`🎥 Recording ${isRecording ? 'resumed' : 'paused'}`);
    
    recordBtn.textContent = isRecording ? 'Pause Recording' : 'Resume Recording';
    recordBtn.classList.toggle('recording');
    document.querySelectorAll('.assertion-btn').forEach(btn => btn.disabled = !isRecording);
    recordingStatus.textContent = isRecording ? 'Recording' : 'Paused';
    document.querySelector('.recording-indicator').classList.toggle('active', isRecording);

    // Send message through background script
    chrome.runtime.sendMessage({
      type: 'TOGGLE_RECORDING',
      isRecording
    });
  });

  assertTextBtn.addEventListener('click', () => {
    console.log('🎯 Entering text assertion mode');
    chrome.runtime.sendMessage({
      type: 'ADD_ASSERTION_MODE',
      assertionType: 'text'
    });
  });

  assertColorBtn.addEventListener('click', () => {
    console.log('🎯 Entering color assertion mode');
    chrome.runtime.sendMessage({
      type: 'ADD_ASSERTION_MODE',
      assertionType: 'color'
    });
  });

  assertVisibleBtn.addEventListener('click', () => {
    console.log('🎯 Entering visibility assertion mode');
    chrome.runtime.sendMessage({
      type: 'ADD_ASSERTION_MODE',
      assertionType: 'visible'
    });
  });

  generateBtn.addEventListener('click', () => {
    console.log('⚙️ Generating test code');
    const selectedTool = toolSelect.value;
    const selectedPage = pageSelect.value;
    const code = selectedTool === 'puppeteer' 
      ? generatePuppeteerCode(selectedPage) 
      : generatePlaywrightCode(selectedPage);
    console.log('📜 Generated code:', code);
    
    // Open code viewer in new tab with the generated code
    const encodedCode = encodeURIComponent(code);
    const viewerUrl = chrome.runtime.getURL('code-viewer.html');
    chrome.tabs.create({ 
      url: `${viewerUrl}?code=${encodedCode}`
    });
  });

  clearBtn.addEventListener('click', () => {
    console.log('🧹 Clearing all recorded actions');
    recordedActions = [];
    isRecording = false;
    chrome.storage.local.set({ recordedActions: [] });
    updateActionList();
    
    // Update recording UI state
    recordBtn.textContent = 'Start Recording';
    recordBtn.classList.remove('recording');
    document.querySelectorAll('.assertion-btn').forEach(btn => btn.disabled = true);
    recordingStatus.textContent = 'Not Recording';
    document.querySelector('.recording-indicator').classList.remove('active');
    
    // Notify content script
    chrome.runtime.sendMessage({
      type: 'TOGGLE_RECORDING',
      isRecording: false
    });
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ACTION_RECORDED') {
    console.log('📝 New action recorded:', message.action);
    recordedActions.push(message.action);
    chrome.storage.local.set({ recordedActions });
    updateActionList();
  }
});

function updateActionList() {
  console.log('🔄 Updating action list UI');
  const $actionList = document.getElementById('actionList');
  $actionList.innerHTML = '';

  if (recordedActions.length === 0) {
    console.log('ℹ️ No actions to display');
    $actionList.innerHTML = '<div class="action-item">No actions recorded yet</div>';
    return;
  }

  console.log('📋 Displaying actions:', recordedActions);
  recordedActions.forEach((action, index) => {
    const $actionItem = document.createElement('div');
    $actionItem.className = 'action-item';
    // Make the item draggable
    $actionItem.draggable = true;
    $actionItem.setAttribute('data-index', index);
    $actionItem.innerHTML = `
      <div>
        <span class="drag-handle">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
          </svg>
        </span>
        <span class="type">${action.type}</span>
        <span class="description">${action.description}</span>
      </div>
      <span class="delete-action" data-index="${index}">x</span>
    `;
    $actionList.appendChild($actionItem);

    // Add drag event listeners
    $actionItem.addEventListener('dragstart', (e) => {
      e.target.classList.add('dragging');
      e.dataTransfer.setData('text/plain', index);
    });

    $actionItem.addEventListener('dragend', (e) => {
      e.target.classList.remove('dragging');
    });

    $actionItem.addEventListener('dragover', (e) => {
      e.preventDefault();
      const draggingItem = document.querySelector('.dragging');
      if (draggingItem === e.currentTarget) return;
      
      const allItems = [...$actionList.querySelectorAll('.action-item:not(.dragging)')];
      const nextItem = allItems.find(item => {
        const rect = item.getBoundingClientRect();
        return e.clientY <= rect.top + rect.height / 2;
      });

      if (nextItem) {
        $actionList.insertBefore(draggingItem, nextItem);
      } else {
        $actionList.appendChild(draggingItem);
      }
    });

    $actionItem.addEventListener('drop', (e) => {
      e.preventDefault();
      const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
      const toIndex = parseInt(e.currentTarget.dataset.index);
      
      if (fromIndex !== toIndex) {
        // Reorder the recordedActions array
        const [movedItem] = recordedActions.splice(fromIndex, 1);
        recordedActions.splice(toIndex, 0, movedItem);
        
        // Save to storage and update UI
        chrome.storage.local.set({ recordedActions });
        updateActionList();
      }
    });
  });

  // Update action count
  document.getElementById('actionCount').textContent = `${recordedActions.length} actions recorded`;

  // Add delete action handlers
  document.querySelectorAll('.delete-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      console.log('🗑️ Deleting action at index:', index);
      recordedActions.splice(index, 1);
      chrome.storage.local.set({ recordedActions });
      updateActionList();
    });
  });
}

function generatePuppeteerCode(pageName = 'page') {
  console.log(`⚙️ Starting Puppeteer code generation for ${pageName}`);
  
  let code = "";
  
  recordedActions.forEach((action, index) => {
    console.log(`🔨 Processing action ${index + 1}/${recordedActions.length}:`, action);
    switch (action.type) {
      case 'click':
        if (action.selector.startsWith('text/')) {
          code += `    await ${pageName}.waitForSelector('${action.selector}');\n`;
          code += `    await ${pageName}.click('${action.selector}');\n\n`;
        } else {
          code += `    await ${pageName}.waitForSelector('${action.selector}');\n`;
          code += `    await ${pageName}.click('${action.selector}');\n\n`;
        }
        break;
      case 'type':
        code += `    await ${pageName}.waitForSelector('${action.selector}');\n`;
        code += `    await ${pageName}.type('${action.selector}', '${action.value}');\n\n`;
        break;
      case 'select':
        code += `    await ${pageName}.waitForSelector('${action.selector}');\n`;
        code += `    await ${pageName}.select('${action.selector}', '${action.value}');\n\n`;
        break;
      case 'assertion':
        code += `    await expect(${pageName}).toMatchElement('${action.selector}', {\n`;
        code += `      text: '${action.expectedText}'\n`;
        code += `    });\n\n`;
        break;
      case 'color-assertion':
        code += `    const element = await ${pageName}.$('${action.selector}');\n`;
        code += `    const color = await ${pageName}.evaluate(el => getComputedStyle(el).color, element);\n`;
        code += `    expect(color).toBe('${action.expectedColor}');\n\n`;
        break;
      case 'visible':
        code += `    await expect(${pageName}).toMatchElement('${action.selector}', {\n`;
        code += `    visible: true\n`;
        code += `    });\n\n`;
        break;
    }
  });

  code += "";
  
  console.log('✅ Code generation complete');
  return code;
}

function generatePlaywrightCode(pageName = 'page') {
  console.log(`⚙️ Starting Playwright code generation for ${pageName}`);
  
  let code = `async function testFn({ ${pageName} }: TestContext) {\n`;
  code += `  if (!${pageName}) {\n`;
  code += `    throw new Error('${pageName} not initialized');\n`;
  code += `  }\n\n`;
  
  recordedActions.forEach((action, index) => {
    console.log(`🔨 Processing action ${index + 1}/${recordedActions.length}:`, action);
    switch (action.type) {
      case 'click':
        if (action.selector.startsWith('text/')) {
          code += `  await ${pageName}.getByText('${action.selector.replace('text/', '')}', { exact: true }).waitFor({ state: 'visible' });\n`;
          code += `  await ${pageName}.getByText('${action.selector.replace('text/', '')}', { exact: true }).click();\n\n`;
        } else {
          code += `  await ${pageName}.locator('${action.selector}').waitFor({ state: 'visible' });\n`;
          code += `  await ${pageName}.locator('${action.selector}').click();\n\n`;
        }
        break;
      case 'type':
        code += `  await ${pageName}.locator('${action.selector}').waitFor({ state: 'visible' });\n`;
        code += `  await ${pageName}.locator('${action.selector}').fill('${action.value}');\n\n`;
        break;
      case 'select':
        code += `  await ${pageName}.locator('${action.selector}').waitFor({ state: 'visible' });\n`;
        code += `  await ${pageName}.locator('${action.selector}').selectOption('${action.value}');\n\n`;
        break;
      case 'assertion':
        code += `  await expect(${pageName}.getByText('${action.expectedText}', { exact: true })).toBeVisible();\n\n`;
        break;
      case 'visible':
        code += `  await expect(${pageName}.locator('${action.selector}')).toBeVisible();\n\n`;
        break;
    }
  });

  code += '}';
  
  console.log('✅ Code generation complete');
  return code;
} 