import * as Location from 'expo-location';

// Request high-accuracy GPS location (not IP-based)
export async function getGPSLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  const loc = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });
  return loc.coords;
}

// Reverse geocode using OpenStreetMap Nominatim (free, no API key)
export async function reverseGeocode(latitude, longitude) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
      { headers: { 'User-Agent': 'CrimeAlertApp/1.0' } }
    );
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      const parts = [
        a.road || a.pedestrian || a.footway || '',
        a.suburb || a.neighbourhood || a.hamlet || '',
        a.city || a.town || a.village || a.municipality || '',
        a.state || a.county || '',
        a.country || '',
      ].filter(Boolean);
      return {
        shortAddress: parts.slice(0, 3).join(', '),
        fullAddress: data.display_name,
        area: a.suburb || a.neighbourhood || a.city || a.town || a.village || '',
        city: a.city || a.town || a.village || a.municipality || '',
        country: a.country || '',
      };
    }
  } catch {
    // fallback to expo geocoding
  }

  // Fallback to expo-location reverse geocoding
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (place) {
      return {
        shortAddress: [place.street, place.city, place.region].filter(Boolean).join(', '),
        fullAddress: [place.street, place.city, place.region, place.country].filter(Boolean).join(', '),
        area: place.district || place.subregion || place.city || '',
        city: place.city || '',
        country: place.country || '',
      };
    }
  } catch {
    // ignore
  }

  return null;
}

// Generate a static Google Maps image URL for map previews
export function getMapPreviewUrl(latitude, longitude, zoom = 15, width = 600, height = 300) {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${latitude},${longitude}&key=`;
}

// Generate an OpenStreetMap embed URL (free, no API key needed)
export function getMapEmbedUrl(latitude, longitude, zoom = 16) {
  return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005},${latitude - 0.005},${longitude + 0.005},${latitude + 0.005}&layer=mapnik&marker=${latitude},${longitude}`;
}

// Generate a link to open in Google Maps
export function getGoogleMapsLink(latitude, longitude) {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}
