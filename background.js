import { processLocation } from './utils/api.js';
import { appendToSheet } from './utils/sheetsWriter.js';

let isRunning = false;
let currentProcess = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'startProcessing') {
    if (isRunning) {
      sendResponse({ status: 'error', message: 'Already running' });
      return;
    }

    isRunning = true;
    const { location, radius, sheetId } = request;
    
    currentProcess = processLocation(location, radius, sheetId)
      .finally(() => {
        isRunning = false;
        currentProcess = null;
      });

    sendResponse({ status: 'started' });
    return true;
  }

  if (request.action === 'stopProcessing') {
    if (!isRunning) {
      sendResponse({ status: 'error', message: 'Not running' });
      return;
    }
    
    // Implement cancellation logic if needed
    isRunning = false;
    sendResponse({ status: 'stopped' });
    return true;
  }

  if (request.action === 'getStatus') {
    sendResponse({ isRunning });
    return true;
  }
});

// Handle form submission results from content scripts
chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(async (msg) => {
    if (msg.type === 'formResult') {
      const { businessName, mapUrl, status } = msg;
      await appendToSheet({
        sheetId: msg.sheetId,
        data: [
          businessName,
          mapUrl,
          new Date().toISOString(),
          status
        ]
      });
      
      // Update UI
      chrome.action.setBadgeText({ text: isRunning ? 'ON' : '' });
    }
  });
});