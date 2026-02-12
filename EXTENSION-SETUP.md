# Recorder Studio Extension - Installation Guide

## Overview

**Recorder Studio** is a Chrome browser extension that records user actions and generates Puppeteer test code automatically. This extension helps developers create automated tests by recording interactions with web pages.

---

## Installation Methods

1. Open Chrome and navigate to:
   ```
   chrome://extensions/
   ```

2. Enable **Developer mode** (toggle switch in top-right corner)

3. Click **"Load unpacked"** button

4. Navigate to and select the extension directory:
   ```
   /path/to/puppeteer-workspace/recorder-studio-extension
   ```

5. The extension should now appear in your extensions list!

---

## Verification

After installation, verify the extension is working:

1. ✅ The Recorder Studio icon should appear in your browser toolbar
2. ✅ Click the icon or use the keyboard shortcut (Command+Shift+Y / Ctrl+Shift+Y)
3. ✅ The side panel should open showing the recording interface
4. ✅ You should see "Start Recording" button

---

## Usage Guide

### Starting a Recording

1. **Open the extension** by clicking the icon or pressing `Command+Shift+Y` (Mac) / `Ctrl+Shift+Y` (Windows/Linux)

2. **Navigate to the website** you want to record

3. **Click "Start Recording"** in the side panel

4. **Perform actions** on the webpage:
   - Click buttons, links, and elements
   - Type into input fields
   - Navigate between pages
   - All actions will be recorded automatically

5. **Click "Stop Recording"** when finished

6. **View the generated code** in the side panel

### Working with Generated Code

- **Copy to Clipboard**: Click the "Copy" button to copy the Puppeteer code
- **View Details**: The code viewer shows the complete Puppeteer script
- **Export**: Save recordings for later use

---

## Keyboard Shortcuts

| Action | Mac | Windows/Linux |
|--------|-----|---------------|
| Toggle Extension | `Command+Shift+Y` | `Ctrl+Shift+Y` |

---

## Extension Structure

```
recorder-studio-extension/
├── manifest.json          # Extension configuration
├── background.js          # Background service worker
├── content.js             # Content script (injected into pages)
├── popup.js               # Extension popup logic
├── popup.css              # Popup styling
├── sidepanel.html         # Side panel interface
├── code-viewer.html       # Code viewer interface
├── code-viewer.js         # Code viewer logic
```

---

## Development

### Modifying the Extension

If you make changes to the extension code:

1. Edit the files in `recorder-studio-extension/`
2. Go to `chrome://extensions/` or `edge://extensions/`
3. Click the **refresh icon** (🔄) on the Recorder Studio extension card
4. Test your changes

### Debugging

- **Background Script**: Click "Inspect views: service worker" on extension card
- **Content Script**: Open browser DevTools (F12) on any webpage
- **Side Panel**: Right-click side panel and select "Inspect"

---

## Permissions

The extension requires the following permissions:

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access current tab for recording |
| `scripting` | Inject content scripts into pages |
| `storage` | Save recordings and settings |
| `sidePanel` | Display side panel interface |
| `tabs` | Manage browser tabs |

---

**Note**: This extension uses Manifest V3 and requires modern Chromium browsers.

---

## Uninstallation

To remove the extension:

1. Go to `chrome://extensions/` or `edge://extensions/`
2. Find "Recorder Studio"
3. Click **"Remove"**
4. Confirm removal

---

## Support

For issues or questions:

1. Check the Troubleshooting section above
2. Review browser console for errors
3. Verify extension files are intact with `./install-extension.sh`

---

## License

This extension is part of the Puppeteer Workspace project.

---

**Last Updated**: February 2026
