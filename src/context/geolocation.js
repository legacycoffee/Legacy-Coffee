export function getCurrentCoordinates() {
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Location access is not supported by this browser.'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({
        location_latitude: coords.latitude.toFixed(6),
        location_longitude: coords.longitude.toFixed(6),
      }),
      error => {
        const message = error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. You can enter your address manually.'
          : error.code === error.POSITION_UNAVAILABLE
            ? 'Your current location is unavailable. Please enter your address manually.'
            : 'Location request timed out. Please try again or enter your address manually.'
        reject(new Error(message))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  })
}
