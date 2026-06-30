
const BENGALURU_CENTER = [77.641151, 12.971891];
const geocodeAddress = async (address) => {
  if (!address || !process.env.MAPBOX_ACCESS_TOKEN) {
    return BENGALURU_CENTER;
  }

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?limit=1&access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      // Mapbox returns coordinates as [lng, lat] — matches MongoDB GeoJSON format directly
      return data.features[0].geometry.coordinates;
    }

    console.warn(`⚠️ [Mapbox Geocoder] No results for address: "${address}". Using Bengaluru center.`);
    return BENGALURU_CENTER;
  } catch (err) {
    console.warn(`⚠️ [Mapbox Geocoder] Request failed for "${address}": ${err.message}. Using Bengaluru center.`);
    return BENGALURU_CENTER;
  }
};

module.exports = { geocodeAddress, BENGALURU_CENTER };
