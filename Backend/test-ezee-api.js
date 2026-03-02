const https = require('https');

// EZEE API Configuration
const config = {
    baseUrl: 'https://live.ipms247.com/',
    hotelCode: '46924',
    apiKey: '5295697129d7c0f7f5-13a2-11f1-9'
};

// Build the API URL with required parameters
function buildApiUrl() {
    const params = new URLSearchParams({
        request_type: 'RoomList',
        HotelCode: config.hotelCode,
        APIKey: config.apiKey,
        check_in_date: '2026-03-05', // Using a future date (current date is 2026-03-02)
        check_out_date: '2026-03-07',
        num_nights: '', // Remove num_nights when check_out_date is provided
        number_adults: '1',
        number_children: '0',
        num_rooms: '1',
        promotion_code: '',
        property_configuration_info: '0',
        showtax: '0',
        show_only_available_rooms: '0',
        language: 'en',
        roomtypeunkid: '',
        packagefor: 'DESKTOP',
        promotionfor: 'DESKTOP'
    });

    return `${config.baseUrl}booking/reservation_api/listing.php?${params.toString()}`;
}

// Make API request
function testEzeeAPI() {
    const url = buildApiUrl();
    console.log('Testing EZEE API...');
    console.log('URL:', url);
    console.log('----------------------------------------');

    https.get(url, (res) => {
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', res.headers);
        console.log('----------------------------------------');

        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                console.log('API Response:');
                console.log(JSON.stringify(jsonData, null, 2));
                
                if (Array.isArray(jsonData) && jsonData.length > 0) {
                    const firstItem = jsonData[0];
                    
                    // Check if it's an error response
                    if (firstItem.Error_Details) {
                        console.log('\n❌ API Error Received:');
                        console.log('- Error Code:', firstItem.Error_Details.Error_Code);
                        console.log('- Error Message:', firstItem.Error_Details.Error_Message);
                        
                        // Provide specific guidance based on error code
                        switch(firstItem.Error_Details.Error_Code) {
                            case 'NORESACC':
                                console.log('\n💡 Solution:');
                                console.log('1. Contact EZEE support to enable Reservation Account');
                                console.log('2. Verify your Hotel Code and API Key are correct');
                                console.log('3. Check if your property is active in the system');
                                break;
                            case 'APIACCESSDENIED':
                                console.log('\n💡 Solution:');
                                console.log('1. Verify API Key is correct');
                                console.log('2. Contact support to enable API access');
                                break;
                            case 'HotelCodeEmpty':
                                console.log('\n💡 Solution: Hotel Code is missing or empty');
                                break;
                            default:
                                console.log('\n💡 Check API documentation for this error code');
                        }
                        return;
                    }
                    
                    // Success case - room data
                    console.log('\n✅ Success! Found', jsonData.length, 'room(s)');
                    console.log('Sample room data:');
                    const firstRoom = firstItem;
                    console.log('- Room Name:', firstRoom.Room_Name);
                    console.log('- Room Type:', firstRoom.Roomtype_Name);
                    console.log('- Currency:', firstRoom.currency_code, firstRoom.currency_sign);
                    console.log('- Available Rooms:', firstRoom.min_ava_rooms);
                    if (firstRoom.room_rates_info) {
                        console.log('- Average Rate/Night:', firstRoom.room_rates_info.avg_per_night_after_discount);
                    }
                } else {
                    console.log('\n⚠️  No rooms found or empty response');
                }
            } catch (error) {
                console.log('Raw Response:');
                console.log(data);
                console.log('\n❌ JSON Parse Error:', error.message);
            }
        });
        
    }).on('error', (error) => {
        console.error('❌ Request Error:', error.message);
    });
}

// Run the test
testEzeeAPI();
