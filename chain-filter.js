// chain-filter.js
export class ChainFilter {
  constructor() {
    this.blacklist = [];
    this.brandThreshold = 3; // Number of same-brand locations to consider as chain
  }

  loadBlacklist(csvData) {
    this.blacklist = csvData.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'));
    console.log('Loaded blacklist with', this.blacklist.length, 'entries');
  }

  applyFilters(locations) {
    return locations.filter(location => {
      // Check blacklist
      if (this.isBlacklisted(location.name)) {
        return false;
      }
      
      // Check if this is part of a chain (implementation would need more context)
      // This is a simplified version - would need more sophisticated brand detection
      return true;
    });
  }

  isBlacklisted(name) {
    return this.blacklist.some(pattern => {
      try {
        const regex = new RegExp(pattern, 'i');
        return regex.test(name);
      } catch (e) {
        console.warn('Invalid blacklist pattern:', pattern);
        return false;
      }
    });
  }
}