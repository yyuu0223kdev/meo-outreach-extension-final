import { filterChainBusinesses } from './chainFilter.js';

const API_KEY = 'AIzaSyC8XsWvgrPIF51MzdTFhRYqv8dObg8pboI';
const MAX_RESULTS = 20; // For testing, increase for production

export async function processLocation(location, radius, sheetId) {
  try {
    // Get businesses from Google Places API
    const businesses = await findLowRatedBusinesses(location, radius);
    
    // Filter out chain businesses
    const filteredBusinesses = await filterChainBusinesses(businesses);
    
    // Process each business
    for (const business of filteredBusinesses.slice(0, MAX_RESULTS)) {
      if (business.website) {
        await processBusinessWebsite(business, sheetId);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return { success: true, count: filteredBusinesses.length };
  } catch (error) {
    console.error('Error processing location:', error);
    return { success: false, error: error.message };
  }
}

async function findLowRatedBusinesses(location, radius) {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(location)}&radius=${radius * 1000}&key=${API_KEY}`;
  
  const response = await fetch(url);
  const data = await response.json();
  
  if (data.status !== 'OK') {
    throw new Error(`Places API error: ${data.status}`);
  }
  
  // Filter for low-rated businesses with few reviews
  return data.results.filter(place => 
    (place.rating && place.rating < 4.0) && 
    (place.user_ratings_total && place.user_ratings_total <= 50)
  );
}

async function processBusinessWebsite(business, sheetId) {
  return new Promise((resolve) => {
    // Create a new tab with the business website
    chrome.tabs.create({
      url: `${business.website}?businessName=${encodeURIComponent(business.name)}&mapUrl=${encodeURIComponent(`https://www.google.com/maps/place/?q=place_id:${business.place_id}`)}&sheetId=${sheetId}`,
      active: false
    }, (tab) => {
      // Inject content script when tab is loaded
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-script.js']
      }, () => {
        // Close the tab after some time
        setTimeout(() => {
          chrome.tabs.remove(tab.id);
          resolve();
        }, 10000);
      });
    });
  });
}