console.log('🚀 Background Script Initialized');

// Track side panel state
let isSidePanelOpen = false;
let activeTabId = null;

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('📦 Extension installed/updated');
  // Initialize storage with empty recorded actions
  chrome.storage.local.set({ recordedActions: [] }, () => {
    console.log('💾 Storage initialized with empty recorded actions');
  });
  
  // Set up the side panel
  if (chrome.sidePanel) {
    console.log('🔧 Setting up side panel');
    chrome.sidePanel.setOptions({
      enabled: true,
      path: 'sidepanel.html'
    });
  }
});

// Track active tab changes
chrome.tabs.onActivated.addListener((activeInfo) => {
  console.log('📑 Active tab changed:', activeInfo.tabId);
  activeTabId = activeInfo.tabId;
});

// Handle tab updates (including refreshes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    console.log('📄 Page is refreshing/loading:', tabId);
    // Close side panel on refresh
    if (isSidePanelOpen && tabId === activeTabId) {
      console.log('🔄 Closing side panel due to page refresh');
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
      isSidePanelOpen = false;
      
      // Reset recording state
      chrome.tabs.sendMessage(tabId, {
        type: 'TOGGLE_RECORDING',
        isRecording: false
      }).catch(() => {
        // Content script might not be ready yet, which is fine
        console.log('⚠️ Content script not ready yet');
      });
    }
  }
});

// Handle tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    console.log('📑 Active tab closed:', tabId);
    activeTabId = null;
    isSidePanelOpen = false;
  }
});

// Get initial active tab
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    console.log('📑 Setting initial active tab:', tabs[0].id);
    activeTabId = tabs[0].id;
  }
});

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received in background script:', message);
  
  if (sender.tab) {
    // If message comes from a tab, update activeTabId
    activeTabId = sender.tab.id;
  } else {
    // Messages from side panel to content script
    if (message.type === 'TOGGLE_RECORDING' || message.type === 'ADD_ASSERTION_MODE') {
      console.log('🔄 Forwarding message to content script:', message);
      if (activeTabId) {
        chrome.tabs.sendMessage(activeTabId, message);
      } else {
        console.error('❌ No active tab found');
      }
    }
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('🖱️ Extension icon clicked');
  activeTabId = tab.id;
  
  // Toggle side panel
  if (isSidePanelOpen) {
    console.log('🔄 Closing side panel');
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
    isSidePanelOpen = false;
  } else {
    console.log('🔄 Opening side panel');
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    isSidePanelOpen = true;
  }
}); 