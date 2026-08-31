import { 
  calculateSafetyStock, 
  calculateReorderPoint, 
  calculateEOQ, 
  calculateDynamicInventoryMetrics 
} from '../api/utils/stockUtils.js';

describe('Stock Utilities (Industrial Engineering Formulas)', () => {
  describe('calculateSafetyStock', () => {
    it('menghitung safety stock dengan benar untuk skenario normal', () => {
      // (50 * 5) - (30 * 3) = 250 - 90 = 160
      const result = calculateSafetyStock(50, 5, 30, 3);
      expect(result).toBe(160);
    });

    it('mengembalikan 0 jika hasil kalkulasi negatif', () => {
      // (10 * 2) - (15 * 3) = 20 - 45 = -25 -> Harus jadi 0
      const result = calculateSafetyStock(10, 2, 15, 3);
      expect(result).toBe(0);
    });

    it('melempar error jika ada input negatif', () => {
      expect(() => calculateSafetyStock(-10, 5, 5, 2)).toThrow('Angka tidak boleh negatif');
    });
  });

  describe('calculateReorderPoint', () => {
    it('menghitung reorder point dengan benar', () => {
      // (30 * 3) + 160 = 90 + 160 = 250
      const result = calculateReorderPoint(30, 3, 160);
      expect(result).toBe(250);
    });

    it('melempar error jika ada input negatif', () => {
      expect(() => calculateReorderPoint(30, -3, 160)).toThrow('Angka tidak boleh negatif');
    });
  });

  describe('calculateEOQ', () => {
    it('menghitung EOQ dengan benar untuk skenario pemesanan optimal', () => {
      // Demand = 1000, Ordering Cost = 50000, Holding Cost = 20000
      // EOQ = SQRT((2 * 1000 * 50000) / 20000) = SQRT(5000) = 70.71 -> 71
      const result = calculateEOQ(1000, 50000, 20000);
      expect(result).toBe(71);
    });

    it('melempar error jika parameter invalid atau holding cost <= 0', () => {
      expect(() => calculateEOQ(1000, 50000, 0)).toThrow('Parameter EOQ tidak valid');
    });
  });

  describe('calculateDynamicInventoryMetrics', () => {
    it('menghitung parameter inventori dinamis berdasarkan riwayat harian', () => {
      const salesHistory = [5, 10, 15, 8, 12, 20, 5, 10]; // total = 85, avg = 10.63, max = 20
      const priceBuy = 500000;

      const metrics = calculateDynamicInventoryMetrics(salesHistory, priceBuy);
      expect(metrics.avgDailySales).toBe(10.63);
      expect(metrics.maxDailySales).toBe(20);
      expect(metrics.safetyStock).toBeGreaterThanOrEqual(0);
      expect(metrics.rop).toBeGreaterThan(0);
      expect(metrics.eoq).toBeGreaterThanOrEqual(10);
    });
  });
});
