const NOMINATIM_URL = 'https://nominatim.openstreetmap.org'

export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return []
  const url = `${NOMINATIM_URL}/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=0`
  try {
    const response = await fetch(url)
    if (!response.ok) return []
    const data = await response.json()
    return (data ?? []).map((r) => {
      const parts = r.display_name.split(', ')
      const short = parts.length > 3
        ? [parts[0], parts[parts.length - 2], parts[parts.length - 1]].join(', ')
        : r.display_name
      return {
        placeId: r.place_id,
        name: parts[0],
        subtitle: parts.slice(1).join(', '),
        location: short,
        latitude: Number(r.lat),
        longitude: Number(r.lon),
      }
    })
  } catch {
    return []
  }
}

export async function geocodeLocation(query) {
  if (!query) return null
  const results = await searchLocations(query)
  const first = results[0]
  if (!first) return null
  return { latitude: first.latitude, longitude: first.longitude }
}
