# eZee Booking Logs - What You'll See in Server Terminal

When bookings are made from admin portal or user self-booking, you'll see these detailed logs in your server terminal:

## Example Log Output:

```
🚀 [EZEE] ===== STARTING EZEE BOOKING PROCESS =====
👤 [EZEE] Guest: Test User
📧 [EZEE] Email: test@example.com
📅 [EZEE] Dates: 2026-04-15 to 2026-04-16
🏠 [EZEE] Room Type ID: 4692400000000000005
💰 [EZEE] Payment Mode: 0

🏨 [EZEE] Creating booking in eZee PMS...
📋 [EZEE] Booking Data: {
  "Title": "Mr",
  "First_Name": "Test",
  "Last_Name": "User",
  "Room_Details": [
    {
      "Rateplan_Id": "4692400000000000015",
      "Ratetype_Id": "4692400000000000003",
      "Roomtype_Id": "4692400000000000005",
      "baserate": "4725",
      "extradultrate": "2100",
      "extrachildrate": "1942",
      "number_adults": "1",
      "number_children": "0",
      "Title": "",
      "First_Name": "Test",
      "Last_Name": "User",
      "Email_Address": "test@example.com"
    }
  ],
  "check_in_date": "2026-04-15",
  "check_out_date": "2026-04-16",
  "Booking_Payment_Mode": "",
  "Email_Address": "test@example.com",
  "Source_Id": "",
  "Device": "DESKTOP",
  "Languagekey": "en",
  "paymenttypeunkid": ""
}
🔗 [EZEE] InsertBooking URL: https://live.ipms247.com/booking/reservation_api/listing.php?request_type=InsertBooking&HotelCode=46924&APIKey=5295697129d7c0f7f5-13a2-11f1-9&language=en&BookingData=...

📨 [EZEE] InsertBooking Response: {
  "ReservationNo": "3056",
  "SubReservationNo": ["3056"],
  "Inventory_Mode": "REGULAR",
  "lang_key": "en",
  "contactunkid": "4692400000000003971"
}

✅ [EZEE] Booking created successfully!
🎫 [EZEE] Reservation Number: 3056
📊 [EZEE] Inventory Mode: REGULAR

🔄 [EZEE] Confirming booking in eZee PMS...
📋 [EZEE] Process Data: {
  "Action": "ConfirmBooking",
  "ReservationNo": "3056",
  "Inventory_Mode": "REGULAR",
  "Error_Text": ""
}
🔗 [EZEE] ProcessBooking URL: https://live.ipms247.com/booking/reservation_api/listing.php?request_type=ProcessBooking&HotelCode=46924&APIKey=5295697129d7c0f7f5-13a2-11f1-9&language=en&Process_Data=...

📨 [EZEE] ProcessBooking Response: {
  "result": "success",
  "message": "Booking Processed Succesfully"
}

🎉 [EZEE] Booking confirmed successfully!
✅ [EZEE] Result: success
💬 [EZEE] Message: Booking Processed Succesfully

🏁 [EZEE] ===== BOOKING PROCESS COMPLETED =====
🎫 [EZEE] Final Reservation Number: 3056
📊 [EZEE] Final Inventory Mode: REGULAR
📋 [EZEE] Sub-Reservations: 3056
🏨 [EZEE] Room availability updated in eZee PMS
🎉 [EZEE] ===== END OF EZEE BOOKING PROCESS =====
```

## Error Logs (if something goes wrong):

```
❌ [EZEE] InsertBooking error: { statusCode: 400, message: "ParametersMissing" }
💥 [EZEE] InsertBooking exception: ParametersMissing

❌ [EZEE] ProcessBooking error: { statusCode: 502, message: "ReservationNotExist" }
💥 [EZEE] ProcessBooking exception: ReservationNotExist
```

## What Each Icon Means:

- 🚀 **Starting** - Booking process initiated
- 👤 **Guest Info** - Customer details
- 📧 **Email** - Customer email
- 📅 **Dates** - Check-in/Check-out
- 🏠 **Room** - Room type details
- 💰 **Payment** - Payment method
- 🏨 **Creating** - Sending to eZee PMS
- 📋 **Data** - Full booking payload
- 🔗 **URL** - API endpoint being called
- 📨 **Response** - eZee API response
- ✅ **Success** - Step completed successfully
- 🎫 **Reservation** - Booking reference number
- 🔄 **Confirming** - Confirming the booking
- 🎉 **Confirmed** - Booking fully confirmed
- 🏁 **Completed** - Entire process finished
- ❌ **Error** - Something went wrong
- 💥 **Exception** - Critical error occurred

## When You'll See These Logs:

1. **Admin creates booking** in `/booking` section → Full logs appear
2. **User books room** themselves → Full logs appear
3. **Any booking error** → Error logs appear with details

**Your server terminal will now show complete visibility into every eZee booking transaction!** 🎯
