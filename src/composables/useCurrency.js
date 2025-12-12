import { ref, watch } from "vue";
import Decimal from "decimal.js";

export function useCurrency() {
  const exchangeRate = new Decimal(600);
  const currencyType = ref("LC");

  const convertCurrency = (amount) => {
    if (currencyType.value === "USD") {
      return new Decimal(amount);
    }
    return new Decimal(amount).mul(exchangeRate); // Accurate, no rounding
  };

  watch(currencyType, (newVal) => {
    console.log(`Currency type changed to: ${newVal}`);
  });

  return {
    currencyType,
    convertCurrency,
  };
}
