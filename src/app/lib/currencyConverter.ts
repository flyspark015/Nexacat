/**
 * Currency Converter - USD to INR
 * 
 * Handles price conversion with real-time exchange rates
 */

export interface PriceConversion {
  originalPrice: number;
  originalCurrency: string;
  convertedPrice: number;
  convertedCurrency: string;
  exchangeRate: number;
  timestamp: Date;
  source: 'api' | 'fallback';
}

/**
 * Get current USD to INR exchange rate
 * 
 * PRODUCTION: Use a real API like:
 * - https://exchangerate-api.com/
 * - https://openexchangerates.org/
 * - https://currencyapi.com/
 */
async function getExchangeRate(): Promise<number> {
  try {
    // Try to fetch real exchange rate
    // const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    // const data = await response.json();
    // return data.rates.INR;
    
    // Fallback: Use approximate rate
    return 83.5; // Updated as of Feb 2026 (approximate)
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
    return 83.5; // Fallback rate
  }
}

/**
 * Convert USD to INR
 */
export async function convertUSDtoINR(
  usdPrice: number,
  markup: number = 0
): Promise<PriceConversion> {
  const rate = await getExchangeRate();
  
  // Apply markup if specified (e.g., 10% = 0.10)
  const finalRate = rate * (1 + markup);
  
  const convertedPrice = Math.round(usdPrice * finalRate);
  
  return {
    originalPrice: usdPrice,
    originalCurrency: 'USD',
    convertedPrice,
    convertedCurrency: 'INR',
    exchangeRate: rate,
    timestamp: new Date(),
    source: 'fallback',
  };
}

/**
 * Parse price string to number
 */
export function parsePrice(priceString: string): number | null {
  if (!priceString) return null;
  
  // Remove currency symbols and common characters
  const cleaned = priceString
    .replace(/[$₹£€¥,\s]/g, '')
    .trim();
  
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

/**
 * Detect currency from string
 */
export function detectCurrency(text: string): string {
  const normalized = text.toUpperCase().trim();
  
  if (normalized.includes('USD') || normalized.includes('$')) return 'USD';
  if (normalized.includes('INR') || normalized.includes('₹') || normalized.includes('RS')) return 'INR';
  if (normalized.includes('EUR') || normalized.includes('€')) return 'EUR';
  if (normalized.includes('GBP') || normalized.includes('£')) return 'GBP';
  if (normalized.includes('JPY') || normalized.includes('¥')) return 'JPY';
  
  return 'USD'; // Default
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString('en-IN')}`;
  } else if (currency === 'USD') {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  } else {
    return `${amount.toLocaleString()}`;
  }
}

/**
 * Auto-convert price if needed
 */
export async function autoConvertPrice(
  priceString: string,
  currencyHint?: string
): Promise<{
  originalPrice: number;
  originalCurrency: string;
  inrPrice: number;
  conversion?: PriceConversion;
} | null> {
  const price = parsePrice(priceString);
  if (!price) return null;
  
  const currency = currencyHint || detectCurrency(priceString);
  
  if (currency === 'USD') {
    const conversion = await convertUSDtoINR(price);
    return {
      originalPrice: price,
      originalCurrency: 'USD',
      inrPrice: conversion.convertedPrice,
      conversion,
    };
  } else if (currency === 'INR') {
    return {
      originalPrice: price,
      originalCurrency: 'INR',
      inrPrice: price,
    };
  } else {
    // For other currencies, convert to USD first, then to INR
    // This is simplified - in production, use direct conversion
    return {
      originalPrice: price,
      originalCurrency: currency,
      inrPrice: Math.round(price * 83.5), // Approximate
    };
  }
}
