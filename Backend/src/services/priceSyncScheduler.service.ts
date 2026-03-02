import { roomPriceSyncService } from "./roomPriceSync.service";

class PriceSyncScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start automatic price sync every hour
   */
  start(intervalMinutes: number = 60): void {
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
  stop(): void {
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
  async syncPrices(): Promise<void> {
    try {
      console.log("Starting scheduled price sync...");
      const updates = await roomPriceSyncService.syncPricesToDatabase();
      
      const changedPrices = updates.filter(u => u.oldPricePerNight !== u.newPricePerNight);
      
      if (changedPrices.length > 0) {
        console.log(`Price sync completed. Updated prices for ${changedPrices.length} rooms:`);
        changedPrices.forEach(update => {
          console.log(`  ${update.title}: ${update.oldPricePerNight} → ${update.newPricePerNight}`);
        });
      } else {
        console.log("Price sync completed. No price changes detected.");
      }
    } catch (error) {
      console.error("Scheduled price sync failed:", error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextSync?: Date } {
    return {
      isRunning: this.isRunning,
    };
  }
}

// Export singleton instance
export const priceSyncScheduler = new PriceSyncScheduler();
