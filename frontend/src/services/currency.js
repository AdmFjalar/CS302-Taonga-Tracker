/**
 * Currency conversion service for comparing heirloom values across different currencies.
 */

const CURRENCY_API_BASE = 'https://api.exchangerate-api.com/v4/latest';
const DEFAULT_BASE_CURRENCY = 'USD';

let exchangeRateCache = {
  rates: {},
  lastUpdated: null,
  baseCurrency: DEFAULT_BASE_CURRENCY
};

/**
 * Check if cached exchange rates are still valid (1 hour).
 * @returns {boolean} True if cache is valid
 */
const isCacheValid = () => {
  if (!exchangeRateCache.lastUpdated) return false;
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  return exchangeRateCache.lastUpdated > oneHourAgo;
};

/**
 * Fetch exchange rates from API with caching.
 * @param {string} [baseCurrency='USD'] - Base currency for rates
 * @returns {Promise<Object>} Exchange rates object
 */
const fetchExchangeRates = async (baseCurrency = DEFAULT_BASE_CURRENCY) => {
  try {
    const response = await fetch(`${CURRENCY_API_BASE}/${baseCurrency}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    exchangeRateCache = {
      rates: data.rates,
      lastUpdated: Date.now(),
      baseCurrency: baseCurrency
    };
    
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return getFallbackRates();
  }
};

/**
 * Fallback exchange rates when API is unavailable.
 * @returns {Object} Static exchange rates
 */
const getFallbackRates = () => ({
  USD: 1,
  EUR: 0.85,
  GBP: 0.73,
  JPY: 110,
  CAD: 1.25,
  AUD: 1.35,
  CHF: 0.92,
  CNY: 6.45,
  SEK: 8.60,
  NOK: 8.50
});

/**
 * Get current exchange rates with caching.
 * @param {string} [baseCurrency='USD'] - Base currency
 * @returns {Promise<Object>} Exchange rates
 */
export const getExchangeRates = async (baseCurrency = DEFAULT_BASE_CURRENCY) => {
  if (isCacheValid() && exchangeRateCache.baseCurrency === baseCurrency) {
    return exchangeRateCache.rates;
  }
  
  return await fetchExchangeRates(baseCurrency);
};

/**
 * Convert amount between currencies.
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {Promise<number>} Converted amount
 */
export const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const rates = await getExchangeRates(fromCurrency);
    const rate = rates[toCurrency];

    if (!rate) {
      console.warn(`Exchange rate not found for ${toCurrency}`);
      return amount;
    }

    return amount * rate;
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return amount;
  }
};

/**
 * Convert all heirloom values to a common currency for comparison.
 * @param {Array} heirlooms - Array of heirloom objects
 * @param {string} [targetCurrency='USD'] - Target currency
 * @returns {Promise<Array>} Heirlooms with converted values
 */
export const normalizeHeirloomValues = async (heirlooms, targetCurrency = DEFAULT_BASE_CURRENCY) => {
  const rates = await getExchangeRates();

  return Promise.all(heirlooms.map(async (heirloom) => {
    const { estimatedValue, currency } = heirloom;

    if (!estimatedValue || !currency) {
      return { ...heirloom, normalizedValue: 0, normalizedCurrency: targetCurrency };
    }

    const convertedValue = await convertCurrency(estimatedValue, currency, targetCurrency);

    return {
      ...heirloom,
      normalizedValue: convertedValue,
      normalizedCurrency: targetCurrency
    };
  }));
};

/**
 * Find the most valuable heirloom after currency normalization.
 * @param {Array} heirlooms - Array of heirloom objects
 * @returns {Promise<Object|null>} Most valuable heirloom or null
 */
export const findMostValuableHeirloom = async (heirlooms) => {
  if (!heirlooms || heirlooms.length === 0) return null;

  const normalizedHeirlooms = await normalizeHeirloomValues(heirlooms);

  return normalizedHeirlooms.reduce((mostValuable, current) => {
    if (!mostValuable || (current.normalizedValue > mostValuable.normalizedValue)) {
      return current;
    }
    return mostValuable;
  }, null);
};

/**
 * Calculate total portfolio value in target currency.
 * @param {Array} heirlooms - Array of heirloom objects
 * @param {string} [targetCurrency='USD'] - Target currency
 * @returns {Promise<Object>} Total value and currency
 */
export const calculatePortfolioValue = async (heirlooms, targetCurrency = DEFAULT_BASE_CURRENCY) => {
  const normalizedHeirlooms = await normalizeHeirloomValues(heirlooms, targetCurrency);

  const totalValue = normalizedHeirlooms.reduce((sum, heirloom) => {
    return sum + (heirloom.normalizedValue || 0);
  }, 0);

  return {
    value: totalValue,
    currency: targetCurrency,
    itemCount: heirlooms.length
  };
};
