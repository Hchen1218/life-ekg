
import { getLongitude } from "../src/lib/city-coordinates";

const input = "江西省赣州市";
const lon = getLongitude(input);
console.log(`Input: ${input} -> Longitude: ${lon}`);

const input2 = "赣州市";
const lon2 = getLongitude(input2);
console.log(`Input: ${input2} -> Longitude: ${lon2}`);

// Test Math
const offset = (lon - 120) * 4;
console.log(`Offset minutes: ${offset}`);
