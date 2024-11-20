import { useTheme } from "next-themes";
import { Appearance } from "@stripe/stripe-js";

export function useStripeTheme() {
  const { theme } = useTheme();

  const appearance: Appearance = {
    theme: "stripe",
    variables: {
      colorPrimary: "#0F172A",
      colorBackground: theme === "dark" ? "#020617" : "#ffffff",
      colorText: theme === "dark" ? "#ffffff" : "#0F172A",
      colorDanger: "#DC2626",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "6px",
    },
    rules: {
      ".Input": {
        backgroundColor: theme === "dark" ? "#1E293B" : "#ffffff",
        border: `1px solid ${theme === "dark" ? "#334155" : "#E2E8F0"}`,
      },
      ".Input:focus": {
        border: `1px solid ${theme === "dark" ? "#94A3B8" : "#94A3B8"}`,
      },
      ".Label": {
        color: theme === "dark" ? "#E2E8F0" : "#1E293B",
      },
      ".Tab": {
        backgroundColor: theme === "dark" ? "#1E293B" : "#ffffff",
        border: `1px solid ${theme === "dark" ? "#334155" : "#E2E8F0"}`,
      },
      ".Tab:hover": {
        backgroundColor: theme === "dark" ? "#334155" : "#F8FAFC",
      },
      ".Tab--selected": {
        backgroundColor: theme === "dark" ? "#334155" : "#F1F5F9",
      },
      ".Error": {
        color: "#DC2626",
      },
    },
  };

  return appearance;
}
