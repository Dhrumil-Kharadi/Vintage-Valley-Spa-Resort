"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.priceSyncScheduler = void 0;
const roomPriceSync_service_1 = require("./roomPriceSync.service");
class PriceSyncScheduler {
    intervalId = null;
    isRunning = false;
    /**
     * Start automatic price sync every hour
     */
    start(intervalMinutes = 60) {
        if (this.isRunning) {
            console.log("Price sync scheduler is already running");
            return;
        }
        console.log(`Starting price sync scheduler with ${intervalMinutes} minute interval`);
        // Sync immediately on start
        this.syncPrices();
        // Then sync at regular intervals
        this.intervalId = setInterval(() => {
            this.syncPrices();
        }, intervalMinutes * 60 * 1000);
        this.isRunning = true;
    }
    /**
     * Stop the price sync scheduler
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log("Price sync scheduler stopped");
    }
    /**
     * Manual sync trigger
     */
    async syncPrices() {
        try {
            console.log("Starting scheduled price sync...");
            const updates = await roomPriceSync_service_1.roomPriceSyncService.syncPricesToDatabase();
            const changedPrices = updates.filter(u => u.oldPricePerNight !== u.newPricePerNight);
            if (changedPrices.length > 0) {
                console.log(`Price sync completed. Updated prices for ${changedPrices.length} rooms:`);
                changedPrices.forEach(update => {
                    console.log(`  ${update.title}: ${update.oldPricePerNight} → ${update.newPricePerNight}`);
                });
            }
            else {
                console.log("Price sync completed. No price changes detected.");
            }
        }
        catch (error) {
            console.error("Scheduled price sync failed:", error);
        }
    }
    /**
     * Get scheduler status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
        };
    }
}
// Export singleton instance
exports.priceSyncScheduler = new PriceSyncScheduler();
