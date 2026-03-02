# Live Room Prices Implementation

## Overview
This implementation provides live room pricing from the eZee API with automatic database synchronization. Prices are fetched on-demand and stored in the database, ensuring that all website pages display consistent, up-to-date pricing.

## Key Features
- **Live Price Fetching**: Real-time prices from eZee API
- **Database Sync**: Automatic updates to Room table with EP, CP, MAP pricing
- **Price Plans**: Support for Base, European Plan (EP), Continental Plan (CP), and Modified American Plan (MAP)
- **Scheduler**: Automatic background syncing at configurable intervals
- **Frontend Integration**: Multiple pages displaying live or synced prices
- **Mock Data Fallback**: Demo data when eZee API is not configured

## Backend Implementation

### New Files
- `Backend/src/services/ezeeLivePrice.service.ts` – Service that calls eZee RoomList API with validation and error mapping.
- `Backend/src/services/roomPriceSync.service.ts` – Syncs eZee prices to database Room table.
- `Backend/src/services/priceSyncScheduler.service.ts` – Background scheduler for automatic price syncs.
- `Backend/src/controllers/roomLivePrice.controller.ts` – Controller for live prices and sync operations.
- `Backend/src/routes/roomLivePrice.routes.ts` – Router for live price endpoints.

### API Endpoints
- `GET /api/rooms-live` – Returns live room prices with optional database sync
  - Query params: checkIn, checkOut, adults, children, rooms, syncToDb=true
  - Response: `{ success: true, rooms: [{ roomType, price, currency, availability }], syncUpdates?: number }`

- `POST /api/rooms-live/sync` – Manually sync prices to database
  - Response: `{ success: true, message: "Successfully synced prices for X rooms", updates: [...] }`

- `GET /api/rooms-live/database` – Get current prices from database
  - Response: `{ success: true, rooms: [{ id, title, pricePerNight, epPricePerNight, cpPricePerNight, mapPricePerNight, ... }] }`

- `POST /api/rooms-live/scheduler/start` – Start automatic price sync scheduler
  - Body: `{ intervalMinutes: 60 }` (default: 60 minutes)

- `POST /api/rooms-live/scheduler/stop` – Stop automatic price sync scheduler

- `GET /api/rooms-live/scheduler/status` – Get scheduler status

### Price Calculations
When syncing to database, the system calculates:
- **Base Price**: Direct from eZee API
- **EP (European Plan)**: Base Price × 1.2 (20% premium)
- **CP (Continental Plan)**: Base Price × 0.9 (10% discount)
- **MAP (Modified American Plan)**: Base Price × 1.1 (10% premium)

### Environment Variables (required for live prices)
Add to Backend/.env:
```
EZEE_BASE_URL=https://live.ipms247.com/
EZEE_HOTEL_CODE=46924
EZEE_API_KEY=your_ezee_api_key_here
```

## Frontend Implementation

### New Files
- `Frontend/src/lib/roomLivePrice.service.ts` – Service for live price API calls.
- `Frontend/src/lib/roomDatabase.service.ts` – Service for database room data.
- `Frontend/src/pages/RoomMinimal.tsx` – Minimal live price page.
- `Frontend/src/pages/RoomLive.tsx` – Dedicated live price page.
- `Frontend/src/pages/RoomsSynced.tsx` – Rooms page with database prices and sync functionality.

### New Routes
- `/room-minimal` – Minimal live price UI
- `/room-live` – Dedicated live price UI
- `/rooms-synced` – Full rooms page with database prices and manual sync

### Usage Examples

#### Live Price Fetching
```typescript
import { roomLivePriceService } from "../lib/roomLivePrice.service";

const response = await roomLivePriceService.getRoomPrices({
  checkIn: "2025-09-01",
  checkOut: "2025-09-02",
  adults: 2,
  children: 0,
  rooms: 1,
});
```

#### Database Room Fetching
```typescript
import { roomDatabaseService } from "../lib/roomDatabase.service";

const response = await roomDatabaseService.getDatabaseRooms();
const rooms = response.rooms; // Array of rooms with all pricing plans
```

#### Manual Price Sync
```typescript
const response = await roomDatabaseService.syncPrices();
if (response.success) {
  console.log(response.message); // "Successfully synced prices for 4 rooms"
}
```

## How It Works

### 1. Live Price Flow
1. Frontend requests live prices from `/api/rooms-live`
2. Backend calls eZee API with hotel code and auth code
3. If `syncToDb=true`, prices are synced to database
4. Backend returns live prices to frontend

### 2. Database Sync Flow
1. Backend fetches live prices from eZee API
2. Matches rooms by title similarity
3. Calculates EP, CP, MAP prices
4. Updates Room table with new prices
5. Logs changes and returns update summary

### 3. Scheduler Flow
1. Scheduler starts with configurable interval
2. Every interval, calls price sync service
3. Logs successful syncs and price changes
4. Continues until stopped

### 4. Frontend Display
- **Live Pages**: Show real-time prices directly from API
- **Synced Pages**: Show database prices with manual sync option
- **Price Plans**: Users can switch between Base, EP, CP, MAP pricing

## Security
- Auth code and hotel code are server-side only
- No sensitive keys exposed to frontend
- Rate limiting on API endpoints
- Input validation and error handling

## Testing

### Manual Testing
1. Start Backend and Frontend
2. Visit `/rooms-synced` for database prices
3. Visit `/room-minimal` for live prices
4. Click "Sync Prices" to update database
5. Switch between pricing plans to see different rates

### API Testing
```bash
# Get live prices with sync
curl "http://localhost:5050/api/rooms-live?syncToDb=true"

# Manual sync
curl -X POST "http://localhost:5050/api/rooms-live/sync"

# Get database prices
curl "http://localhost:5050/api/rooms-live/database"

# Start scheduler (30-minute intervals)
curl -X POST "http://localhost:5050/api/rooms-live/scheduler/start" -d '{"intervalMinutes":30}'
```

## Production Deployment

### With Real eZee API
1. Set valid `EZEE_*` environment variables
2. Remove mock data fallback from `ezeeLivePrice.service.ts`
3. Start scheduler with desired interval
4. Monitor logs for sync failures

### Price Update Frequency
- **Manual**: Use sync button or API endpoint
- **Scheduled**: Configure interval (recommended: 60 minutes)
- **Real-time**: Call live price endpoint with `syncToDb=true`

## Monitoring
- Check logs for price change notifications
- Monitor `/api/rooms-live/scheduler/status`
- Set up alerts for sync failures
- Track price change history (can be extended to database table)

## Notes
- Original `/api/rooms/prices` endpoint remains unchanged
- Mock data is used when eZee API returns NORESACC error
- Room matching is based on title similarity
- Price calculations can be customized in `roomPriceSync.service.ts`
- All prices are stored in INR currency
