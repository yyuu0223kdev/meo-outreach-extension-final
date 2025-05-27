document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const progressText = document.getElementById('progressText');
  const progressBar = document.getElementById('progressBar');
  const sentCount = document.getElementById('sentCount');
  const skippedCount = document.getElementById('skippedCount');
  const errorCount = document.getElementById('errorCount');
  
  let stats = {
    sent: 0,
    skipped: 0,
    error: 0
  };
  
  // Load saved settings
  chrome.storage.sync.get(['location', 'radius'], function(data) {
    if (data.location) document.getElementById('location').value = data.location;
    if (data.radius) document.getElementById('radius').value = data.radius;
  });
  
  // Check current status
  checkStatus();
  
  // Start button click handler
  startBtn.addEventListener('click', function() {
    const location = document.getElementById('location').value.trim();
    const radius = document.getElementById('radius').value;
    
    if (!location || !radius) {
      progressText.textContent = 'すべてのフィールドを入力してください';
      return;
    }
    
    // Save settings
    chrome.storage.sync.set({
      location,
      radius,
    });
    
    // Start processing
    chrome.runtime.sendMessage({
      action: 'startProcessing',
      location,
      radius,
    }, function(response) {
      if (response.status === 'started') {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        progressText.textContent = '処理を開始しました...';
      } else {
        progressText.textContent = 'エラー: ' + response.message;
      }
    });
  });
  
  // Stop button click handler
  stopBtn.addEventListener('click', function() {
    chrome.runtime.sendMessage({ action: 'stopProcessing' }, function(response) {
      if (response.status === 'stopped') {
        startBtn.disabled = false;
        stopBtn.disabled = true;
        progressText.textContent = '処理が停止されました';
      }
    });
  });
  
  // Listen for updates from background
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.update) {
      updateStats(request.update);
    }
  });
  
  // Update stats display
  function updateStats(update) {
    if (update.sent) stats.sent += update.sent;
    if (update.skipped) stats.skipped += update.skipped;
    if (update.error) stats.error += update.error;
    
    sentCount.textContent = stats.sent;
    skippedCount.textContent = stats.skipped;
    errorCount.textContent = stats.error;
    
    const total = stats.sent + stats.skipped + stats.error;
    if (total > 0) {
      progressBar.value = (stats.sent / total) * 100;
    }
  }
  
  // Check current processing status
  function checkStatus() {
    chrome.runtime.sendMessage({ action: 'getStatus' }, function(response) {
      if (response.isRunning) {
        startBtn.disabled = true;
        stopBtn.disabled = false;
        progressText.textContent = '処理中...';
      } else {
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }
    });
  }
});