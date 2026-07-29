# 20 — Troubleshooting

## Common Issues and Solutions

---

### 1. Server Won't Start — "Zod validation failed"

**Symptoms**: Backend crashes immediately with a Zod validation error.

**Cause**: Missing or invalid environment variables in `.env`.

**Solution**:
```bash
# Ensure .env exists
cp Backend/.env.example Backend/.env

# Check JWT_SECRET is at least 16 characters
JWT_SECRET=your-minimum-16-character-secret

# Check DATABASE_URL is valid
DATABASE_URL=mysql://root:password@localhost:3306/vintage_valley
```

---

### 2. Database Connection Failed — "Can't reach database"

**Symptoms**: Prisma throws connection error on startup.

**Cause**: MySQL server not running, wrong credentials, or wrong database name.

**Solution**:
```bash
# Verify MySQL is running
mysql -u root -p -e "SELECT 1"

# Create database if it doesn't exist
mysql -u root -p -e "CREATE DATABASE vintage_valley"

# Test Prisma connection
cd Backend && npx prisma db push
```

---

### 3. eZee API Returns Empty Rooms

**Symptoms**: Room listing shows no rooms or uses fallback data.

**Cause**: eZee API credentials invalid, hotel code wrong, or API down.

**Solution**:
```bash
# Check env vars
echo $EZEE_BASE_URL    # Should be https://live.ipms247.com/
echo $EZEE_HOTEL_CODE  # Should be your hotel code
echo $EZEE_API_KEY     # Should be valid API key

# Test API directly
node Backend/test-ezee-api.js
```

Check backend logs for:
```
eZee configuration missing     → EZEE_* env vars not set
Failed to fetch room availability → API error or timeout
HotelCodeEmpty                 → EZEE_HOTEL_CODE empty
UNAUTHREQ                     → Invalid EZEE_API_KEY
```

---

### 4. eZee Booking Push Fails

**Symptoms**: Payment succeeds but booking not confirmed. Error in logs.

**Cause**: Missing `EZEE_SOURCE_ID` or `EZEE_PAYMENTTYPEUNKID`.

**Solution**:
```env
# Get these from your eZee admin panel
EZEE_SOURCE_ID=your-source-id
EZEE_PAYMENTTYPEUNKID=your-payment-type-id

# For debugging only (will likely be rejected by eZee):
EZEE_ALLOW_MISSING_BOOKING_IDS=true
```

---

### 5. Email Not Sending — "MAILER SKIP"

**Symptoms**: Bookings confirm but no email received. Logs show "MAILER SKIP".

**Cause**: SMTP configuration missing or invalid.

**Solution**:
```env
# Ensure all SMTP vars are set
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your-gmail-app-password    # NOT your Gmail login password
```

**Gmail App Password setup**:
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Copy the 16-character app password
4. Use it as `SMTP_PASS` (remove spaces)

---

### 6. Email Error — "535 BadCredentials"

**Symptoms**: Logs show `535 5.7.8 Username and Password not accepted`.

**Solution**: Regenerate Gmail App Password and update `SMTP_PASS` in **both** `Backend/.env` and `Admin/.env`.

```
MAILER HINT >>> If you see 535 BadCredentials, regenerate a Gmail App Password
for the same account as SMTP_USER and update SMTP_PASS in BOTH Backend/.env
and Admin/.env.
```

---

### 7. Razorpay Payment Fails — "Invalid Razorpay signature"

**Symptoms**: Payment appears successful in Razorpay but verification fails.

**Cause**: `RAZORPAY_KEY_SECRET` mismatch between order creation and verification.

**Solution**:
- Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` match your Razorpay dashboard
- For testing, use `rzp_test_*` keys
- Check that the server hasn't restarted between order creation and verification

---

### 8. Google OAuth — "oauth=failed" Redirect

**Symptoms**: After Google login, redirected to `/login?oauth=failed`.

**Causes**:
1. `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` not configured
2. `GOOGLE_REDIRECT_URL` doesn't match Google Console config
3. OAuth state cookie expired (> 10 minutes between consent and callback)

**Solution**:
```env
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
GOOGLE_REDIRECT_URL=http://localhost:5050/api/auth/google/callback
```

Ensure the redirect URL matches **exactly** in Google Cloud Console.

---

### 9. Admin Panel — "Unauthorized" on Login

**Symptoms**: Can't log in to admin panel.

**Cause**: No admin user exists in the database.

**Solution**:
```bash
# Create admin via seed
cd Backend
ADMIN_EMAIL=admin@hotel.com ADMIN_PASSWORD=securepass123 npx prisma db seed
```

Or create directly via Prisma Studio:
```bash
npx prisma studio
# Set user's role to ADMIN
```

---

### 10. Frontend Proxy — "CORS Error" in Browser

**Symptoms**: API calls fail with CORS errors in development.

**Cause**: Backend not running or wrong proxy config.

**Solution**:
- Ensure Backend is running on port 5050
- Ensure Admin API is running on port 5051
- Check `vite.config.ts` proxy settings match actual server ports
- Ensure `CLIENT_URL` in Backend `.env` matches frontend URL

---

### 11. Build Fails — TypeScript Errors

**Symptoms**: `npm run build` fails with type errors.

**Solution**:
```bash
# Regenerate Prisma client (fixes most type issues)
cd Backend && npx prisma generate

# For Admin (uses Backend schema)
cd Admin && npm run prisma:generate
```

---

### 12. Rooms Show ₹0 Price

**Symptoms**: Room cards display ₹0 or empty price.

**Cause**: eZee API returned rooms with empty/zero price fields.

**Diagnosis**: Check backend logs for `[DEBUG] Final calculated avg price: 0`.

**Solution**:
- Verify eZee credentials
- Ensure the date range is valid and within eZee's configured availability
- Check if the room type has rate plans configured in eZee admin

---

### 13. Manual Booking — "Selected room not available"

**Symptoms**: Admin manual booking fails with "room not available" error.

**Cause**: eZee has no availability for the selected room type and dates.

**Solution**:
- Check eZee admin panel for room availability
- Ensure the room title in the database matches eZee room type names
- Room type matching is case-insensitive and strips plan suffixes (EP/CP/MAP)

---

## Useful Debug Commands

```bash
# Check database tables
cd Backend && npx prisma studio

# Test eZee connectivity
node Backend/test-ezee-api.js

# Test email sending
node Backend/test_smtp.js

# Check eZee booking format
node Backend/test_ezee_booking.js

# View PM2 logs (production)
pm2 logs backend
pm2 logs admin

# Restart services
pm2 restart all
systemctl reload nginx
```
