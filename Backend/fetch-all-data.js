const https = require('https');
const fs = require('fs');

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
        check_in_date: '2026-03-05',
        check_out_date: '2026-03-07',
        num_nights: '',
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

// Make API request and save to JSON
function fetchAndSaveData() {
    const url = buildApiUrl();
    console.log('Fetching EZEE API data...');
    console.log('URL:', url);
    console.log('----------------------------------------');

    https.get(url, (res) => {
        console.log('Status Code:', res.statusCode);
        
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const jsonData = JSON.parse(data);
                
                // Create comprehensive data object
                const comprehensiveData = {
                    fetchInfo: {
                        timestamp: new Date().toISOString(),
                        url: url,
                        status: res.statusCode,
                        totalRooms: jsonData.length,
                        hotelCode: config.hotelCode,
                        currency: jsonData[0]?.currency_code || 'N/A'
                    },
                    apiResponse: jsonData,
                    summary: {
                        roomTypes: jsonData.map(room => ({
                            roomName: room.Room_Name,
                            roomType: room.Roomtype_Name,
                            maxAdults: room.max_adult_occupancy,
                            maxChildren: room.max_child_occupancy,
                            availableRooms: room.min_ava_rooms,
                            avgRatePerNight: room.room_rates_info?.avg_per_night_after_discount,
                            currency: room.currency_code,
                            totalPrice: room.room_rates_info?.totalprice_inclusive_all,
                            checkInTime: room.check_in_time,
                            checkOutTime: room.check_out_time,
                            amenities: room.RoomAmenities,
                            images: room.RoomImages?.length || 0,
                            hasImages: !!(room.RoomImages && room.RoomImages.length > 0)
                        }))
                    },
                    pricingSummary: {
                        rates: jsonData.map(room => ({
                            roomName: room.Room_Name,
                            avgRate: room.room_rates_info?.avg_per_night_after_discount,
                            totalPrice: room.room_rates_info?.totalprice_inclusive_all,
                            exclusiveTaxRates: room.room_rates_info?.exclusive_tax,
                            rackRate: room.room_rates_info?.rack_rate,
                            extraAdultRate: room.extra_adult_rates_info?.inclusive_tax_adjustment,
                            extraChildRate: room.extra_child_rates_info?.inclusive_tax_adjustment
                        }))
                    },
                    availabilitySummary: {
                        rooms: jsonData.map(room => ({
                            roomName: room.Room_Name,
                            availableRooms: room.available_rooms,
                            minAvailable: room.min_ava_rooms,
                            dates: Object.keys(room.available_rooms || {})
                        }))
                    }
                };

                // Save to JSON file
                const fileName = 'checkdata.json';
                fs.writeFileSync(fileName, JSON.stringify(comprehensiveData, null, 2), 'utf8');
                
                console.log('\n✅ Data successfully saved to', fileName);
                console.log('📊 Summary:');
                console.log('- Total Rooms:', jsonData.length);
                console.log('- Currency:', jsonData[0]?.currency_code || 'N/A');
                console.log('- Date Range:', '2026-03-05 to 2026-03-07');
                console.log('- File Size:', (fs.statSync(fileName).size / 1024).toFixed(2), 'KB');
                
                // Display sample data
                if (jsonData.length > 0) {
                    console.log('\n🏨 Sample Room Data:');
                    const firstRoom = jsonData[0];
                    console.log('- Room:', firstRoom.Room_Name);
                    console.log('- Type:', firstRoom.Roomtype_Name);
                    console.log('- Rate:', firstRoom.currency_code + ' ' + firstRoom.room_rates_info?.avg_per_night_after_discount);
                    console.log('- Available:', firstRoom.min_ava_rooms, 'rooms');
                    console.log('- Images:', firstRoom.RoomImages?.length || 0, 'images');
                }
                
            } catch (error) {
                console.error('❌ Error processing data:', error.message);
                console.log('Raw response:', data);
            }
        });
        
    }).on('error', (error) => {
        console.error('❌ Request Error:', error.message);
    });
}

// Run the fetch
fetchAndSaveData();
