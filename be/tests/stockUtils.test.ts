import { calculateSafetyStock, calculateReorderPoint } from '../api/utils/stockUtils.js';

describe('Stock Utilities', () => {
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
});
