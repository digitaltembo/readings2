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

const initalLocs = [
  {
    latitude: 52.5310214,
    longitude: -1.2649062,
    id: "England, UK, Europe",
    layout: "location",
  },
  {
    latitude: 54.7023545,
    longitude: -3.2765753,
    id: "UK, Europe",
    layout: "location",
  },
  {
    latitude: 51.0,
    longitude: 10.0,
    id: "Europe",
    layout: "location",
  },
  {
    latitude: 39.7837304,
    longitude: -100.445882,
    id: "USA, North America",
    layout: "location",
  },
  {
    latitude: 51.0000002,
    longitude: -109.0,
    id: "North America",
    layout: "location",
  },
  {
    latitude: 36.5748441,
    longitude: 139.2394179,
    id: "Japan, Asia",
    layout: "location",
  },
  {
    latitude: 51.2086975,
    longitude: 89.2343748,
    id: "Asia",
    layout: "location",
  },
  {
    latitude: 46.603354,
    longitude: 1.8883335,
    id: "France, Europe",
    layout: "location",
  },
  {
    latitude: 13.7524938,
    longitude: 100.4935089,
    id: "Bangkok, Thailand, Asia",
    layout: "location",
  },
  {
    latitude: 14.8971921,
    longitude: 100.83273,
    id: "Thailand, Asia",
    layout: "location",
  },
  {
    latitude: 64.6863136,
    longitude: 97.7453061,
    id: "Russia, Europe",
    layout: "location",
  },
  {
    latitude: 52.865196,
    longitude: -7.9794599,
    id: "Ireland, Europe",
    layout: "location",
  },
  {
    latitude: 43.1561681,
    longitude: -75.8449946,
    id: "NY, USA, North America",
    layout: "location",
  },
  {
    latitude: 38.9953683,
    longitude: 21.9877132,
    id: "Greece, Europe",
    layout: "location",
  },
  {
    latitude: 41.0091982,
    longitude: 28.9662187,
    id: "Istanbul, Turkey, Europe",
    layout: "location",
  },
  {
    latitude: 38.9597594,
    longitude: 34.9249653,
    id: "Turkey, Europe",
    layout: "location",
  },
  {
    latitude: 53.3493795,
    longitude: -6.2605593,
    id: "Dublin, Ireland, Europe",
    layout: "location",
  },
  {
    latitude: 61.0666922,
    longitude: -107.991707,
    id: "Canada, North America",
    layout: "location",
  },
  {
    latitude: 22.5726459,
    longitude: 88.3638953,
    id: "Kolkata, India, Asia",
    layout: "location",
  },
  {
    latitude: 22.3511148,
    longitude: 78.6677428,
    id: "India, Asia",
    layout: "location",
  },
  {
    latitude: 43.6166163,
    longitude: -116.200886,
    id: "Boise, Idaho, USA, North America",
    layout: "location",
  },
  {
    latitude: 43.6447642,
    longitude: -114.015407,
    id: "Idaho, USA, North America",
    layout: "location",
  },
  {
    latitude: 34.3519035,
    longitude: -89.4664677,
    id: "Lafayette County, MS, USA, North America",
    layout: "location",
  },
  {
    latitude: 32.9715285,
    longitude: -89.7348497,
    id: "MS, USA, North America",
    layout: "location",
  },
  {
    latitude: 52.215933,
    longitude: 19.134422,
    id: "Poland, Europe",
    layout: "location",
  },
  {
    latitude: 56.7861112,
    longitude: -4.1140518,
    id: "Scotland, UK, Europe",
    layout: "location",
  },
  {
    latitude: -41.5000831,
    longitude: 172.8344077,
    id: "New Zealand, Oceania",
    layout: "location",
  },
  {
    latitude: -12.7725835,
    longitude: 173.7741688,
    id: "Oceania",
    layout: "location",
  },
  {
    latitude: 40.7127281,
    longitude: -74.0060152,
    id: "New York City, NY, USA, North America",
    layout: "location",
  },
  {
    latitude: 51.1638175,
    longitude: 10.4478313,
    id: "Germany, Europe",
    layout: "location",
  },
  {
    latitude: 49.7439047,
    longitude: 15.3381061,
    id: "Czech Republic, Europe",
    layout: "location",
  },
  {
    latitude: 19.08157715,
    longitude: 72.88662753964906,
    id: "Mumbai, India, Asia",
    layout: "location",
  },
  {
    latitude: 59.6749712,
    longitude: 14.5208584,
    id: "Sweden, Europe",
    layout: "location",
  },
  {
    latitude: 44.4308975,
    longitude: -89.6884637,
    id: "Wisconsin, USA, North America",
    layout: "location",
  },
  {
    latitude: 35.000074,
    longitude: 104.999927,
    id: "China, Asia",
    layout: "location",
  },
  {
    latitude: 39.4225192,
    longitude: -111.714358,
    id: "Utah, USA, North America",
    layout: "location",
  },
  {
    latitude: 51.5073359,
    longitude: -0.12765,
    id: "London, England, UK, Europe",
    layout: "location",
  },
  {
    latitude: 35.6840574,
    longitude: 139.7744912,
    id: "Tokyo, Japan, Asia",
    layout: "location",
  },
  {
    latitude: 34.0536909,
    longitude: -118.242766,
    id: "Los Angeles, California, USA, North America",
    layout: "location",
  },
  {
    latitude: 36.7014631,
    longitude: -118.755997,
    id: "California, USA, North America",
    layout: "location",
  },
  {
    latitude: 4.099917,
    longitude: -72.9088133,
    id: "Colombia, South America",
    layout: "location",
  },
  {
    latitude: -21.0002179,
    longitude: -61.0006565,
    id: "South America",
    layout: "location",
  },
  {
    latitude: -34.9964963,
    longitude: -64.9672817,
    id: "Argentina, South America",
    layout: "location",
  },
  {
    latitude: 47.1817585,
    longitude: 19.5060937,
    id: "Hungary, Europe",
    layout: "location",
  },
  {
    latitude: -24.7761086,
    longitude: 134.755,
    id: "Australia, Oceania",
    layout: "location",
  },
  {
    id: "Wyoming, USA, North America",
    layout: "location",
  },
  {
    latitude: 55.9533456,
    longitude: -3.1883749,
    id: "Edinburgh, Scotland, UK, Europe",
    layout: "location",
  },
  {
    latitude: 42.6384261,
    longitude: 12.674297,
    id: "Italy, Europe",
    layout: "location",
  },
  {
    latitude: 50.0874654,
    longitude: 14.4212535,
    id: "Prague, Czech Republic, Europe",
    layout: "location",
  },
  {
    latitude: 10.7466905,
    longitude: -61.0840075,
    id: "Trinidad and Tobago, Central America",
    layout: "location",
  },
  {
    latitude: -30.29284845,
    longitude: 153.12561585745573,
    id: "Central America",
    layout: "location",
  },
  {
    latitude: 37.1232245,
    longitude: -78.4927721,
    id: "Virginia, USA, North America",
    layout: "location",
  },
  {
    latitude: -13.2687204,
    longitude: 33.9301963,
    id: "Malawi, Africa",
    layout: "location",
  },
  {
    latitude: 11.5024338,
    longitude: 17.7578122,
    id: "Africa",
    layout: "location",
  },
  {
    latitude: 9.6000359,
    longitude: 7.9999721,
    id: "Nigeria, Africa",
    layout: "location",
  },
  {
    latitude: 22.350627,
    longitude: 114.1849161,
    id: "Hong Kong, China, Asia",
    layout: "location",
  },
  {
    latitude: 36.638392,
    longitude: 127.6961188,
    id: "South Korea, Asia",
    layout: "location",
  },
  {
    latitude: 19.4326296,
    longitude: -99.1331785,
    id: "Mexico City, Mexico, Central America",
    layout: "location",
  },
  {
    latitude: 19.3452223,
    longitude: -99.1494231,
    id: "Mexico, Central America",
    layout: "location",
  },
  {
    id: "Seattle, Washington, USA, North America",
    layout: "location",
  },
  {
    id: "Washington, USA, North America",
    layout: "location",
  },
  {
    latitude: 19.5408338,
    longitude: -96.9146374,
    id: "Xalapa, Veracruz, Mexico, Central America",
    layout: "location",
  },
  {
    latitude: 18.80461935,
    longitude: -97.1846928065163,
    id: "Veracruz, Mexico, Central America",
    layout: "location",
  },
  {
    latitude: 38.7251776,
    longitude: -105.607716,
    id: "Colorado, USA, North America",
    layout: "location",
  },
  {
    latitude: 34.5708167,
    longitude: -105.993007,
    id: "New Mexico, USA, North America",
    layout: "location",
  },
  {
    latitude: 48.8534951,
    longitude: 2.3483915,
    id: "Paris, France, Europe",
    layout: "location",
  },
  {
    latitude: -26.205,
    longitude: 28.049722,
    id: "Johannesburg, South Africa, Africa",
    layout: "location",
  },
  {
    latitude: -28.8166236,
    longitude: 24.991639,
    id: "South Africa, Africa",
    layout: "location",
  },
  {
    latitude: 28.1083929,
    longitude: 84.0917139,
    id: "Nepal, Asia",
    layout: "location",
  },
  {
    latitude: -34.6075682,
    longitude: -58.4370894,
    id: "Buenos Aires, Argentina, South America",
    layout: "location",
  },
  {
    latitude: 19.0974031,
    longitude: -70.3028026,
    id: "Dominican Republic, Central America",
    layout: "location",
  },
  {
    latitude: 28.6138954,
    longitude: 77.2090057,
    id: "New Delhi, India, Asia",
    layout: "location",
  },
  {
    latitude: 45.1960403,
    longitude: -63.1653789,
    id: "Nova Scotia, Canada, North America",
    layout: "location",
  },
  {
    latitude: 44.5990718,
    longitude: -72.5002608,
    id: "VT, USA, North America",
    layout: "location",
  },
  {
    latitude: 48.1371079,
    longitude: 11.5753822,
    id: "Munich, Germany, Europe",
    layout: "location",
  },
  {
    latitude: -41.2887953,
    longitude: 174.7772114,
    id: "Wellington, New Zealand, Oceania",
    layout: "location",
  },
  {
    latitude: 41.5612048,
    longitude: -74.1884806,
    id: "Walden, MA, USA, North America",
    layout: "location",
  },
  {
    latitude: 42.3788774,
    longitude: -72.032366,
    id: "MA, USA, North America",
    layout: "location",
  },
  {
    latitude: 47.59397,
    longitude: 14.12456,
    id: "Austria, Europe",
    layout: "location",
  },
  {
    latitude: 36.7014631,
    longitude: -118.755997,
    id: "CA, USA, North America",
    layout: "location",
  },
  {
    latitude: 39.3260685,
    longitude: -4.8379791,
    id: "Spain, Europe",
    layout: "location",
  },
  {
    latitude: -10.3333333,
    longitude: -53.2,
    id: "Brazil, South America",
    layout: "location",
  },
  {
    latitude: 4.8417097,
    longitude: -58.6416891,
    id: "Guyana, South America",
    layout: "location",
  },
  {
    latitude: 45.709097,
    longitude: -68.8590201,
    id: "Maine, USA, North America",
    layout: "location",
  },
  {
    latitude: 14.6367927,
    longitude: -61.01582685063731,
    id: "Martinique, Central America",
    layout: "location",
  },
  {
    latitude: 8.0018709,
    longitude: -66.1109318,
    id: "Venezuela, South America",
    layout: "location",
  },
  {
    latitude: 40.6787196,
    longitude: -82.5827749,
    id: "Lexington, OH, USA, North America",
    layout: "location",
  },
  {
    latitude: 40.2253569,
    longitude: -82.6881395,
    id: "OH, USA, North America",
    layout: "location",
  },
  {
    latitude: 40.190632,
    longitude: 116.412144,
    id: "Beijing, China, Asia",
    layout: "location",
  },
  {
    latitude: 38.6268666,
    longitude: -90.159707,
    id: "East St. Louis, IL, USA, North America",
    layout: "location",
  },
  {
    latitude: 40.0796606,
    longitude: -89.4337288,
    id: "IL, USA, North America",
    layout: "location",
  },
  {
    latitude: 36.8002068,
    longitude: 10.1857757,
    id: "Tunis, Tunisia, Africa",
    layout: "location",
  },
  {
    latitude: 36.8002068,
    longitude: 10.1857757,
    id: "Tunisia, Africa",
    layout: "location",
  },
];
/**
 * Uses the Nominatum openstreetmaps API to geocode the location
 * @param {string} location
 * @returns {Promise<{latitude: number, longitude: number} | null>} location
 */
export async function locate(location) {
  if (CONTINENTS.includes(location)) {
    return Promise.resolve(null);
  }
  const alreadyFound = initalLocs.find(({ id }) => id === location);
  if (alreadyFound) {
    return { latitude: alreadyFound, longitude: alreadyFound };
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
