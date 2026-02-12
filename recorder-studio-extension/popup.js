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
  const runBtn = document.getElementById('runBtn');

  const clearBtn = document.getElementById('clearBtn');
  const assertTextBtn = document.getElementById('assertTextBtn');
  const assertColorBtn = document.getElementById('assertColorBtn');
  const assertBgColorBtn = document.getElementById('assertBgColorBtn');
  const addCommentBtn = document.getElementById('addCommentBtn');
  const commentInput = document.getElementById('commentInput');
  const commentInputRow = document.getElementById('commentInputRow');
  const addWaitBtn = document.getElementById('addWaitBtn');
  const waitInput = document.getElementById('waitInput');
  const waitInputRow = document.getElementById('waitInputRow');
  const recordingStatus = document.getElementById('recordingStatus');
  const actionCount = document.getElementById('actionCount');

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

  assertBgColorBtn.addEventListener('click', () => {
    console.log('🎯 Entering background color assertion mode');
    chrome.runtime.sendMessage({
      type: 'ADD_ASSERTION_MODE',
      assertionType: 'background-color'
    });
  });

  // Toggle comment input field when Add Comment button is clicked
  addCommentBtn.addEventListener('click', () => {
    // Hide wait input if it's open
    if (!waitInputRow.classList.contains('hidden')) {
      waitInputRow.classList.add('hidden');
      addWaitBtn.textContent = 'Active Wait';
    }
    
    if (commentInputRow.classList.contains('hidden')) {
      // Show the input field
      commentInputRow.classList.remove('hidden');
      commentInput.focus();
      addCommentBtn.textContent = 'Cancel';
    } else {
      // Hide the input field
      commentInputRow.classList.add('hidden');
      commentInput.value = '';
      addCommentBtn.textContent = 'Add Comment';
    }
  });
  
  // Toggle wait input field when Add Wait button is clicked
  addWaitBtn.addEventListener('click', () => {
    // Hide comment input if it's open
    if (!commentInputRow.classList.contains('hidden')) {
      commentInputRow.classList.add('hidden');
      addCommentBtn.textContent = 'Add Comment';
    }
    
    if (waitInputRow.classList.contains('hidden')) {
      // Show the input field
      waitInputRow.classList.remove('hidden');
      waitInput.focus();
      addWaitBtn.textContent = 'Cancel';
    } else {
      // Hide the input field
      waitInputRow.classList.add('hidden');
      addWaitBtn.textContent = 'Active Wait';
    }
  });
  
  // Handle Enter key in comment input
  commentInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      addCommentAction();
      // Hide the input row after adding comment
      commentInputRow.classList.add('hidden');
      addCommentBtn.textContent = 'Add Comment';
    }
  });
  
  // Handle Enter key in wait input
  waitInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
      addWaitAction();
      // Hide the input row after adding wait
      waitInputRow.classList.add('hidden');
      addWaitBtn.textContent = 'Active Wait';
    }
  });

  generateBtn.addEventListener('click', () => {
    console.log('⚙️ Opening code viewer');
    
    // Pass recorded actions to code viewer
    const encodedActions = encodeURIComponent(JSON.stringify(recordedActions));
    const viewerUrl = chrome.runtime.getURL('code-viewer.html');
    chrome.tabs.create({ 
      url: `${viewerUrl}?actions=${encodedActions}`
    });
  });

  runBtn.addEventListener('click', async () => {
    if (!recordedActions?.length) {
      alert('No actions recorded yet.');
      return;
    }

    // If recording is on, pause it for replay stability.
    if (isRecording) {
      isRecording = false;
      resetUIState();
      chrome.runtime.sendMessage({ type: 'TOGGLE_RECORDING', isRecording: false });
    }

    const prevText = runBtn.textContent;
    runBtn.disabled = true;
    runBtn.textContent = 'Running...';

    try {
      if (!window.RecorderStudioCdp?.runReplay) {
        throw new Error('CDP helper not loaded. Missing src/cdp.js?');
      }
      await window.RecorderStudioCdp.runReplay(recordedActions);
      console.log('✅ Replay complete');
    } catch (err) {
      console.error('❌ Replay failed', err);
      alert(`Run failed: ${err?.message || String(err)}`);
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = prevText;
    }
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


// Function to add a comment action
function addCommentAction() {
  const commentInput = document.getElementById('commentInput');
  const commentText = commentInput.value.trim();
  
  if (commentText) {
    console.log('📝 Adding comment checkpoint:', commentText);
    
    const commentAction = {
      type: 'comment',
      description: commentText,
      timestamp: new Date().toISOString()
    };
    
    recordedActions.push(commentAction);
    chrome.storage.local.set({ recordedActions });
    updateActionList();
    
    // Clear the input after adding
    commentInput.value = '';
  }
}


// Function to add a wait action
function addWaitAction() {
  const waitInput = document.getElementById('waitInput');
  const waitTime = parseInt(waitInput.value);
  
  if (waitTime > 0) {
    console.log('⏱️ Adding wait action:', waitTime, 'seconds');
    
    const waitAction = {
      type: 'wait',
      duration: waitTime,
      description: `${waitTime} second${waitTime === 1 ? '' : 's'}`,
      timestamp: new Date().toISOString()
    };
    
    recordedActions.push(waitAction);
    chrome.storage.local.set({ recordedActions });
    updateActionList();
  }
}


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
    
    // Set appropriate class based on action type
    if (action.type === 'comment') {
      $actionItem.className = 'action-item comment';
    } else if (action.type === 'wait') {
      $actionItem.className = 'action-item wait';
    } else {
      $actionItem.className = 'action-item';
    }
    
    // Make the item draggable
    $actionItem.draggable = true;
    $actionItem.setAttribute('data-index', index);
    
    // Different rendering for special action types
    if (action.type === 'comment') {
      $actionItem.innerHTML = `
        <div>
          <span class="drag-handle">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
          </span>
          <span class="type">//</span>
          <span class="description">${action.description}</span>
        </div>
        <span class="delete-action" data-index="${index}">x</span>
      `;
    } else if (action.type === 'wait') {
      $actionItem.innerHTML = `
        <div>
          <span class="drag-handle">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
            </svg>
          </span>
          <span class="type">Wait</span>
          <span class="description">${action.description}</span>
        </div>
        <span class="delete-action" data-index="${index}">x</span>
      `;
    } else {
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
    }
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
  
  // Scroll to the bottom of the action list
  $actionList.scrollTop = $actionList.scrollHeight;
}