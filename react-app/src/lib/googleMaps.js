/** Google Maps URLs for customer delivery locations. */

export function hasValidLocation(order) {
  const lat = Number(order?.location_lat);
  const lng = Number(order?.location_lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}

export function googleMapsViewUrl(lat, lng) {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export function googleMapsDirectionsUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function formatCoordinates(lat, lng, locale = 'en') {
  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) return '';
  return `${latNum.toFixed(5)}, ${lngNum.toFixed(5)}`;
}
