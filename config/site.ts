export const siteConfig = {
  name: "Arcane Forge",
  formspreeId: "xvgzjyyo",
  apiHost: process.env.NEXT_PUBLIC_API_HOST || "https://arcane-forge-service.dev.arcaneforge.ai",
  gamesApiHost: process.env.NEXT_PUBLIC_GAMES_API_HOST || "https://games.arcaneforge.ai",
  dashboardUrl: process.env.NEXT_PUBLIC_DASHBOARD_URL || "https://app.arcaneforge.ai",
  // You can add other global config values here
  // For example:
  // description: "AI-Powered Game Development, Simplified.",
  // social: {
  //   twitter: "https://twitter.com/...",
  //   github: "https://github.com/...",
  // }
} as const; 