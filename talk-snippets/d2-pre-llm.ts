// Source: none in gen-ui. Illustrative shapes for the pre-LLM slide; not type-checked.
// Adaptive Cards: the real JSON card format (https://learn.microsoft.com/en-us/adaptive-cards/).
// Ghost Platform: field names from Airbnb's post "A Deep Dive into Airbnb's
// Server-Driven UI System" (Ryan Brooks, 29 Jun 2021): sections, screens,
// placements by section id, sectionComponentType. Payload shape abridged, not
// copied from a real response.

export const adaptiveCard = {
  type: "AdaptiveCard",
  version: "1.5",
  body: [
    { type: "TextBlock", text: "Revenue this month", weight: "Bolder" },
    { type: "FactSet", facts: [{ title: "Revenue", value: "$1.2M" }, { title: "Change", value: "+12%" }] },
  ],
};

export const ghostPlatformResponse = {
  sections: [{ id: "title", sectionComponentType: "TITLE", section: { title: "Revenue this month" } }],
  screens: [{ id: "root", layout: { placements: [{ sectionId: "title" }] } }],
};
