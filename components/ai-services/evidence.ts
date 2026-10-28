// Approved public portfolio captions and images from the reviewed services page.
export const portfolioCases = [
  {
    "id": "buff",
    "tab": "NPC Dialogue & AI Buffs",
    "title": "NPC Dialogue\n& AI Buffs",
    "summary": "NPC conversations that generate dialogue, player choices, and validated gameplay buffs in response to the encounter.",
    "slides": [
      {
        "src": "/ai-services/assets/native-buff-overview.webp",
        "label": "Dialogue & choices",
        "short": "Keep the interaction in its game context",
        "title": "Keep the interaction in its game context",
        "description": "Character dialogue and player choices respond to the encounter and connect the conversation to the game.",
        "alt": "NPC Dialogue & AI Buffs — Keep the interaction in its game context"
      },
      {
        "src": "/ai-services/assets/native-buff-effects.webp",
        "label": "Gameplay effects",
        "short": "Bring the effect into the encounter",
        "title": "Bring the effect into the encounter",
        "description": "A conversation can produce a structured buff response, validated against the game’s rules before the effect is applied.",
        "alt": "NPC Dialogue & AI Buffs — Bring the effect into the encounter"
      },
      {
        "src": "/ai-services/assets/native-buff-controls.webp",
        "label": "Story prompt",
        "short": "Shape the story instructions",
        "title": "Shape the story instructions",
        "description": "The pictured settings panel holds the story instructions and generation parameters.",
        "alt": "NPC Dialogue & AI Buffs — Shape the story instructions"
      },
      {
        "src": "/ai-services/assets/native-buff-npc-controls.webp",
        "label": "Character settings",
        "short": "Keep character direction in the designer’s hands",
        "title": "Keep character direction in the designer’s hands",
        "description": "The pictured character settings include the NPC’s name, role, and story context.",
        "alt": "NPC Dialogue & AI Buffs — Keep character direction in the designer’s hands"
      },
      {
        "src": "/ai-services/assets/native-buff-analysis.webp",
        "label": "Analysis",
        "short": "Inspect the session behind the moment",
        "title": "Inspect the session behind the moment",
        "description": "Follow dialogue, selected actions, and gameplay data to understand how an encounter unfolds.",
        "alt": "NPC Dialogue & AI Buffs — Inspect the session behind the moment"
      },
      {
        "src": "/ai-services/assets/native-buff-simulation.webp",
        "label": "Fast simulation",
        "short": "Review encounters across a simulation",
        "title": "Review encounters across a simulation",
        "description": "Use the sandbox’s simulation and analysis tools to review choices, outcomes, and gameplay effects.",
        "alt": "NPC Dialogue & AI Buffs — Review encounters across a simulation"
      }
    ]
  },
  {
    "id": "campaign",
    "tab": "AI-native storylines",
    "title": "AI-native\nstorylines",
    "summary": "Generate a storyline for each player or session, with chapter text, dialogue, and story direction that respond to game events, choices, and outcomes.",
    "slides": [
      {
        "src": "/ai-services/assets/native-campaign-archive.webp",
        "label": "Campaign archive",
        "short": "Read the chapter in its game context",
        "title": "Read the chapter in its game context",
        "description": "Read generated chapter briefings and dialogue alongside the mission context and the events that shape the narrative.",
        "alt": "AI-native storylines — Read the chapter in its game context"
      },
      {
        "src": "/ai-services/assets/native-campaign-tree.webp",
        "label": "Story tree",
        "short": "See the shape of the story",
        "title": "See the shape of the story",
        "description": "Follow the connections between scenes, character fates, and endings in a visual narrative tree.",
        "alt": "AI-native storylines — See the shape of the story"
      },
      {
        "src": "/ai-services/assets/native-campaign-simulator.webp",
        "label": "Campaign simulation",
        "short": "Follow the campaign through its report",
        "title": "Follow the campaign through its report",
        "description": "Review how the narrative service handles campaign scenarios, chapter flow, and validation through simulation reports.",
        "alt": "AI-native storylines — Follow the campaign through its report"
      },
      {
        "src": "/ai-services/assets/native-campaign-generation.webp",
        "label": "Generation history",
        "short": "Inspect how a chapter comes together",
        "title": "Inspect how a chapter comes together",
        "description": "Review the stages that contribute to a chapter, with their requests and results available for closer inspection.",
        "alt": "AI-native storylines — Inspect how a chapter comes together"
      }
    ]
  },
  {
    "id": "systems",
    "tab": "AI-native tech trees",
    "title": "AI-native\ntech trees",
    "summary": "Generate technologies and enhancements around each player’s campaign, so different playthroughs can develop different tech trees within the game’s rules.",
    "slides": [
      {
        "src": "/ai-services/assets/native-systems-tree-production.webp",
        "label": "Technology tree",
        "short": "Trace a discovery through its dependencies",
        "title": "Trace a discovery through its dependencies",
        "description": "Inspect prerequisites and production connections as distinct links, with the selected invention’s description, costs, and effects alongside.",
        "alt": "AI-native tech tree — technology tree showing the prerequisite and production connections around Resonance Crystal Forge"
      },
      {
        "src": "/ai-services/assets/native-systems-tree-evolution.webp",
        "label": "Progression branches",
        "short": "Follow an invention into new branches",
        "title": "Follow an invention into new branches",
        "description": "Follow Living Crystal Nursery into later research and buildings, exploring the connections that make an invention part of a wider progression.",
        "alt": "AI-native tech tree — technology tree showing Living Crystal Nursery and its later research and building branches"
      },
      {
        "src": "/ai-services/assets/native-sanguo-discovery-game.webp",
        "label": "Campaign discoveries",
        "short": "Turn discoveries into campaign research",
        "title": "Turn discoveries into campaign research",
        "description": "A strategy-game discovery opens new research and units, with effects connected to the campaign’s actions and locations.",
        "alt": "AI-native tech trees in a strategy campaign: a generated discovery and research effects shown beside the campaign map."
      },
      {
        "src": "/ai-services/assets/native-colony-invention-game.webp",
        "label": "Colony progression",
        "short": "Follow inventions through the colony",
        "title": "Follow inventions through the colony",
        "description": "The colony simulation connects each turn’s actions to inventions, resource production, research, and the available build catalog.",
        "alt": "AI-native tech-tree progression in a colony simulator showing turn actions, generated inventions, resource production, and the build catalog."
      }
    ]
  }
];

