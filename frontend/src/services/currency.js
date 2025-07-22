/**
 * Currency conversion service for standardizing heirloom values
 */

// Cache for exchange rates to avoid excessive API calls
let exchangeRatesCache = null;
let lastFetchTime = null;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour in milliseconds

const FALLBACK_RATES = {
  USD: 1.0,
  EUR: 1.09,
  GBP: 1.27,
  JPY: 0.0069,
  CAD: 0.74,
  AUD: 0.67,
  CHF: 1.12,
  CNY: 0.14,
  SEK: 0.092,
  NOK: 0.092,
  MXN: 0.058,
  INR: 0.012,
  BRL: 0.20,
  KRW: 0.00076,
  SGD: 0.74,
  NZD: 0.62
};

/**
 * Fetch current exchange rates from a free API (exchangerate-api.com)
 * @returns {Promise<Object>} Exchange rates with USD as base
 */
const fetchExchangeRates = async () => {
  try {
    // Check if we have cached rates that are still fresh
    if (exchangeRatesCache && lastFetchTime && (Date.now() - lastFetchTime) < CACHE_DURATION) {
      return exchangeRatesCache;
    }

    // Free API that doesn't require registration
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Convert to our format (rates to USD, not from USD)
    const rates = { USD: 1.0 };
    for (const [currency, rate] of Object.entries(data.rates)) {
      if (rate > 0) {
        rates[currency] = 1 / rate; // Convert from USD rate to USD conversion rate
      }
    }

    // Cache the results
    exchangeRatesCache = rates;
    lastFetchTime = Date.now();

    console.log('✅ Successfully fetched current exchange rates');
    return rates;

  } catch (error) {
    console.warn('⚠️ Failed to fetch exchange rates, using fallback rates:', error.message);

    // If we have cached rates, use them even if they're old
    if (exchangeRatesCache) {
      console.log('📋 Using cached exchange rates');
      return exchangeRatesCache;
    }

    // Otherwise use fallback rates
    console.log('🔄 Using fallback exchange rates');
    return FALLBACK_RATES;
  }
};

/**
 * Convert any currency amount to USD for standardized comparison
 * @param {number} amount - The amount to convert
 * @param {string} fromCurrency - The source currency code (e.g., 'EUR', 'GBP')
 * @returns {Promise<number>} - The amount converted to USD
 */
export const convertToUSD = async (amount, fromCurrency) => {
  if (!amount || amount <= 0) return 0;
  if (!fromCurrency || fromCurrency === 'USD') return amount;

  try {
    const rates = await fetchExchangeRates();
    const rate = rates[fromCurrency.toUpperCase()];

    if (!rate) {
      console.warn(`Unknown currency: ${fromCurrency}, treating as USD`);
      return amount;
    }

    return amount * rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    return amount; // Return original amount if conversion fails
  }
};

/**
 * Get the standardized value of an heirloom in USD
 * @param {Object} heirloom - The heirloom object with estimatedValue and currency
 * @returns {Promise<number>} - The standardized value in USD
 */
export const getStandardizedValue = async (heirloom) => {
  if (!heirloom || !heirloom.estimatedValue) return 0;

  const currency = heirloom.currency || 'USD';
  return await convertToUSD(heirloom.estimatedValue, currency);
};

/**
 * Format a currency amount with proper currency symbol and formatting
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (!amount || amount <= 0) return `${getCurrencySymbol(currency)}0`;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback formatting if currency is not supported
    return `${getCurrencySymbol(currency)}${amount.toLocaleString()}`;
  }
};

/**
 * Get currency symbol for a given currency code
 * @param {string} currency - The currency code
 * @returns {string} - The currency symbol
 */
const getCurrencySymbol = (currency) => {
  const symbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    SEK: 'kr',
    NOK: 'kr',
    MXN: '$',
    INR: '₹',
    BRL: 'R$',
    KRW: '₩',
    SGD: 'S$',
    NZD: 'NZ$'
  };

  return symbols[currency] || currency;
};

/**
 * Compare two heirlooms by their standardized USD values
 * @param {Object} heirloom1 - First heirloom to compare
 * @param {Object} heirloom2 - Second heirloom to compare
 * @returns {Promise<number>} - Negative if heirloom1 < heirloom2, positive if heirloom1 > heirloom2, 0 if equal
 */
export const compareHeirloomValues = async (heirloom1, heirloom2) => {
  const value1 = await getStandardizedValue(heirloom1);
  const value2 = await getStandardizedValue(heirloom2);
  return value1 - value2;
};

/**
 * Get current exchange rate for a specific currency pair
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency (defaults to USD)
 * @returns {Promise<number>} - Exchange rate
 */
export const getExchangeRate = async (fromCurrency, toCurrency = 'USD') => {
  if (fromCurrency === toCurrency) return 1.0;

  try {
    const rates = await fetchExchangeRates();

    if (toCurrency === 'USD') {
      return rates[fromCurrency.toUpperCase()] || 1.0;
    } else {
      // Convert through USD
      const fromRate = rates[fromCurrency.toUpperCase()] || 1.0;
      const toRate = rates[toCurrency.toUpperCase()] || 1.0;
      return fromRate / toRate;
    }
  } catch (error) {
    console.error('Error getting exchange rate:', error);
    return 1.0;
  }
};

/**
 * Force refresh the exchange rates cache
 * @returns {Promise<Object>} Fresh exchange rates
 */
export const refreshExchangeRates = async () => {
  exchangeRatesCache = null;
  lastFetchTime = null;
  return await fetchExchangeRates();
};

export default {
  convertToUSD,
  getStandardizedValue,
  formatCurrency,
  compareHeirloomValues,
  getExchangeRate,
  refreshExchangeRates
};
