import axios from 'axios';
import fs from 'fs';
import path from 'path';

const EZEE_BASE_URL = 'https://live.ipms247.com/';
const EZEE_HOTEL_CODE = '46924';
const EZEE_API_KEY = '5295697129d7c0f7f5-13a2-11f1-9';

async function fetchRates(checkIn: string, checkOut: string, label: string) {
    const url = new URL('booking/reservation_api/listing.php', EZEE_BASE_URL);
    url.searchParams.set('request_type', 'RoomList');
    url.searchParams.set('HotelCode', EZEE_HOTEL_CODE);
    url.searchParams.set('APIKey', EZEE_API_KEY);
    url.searchParams.set('check_in_date', checkIn);
    url.searchParams.set('check_out_date', checkOut);
    url.searchParams.set('number_adults', '2');
    url.searchParams.set('number_children', '0');
    url.searchParams.set('num_rooms', '1');
    url.searchParams.set('language', 'en');
    url.searchParams.set('showtax', '0');
    url.searchParams.set('show_only_available_rooms', '0');
    url.searchParams.set('packagefor', 'DESKTOP');
    url.searchParams.set('promotionfor', 'DESKTOP');

    console.log(`Fetching ${label} rates for ${checkIn} to ${checkOut}...`);
    const response = await axios.get(url.toString());
    return response.data;
}

async function main() {
    try {
        // Weekday: Wednesday to Thursday (March 18-19, 2026)
        const weekdayData = await fetchRates('2026-03-18', '2026-03-19', 'WEEKDAY');
        
        // Weekend: Saturday to Sunday (March 21-22, 2026)
        const weekendData = await fetchRates('2026-03-21', '2026-03-22', 'WEEKEND');

        const result = {
            weekday: weekdayData,
            weekend: weekendData
        };

        const outputPath = path.join(__dirname, 'ezee_rates_comparison.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
        console.log(`Rates comparison saved to ${outputPath}`);

    } catch (error: any) {
        console.error('Error fetching rates:', error.message);
    }
}

main();
