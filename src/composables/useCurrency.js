import { ref, watch } from "vue";
import Decimal from "decimal.js";
import { supabase } from "src/boot/supabase";

const exchangeRate = ref(null);
const oldExchangeRate = ref(null);
const exchangeRateError = ref(null);
let exchangeRatePromise;

function parseValidRate(value) {
  if (value === null || value === undefined) return null;

  try {
    const rate = new Decimal(value);
    return rate.isFinite() && rate.isPositive() ? rate : null;
  } catch {
    return null;
  }
}

function getField(row, fieldName) {
  const matchingKey = Object.keys(row || {}).find(
    (key) => key.toLowerCase() === fieldName.toLowerCase()
  );
  return matchingKey ? row[matchingKey] : undefined;
}

async function loadExchangeRate() {
  if (exchangeRatePromise) return exchangeRatePromise;

  exchangeRatePromise = supabase
    .from("ExchangeRate")
    .select("Rate, status")
    .order("created_at", { ascending: false })
    .then(({ data, error }) => {
      if (error) throw error;

      const oldRateRow = data?.find(
        (row) => String(getField(row, "Status") || "").trim().toLowerCase() === "old"
      );
      const currentRateRow = data?.find(
        (row) => String(getField(row, "Status") || "").trim().toLowerCase() !== "old"
      );
      const currentRate = parseValidRate(getField(currentRateRow, "Rate"))
        ?? parseValidRate(getField(data?.[0], "Rate"));
      const oldRate = parseValidRate(getField(oldRateRow, "Rate"));

      if (oldRate) {
        oldExchangeRate.value = oldRate;
      } else if (oldRateRow) {
        console.warn("The Old exchange rate is zero or invalid; using the current rate for older bonuses.");
      }

      const rate = currentRate;
      if (!rate) {
        throw new Error("No exchange rate is configured.");
      }

      exchangeRate.value = rate;
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

  const convertCurrency = (amount, bonusDate) => {
    if (currencyType.value === "USD") {
      return new Decimal(amount);
    }

    const date = typeof bonusDate === "string" ? bonusDate.slice(0, 10) : "";
    const rate = date && date < "2026-08-01" && oldExchangeRate.value
      ? oldExchangeRate.value
      : exchangeRate.value;

    return rate
      ? new Decimal(amount).mul(rate)
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
