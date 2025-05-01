// This file will contain utilities related to TomTom Maps API

// TomTom API key from environment variables
export const TOMTOM_API_KEY = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || "";

/**
 * Reverse geocode coordinates into an address string
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Promise with the formatted address or null
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<string | null> {
  if (!TOMTOM_API_KEY) {
    console.error("TomTom API key is not configured.");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.json?key=${TOMTOM_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    if (
      data.addresses &&
      data.addresses.length > 0 &&
      data.addresses[0].address
    ) {
      const address = data.addresses[0].address;

      // Format the address string
      const parts = [];
      if (address.streetNumber) parts.push(address.streetNumber);
      if (address.streetName) parts.push(address.streetName);
      if (address.municipalitySubdivision)
        parts.push(address.municipalitySubdivision);
      if (address.municipality) parts.push(address.municipality);
      if (address.countrySubdivision) parts.push(address.countrySubdivision);
      if (address.postalCode) parts.push(address.postalCode);

      return parts.join(", ");
    }

    return null;
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    return null;
  }
}

/**
 * Calculate the distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon1 - lon2);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

/**
 * Convert degrees to radians
 * @param deg Angle in degrees
 * @returns Angle in radians
 */
export function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
