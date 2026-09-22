import { ref, watch } from "vue";
import Decimal from "decimal.js";
import { supabase } from "src/boot/supabase";

const exchangeRate = ref(null);
const exchangeRateError = ref(null);
let exchangeRatePromise;

async function loadExchangeRate() {
  if (exchangeRatePromise) return exchangeRatePromise;

  exchangeRatePromise = supabase
    .from("ExchangeRate")
    .select("Rate")
    .order("created_at", { ascending: false })
    .limit(1)
    .then(({ data, error }) => {
      if (error) throw error;

      const rate = data?.[0]?.Rate;
      if (rate === null || rate === undefined) {
        throw new Error("No exchange rate is configured.");
      }

      exchangeRate.value = new Decimal(rate);
      return exchangeRate.value;
    })
    .catch((error) => {
      exchangeRateError.value = error;
      console.error("Error fetching exchange rate:", error);
      return null;
    });

  return exchangeRatePromise;
}

export function useCurrency() {
  loadExchangeRate();
  const currencyType = ref("LC");

  const convertCurrency = (amount) => {
    if (currencyType.value === "USD") {
      return new Decimal(amount);
    }
    return exchangeRate.value
      ? new Decimal(amount).mul(exchangeRate.value)
      : new Decimal(0);
  };

  watch(currencyType, (newVal) => {
    console.log(`Currency type changed to: ${newVal}`);
  });

  return {
    currencyType,
    convertCurrency,
    exchangeRate,
    exchangeRateError,
    loadExchangeRate,
  };
}
