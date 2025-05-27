const SPREADSHEET_ID = '1dseddAwr2AiYPFhadMkAOPcpBWG1UyTrBHFsqobiYK0';
const SPREADSHEET_RANGE = 'Sheet1!A:D';

export async function appendToSheet({ data }) {
  try {
    // Get auth token
    const token = await new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
    
    // Prepare request
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SPREADSHEET_RANGE}:append?valueInputOption=USER_ENTERED`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        range: SPREADSHEET_RANGE,
        majorDimension: 'ROWS',
        values: [data]
      })
    });
    
    if (!response.ok) {
      throw new Error(`Sheets API error: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error writing to sheet:', error);
    return false;
  }
}