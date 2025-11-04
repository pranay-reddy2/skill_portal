import * as maptiler from "@maptiler/client";

maptiler.config.apiKey = import.meta.env.VITE_MAP_TILER_KEY;

export async function getCoordinatesFromAddress(address, countryCode) {
  if (!maptiler.geocoding) {
    console.error("MapTiler geocoding client is not properly initialized.");
    return null;
  }

  try {
    const options = {
      limit: 1,
    };

    if (countryCode) {
      options.country = countryCode;
    }

    const results = await maptiler.geocoding.forward(address, options);

    if (results.features && results.features.length > 0) {
      const geometry = results.features[0].geometry;
      return geometry;
    } else {
      console.error("No coordinates found for that address.");
      return null;
    }
  } catch (error) {
    console.error("Error geocoding the address:", error);
    return null;
  }
}