import { describe, it, expect } from 'vitest';
import { getCartLineKey, resolveCartLineKey } from './cartLineKey';

describe('cartLineKey', () => {
  it('separates variants of the same product', () => {
    expect(getCartLineKey('8', '7')).not.toBe(getCartLineKey('8', '16'));
  });

  it('keeps products without variant on product id only', () => {
    expect(getCartLineKey('3', null)).toBe('3');
  });

  it('resolves legacy cart rows with variantKey', () => {
    expect(resolveCartLineKey({ productId: '8', variantKey: '16' })).toBe('8::16');
  });
});
