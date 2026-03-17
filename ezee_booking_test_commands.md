# eZee Booking API Testing Commands

## Test ConfiguredPGList (Payment Gateways)
```powershell
$bookingData = "HotelCode=46924&ApiKey=5295697129d7c0f7f5-13a2-11f1-9&Language=en"

$response = Invoke-RestMethod -Uri "https://live.ipms247.com/booking/reservation_api/listing.php?request_type=ConfiguredPGList&HotelCode=46924&APIKey=5295697129d7c0f7f5-13a2-11f1-9&Language=en" -Method Get
Write-Host "ConfiguredPGList Response:"
$response | ConvertTo-Json -Depth 10
```

## Test RoomList (Get Available Rooms)
```powershell
$response = Invoke-RestMethod -Uri "https://live.ipms247.com/booking/reservation_api/listing.php?request_type=RoomList&HotelCode=46924&APIKey=5295697129d7c0f7f5-13a2-11f1-9&check_in_date=2026-04-15&check_out_date=2026-04-16&number_adults=1&number_children=0&num_rooms=1&language=en" -Method Get
Write-Host "RoomList Response:"
$response.RoomList | Select-Object Room_Name, roomtypeunkid, @{Name="Rateplan_Id"; Expression={$_.room_rates_info.rateplanunkid}}, @{Name="Ratetype_Id"; Expression={$_.room_rates_info.ratetypeunkid}}, @{Name="Avg_Rate"; Expression={$_.room_rates_info.avg_per_night_after_discount}}
```

## Test InsertBooking (Create Booking)
```powershell
$bookingData = @{
    "request_type" = "InsertBooking"
    "HotelCode" = "46924"
    "APIKey" = "5295697129d7c0f7f5-13a2-11f1-9"
    "Language" = "en"
    "BookingData" = "{
        ""Title"": ""Mr"",
        ""First_Name"": ""Test"",
        ""Last_Name"": ""User"",
        ""Email_Address"": ""test@example.com"",
        ""MobileNo"": ""1234567890"",
        ""Address"": ""123 Test St"",
        ""City"": ""Test City"",
        ""Country"": ""Test Country"",
        ""Zipcode"": ""12345"",
        ""check_in_date"": ""2026-04-15"",
        ""check_out_date"": ""2026-04-16"",
        ""Room_Details"": [{
            ""Rateplan_Id"": ""4692400000000000015"",
            ""Ratetype_Id"": ""4692400000000000003"",
            ""Roomtype_Id"": ""4692400000000000005"",
            ""baserate"": ""4725"",
            ""extradultrate"": ""2100"",
            ""extrachildrate"": ""1942"",
            ""number_adults"": ""1"",
            ""number_children"": ""0"",
            ""Title"": ""Mr"",
            ""First_Name"": ""Test"",
            ""Last_Name"": ""User"",
            ""Email_Address"": ""test@example.com""
        }],
        ""Booking_Payment_Mode"": """",
        ""Source_Id"": """",
        ""paymenttypeunkid"": """",
        ""Device"": ""DESKTOP"",
        ""Languagekey"": ""en""
    }"
}

$body = ($bookingData.GetEnumerator() | ForEach-Object { "$($_.Key)=$([System.Web.HttpUtility]::UrlEncode($_.Value))" }) -join "&"
$response = Invoke-RestMethod -Uri "https://live.ipms247.com/booking/reservation_api/listing.php?Language=en" -Method Post -ContentType "application/x-www-form-urlencoded" -Body $body
Write-Host "InsertBooking Response:"
$response | ConvertTo-Json -Depth 10

# Save reservation number for next step
$reservationNo = $response.ReservationNo
Write-Host "Reservation Number: $reservationNo"
```

## Test ProcessBooking (Confirm Booking)
```powershell
$processData = @{
    "request_type" = "ProcessBooking"
    "HotelCode" = "46924"
    "APIKey" = "5295697129d7c0f7f5-13a2-11f1-9"
    "Language" = "en"
    "Process_Data" = "{
        ""Action"": ""ConfirmBooking"",
        ""ReservationNo"": ""3056"",
        ""Inventory_Mode"": ""REGULAR"",
        ""Error_Text"": """"
    }"
}

$body = ($processData.GetEnumerator() | ForEach-Object { "$($_.Key)=$([System.Web.HttpUtility]::UrlEncode($_.Value))" }) -join "&"
$response = Invoke-RestMethod -Uri "https://live.ipms247.com/booking/reservation_api/listing.php?Language=en" -Method Post -ContentType "application/x-www-form-urlencoded" -Body $body
Write-Host "ProcessBooking Response:"
$response | ConvertTo-Json -Depth 10
```

## Important Notes:

1. **Booking Flow**: Your website now properly creates bookings in eZee PMS when users book rooms
2. **Room Availability**: eZee automatically updates room availability after successful bookings
3. **Environment Variables**: Added EZEE_SOURCE_ID and EZEE_PAYMENTTYPEUNKID to .env (currently empty)
4. **API Endpoints**: Using correct eZee API format: `https://live.ipms247.com/booking/reservation_api/listing.php`
5. **Room Details**: Backend now sends Room_Details as array instead of object with Room_1, Room_2 keys

## Required IDs from eZee:
- Contact eZee support to get valid EZEE_SOURCE_ID and EZEE_PAYMENTTYPEUNKID for your property
- These IDs are required by some eZee properties to prevent "ParametersMissing" errors
- Add them to your .env file once received

## Backend Integration:
- Fixed booking payload format in `Backend/src/services/ezeeBooking.service.ts`
- Added Title, First_Name, Last_Name to main booking data
- Changed Room_Details from object to array format
- Both admin portal and user booking flows will now work correctly
