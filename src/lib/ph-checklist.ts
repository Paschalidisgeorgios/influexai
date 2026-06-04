export type ChecklistItem = { id: string; label: string };
export type ChecklistSection = { title: string; items: ChecklistItem[] };

export const PH_CHECKLIST: ChecklistSection[] = [
  {
    title: "PRE-LAUNCH (1 week before)",
    items: [
      {
        id: "pre-profile",
        label: "ProductHunt Profil vollständig (Avatar, Bio, Links)",
      },
      { id: "pre-tagline", label: "Tagline finalisiert (max 60 Zeichen)" },
      {
        id: "pre-description",
        label: "Beschreibung geschrieben (250-300 Wörter)",
      },
      { id: "pre-thumbnail", label: "Thumbnail/Logo 240x240px vorbereitet" },
      {
        id: "pre-gallery",
        label: "Gallery Screenshots (min 3, max 6) erstellt",
      },
      {
        id: "pre-video",
        label: "Demo Video (optional aber empfohlen, 2-3 min)",
      },
      { id: "pre-maker", label: "Maker Comment vorgeschrieben" },
      {
        id: "pre-hunter",
        label: "Hunter gefunden (jemand mit Follower auf PH)",
      },
      {
        id: "pre-supporters",
        label: "50+ Supporter kontaktiert (Discord, Twitter, Newsletter)",
      },
      { id: "pre-day", label: "Launch Tag: Dienstag oder Mittwoch gewählt" },
      { id: "pre-time", label: "Launch Zeit: 00:01 PST (09:01 MESZ) geplant" },
    ],
  },
  {
    title: "LAUNCH DAY",
    items: [
      { id: "day-post", label: "Post live um 00:01 PST" },
      { id: "day-maker", label: "Maker Comment sofort posten" },
      {
        id: "day-notify",
        label: "Alle Supporter benachrichtigen (Template bereit)",
      },
      { id: "day-twitter", label: "Twitter/X Announcement gepostet" },
      { id: "day-linkedin", label: "LinkedIn Post gepostet" },
      {
        id: "day-reddit",
        label: "Reddit r/entrepreneur / r/SideProject gepostet",
      },
      { id: "day-reply", label: "Auf ALLE Kommentare innerhalb 1h antworten" },
      { id: "day-stats", label: "Stündlich Stats checken und feiern" },
    ],
  },
  {
    title: "POST-LAUNCH",
    items: [
      {
        id: "post-badge",
        label: '"We launched on ProductHunt" Badge auf Landing Page',
      },
      { id: "post-thanks", label: "Thank-you Tweet" },
      { id: "post-learnings", label: "Learnings dokumentieren" },
    ],
  },
];

export const PH_CHECKLIST_IDS = PH_CHECKLIST.flatMap((s) =>
  s.items.map((i) => i.id)
);

export const PH_CHECKLIST_TOTAL = PH_CHECKLIST_IDS.length;
