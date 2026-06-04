export type ChecklistItem = { id: string; label: string };
export type ChecklistSection = { title: string; items: ChecklistItem[] };

export const APP_STORE_CHECKLIST: ChecklistSection[] = [
  {
    title: "iOS APP STORE",
    items: [
      { id: "ios-icon", label: "App Icon 1024×1024px (PNG, no alpha)" },
      {
        id: "ios-screenshots-69",
        label: 'iPhone 6.9" Screenshots (1320×2868px) — min 3, max 10',
      },
      {
        id: "ios-screenshots-65",
        label: 'iPhone 6.5" Screenshots (1242×2688px)',
      },
      {
        id: "ios-ipad",
        label: 'iPad Pro 12.9" Screenshots (optional but recommended)',
      },
      {
        id: "ios-preview",
        label: "App Preview Video (optional, 15–30 sec, MP4)",
      },
      { id: "ios-name", label: "App Name (max 30 chars)" },
      { id: "ios-subtitle", label: "Subtitle (max 30 chars)" },
      { id: "ios-description", label: "Description (max 4000 chars)" },
      {
        id: "ios-keywords",
        label: "Keywords (max 100 chars, comma separated)",
      },
      { id: "ios-privacy", label: "Privacy Policy URL live" },
      { id: "ios-support", label: "Support URL live" },
      { id: "ios-age", label: "Age Rating completed (likely 4+)" },
      { id: "ios-review-notes", label: "App Review Notes written" },
      { id: "ios-dev-account", label: "Apple Developer Account ($99/year)" },
      { id: "ios-bundle", label: "Bundle ID registered: com.influexai.app" },
    ],
  },
  {
    title: "GOOGLE PLAY",
    items: [
      { id: "play-icon", label: "App Icon 512×512px (PNG)" },
      { id: "play-feature", label: "Feature Graphic 1024×500px" },
      { id: "play-screenshots", label: "Phone Screenshots (min 2, max 8)" },
      { id: "play-short", label: "Short Description (max 80 chars)" },
      { id: "play-full", label: "Full Description (max 4000 chars)" },
      { id: "play-category", label: "App Category selected: Productivity" },
      { id: "play-rating", label: "Content Rating completed" },
      { id: "play-privacy", label: "Privacy Policy URL live" },
      {
        id: "play-console",
        label: "Google Play Console Account ($25 one-time)",
      },
      { id: "play-package", label: "Package name: com.influexai.app" },
    ],
  },
];

export const APP_STORE_CHECKLIST_IDS = APP_STORE_CHECKLIST.flatMap((s) =>
  s.items.map((i) => i.id)
);

export const APP_STORE_CHECKLIST_TOTAL = APP_STORE_CHECKLIST_IDS.length;

export type ScreenshotConcept = {
  id: string;
  screen: string;
  description: string;
  highlights: string[];
  headline: string;
  frameBg: string;
};

export const SCREENSHOT_CONCEPTS: ScreenshotConcept[] = [
  {
    id: "dashboard",
    screen: "Home Dashboard",
    description:
      "Übersicht aller KI-Flows (Script, Niche, Outlier, Thumbnail, Remix).",
    highlights: ["Flow-Karten Grid", "Credits-Badge oben", "NEU-Badges"],
    headline: "Alle KI-Tools auf einen Blick",
    frameBg: "#060608",
  },
  {
    id: "script",
    screen: "Script Generator",
    description:
      "Thema eingegeben, Generierung läuft oder Ergebnis mit Hook/Main/CTA.",
    highlights: ["Topic-Input", "Generieren-Button", "Script-Output"],
    headline: "Script in 30 Sekunden",
    frameBg: "#0f0f12",
  },
  {
    id: "results",
    screen: "Results Screen",
    description: "Niche Analyzer oder Outlier-Ergebnisse mit klaren Metriken.",
    highlights: ["Score/Karten", "Copy-Button", "Speichern-Aktion"],
    headline: "Professionelle Ergebnisse sofort",
    frameBg: "#18181d",
  },
  {
    id: "community",
    screen: "Community",
    description: "Community-Feed mit Wins, Ideen und Challenge-Banner.",
    highlights: ["Challenge Banner", "Post-Karten", "Engagement"],
    headline: "Lerne von anderen Creatorn",
    frameBg: "#060608",
  },
  {
    id: "credits",
    screen: "Credits / Pricing",
    description: "Credit-Balance und Pakete (Starter, Creator, Pro).",
    highlights: ["Guthaben groß", "Paket-Karten", "Kein Abo-Hinweis"],
    headline: "Faire Preise, keine Abos",
    frameBg: "#0f0f12",
  },
];

export const LAUNCH_TIMELINE = [
  {
    id: "w-2",
    phase: "Week -2",
    title: "Submit for review",
    detail: "Apple: 1–3 days · Google Play: 1–7 days",
    status: "upcoming" as const,
  },
  {
    id: "w-1",
    phase: "Week -1",
    title: "Launch marketing prep",
    detail: "Social posts, email drafts, press kit",
    status: "upcoming" as const,
  },
  {
    id: "d0-push",
    phase: "Day 0",
    title: "App goes live",
    detail: 'Push to web users: "📱 InfluexAI ist jetzt im App Store!"',
    status: "launch" as const,
  },
  {
    id: "d0-email",
    phase: "Day 0",
    title: "Email campaign",
    detail: '"Die App ist da! Hol dir InfluexAI auf dein Handy."',
    status: "launch" as const,
  },
  {
    id: "d1-7",
    phase: "Day 1–7",
    title: "Review responses",
    detail: "Respond to all App Store & Play reviews immediately",
    status: "active" as const,
  },
  {
    id: "w2",
    phase: "Week 2",
    title: "First update",
    detail: "Bug fixes — shows active development",
    status: "upcoming" as const,
  },
];

export const EAS_JSON_EXAMPLE = `{
  "build": {
    "preview": {
      "distribution": "internal",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" }
    },
    "production": {
      "ios": { "autoIncrement": true },
      "android": { "autoIncrement": true }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "YOUR_APP_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production"
      }
    }
  }
}`;

export const EAS_COMMANDS = `# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS (TestFlight first)
eas build --platform ios --profile preview

# Build for Android (internal testing first)
eas build --platform android --profile preview

# Submit to App Store (after build)
eas submit --platform ios

# Submit to Google Play
eas submit --platform android`;
