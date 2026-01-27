
import { Solar } from 'lunar-javascript';

// Dec 18 2000
const solar = Solar.fromYmdHms(2000, 12, 18, 7, 20, 0);
console.log(`Date: ${solar.toFullString()}`);

// Check if Lunar has built-in True Solar Time support
// Usually libraries have something like 'useLongitude'
console.log("Checking for API methods...");
// I will inspect keys of Solar and Lunar in my mind or documentation
// But for now, let's see if I can find a way to get True Solar Time via the library.

// According to docs (searched mentally), lunar-javascript supports True Solar Time via:
// Lunar.fromSolar(solar).getEightChar().setSect(2) -> this is for Zi hour.

// Is there a helper?
try {
    // @ts-ignore
    const j = solar.getJulianDay();
    console.log("Julian Day:", j);
    
    // Some libraries have SolarUtil.getEquationOfTime(julianDay)
    // Let's try to import SolarUtil
} catch (e) {
    console.log(e);
}
