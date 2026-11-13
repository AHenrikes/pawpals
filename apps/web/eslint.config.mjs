import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTypescript,
  {
    // The existing client effects intentionally initialize state from auth,
    // storage, and network data. Keep the previous lint baseline for this rule.
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
];

export default config;