export const analyticsSlides = [
  {
    "id": "buff",
    "tab": "Buff behavior",
    "src": "/ai-services/assets/analytics-buff-panel.webp",
    "width": 1908,
    "height": 1306,
    "title": "NPC dialogue & rewards",
    "summary": "Review the rewards generated by NPC conversations, with effect types and gameplay magnitudes shown in their own context.",
    "detailTitle": "Inspect the distribution before tuning.",
    "description": "Compare 15 rewards across three campaigns. Damage and movement-speed increases have separate distributions, so different gameplay effects keep their own units and review criteria.",
    "short": "Review reward types and effect magnitudes",
    "alt": "NPC reward analytics: 15 rewards across 3 campaigns, 6 effect types, 45 model call records;damage and movement-speed magnitude distributions."
  },
  {
    "id": "story",
    "tab": "Story generation",
    "src": "/ai-services/assets/analytics-story-panel.webp",
    "width": 1908,
    "height": 1304,
    "title": "Adaptive story generation",
    "summary": "Review generation stages, narrative coverage, and the rule checks that keep story content connected to playable objectives.",
    "detailTitle": "Follow an issue through its repair.",
    "description": "Across six generated chapters, 18 stages show 15 first-pass acceptances and three repairs. The trace follows a missing mission target from rejection through one repair to accepted board setup.",
    "short": "Inspect generation checks and mission coverage",
    "alt": "Story analytics for 3 scenario runs and 6 generated chapters: 18 generation stages, 3 repair requests;mission mix and recorded rejected-target repair trace."
  },
  {
    "id": "tech-tree",
    "tab": "Tech-tree progression",
    "src": "/ai-services/assets/analytics-tech-tree-panel.webp",
    "width": 1908,
    "height": 1230,
    "title": "Tech-tree progression",
    "summary": "Follow how generated technologies, enhancements, and dependencies build a campaign’s progression.",
    "detailTitle": "Measure growth and effect balance.",
    "description": "Review 24 AI-origin objects across 87 simulated turns, including research, buildings, and resources. A separate strategy run shows the distribution of 10 research bonuses over 17 months.",
    "short": "Review catalog growth and research bonus balance",
    "alt": "Tech-tree analytics: 87 turns, 15 accepted model calls, 24 AI-origin objects and 83 prerequisite references;separate strategy run has 10 research effects averaging 8 percent."
  }
];
