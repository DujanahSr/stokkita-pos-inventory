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
    maxDailySales * maxLeadTime - avgDailySales * avgLeadTime;

  // Safety stock tidak boleh negatif secara logis, minimal 0
  return Math.max(0, Math.ceil(safetyStock));
}

/**
 * Kalkulasi Reorder Point (ROP)
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

  return Math.ceil(avgDailySales * avgLeadTime + safetyStock);
}

/**
 * Kalkulasi Economic Order Quantity (EOQ)
 * Rumus: SQRT((2 * Annual Demand * Ordering Cost) / Holding Cost per Unit)
 */
export function calculateEOQ(
  annualDemand: number,
  orderingCost: number,
  holdingCostPerUnit: number
): number {
  if (annualDemand < 0 || orderingCost < 0 || holdingCostPerUnit <= 0) {
    throw new Error("Parameter EOQ tidak valid atau holding cost <= 0");
  }

  if (annualDemand === 0) {
    return 10; // Minimum default batch order
  }

  const eoq = Math.sqrt((2 * annualDemand * orderingCost) / holdingCostPerUnit);
  return Math.max(5, Math.ceil(eoq));
}

/**
 * Kalkulasi Dinamis Inventori Berdasarkan Riwayat Penjualan Harian
 */
export function calculateDynamicInventoryMetrics(
  dailySalesArray: number[],
  priceBuy: number,
  options?: {
    leadTimeAvg?: number;
    leadTimeMax?: number;
    orderingCost?: number;
    holdingCostRatio?: number;
  }
) {
  const leadTimeAvg = options?.leadTimeAvg ?? 3; // Default 3 hari
  const leadTimeMax = options?.leadTimeMax ?? 5; // Default 5 hari
  const orderingCost = options?.orderingCost ?? 50000; // Biaya pemesanan default Rp 50.000
  const holdingCostRatio = options?.holdingCostRatio ?? 0.2; // 20% dari HPP per tahun

  // 1. Hitung Kecepatan Penjualan (Daily Sales Velocity)
  const totalSalesPeriod = dailySalesArray.reduce((sum, val) => sum + val, 0);
  const periodDays = Math.max(1, dailySalesArray.length);
  const avgDailySales = totalSalesPeriod / periodDays;
  const maxDailySales = dailySalesArray.length > 0 ? Math.max(...dailySalesArray) : 0;

  // 2. Hitung Safety Stock & ROP
  const safetyStock = calculateSafetyStock(maxDailySales, leadTimeMax, avgDailySales, leadTimeAvg);
  const rop = calculateReorderPoint(avgDailySales, leadTimeAvg, safetyStock);

  // 3. Hitung EOQ
  const annualDemand = Math.max(avgDailySales * 365, totalSalesPeriod > 0 ? totalSalesPeriod * 12 : 50);
  const holdingCostPerUnit = Math.max(1000, priceBuy * holdingCostRatio);
  const eoq = calculateEOQ(annualDemand, orderingCost, holdingCostPerUnit);

  return {
    avgDailySales: Number(avgDailySales.toFixed(2)),
    maxDailySales,
    safetyStock,
    rop: Math.max(5, rop), // Minimum ROP 5 pcs
    eoq: Math.max(10, eoq), // Minimum EOQ 10 pcs
    annualDemandEstimate: Math.ceil(annualDemand)
  };
}
