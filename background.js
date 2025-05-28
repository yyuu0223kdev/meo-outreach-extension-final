// background.js
import { PlacesParser } from './maps-parser.js';
import { SheetsWriter } from './sheets-writer.js';
import { ChainFilter } from './chain-filter.js';

const API_KEY = 'AIzaSyC8XsWvgrPIF51MzdTFhRYqv8dObg8pboI';
const SPREADSHEET_ID = '1dseddAwr2AiYPFhadMkAOPcpBWG1UyTrBHFsqobiYK0';
const RATE_LIMIT = 1000; // 1 request per second
const BLACKLIST_URL = chrome.runtime.getURL('data/blacklist.csv');

let isRunning = false;
let currentTabId = null;
let processedCount = 0;
let sentCount = 0;
let skippedCount = 0;
let errorCount = 0;

const status = {
  RUNNING: 'running',
  STOPPED: 'stopped',
  PAUSED: 'paused'
};

let currentStatus = status.STOPPED;

// Initialize modules
const placesParser = new PlacesParser(API_KEY);
const sheetsWriter = new SheetsWriter(SPREADSHEET_ID);
const chainFilter = new ChainFilter();

// Load blacklist data
fetch(BLACKLIST_URL)
  .then(response => response.text())
  .then(data => chainFilter.loadBlacklist(data))
  .catch(err => console.error('Failed to load blacklist:', err));

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.command) {
    case 'start':
      if (currentStatus !== status.RUNNING) {
        startProcessing(request.params);
        sendResponse({ status: 'started' });
      }
      break;
    case 'stop':
      stopProcessing();
      sendResponse({ status: 'stopped' });
      break;
    case 'getStatus':
      sendResponse({
        status: currentStatus,
        stats: {
          processed: processedCount,
          sent: sentCount,
          skipped: skippedCount,
          errors: errorCount
        }
      });
      break;
    case 'formResult':
      handleFormResult(request.data);
      sendResponse({ status: 'received' });
      break;
    default:
      sendResponse({ status: 'unknown_command' });
  }
  return true;
});

async function startProcessing(params) {
  currentStatus = status.RUNNING;
  processedCount = 0;
  sentCount = 0;
  skippedCount = 0;
  errorCount = 0;
  
  try {
    const locations = await placesParser.searchLocations(params);
    const filteredLocations = chainFilter.applyFilters(locations);
    
    for (const location of filteredLocations) {
      if (currentStatus !== status.RUNNING) break;
      
      await processLocation(location);
      await new Promise(resolve => setTimeout(resolve, RATE_LIMIT));
    }
  } catch (error) {
    console.error('Processing error:', error);
    chrome.action.setBadgeText({ text: 'ERR' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  } finally {
    currentStatus = status.STOPPED;
  }
}

async function processLocation(location) {
  if (!location.website) {
    await recordResult(location, 'NOFORM');
    return;
  }

  try {
    const tab = await chrome.tabs.create({ 
      url: location.website,
      active: false 
    });
    currentTabId = tab.id;
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-script.js']
    });
    
    // Wait for result from content script
    const result = await new Promise(resolve => {
      const listener = (request, sender) => {
        if (sender.tab.id === tab.id && request.type === 'formResult') {
          chrome.runtime.onMessage.removeListener(listener);
          resolve(request.data);
        }
      };
      chrome.runtime.onMessage.addListener(listener);
    });
    
    await recordResult(location, result.status);
    
  } catch (error) {
    console.error(`Error processing ${location.name}:`, error);
    await recordResult(location, 'ERROR');
  } finally {
    if (currentTabId) {
      await chrome.tabs.remove(currentTabId);
      currentTabId = null;
    }
  }
}

async function recordResult(location, resultStatus) {
  processedCount++;
  
  switch (resultStatus) {
    case 'SENT': sentCount++; break;
    case 'SKIPPED': skippedCount++; break;
    case 'ERROR': errorCount++; break;
  }
  
  const rowData = [
    location.name,
    location.url,
    new Date().toISOString(),
    resultStatus
  ];
  
  try {
    await sheetsWriter.appendRow(rowData);
  } catch (error) {
    console.error('Failed to write to sheet:', error);
    // Fallback to local storage if Sheets API fails
    chrome.storage.local.get({ failedWrites: [] }, (data) => {
      const failedWrites = data.failedWrites;
      failedWrites.push(rowData);
      chrome.storage.local.set({ failedWrites });
    });
  }
  
  updateBadge();
}

function updateBadge() {
  chrome.action.setBadgeText({ text: processedCount.toString() });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
}

function stopProcessing() {
  currentStatus = status.STOPPED;
  if (currentTabId) {
    chrome.tabs.remove(currentTabId);
    currentTabId = null;
  }
}

function handleFormResult(data) {
  // Additional processing if needed
}