// maps-parser.js
export class PlacesParser {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://maps.googleapis.com/maps/api/place';
  }

  async searchLocations(params) {
    const { location, radius, keyword } = params;
    const url = `${this.baseUrl}/textsearch/json?key=${this.apiKey}&location=${location}&radius=${radius}&keyword=${keyword}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Places API error: ${data.status}`);
      }
      
      const locations = [];
      
      for (const place of data.results) {
        if (place.rating < 4.0 && place.user_ratings_total <= 50) {
          const details = await this.getPlaceDetails(place.place_id);
          if (details) {
            locations.push({
              name: details.name,
              address: details.formatted_address,
              website: details.website,
              url: details.url,
              rating: details.rating,
              user_ratings_total: details.user_ratings_total,
              place_id: place.place_id
            });
          }
        }
      }
      
      return locations;
    } catch (error) {
      console.error('Error searching locations:', error);
      throw error;
    }
  }

  async getPlaceDetails(placeId) {
    const fields = 'name,formatted_address,website,url,rating,user_ratings_total';
    const url = `${this.baseUrl}/details/json?key=${this.apiKey}&place_id=${placeId}&fields=${fields}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        console.warn(`Details API error for ${placeId}: ${data.status}`);
        return null;
      }
      
      return data.result;
    } catch (error) {
      console.error(`Error getting details for ${placeId}:`, error);
      return null;
    }
  }
}