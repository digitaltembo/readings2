import https from "https";

// Nominatim doesn't like addresses that end in the continent, so let's filter those out from addresses
const CONTINENTS = [
  "North America",
  "South America",
  "Europe",
  "Africa",
  "Asia",
  "Oceania",
  "Central America",
];

const EMAIL = "nolanhhawkins+nominatum@gmail.com";
const NOMINATUM_SLEEP_MS = 1000;

/**
 * Uses the Nominatum openstreetmaps API to geocode the location
 * @param {string} location
 * @returns {Promise<{latitude: number, longitude: number} | null>} location
 */
export async function locate(location) {
  if (CONTINENTS.includes(location)) {
    return Promise.resolve(null);
  }
  console.log(`Locating ${location}`);
  const parts = location.split(", ");
  const lookup = CONTINENTS.includes(parts[parts.length - 1])
    ? parts.slice(0, -1).join(", ")
    : location;

  const coords = await new Promise((resolve) => {
    https.get(
      `https://nominatim.openstreetmap.org/search?email=${EMAIL}&format=json&q=${lookup}`,
      { headers: { "user-agent": `jekyll-maps.rb/${EMAIL}` } },
      (res) => {
        res.setEncoding("utf8");
        let responseText = "";
        res.on("data", (chunk) => {
          responseText += chunk;
        });
        res.on("end", () => {
          const responseJson = JSON.parse(responseText);
          if (
            responseJson &&
            responseJson[0] &&
            responseJson[0].lat &&
            responseJson[0].lon
          ) {
            resolve({
              latitude: responseJson[0].lat,
              longitude: responseJson[0].lon,
            });
          } else {
            console.warn("Couldn't locate", location);
            resolve(null);
          }
        });
        res.on("error", () => resolve(null));
      }
    );
  });

  await new Promise((resolve) => setTimeout(resolve, NOMINATUM_SLEEP_MS));
  return coords;
}
