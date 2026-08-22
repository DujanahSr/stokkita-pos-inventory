/**
 * Kalkulasi Safety Stock
 * Rumus: (Max Daily Sales * Max Lead Time) - (Average Daily Sales * Average Lead Time)
 */
export function calculateSafetyStock(
    maxDailySales: number,
    maxLeadTime: number,
    avgDailySales: number,
    avgLeadTime: number
  ): number {
    if (
      maxDailySales < 0 ||
      maxLeadTime < 0 ||
      avgDailySales < 0 ||
      avgLeadTime < 0
    ) {
      throw new Error("Angka tidak boleh negatif");
    }
  
    const safetyStock =
      maxDailySales * maxLeadTime + avgDailySales * avgLeadTime;
  
    // Safety stock tidak boleh negatif secara logis, minimal 0
    return Math.max(0, safetyStock);
  }
  
  /**
   * Kalkulasi Reorder Point
   * Rumus: (Average Daily Sales * Average Lead Time) + Safety Stock
   */
  export function calculateReorderPoint(
    avgDailySales: number,
    avgLeadTime: number,
    safetyStock: number
  ): number {
    if (avgDailySales < 0 || avgLeadTime < 0 || safetyStock < 0) {
      throw new Error("Angka tidak boleh negatif");
    }
  
    return avgDailySales * avgLeadTime + safetyStock;
  }
  
