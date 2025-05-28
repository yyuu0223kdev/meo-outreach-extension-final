// popup.js
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const locationInput = document.getElementById('location');
  const radiusInput = document.getElementById('radius');
  const keywordInput = document.getElementById('keyword');
  const processedCount = document.getElementById('processedCount');
  const sentCount = document.getElementById('sentCount');
  const skippedCount = document.getElementById('skippedCount');
  const errorCount = document.getElementById('errorCount');
  const progressBar = document.getElementById('progressBar');

  let updateInterval;
  
  // Load saved settings
  chrome.storage.sync.get(['location', 'radius', 'keyword'], (data) => {
    if (data.location) locationInput.value = data.location;
    if (data.radius) radiusInput.value = data.radius;
    if (data.keyword) keywordInput.value = data.keyword;
  });
  
  startBtn.addEventListener('click', () => {
    const params = {
      location: locationInput.value,
      radius: radiusInput.value,
      keyword: keywordInput.value
    };
    
    // Save settings
    chrome.storage.sync.set({
      location: params.location,
      radius: params.radius,
      keyword: params.keyword
    });
    
    chrome.runtime.sendMessage({ command: 'start', params });
    startBtn.disabled = true;
    stopBtn.disabled = false;
    
    // Start status updates
    updateStatus();
    updateInterval = setInterval(updateStatus, 1000);
  });
  
  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ command: 'stop' });
    stopBtn.disabled = true;
    clearInterval(updateInterval);
  });
  
  function updateStatus() {
    chrome.runtime.sendMessage({ command: 'getStatus' }, (response) => {
      if (!response) return;
      
      processedCount.textContent = response.stats.processed;
      sentCount.textContent = response.stats.sent;
      skippedCount.textContent = response.stats.skipped;
      errorCount.textContent = response.stats.errors;
      
      const total = response.stats.processed;
      const success = response.stats.sent;
      progressBar.style.width = total > 0 ? `${(success / total) * 100}%` : '0%';
      
      if (response.status === 'stopped') {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        clearInterval(updateInterval);
      }
    });
  }
});