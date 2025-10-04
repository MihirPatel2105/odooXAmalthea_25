const axios = require('axios');

// Cache for currency data
let currencyCache = {
  countries: null,
  rates: {},
  lastUpdated: null
};

// Get all countries with currency information
exports.getCurrencyByCountry = async (countryName) => {
  try {
    if (!currencyCache.countries || 
        !currencyCache.lastUpdated || 
        Date.now() - currencyCache.lastUpdated > 24 * 60 * 60 * 1000) {
      
      const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
      currencyCache.countries = response.data;
      currencyCache.lastUpdated = Date.now();
    }

    const country = currencyCache.countries.find(c => 
      c.name.common.toLowerCase() === countryName.toLowerCase() ||
      c.name.official.toLowerCase() === countryName.toLowerCase()
    );

    if (!country || !country.currencies) {
      return null;
    }

    const currencyCode = Object.keys(country.currencies)[0];
    const currencyInfo = country.currencies[currencyCode];

    return {
      code: currencyCode,
      name: currencyInfo.name,
      symbol: currencyInfo.symbol || currencyCode
    };

  } catch (error) {
    console.error('Error fetching currency data:', error);
    return null;
  }
};

// Get all available currencies
exports.getAllCurrencies = async () => {
  try {
    if (!currencyCache.countries || 
        !currencyCache.lastUpdated || 
        Date.now() - currencyCache.lastUpdated > 24 * 60 * 60 * 1000) {
      
      const response = await axios.get('https://restcountries.com/v3.1/all?fields=name,currencies');
      currencyCache.countries = response.data;
      currencyCache.lastUpdated = Date.now();
    }

    const currencies = new Map();

    currencyCache.countries.forEach(country => {
      if (country.currencies) {
        Object.entries(country.currencies).forEach(([code, info]) => {
          if (!currencies.has(code)) {
            currencies.set(code, {
              code,
              name: info.name,
              symbol: info.symbol || code,
              countries: [country.name.common]
            });
          } else {
            currencies.get(code).countries.push(country.name.common);
          }
        });
      }
    });

    return Array.from(currencies.values()).sort((a, b) => a.code.localeCompare(b.code));

  } catch (error) {
    console.error('Error fetching currencies:', error);
    return [];
  }
};

// Convert currency
exports.convertCurrency = async (amount, fromCurrency, toCurrency) => {
  try {
    if (fromCurrency === toCurrency) {
      return {
        originalAmount: amount,
        convertedAmount: amount,
        exchangeRate: 1,
        fromCurrency,
        toCurrency,
        convertedAt: new Date()
      };
    }

    const cacheKey = `${fromCurrency}-${toCurrency}`;
    const now = Date.now();
    
    if (currencyCache.rates[cacheKey] && 
        currencyCache.rates[cacheKey].timestamp && 
        now - currencyCache.rates[cacheKey].timestamp < 60 * 60 * 1000) {
      
      const cachedRate = currencyCache.rates[cacheKey];
      return {
        originalAmount: amount,
        convertedAmount: Math.round(amount * cachedRate.rate * 100) / 100,
        exchangeRate: cachedRate.rate,
        fromCurrency,
        toCurrency,
        convertedAt: new Date()
      };
    }

    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const rates = response.data.rates;

    if (!rates[toCurrency]) {
      throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
    }

    const exchangeRate = rates[toCurrency];
    const convertedAmount = Math.round(amount * exchangeRate * 100) / 100;

    currencyCache.rates[cacheKey] = {
      rate: exchangeRate,
      timestamp: now
    };

    return {
      originalAmount: amount,
      convertedAmount,
      exchangeRate,
      fromCurrency,
      toCurrency,
      convertedAt: new Date()
    };

  } catch (error) {
    console.error('Currency conversion error:', error);
    throw new Error(`Failed to convert ${fromCurrency} to ${toCurrency}: ${error.message}`);
  }
};

// Get current exchange rates for a base currency
exports.getExchangeRates = async (baseCurrency) => {
  try {
    const cacheKey = `rates-${baseCurrency}`;
    const now = Date.now();
    
    if (currencyCache.rates[cacheKey] && 
        currencyCache.rates[cacheKey].timestamp && 
        now - currencyCache.rates[cacheKey].timestamp < 60 * 60 * 1000) {
      
      return currencyCache.rates[cacheKey].data;
    }

    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
    const ratesData = {
      base: response.data.base,
      date: response.data.date,
      rates: response.data.rates
    };

    currencyCache.rates[cacheKey] = {
      data: ratesData,
      timestamp: now
    };

    return ratesData;

  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
};

// Format currency display
exports.formatCurrency = (amount, currencyCode, locale = 'en-US') => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode
    }).format(amount);
  } catch (error) {
    return `${currencyCode} ${amount.toFixed(2)}`;
  }
};
