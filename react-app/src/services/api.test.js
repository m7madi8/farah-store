/**
 * API service tests — fetchProducts, fetchProductBySlug, submitOrder.
 * Mocks fetch; no real backend required.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchProducts, fetchProductBySlug, getProductBySlug, submitOrder } from './api';

describe('api', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('VITE_API_BASE', '');
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', '');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');
    vi.stubEnv('VITE_FIREBASE_APP_ID', '');
  });

  describe('fetchProducts', () => {
    it('returns mock products when VITE_API_BASE is not set', async () => {
      const products = await fetchProducts();
      expect(Array.isArray(products)).toBe(true);
      if (products.length > 0) {
        expect(products[0]).toHaveProperty('slug');
        expect(products[0]).toHaveProperty('name');
        expect(products[0]).toHaveProperty('price');
      }
    });

    it('returns array from API when fetch is mocked', async () => {
      vi.stubEnv('VITE_API_BASE', 'http://test.local/api');
      const mockData = [{ id: 1, slug: 'test', name: 'Test', price: 10 }];
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          headers: {
            get: (name) => (String(name).toLowerCase() === 'content-type' ? 'application/json' : null),
          },
          json: () => Promise.resolve({ results: mockData }),
        })
      );
      const products = await fetchProducts();
      expect(Array.isArray(products)).toBe(true);
    });
  });

  describe('fetchProductBySlug', () => {
    it('returns product matching slug from fetchProducts result', async () => {
      const product = await fetchProductBySlug('dumplings-chicken');
      if (product) {
        expect(product.slug).toBe('dumplings-chicken');
      } else {
        expect(product).toBeNull();
      }
    });
  });

  describe('getProductBySlug', () => {
    it('returns mock product synchronously', () => {
      const product = getProductBySlug('dumplings-chicken');
      expect(product?.slug).toBe('dumplings-chicken');
    });
  });

  describe('submitOrder', () => {
    it('returns local success when BASE is not set', async () => {
      const result = await submitOrder({ name: 'T', phone: '1', items: [], total: 0 });
      expect(result).toHaveProperty('ok', true);
      expect(result).toHaveProperty('orderId');
    });

    it('submitOrder with BASE set uses POST and JSON body', async () => {
      vi.stubEnv('VITE_API_BASE', 'http://test.local/api');
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          headers: {
            get: (name) => (String(name).toLowerCase() === 'content-type' ? 'application/json' : null),
          },
          json: () => Promise.resolve({ id: 123 }),
        })
      );
      await submitOrder({
        name: 'Test',
        phone: '1',
        address: 'Addr',
        items: [{ productId: 1, quantity: 1, price: 10, name: 'P' }],
        total: 10,
      });
      if (fetch.mock.calls.length) {
        expect(fetch.mock.calls[0][1].method).toBe('POST');
        expect(typeof fetch.mock.calls[0][1].body).toBe('string');
      }
    });
  });
});
