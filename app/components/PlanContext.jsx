import { createContext, useContext } from "react";
import { Banner, Button } from "@shopify/polaris";
import { useNavigate } from "react-router";

const PlanContext = createContext({ isPro: false });

export function PlanProvider({ isPro, children }) {
  return (
    <PlanContext.Provider value={{ isPro }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}

/** Drop this banner at the top of any Pro-only page */
export function ProUpgradeBanner() {
  const navigate = useNavigate();
  return (
    <Banner
      title="This feature requires Cart Ninja Pro"
      tone="warning"
      action={{
        content: "Upgrade to Pro — 14-day free trial",
        onAction: () => navigate("/app/subscribe"),
      }}
    >
      Upgrade to unlock advanced analytics, usage billing tracking, and more.
    </Banner>
  );
}
