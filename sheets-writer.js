// sheets-writer.js
export class SheetsWriter {
  constructor(spreadsheetId) {
    this.spreadsheetId = spreadsheetId;
    this.range = 'Sheet1!A:D';
  }

  async appendRow(rowData) {
    try {
      const token = await this.getAuthToken();
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.spreadsheetId}/values/${this.range}:append?valueInputOption=USER_ENTERED`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [rowData],
          majorDimension: 'ROWS'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Sheets API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error writing to sheet:', error);
      throw error;
    }
  }

  async getAuthToken() {
    return new Promise((resolve, reject) => {
      chrome.identity.getAuthToken({ interactive: true }, (token) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(token);
        }
      });
    });
  }
}