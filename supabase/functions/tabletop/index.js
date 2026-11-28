// File generato da scripts/build-edge.mjs: non modificarlo a mano.

// supabase/functions/tabletop/main.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// src/game-v3/catalog-types.ts
var FACTIONS = ["Iran", "Coalizione", "Russia", "Cina", "Europa"];
var TRACKS = ["Economia", "Militare", "Diplomazia", "Consenso"];

// src/game-v3/catalog-data.json
var catalog_data_default = {
  provenance: {
    rulebook: "Linea_Rossa_Regolamento_illustrato_v3 (11)_7919-dacf60d92f86c3e8.pdf",
    rulebookSha256: "cf5ba48d604be4690a26f38af8687d6e9784c1b1519febc3fb047a656a620990",
    rulebookPageCount: 49,
    pages: {
      factionCards: "28\u201339",
      bots: "40\u201344",
      events: "45\u201346",
      objectives: "47\u201349",
      correlations: "9\u201310",
      units: "18\u201319",
      initialTracks: "5"
    },
    extraction: "pdftotext -bbox-layout; printed cells verbatim, whitespace normalized",
    eventTurns: "All 75 supplied Mazzo_Eventi/fronti original images, order icons AND printed Avanzano names visually verified; explicit source table VERIFIED_EVENT_TURNS in importer, independent of legacy eventi.ts.",
    eventTurnVerifiedIds: [
      "E01",
      "E02",
      "E03",
      "E04",
      "E05",
      "E06",
      "E07",
      "E08",
      "E09",
      "E10",
      "E11",
      "E12",
      "E13",
      "E14",
      "E15",
      "E16",
      "E17",
      "E18",
      "E19",
      "E20",
      "E21",
      "E22",
      "E23",
      "E24",
      "E25",
      "E26",
      "E27",
      "E28",
      "E29",
      "E30",
      "E31",
      "E32",
      "E33",
      "E34",
      "E35",
      "E36",
      "E37",
      "E38",
      "E39",
      "E40",
      "E41",
      "E42",
      "E43",
      "E44",
      "E45",
      "E46",
      "E47",
      "E48",
      "E49",
      "E50",
      "E51",
      "E52",
      "E53",
      "E54",
      "E55",
      "E56",
      "E57",
      "E58",
      "E59",
      "E60",
      "E61",
      "E62",
      "E63",
      "E64",
      "E65",
      "E66",
      "E67",
      "E68",
      "E69",
      "E70",
      "E71",
      "E72",
      "E73",
      "E74",
      "E75"
    ],
    eventTurnSource: "LineaRossa_Mazzo_Eventi-f05d663e27bdf92e.zip",
    eventTurnVerification: "375 order positions and all 75 Avanzano fields checked on diagnostic contact sheets; no discrepancies with legacy values.",
    unlockFlags: "src/data/mazzi.ts unlocks_special matched by exact ID; appendix A omits these flags",
    unlockRule: "Compatibility metadata only: latest rulebook p13 mixes all 15 specials into the shared deck; no unlock or separate reserve applies to new games.",
    sourceVerifiedUnlockIds: [
      "C004",
      "C006",
      "C015"
    ],
    unlockGraphicAudit: "All 78 supplied ZIP faction fronts checked by OCR AND visually at the fixed unlock-banner region; only C004/C006/C015 have a banner. These three complete fronts also visually verified.",
    legacyOnlyUnlockIds: [
      "C032",
      "C045",
      "NI34"
    ],
    unmatchedLegacyUnlockIds: [],
    board: "Linea_Rossa_Tabellone_corretto (2)-911f6aba85683265.jpg; visual transcription",
    rulings: [
      "Corrected rulebook p17/p19: one defending Scudo Missilistico cancels all attacking Missili balistici bonuses. No override of the latest PDF is required."
    ],
    gaps: [
      "Unlock flags C032/C045/NI34 are inherited by exact ID, not independently graphic-verified: corresponding original fronts are absent from the supplied faction ZIPs. Appendix A does not list unlock flags. No additional flags are invented.",
      "Rulebook p22 specifies an Influence-at-end-of-round State printed in each BOT card header, but Appendix B supplies only ID, title, condition P1, priority 1 and priority 2. Influence territories for all 120 BOT cards are absent from this source and are not inferred from deployment priorities."
    ]
  },
  factionCards: [
    {
      id: "C073C",
      name: "Veto ONU Cina",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C088C",
      name: "Mediazione Diplomatica Cina",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C096C",
      name: "Blocco Sanzioni ONU Cina",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C084C",
      name: "Accordo BRICS Cina",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN02",
      name: "Veto Cina-Russia Congiunto",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN06",
      name: "Blocco Sanzioni Cina ONU",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN09",
      name: "Piano Pace Xi Mar 2026",
      origin: "Cina",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN10",
      name: "Accordo Trilaterale Cina- Iran-Pak",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN12",
      name: "Accordo Con Arabia Saudita",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN13",
      name: "Proposta Cessate il Fuoco Mar",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN16",
      name: "Mediazione Iran-Arabia Saudita 2",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN20",
      name: "Summit ASEAN + Iran",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN26",
      name: "Visita Xi a Tehran Mar 2026",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN28",
      name: "Summit SCO Cina Mar 2026",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN34",
      name: "Veto Cina su Sanzioni Gas",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN36",
      name: "Accordo Mar Caspio Cina",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN38",
      name: "Piano Umanitario Cina",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN40",
      name: "Accordo Storico Cina- Iran-Russia",
      origin: "Cina",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C075C",
      name: "Belt and Road Cina",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C078C",
      name: "Accordo Energia Cina",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C082C",
      name: "Tecnologia Nucleare Cina",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C086C",
      name: "De-dollarizzazione Cina",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C090C",
      name: "Porto di Chabahar",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C092C",
      name: "Ferrovia Cina-Iran",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C095C",
      name: "Investimenti Petrolio Cina",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C083C2",
      name: "Espansione BRICS Cina",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C087C",
      name: "Rotte Commerciali Cina",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN01",
      name: "Accordo Petrolio RMB Mar 2026",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN03",
      name: "Piano 25 anni Upgrade",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN04",
      name: "Yuan come Riserva Regionale",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN05",
      name: "BRICS Development Bank Iran",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN07",
      name: "Ferrovia Speed Rail Cina- Iran",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN14",
      name: "Accordo Mar 2026 con Qatar",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN15",
      name: "Accordo Chabahar Port 2.0",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN18",
      name: "Accordo con Iraq Mar 2026",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN21",
      name: "Accordo Tecnologico Huawei-Iran",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN22",
      name: "De-dollarizzazione Accelerata",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN24",
      name: "Progetto BRI Energia",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN25",
      name: "Accordo Agricoltura Iran- Cina",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN27",
      name: "Accordo Moneta Digitale",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN32",
      name: "Investimenti Porto Hormuz",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN35",
      name: "Proposta Roadmap Energia",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN39",
      name: "Accordo Ferrovia Kurdistan-Cina",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C091C",
      name: "Propaganda CGTN",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN08",
      name: "Propaganda Xinhua Mar 2026",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C094C",
      name: "Accordo Militare Cina",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C076C",
      name: "Esercitazioni Navali Cina",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN17",
      name: "Pattuglia Navale Golfo Cina",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN19",
      name: "Fornitura Radar Cinesi",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN29",
      name: "Portacontainer Stretto Hormuz",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN30",
      name: "Finanziamento Catena Droni",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN31",
      name: "Accordo Militare Trilaterale",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN33",
      name: "Fornitura Sistemi EW Cina",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C083C",
      name: "Crisi Taiwan",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C093C",
      name: "Satellite Spia Cina",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN11",
      name: "Operazione Cyber Contro USA",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN23",
      name: "Accordo Spaziale Cina- Iran",
      origin: "Cina",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NN37",
      name: "Cyberattacco su AIEA",
      origin: "Cina",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C003",
      name: "Diplomazia Shuttle",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C005",
      name: "Accordo Abraham Plus",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C009",
      name: "Negoziato Vienna",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C013",
      name: "Pressione ONU",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C018",
      name: "Accordo Difesa Saudita",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C022",
      name: "Summit Camp David",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C024",
      name: "Rilascio Prigionieri",
      origin: "Coalizione",
      cost: 1,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC01",
      name: "Accordo AIEA Mar 2026",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC02",
      name: "Risoluzione ONU 2891",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC04",
      name: "Proposta JCPOA 3.0",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC05",
      name: "Summit G7 Iran Mar 2026",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC09",
      name: "Mandato Internazionale Mojtaba",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC11",
      name: "Accordo Sauditi-Israele Mar",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC14",
      name: "Pressione Turchia-NATO",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC16",
      name: "Piano di Stabilita Iran",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC17",
      name: "Accordo Transizione Pacifica",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC21",
      name: "Accordo Oman- Mediazione Coal",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC25",
      name: "Pressione India-USA",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC26",
      name: "AIEA Accesso Immediato",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC27",
      name: "Accordo Lega Araba Mar",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC29",
      name: "Accordo Pakistan-USA",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC35",
      name: "Accordo UAE Mar 2026",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC36",
      name: "Proposta Umanitaria ONU",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC40",
      name: "Proposta Pace Definitiva",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "SE_C04",
      name: "Accordo Nucleare Last Minute (spec.)",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "C002",
      name: "Sanzioni SWIFT",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C010",
      name: "Embargo Petrolifero",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C016",
      name: "Sanzioni Secondarie",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C021",
      name: "Congelamento Asset",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC03",
      name: "IEA \u2014 Rilascio Riserve",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC06",
      name: "LNG Qatar verso Europa",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC07",
      name: "Pipeline Alternativa Arabia",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC10",
      name: "Piano Marshall Medio Oriente",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC18",
      name: "Sanzioni Su Mojtaba",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC23",
      name: "Blocco Finanziario SWIFT Plus",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC31",
      name: "Embargo Armi Iran Rafforzato",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC37",
      name: "Sanzioni Precisione Energetica",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "SE_C05",
      name: "Sanzioni Totali (spec.) (spec.)",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "C007",
      name: "Pressione Mediatica CNN",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C019",
      name: "Propaganda VOA",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC32",
      name: "Operazione Psicologica Iran",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C001",
      name: "Portaerei nel Golfo",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C006",
      name: "Strike Chirurgico",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: true
    },
    {
      id: "C008",
      name: "Aiuti Militari Israele",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C011",
      name: "Base Avanzata Qatar",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C014",
      name: "Difesa Missilistica THAAD",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C015",
      name: "Operazione Freedom",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: true
    },
    {
      id: "C020",
      name: "Blocco Navale",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C023",
      name: "Droni Predator",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC08",
      name: "Operazione Congiunta NATO-IDF",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC13",
      name: "Droni Reaper Mar 2026",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC19",
      name: "Operazione Bunker Buster B2",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC22",
      name: "Supporto IDF Mar 2026",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC24",
      name: "Task Force Marina Mar 2026",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC33",
      name: "Accordo Bahrain-Difesa",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC34",
      name: "Droni Acquatici nel Golfo",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC39",
      name: "Accordo Cipro-Basi NATO",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "SE_C03",
      name: "Strike F-35 (spec.) (spec.)",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "SE_C06",
      name: "Operazione Smantellamento (spec.)",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "SC_ATK01",
      name: "Strike su Natanz (spec.)",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "SC_ATK02",
      name: "Operazione Bunker Buster (spec.)",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "NC20",
      name: "Midterm USA come freno",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC30",
      name: "Risoluzione Camera USA",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C004",
      name: "Cyber Attack Stuxnet 2.0",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: true
    },
    {
      id: "C012",
      name: "Intelligence Sharing",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C017",
      name: "Supporto Opposizione",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC12",
      name: "Cyber Strike su IRGC",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC15",
      name: "Aiuti Opposizione Iran",
      origin: "Coalizione",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC28",
      name: "Sabotaggio Gas S. Pars",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NC38",
      name: "Intercettazione Fondi IRGC",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "SE_C01",
      name: "Sabotaggio Fordow (spec.) (spec.)",
      origin: "Coalizione",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "SE_C02",
      name: "Operazione Mossad (spec.) (spec.)",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "SC_ATK03",
      name: "Cyberattack Sistemi Missilistici (spec.)",
      origin: "Coalizione",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "C097",
      name: "Mediazione UE",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C101",
      name: "Diplomazia E3",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C103",
      name: "Pressione Diritti Umani",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C105",
      name: "Rilancio JCPOA",
      origin: "Europa",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C108",
      name: "Dialogo Critico",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C111",
      name: "Accordo Turchia",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C114",
      name: "Conferenza di Pace",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C116",
      name: "Accordo Migranti",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE01",
      name: "JCPOA 3.0 Proposta UE",
      origin: "Europa",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE02",
      name: "Missione Borrell Mar 2026",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE04",
      name: "Accordo AIEA-UE Mar 2026",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE05",
      name: "Missione Macron a Tehran",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE06",
      name: "Accordo Scholz-Iran Canale",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE07",
      name: "Piano Pace E3 Mar 2026",
      origin: "Europa",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE08",
      name: "Conferenza Vienna Bis",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE09",
      name: "Mediazione Svizzera UE",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE14",
      name: "Missione Umanitaria UN- UE",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE19",
      name: "Accordo Israele-UE Mar 2026",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE20",
      name: "Crisi Rifugiati Iran- Turchia",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE22",
      name: "Accordo Giordania-UE",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE26",
      name: "Pressione Diplomatica su Cina",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE27",
      name: "Accordo Turchia-UE Transito",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE28",
      name: "Mediazione Alto Rapp. UE",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE31",
      name: "Proposta Conferenza Sicurezza",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE38",
      name: "Accordo Egitto-UE Mediazione",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE40",
      name: "Soluzione Diplomatica Definitiva",
      origin: "Europa",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C099",
      name: "INSTEX Attivo",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C102",
      name: "Aiuti Umanitari UE",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C104",
      name: "Accordo Gas Alternativo",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C107",
      name: "Sanzioni Mirate",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C109",
      name: "Investimenti Ricostruzione",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C113",
      name: "Diplomazia Energetica",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C117",
      name: "Tecnologia Verde",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C120",
      name: "Accordo Commerciale UE",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE03",
      name: "Corridoio Energetico UE",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE10",
      name: "Crisi Energetica Europa Mar",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE11",
      name: "Piano Energie Rinnovabili UE",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE12",
      name: "Accordo Qatar LNG Mar 2026",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE13",
      name: "Solidarieta UE Post- Strike",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE15",
      name: "Aiuti Civili Post- Bombardamento",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE17",
      name: "Sanzioni Mirate UE su IRGC",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE18",
      name: "Pressione su Russia \u2014 Gas UE",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE21",
      name: "Piano Stabilizzazione Regionale",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE23",
      name: "Embargo Gas Russo UE",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE24",
      name: "Accordo Azerbaigian-UE Gas",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE25",
      name: "Fondo Emergenza UE 100mld",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE29",
      name: "Rilancio INSTEX Mar 2026",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE30",
      name: "Piano Crisi Energetica 2026",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE33",
      name: "Accordo Libia-UE Energia",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE35",
      name: "Piano Ricostruzione Post-Guerra",
      origin: "Europa",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE39",
      name: "Fondo Umanitario ECHO",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C110",
      name: "Pressione Mediatica UE",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C119",
      name: "Embargo Armi UE",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE34",
      name: "Embargo Armi UE Rafforzato",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE36",
      name: "Accordo Grecia-Cipro Basi",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE37",
      name: "Missione EUFOR Iran",
      origin: "Europa",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE16",
      name: "Risoluzione Parlamento Europeo",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NE32",
      name: "Dichiarazione G7 Energia",
      origin: "Europa",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C027",
      name: "Diplomazia Regionale",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C033",
      name: "Negoziato JCPOA",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C037",
      name: "Accordo SCO",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C042",
      name: "Diplomazia Oman",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C046",
      name: "Accordo Baghdad",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C048",
      name: "Moratoria Nucleare",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI06",
      name: "Piano 15 punti Trump via Pakistan",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI07",
      name: "Risposta Iran al Piano Trump",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI09",
      name: "Negoziati di Ginevra Mar 2026",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI10",
      name: "Cessate il Fuoco Temporaneo",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI11",
      name: "Accordo Scambio Prigionieri",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI12",
      name: "Distensione Parziale",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI13",
      name: "Proposta Moratoria 3 mesi",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI33",
      name: "Accordo Oman- Mediazione",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI39",
      name: "Offerta Pace con Condizioni",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "SE_I04",
      name: "Accordo Sorpresa (spec.) (spec.)",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "C029",
      name: "Accordo Petrolio Cina",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C040",
      name: "Commercio Alternativo",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI04",
      name: "Petrolio a 130 dollari",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI20",
      name: "Accordo Gas Russia-Iran Mar",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI21",
      name: "Moratoria Export Petrolio",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI22",
      name: "Crisi Valutaria Rial",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI23",
      name: "Piano Ricostruzione Post-Strike",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI24",
      name: "Accordo BRICS Mar 2026",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI29",
      name: "Petroldollari in Yuan",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI35",
      name: "Accordo Qatar-Gas",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI38",
      name: "Accordo India-Iran Mar",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI40",
      name: "Crisi Economica Sanzioni Mar",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "SE_I06",
      name: "Alleanza BRICS Nucleare (spec.) (spec.)",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "C031",
      name: "Propaganda Press TV",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C044",
      name: "Propaganda Anti-USA",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI16",
      name: "Marcia Funebre a Teheran",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI17",
      name: "Propaganda Nuovo Regime",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C025",
      name: "Arricchimento Uranio 60%",
      origin: "Iran",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C026",
      name: "Proxy Hezbollah",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C028",
      name: "Attacco Droni Houthi",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C030",
      name: "Test Missile Balistico",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C032",
      name: "Centrifughe Avanzate",
      origin: "Iran",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: true
    },
    {
      id: "C034",
      name: "Sequestro Petroliera",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C035",
      name: "Asse della Resistenza",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C038",
      name: "Milizie Iraq",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C039",
      name: "Deterrenza Nucleare",
      origin: "Iran",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C041",
      name: "Supporto Hamas",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C043",
      name: "Esercitazioni Navali",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C047",
      name: "Rappresaglia Missilistica",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI03",
      name: "Chiusura Stretto di Hormuz",
      origin: "Iran",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI05",
      name: "Attivazione Houthi 28 mar",
      origin: "Iran",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI14",
      name: "Attacco Fordow Tunnel B",
      origin: "Iran",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI15",
      name: "Milizie Syria Attivate",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI19",
      name: "Rafah 2.0 - Supporto Gaza",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI25",
      name: "Missile Shabab-5 Test",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI26",
      name: "Accordo Militare Siria",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI30",
      name: "Alleanza Houthi- Hezbollah Mar",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI34",
      name: "Dichiarazione Soglia Zero",
      origin: "Iran",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: true
    },
    {
      id: "NI37",
      name: "Drone Suicide Mar 2026",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "SE_I01",
      name: "Centrifughe IR-9 (spec.) (spec.)",
      origin: "Iran",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "SE_I03",
      name: "Uranio 90% (spec.) (spec.)",
      origin: "Iran",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "SE_I05",
      name: "Tecnologia Missilistica (spec.) (spec.)",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "NI01",
      name: "Morte di Khamenei",
      origin: "Iran",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI02",
      name: "Nomina Mojtaba Khamenei",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI27",
      name: "Crisi Successione Interna",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI28",
      name: "IRGC Assume Controllo",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI31",
      name: "Disordini Interni Post- Khamenei",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI32",
      name: "Repressione IRGC",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C036",
      name: "Cyber Difesa",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C045",
      name: "Sito Nucleare Segreto",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: true
    },
    {
      id: "NI08",
      name: "Bombardamento Natanz",
      origin: "Iran",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI18",
      name: "Cyber Attacco su Haifa",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NI36",
      name: "Santuario Qom Blindato",
      origin: "Iran",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "SE_I02",
      name: "Sito Sotterraneo (spec.) (spec.)",
      origin: "Iran",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        }
      ],
      special: true,
      unlocksSpecial: false
    },
    {
      id: "NT03",
      name: "ONU Sessione Emergenza",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT06",
      name: "Piano Trump 15 Punti",
      origin: "Neutrale",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT09",
      name: "Cessate il Fuoco Unilaterale",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT11",
      name: "Summit ONU Emergenza Mar 2026",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT15",
      name: "Accordo Qatar Mediazione",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT18",
      name: "Proposta Peace Nobel Committee",
      origin: "Neutrale",
      cost: 1,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT20",
      name: "ONU \u2014 Risoluzione 2892",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT23",
      name: "Accordo India-Pakistan Neutralita",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT24",
      name: "Turchia \u2014 Mediazione Attiva",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT27",
      name: "Accordo di Evacuazione Civili",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT28",
      name: "Report AIEA Mar 2026",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT30",
      name: "Segnali Pace Regionale",
      origin: "Neutrale",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT07",
      name: "Mercati Finanziari Panico",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT16",
      name: "Crollo Rial Iraniano",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT21",
      name: "Crisi Shipping Globale",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT25",
      name: "Crisi Liquidity Banche Regionali",
      origin: "Neutrale",
      cost: 1,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT01",
      name: "Notizie Morte Khamenei",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT02",
      name: "Petrolio 130$ shock",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT04",
      name: "Crisi Stretto di Hormuz",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT08",
      name: "Emergenza Nucleare AIEA",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT10",
      name: "Crisi Profughi Regionale",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT13",
      name: "Blocco Canale di Suez",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT29",
      name: "Crisi Alimentare Medio Oriente",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT22",
      name: "Tweet Trump su Iran",
      origin: "Neutrale",
      cost: 1,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT05",
      name: "Drone Houthi Supertanker",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT12",
      name: "Pirateria Golfo di Aden",
      origin: "Neutrale",
      cost: 1,
      options: [
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT14",
      name: "Dimissioni Governo Kuwait",
      origin: "Neutrale",
      cost: 1,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT19",
      name: "Terremoto Politico in Israele",
      origin: "Neutrale",
      cost: 1,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT26",
      name: "Discorso Mojtaba alla Nazione",
      origin: "Neutrale",
      cost: 1,
      options: [
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NT17",
      name: "Attacco Cyber su Pipeline Saudita",
      origin: "Neutrale",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C073R",
      name: "Veto ONU Russia",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C080R",
      name: "Summit SCO Russia",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C088R",
      name: "Mediazione Pechino",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR02",
      name: "Veto ONU Risoluzione Iran Mar",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR05",
      name: "Veto su Missione AIEA",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR09",
      name: "Piano Pace Putin Mar 2026",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR10",
      name: "Summit Astana Mar 2026",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR11",
      name: "Offerta Mediazione Mosca",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR12",
      name: "Corridoio Umanitario Russia",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR19",
      name: "Accordo Mar Caspio Russia",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR21",
      name: "Garanzie Sicurezza Mosca",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR27",
      name: "Isolamento Diplomatico USA",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR28",
      name: "Accordo SCO Allargato Mar",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR30",
      name: "Offerta Armenia come Buffer",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR34",
      name: "Piano Reintegro Iran in SCO",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR37",
      name: "Cerimonia SCO Allargata",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR40",
      name: "Piano Pace Proposta All- In",
      origin: "Russia",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Crisi Bellica",
              delta: 1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C075R",
      name: "Belt and Road Iran",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C078R",
      name: "Accordo Energia Russia- Iran",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C082R",
      name: "Tecnologia Nucleare Civile",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C086R",
      name: "De-dollarizzazione",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C090R",
      name: "Corridoio Nord-Sud",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR01",
      name: "SPFS Alternativo SWIFT",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR03",
      name: "Petrolio in Rubli",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR04",
      name: "Accordo Gas Turchia- Russia",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR06",
      name: "Fornitura Uranio Arricchito",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR15",
      name: "Pipeline Kashagan Russia",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR16",
      name: "Commercio Iran-Russia Mar",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: [
            {
              track: "Sanzioni",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR23",
      name: "Accordo Cereali-Iran",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR29",
      name: "Energia Nucleare Rosatom",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR32",
      name: "Rete Bancaria Alternativa",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR36",
      name: "Accordo Energetico Storico Mar",
      origin: "Russia",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C077R",
      name: "Propaganda RT",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C091R",
      name: "Disinformazione",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR14",
      name: "Disinformazione Post- Khamenei",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR24",
      name: "Propaganda Multilingua",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR39",
      name: "Propaganda RT Arabia Saudita",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C074R",
      name: "Vendita S-400",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C076R",
      name: "Esercitazioni Congiunte",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C079R",
      name: "Supporto Assad",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C085R",
      name: "Droni Shahed",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C087R",
      name: "Base Navale Tartus",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C089R",
      name: "Armi Avanzate Russia",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Economia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C094R",
      name: "Accordo Militare Russia",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR07",
      name: "Truppe Wagner in Siria",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR08",
      name: "Tecnologia S-500 a Iran",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR13",
      name: "Esercitazioni Russia- Cina-Iran",
      origin: "Russia",
      cost: 4,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 3
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 3
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR18",
      name: "Minaccia Escalation Nucleare",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: [
            {
              track: "Nucleare",
              delta: -1
            }
          ]
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR22",
      name: "Blocco Ormuz Russia",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR25",
      name: "Base Navale Bandar Abbas",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR26",
      name: "Fornitura Missili Ipersonici",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Militare",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR31",
      name: "Accordo Drone Shahed 3.0",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Economia",
            delta: 2
          },
          correlation: {
            faction: "Cina",
            track: "Economia",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR33",
      name: "Operazione Speciale Siria Mar",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR35",
      name: "Difesa Anti-Drone Regionale",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Militare",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Economia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "C081R",
      name: "Cyber Warfare Russia",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR17",
      name: "Difesa Cosmica Russa",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Consenso",
            delta: 1
          },
          globals: []
        },
        {
          boost: {
            faction: "Cina",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Militare",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR20",
      name: "Cyberattacco Congiunto",
      origin: "Russia",
      cost: 2,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          globals: [
            {
              track: "Opinione",
              delta: -1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: -1
          },
          globals: [
            {
              track: "Opinione",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Coalizione",
            track: "Militare",
            delta: 1
          },
          correlation: {
            faction: "Cina",
            track: "Consenso",
            delta: -1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    },
    {
      id: "NR38",
      name: "Assistenza Tecnica Nucleare",
      origin: "Russia",
      cost: 3,
      options: [
        {
          boost: {
            faction: "Russia",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Coalizione",
            track: "Diplomazia",
            delta: -1
          },
          globals: []
        },
        {
          boost: {
            faction: "Iran",
            track: "Consenso",
            delta: 2
          },
          correlation: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 1
          },
          globals: [
            {
              track: "Nucleare",
              delta: 1
            }
          ]
        },
        {
          boost: {
            faction: "Europa",
            track: "Diplomazia",
            delta: 2
          },
          correlation: {
            faction: "Iran",
            track: "Diplomazia",
            delta: 1
          },
          globals: []
        }
      ],
      special: false,
      unlocksSpecial: false
    }
  ],
  bots: [
    {
      id: "BOT-IR-E1",
      name: "Petrolio di contrabbando",
      faction: "Iran",
      track: "Economia",
      condition: "Sanzioni \u2265 7",
      priority1: "Sviluppo Economia \xB7 Sanzioni \u22121",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-IR-E2",
      name: "Accordo con Pechino",
      faction: "Iran",
      track: "Economia",
      condition: "Cina Economia \u2265 7",
      priority1: "Sviluppo Economia \xD72",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-IR-E3",
      name: "Zone economiche speciali",
      faction: "Iran",
      track: "Economia",
      condition: "Iran Consenso \u2264 3",
      priority1: "Sviluppo Economia \xB7 Sviluppo Consenso",
      priority2: "Sviluppo Economia \xB7 Opinione \u22121"
    },
    {
      id: "BOT-IR-E4",
      name: "Fondo sovrano",
      faction: "Iran",
      track: "Economia",
      condition: "Iran Economia \u2264 2",
      priority1: "Sviluppo Economia \xD72",
      priority2: "Sviluppo Economia \xB7 Schiera Forze convenzionali"
    },
    {
      id: "BOT-IR-E5",
      name: "Esportazioni verso l'Iraq",
      faction: "Iran",
      track: "Economia",
      condition: "Iran ha un'unit\xE0 in Iraq",
      priority1: "Sviluppo Economia \xB7 Sanzioni \u22121",
      priority2: "Schiera Proxy regionali in Iraq \xB7 Sviluppo Economia"
    },
    {
      id: "BOT-IR-E6",
      name: "Bazar di Teheran",
      faction: "Iran",
      track: "Economia",
      condition: "Opinione \u2264 \u22123",
      priority1: "Sviluppo Economia \xB7 Sviluppo Diplomazia",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-IR-M1",
      name: "Esercitazione IRGC",
      faction: "Iran",
      track: "Militare",
      condition: "Crisi Bellica \u2265 6",
      priority1: "Schiera IRGC in Iran \xB7 Sviluppo Militare",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-IR-M2",
      name: "Flotta dello Stretto",
      faction: "Iran",
      track: "Militare",
      condition: "Meno di 2 Flotte veloci nello Stretto di Hormuz",
      priority1: "Schiera Flotta veloce del Golfo nello Stretto di Hormuz",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-IR-M3",
      name: "Asse della resistenza",
      faction: "Iran",
      track: "Militare",
      condition: "La Coalizione ha unit\xE0 in Siria, Libano, Iraq o Yemen",
      priority1: "Schiera Proxy regionali in quel territorio \xB7 Sviluppo Militare",
      priority2: "Schiera Proxy regionali"
    },
    {
      id: "BOT-IR-M4",
      name: "Arsenale missilistico",
      faction: "Iran",
      track: "Militare",
      condition: "Nucleare \u2265 9 e Crisi Bellica \u2265 5",
      priority1: "Schiera Missili balistici \xB7 Nucleare +1",
      priority2: "Sviluppo Militare \xB7 Nucleare +1"
    },
    {
      id: "BOT-IR-M5",
      name: "Sciame di Shahed",
      faction: "Iran",
      track: "Militare",
      condition: "Crisi Bellica \u2265 4 e Iran e Coalizione hanno unit\xE0 nello stesso territorio",
      priority1: "Attacco in quel territorio",
      priority2: "Schiera Droni Shahed"
    },
    {
      id: "BOT-IR-M6",
      name: "Comando cyber",
      faction: "Iran",
      track: "Militare",
      condition: "Coalizione Militare \u2265 8",
      priority1: "Schiera IRGC Cyber Unit \xB7 Sviluppo Militare",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-IR-D1",
      name: "Asse con Mosca",
      faction: "Iran",
      track: "Diplomazia",
      condition: "Russia Diplomazia \u2265 6",
      priority1: "Sviluppo Diplomazia \xD72",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-IR-D2",
      name: "Ritorno a Vienna",
      faction: "Iran",
      track: "Diplomazia",
      condition: "Sanzioni \u2265 7",
      priority1: "Sviluppo Diplomazia \xB7 Sanzioni \u22121 \xB7 Nucleare \u22121",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-IR-D3",
      name: "Paesi non allineati",
      faction: "Iran",
      track: "Diplomazia",
      condition: "Opinione \u2265 3",
      priority1: "Sviluppo Diplomazia \xB7 Opinione \u22121",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-IR-D4",
      name: "Canale dell'Oman",
      faction: "Iran",
      track: "Diplomazia",
      condition: "Crisi Bellica \u2264 4",
      priority1: "Sviluppo Diplomazia \xB7 Crisi Bellica +1",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-IR-D5",
      name: "Osservatore SCO",
      faction: "Iran",
      track: "Diplomazia",
      condition: "Cina Diplomazia \u2265 7",
      priority1: "Sviluppo Diplomazia \xB7 Sviluppo Economia",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-IR-D6",
      name: "Retorica del Leader",
      faction: "Iran",
      track: "Diplomazia",
      condition: "Iran Consenso \u2264 4",
      priority1: "Sviluppo Diplomazia \xB7 Sviluppo Consenso",
      priority2: "Sviluppo Diplomazia \xB7 Opinione \u22121"
    },
    {
      id: "BOT-IR-C1",
      name: "Sussidi al pane",
      faction: "Iran",
      track: "Consenso",
      condition: "Iran Economia \u2265 6",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-IR-C2",
      name: "Mobilitazione Basij",
      faction: "Iran",
      track: "Consenso",
      condition: "Iran Consenso \u2264 2",
      priority1: "Sviluppo Consenso \xB7 Schiera Forze convenzionali in Iran",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-IR-C3",
      name: "Unit\xE0 nazionale",
      faction: "Iran",
      track: "Consenso",
      condition: "La Coalizione ha unit\xE0 in Iran",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-IR-C4",
      name: "Propaganda di Stato",
      faction: "Iran",
      track: "Consenso",
      condition: "Opinione \u2265 0",
      priority1: "Sviluppo Consenso \xB7 Opinione \u22121",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-IR-C5",
      name: "Riforme moderate",
      faction: "Iran",
      track: "Consenso",
      condition: "Sanzioni \u2265 6",
      priority1: "Sviluppo Consenso \xB7 Sviluppo Diplomazia",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-IR-C6",
      name: "Cerimonia a Qom",
      faction: "Iran",
      track: "Consenso",
      condition: "Nucleare \u2265 10",
      priority1: "Sviluppo Consenso \xB7 Nucleare +1",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CO-E1",
      name: "Massima pressione",
      faction: "Coalizione",
      track: "Economia",
      condition: "Sanzioni \u2264 7",
      priority1: "Sviluppo Economia \xB7 Sanzioni +1",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-CO-E2",
      name: "Riserva strategica",
      faction: "Coalizione",
      track: "Economia",
      condition: "Coalizione Economia \u2264 3",
      priority1: "Sviluppo Economia \xD72",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-CO-E3",
      name: "Contratti della difesa",
      faction: "Coalizione",
      track: "Economia",
      condition: "Coalizione Militare \u2264 5",
      priority1: "Sviluppo Economia \xB7 Sviluppo Militare",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-CO-E4",
      name: "Accordo con gli Emirati",
      faction: "Coalizione",
      track: "Economia",
      condition: "Nessuna unit\xE0 della Coalizione negli Emirati",
      priority1: "Schiera Convenzionale negli Emirati \xB7 Sviluppo Economia",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-CO-E5",
      name: "Dollaro forte",
      faction: "Coalizione",
      track: "Economia",
      condition: "Cina Economia \u2265 8",
      priority1: "Sviluppo Economia \xB7 Sanzioni +1",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-CO-E6",
      name: "Shale oil",
      faction: "Coalizione",
      track: "Economia",
      condition: "Russia Economia \u2265 7",
      priority1: "Sviluppo Economia \xD72",
      priority2: "Sviluppo Economia \xB7 Opinione +1"
    },
    {
      id: "BOT-CO-M1",
      name: "Gruppo portaerei",
      faction: "Coalizione",
      track: "Militare",
      condition: "Blocco di Hormuz attivo o nessun Carrier Strike Group nello Stretto",
      priority1: "Schiera Carrier Strike Group nello Stretto di Hormuz",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-CO-M2",
      name: "Iron Dome",
      faction: "Coalizione",
      track: "Militare",
      condition: "L'Iran ha Missili balistici sul tabellone",
      priority1: "Schiera Scudo Missilistico in Israele",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-CO-M3",
      name: "Strike chirurgico",
      faction: "Coalizione",
      track: "Militare",
      condition: "Nucleare \u2265 10, Crisi Bellica \u2265 4 e la Coalizione ha unit\xE0 in Iran",
      priority1: "Attacco in Iran",
      priority2: "Schiera Missili da crociera in Arabia Saudita"
    },
    {
      id: "BOT-CO-M4",
      name: "Forze speciali",
      faction: "Coalizione",
      track: "Militare",
      condition: "L'Iran ha unit\xE0 in Siria, Iraq, Libano o Yemen",
      priority1: "Schiera Forze Speciali in quel territorio",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-CO-M5",
      name: "Supremazia aerea",
      faction: "Coalizione",
      track: "Militare",
      condition: "Crisi Bellica \u2265 6",
      priority1: "Schiera Aviazione Tattica \xB7 Sviluppo Militare",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-CO-M6",
      name: "Esercitazione congiunta",
      faction: "Coalizione",
      track: "Militare",
      condition: "Europa Militare \u2265 6",
      priority1: "Sviluppo Militare \xD72",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-CO-D1",
      name: "Risoluzione al Consiglio",
      faction: "Coalizione",
      track: "Diplomazia",
      condition: "Russia Diplomazia \u2264 7",
      priority1: "Sviluppo Diplomazia \xB7 Sanzioni +1",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-CO-D2",
      name: "Accordi di Abramo",
      faction: "Coalizione",
      track: "Diplomazia",
      condition: "Opinione \u2265 0",
      priority1: "Sviluppo Diplomazia \xB7 Opinione +1",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-CO-D3",
      name: "Diplomazia navetta",
      faction: "Coalizione",
      track: "Diplomazia",
      condition: "Crisi Bellica \u2264 4",
      priority1: "Sviluppo Diplomazia \xB7 Crisi Bellica +1",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-CO-D4",
      name: "Pressione sull'AIEA",
      faction: "Coalizione",
      track: "Diplomazia",
      condition: "Nucleare \u2265 8",
      priority1: "Sviluppo Diplomazia \xB7 Nucleare \u22121",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-CO-D5",
      name: "Vertice G7",
      faction: "Coalizione",
      track: "Diplomazia",
      condition: "Europa Diplomazia \u2265 7",
      priority1: "Sviluppo Diplomazia \xD72",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-CO-D6",
      name: "Sanzioni secondarie",
      faction: "Coalizione",
      track: "Diplomazia",
      condition: "Sanzioni \u2265 7",
      priority1: "Sviluppo Diplomazia \xB7 Sanzioni +1",
      priority2: "Sviluppo Diplomazia \xB7 Sviluppo Economia"
    },
    {
      id: "BOT-CO-C1",
      name: "Discorso alla nazione",
      faction: "Coalizione",
      track: "Consenso",
      condition: "Opinione \u2264 0",
      priority1: "Sviluppo Consenso \xB7 Opinione +1",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CO-C2",
      name: "Ritiro delle truppe",
      faction: "Coalizione",
      track: "Consenso",
      condition: "Coalizione Consenso \u2264 2",
      priority1: "Sviluppo Consenso \xD72 \xB7 Coalizione Militare \u22121",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CO-C3",
      name: "Elezioni di met\xE0 mandato",
      faction: "Coalizione",
      track: "Consenso",
      condition: "Coalizione Economia \u2265 6",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CO-C4",
      name: "Rally around the flag",
      faction: "Coalizione",
      track: "Consenso",
      condition: "Crisi Bellica \u2264 4",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CO-C5",
      name: "Campagna mediatica",
      faction: "Coalizione",
      track: "Consenso",
      condition: "Russia Consenso \u2265 7",
      priority1: "Sviluppo Consenso \xB7 Opinione +1",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CO-C6",
      name: "Ostaggi liberati",
      faction: "Coalizione",
      track: "Consenso",
      condition: "Iran Diplomazia \u2265 6",
      priority1: "Sviluppo Consenso \xB7 Sviluppo Diplomazia",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-RU-E1",
      name: "Gazprom",
      faction: "Russia",
      track: "Economia",
      condition: "Europa Economia \u2265 7",
      priority1: "Sviluppo Economia \xD72",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-RU-E2",
      name: "Sistema SPFS",
      faction: "Russia",
      track: "Economia",
      condition: "Sanzioni \u2265 6",
      priority1: "Sviluppo Economia \xB7 Sanzioni \u22121",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-RU-E3",
      name: "Presenza a Damasco",
      faction: "Russia",
      track: "Economia",
      condition: "La Russia non ha unit\xE0 in Siria",
      priority1: "Schiera Consiglieri militari in Siria \xB7 Sviluppo Economia",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-RU-E4",
      name: "OPEC+",
      faction: "Russia",
      track: "Economia",
      condition: "Coalizione Economia \u2265 7",
      priority1: "Sviluppo Economia \xB7 Sviluppo Diplomazia",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-RU-E5",
      name: "Flotta ombra",
      faction: "Russia",
      track: "Economia",
      condition: "Russia Economia \u2264 3",
      priority1: "Sviluppo Economia \xD72",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-RU-E6",
      name: "Asse rublo-yuan",
      faction: "Russia",
      track: "Economia",
      condition: "Cina Economia \u2265 6",
      priority1: "Sviluppo Economia \xB7 Sviluppo Diplomazia",
      priority2: "Sviluppo Economia \xB7 Opinione \u22121"
    },
    {
      id: "BOT-RU-M1",
      name: "Base di Tartus",
      faction: "Russia",
      track: "Militare",
      condition: "Nessuna Flotta nel Mediterraneo sul tabellone",
      priority1: "Schiera Flotta nel Mediterraneo in Siria",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-RU-M2",
      name: "S-400 per Teheran",
      faction: "Russia",
      track: "Militare",
      condition: "La Coalizione ha Aviazione Tattica sul tabellone",
      priority1: "Schiera Difesa aerea S-400 in quel territorio",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-RU-M3",
      name: "Consiglieri a Damasco",
      faction: "Russia",
      track: "Militare",
      condition: "L'Iran ha unit\xE0 in Siria",
      priority1: "Schiera Consiglieri militari in Siria",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-RU-M4",
      name: "Forniture a Teheran",
      faction: "Russia",
      track: "Militare",
      condition: "Iran Militare \u2264 5",
      priority1: "Schiera Forniture armi in Iran \xB7 Sviluppo Militare",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-RU-M5",
      name: "Esercitazione Zapad",
      faction: "Russia",
      track: "Militare",
      condition: "Europa Militare \u2265 6",
      priority1: "Sviluppo Militare \xD72",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-RU-M6",
      name: "Hacker del GRU",
      faction: "Russia",
      track: "Militare",
      condition: "Coalizione Economia \u2265 7",
      priority1: "Schiera Cyber Russia in un territorio con unit\xE0 della Coalizione",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-RU-D1",
      name: "Veto russo",
      faction: "Russia",
      track: "Diplomazia",
      condition: "Sanzioni \u2265 7",
      priority1: "Sviluppo Diplomazia \xB7 Sanzioni \u22121",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-RU-D2",
      name: "Formato Astana",
      faction: "Russia",
      track: "Diplomazia",
      condition: "Crisi Bellica \u2264 4",
      priority1: "Sviluppo Diplomazia \xB7 Crisi Bellica +1",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-RU-D3",
      name: "Vertice BRICS",
      faction: "Russia",
      track: "Diplomazia",
      condition: "Cina Diplomazia \u2265 6",
      priority1: "Sviluppo Diplomazia \xD72",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-RU-D4",
      name: "Mediazione di Mosca",
      faction: "Russia",
      track: "Diplomazia",
      condition: "Iran Diplomazia \u2264 4",
      priority1: "Sviluppo Diplomazia \xB7 Iran Diplomazia +1",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-RU-D5",
      name: "Intelligence a Ginevra",
      faction: "Russia",
      track: "Diplomazia",
      condition: "Coalizione Diplomazia \u2265 7",
      priority1: "Schiera Intelligence \xB7 Sviluppo Diplomazia",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-RU-D6",
      name: "Partner strategico",
      faction: "Russia",
      track: "Diplomazia",
      condition: "Opinione \u2265 3",
      priority1: "Sviluppo Diplomazia \xB7 Opinione \u22121",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-RU-C1",
      name: "Media di Stato",
      faction: "Russia",
      track: "Consenso",
      condition: "Opinione \u2265 0",
      priority1: "Sviluppo Consenso \xB7 Opinione \u22121",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-RU-C2",
      name: "Patriottismo",
      faction: "Russia",
      track: "Consenso",
      condition: "Russia Consenso \u2264 2",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-RU-C3",
      name: "Prezzi dell'energia",
      faction: "Russia",
      track: "Consenso",
      condition: "Russia Economia \u2265 7",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-RU-C4",
      name: "Controllo del dissenso",
      faction: "Russia",
      track: "Consenso",
      condition: "Europa Consenso \u2265 7",
      priority1: "Sviluppo Consenso \xB7 Sviluppo Militare",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-RU-C5",
      name: "Narrazione multipolare",
      faction: "Russia",
      track: "Consenso",
      condition: "Cina Consenso \u2265 6",
      priority1: "Sviluppo Consenso \xB7 Sviluppo Diplomazia",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-RU-C6",
      name: "Parata della vittoria",
      faction: "Russia",
      track: "Consenso",
      condition: "Russia Militare \u2265 7",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CN-E1",
      name: "Belt and Road",
      faction: "Cina",
      track: "Economia",
      condition: "Nessun Investimenti BRI sul tabellone",
      priority1: "Schiera Investimenti BRI in Iran \xB7 Sviluppo Economia",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-CN-E2",
      name: "Petrolio a sconto",
      faction: "Cina",
      track: "Economia",
      condition: "Sanzioni \u2265 6",
      priority1: "Sviluppo Economia \xB7 Sanzioni \u22121",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-CN-E3",
      name: "Porto di Chabahar",
      faction: "Cina",
      track: "Economia",
      condition: "Nessuna Flotta commerciale nello Stretto di Hormuz",
      priority1: "Schiera Flotta commerciale nello Stretto di Hormuz",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-CN-E4",
      name: "Yuan digitale",
      faction: "Cina",
      track: "Economia",
      condition: "Coalizione Economia \u2265 7",
      priority1: "Sviluppo Economia \xD72",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-CN-E5",
      name: "Esportazioni record",
      faction: "Cina",
      track: "Economia",
      condition: "Cina Economia \u2264 3",
      priority1: "Sviluppo Economia \xD72",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-CN-E6",
      name: "Infrastrutture nel Golfo",
      faction: "Cina",
      track: "Economia",
      condition: "Crisi Bellica \u2265 6",
      priority1: "Schiera Infrastrutture \xB7 Sviluppo Economia",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-CN-M1",
      name: "Base di Gibuti",
      faction: "Cina",
      track: "Militare",
      condition: "Blocco di Hormuz attivo",
      priority1: "Sviluppo Militare \xD72",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-CN-M2",
      name: "Satelliti Beidou",
      faction: "Cina",
      track: "Militare",
      condition: "Coalizione Militare \u2265 8",
      priority1: "Schiera Satelliti / Spazio",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-CN-M3",
      name: "Tecnologia duale",
      faction: "Cina",
      track: "Militare",
      condition: "Iran Militare \u2264 5",
      priority1: "Schiera Tecnologia duale in Iran",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-CN-M4",
      name: "Unit\xE0 cyber 61398",
      faction: "Cina",
      track: "Militare",
      condition: "Coalizione Economia \u2265 7",
      priority1: "Schiera Cyber Unit in un territorio con unit\xE0 della Coalizione",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-CN-M5",
      name: "Pattuglia navale",
      faction: "Cina",
      track: "Militare",
      condition: "Crisi Bellica \u2265 5",
      priority1: "Sviluppo Militare \xD72",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-CN-M6",
      name: "Stretto di Taiwan",
      faction: "Cina",
      track: "Militare",
      condition: "Coalizione Militare \u2265 7",
      priority1: "Sviluppo Militare \xD72",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-CN-D1",
      name: "Mediazione Riyad\u2013 Teheran",
      faction: "Cina",
      track: "Diplomazia",
      condition: "Crisi Bellica \u2264 5",
      priority1: "Sviluppo Diplomazia \xB7 Crisi Bellica +1",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-CN-D2",
      name: "Piano in 12 punti",
      faction: "Cina",
      track: "Diplomazia",
      condition: "Opinione \u2264 \u22123 oppure \u2265 3",
      priority1: "Sviluppo Diplomazia \xB7 Opinione di 1 verso lo 0",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-CN-D3",
      name: "Veto cinese",
      faction: "Cina",
      track: "Diplomazia",
      condition: "Sanzioni \u2265 7",
      priority1: "Sviluppo Diplomazia \xB7 Sanzioni \u22121",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-CN-D4",
      name: "Summit SCO",
      faction: "Cina",
      track: "Diplomazia",
      condition: "Russia Diplomazia \u2265 6",
      priority1: "Sviluppo Diplomazia \xD72",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-CN-D5",
      name: "Diplomazia dei porti",
      faction: "Cina",
      track: "Diplomazia",
      condition: "La Cina non ha unit\xE0 in Arabia Saudita",
      priority1: "Schiera Investimenti BRI in Arabia Saudita",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-CN-D6",
      name: "Forum Cina\u2013Stati Arabi",
      faction: "Cina",
      track: "Diplomazia",
      condition: "Coalizione Diplomazia \u2265 7",
      priority1: "Sviluppo Diplomazia \xD72",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-CN-C1",
      name: "Prosperit\xE0 comune",
      faction: "Cina",
      track: "Consenso",
      condition: "Cina Economia \u2265 7",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CN-C2",
      name: "Rotte sicure",
      faction: "Cina",
      track: "Consenso",
      condition: "Blocco di Hormuz attivo",
      priority1: "Schiera Flotta commerciale nello Stretto di Hormuz \xB7 Sviluppo Consenso",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CN-C3",
      name: "Grande Firewall",
      faction: "Cina",
      track: "Consenso",
      condition: "Cina Consenso \u2264 2",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CN-C4",
      name: "CGTN",
      faction: "Cina",
      track: "Consenso",
      condition: "Opinione \u2265 2",
      priority1: "Sviluppo Consenso \xB7 Opinione \u22121",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CN-C5",
      name: "Cantieri all'estero",
      faction: "Cina",
      track: "Consenso",
      condition: "Nessuna Infrastrutture sul tabellone",
      priority1: "Schiera Infrastrutture",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-CN-C6",
      name: "Stabilit\xE0 prima di tutto",
      faction: "Cina",
      track: "Consenso",
      condition: "Crisi Bellica \u2264 4",
      priority1: "Sviluppo Consenso \xB7 Crisi Bellica +1",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-EU-E1",
      name: "REPowerEU",
      faction: "Europa",
      track: "Economia",
      condition: "Russia Economia \u2265 7",
      priority1: "Sviluppo Economia \xD72",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-EU-E2",
      name: "Canale INSTEX",
      faction: "Europa",
      track: "Economia",
      condition: "Sanzioni \u2265 8",
      priority1: "Sviluppo Economia \xB7 Sanzioni \u22121",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-EU-E3",
      name: "GNL dal Qatar",
      faction: "Europa",
      track: "Economia",
      condition: "Nessuna unit\xE0 dell'Europa in Qatar",
      priority1: "Schiera Diplomazia UE in Qatar \xB7 Sviluppo Economia",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-EU-E4",
      name: "Mercato unico",
      faction: "Europa",
      track: "Economia",
      condition: "Europa Economia \u2264 3",
      priority1: "Sviluppo Economia \xD72",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-EU-E5",
      name: "Global Gateway",
      faction: "Europa",
      track: "Economia",
      condition: "Cina Economia \u2265 8",
      priority1: "Sviluppo Economia \xB7 Sviluppo Diplomazia",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-EU-E6",
      name: "Rotte commerciali",
      faction: "Europa",
      track: "Economia",
      condition: "Blocco di Hormuz attivo",
      priority1: "Schiera Missione navale UE nello Stretto di Hormuz",
      priority2: "Sviluppo Economia"
    },
    {
      id: "BOT-EU-M1",
      name: "Operazione Aspides",
      faction: "Europa",
      track: "Militare",
      condition: "Nessuna Missione navale UE nello Stretto di Hormuz",
      priority1: "Schiera Missione navale UE nello Stretto di Hormuz",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-EU-M2",
      name: "Caschi blu in Libano",
      faction: "Europa",
      track: "Militare",
      condition: "In Libano ci sono unit\xE0 di Iran o Coalizione",
      priority1: "Schiera Caschi blu in Libano",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-EU-M3",
      name: "Bussola strategica",
      faction: "Europa",
      track: "Militare",
      condition: "Russia Militare \u2265 7",
      priority1: "Sviluppo Militare \xD72",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-EU-M4",
      name: "Intelligence condivisa",
      faction: "Europa",
      track: "Militare",
      condition: "Coalizione Militare \u2265 7",
      priority1: "Schiera Intelligence \xB7 Sviluppo Militare",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-EU-M5",
      name: "Difesa cyber",
      faction: "Europa",
      track: "Militare",
      condition: "Russia o Cina hanno una Cyber Unit sul tabellone",
      priority1: "Schiera Cyber Unit nello stesso territorio",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-EU-M6",
      name: "Forza di interposizione",
      faction: "Europa",
      track: "Militare",
      condition: "Crisi Bellica \u2264 4",
      priority1: "Schiera Caschi blu nel territorio con pi\xF9 unit\xE0 di Iran e Coalizione \xB7 Crisi Bellica +1",
      priority2: "Sviluppo Militare"
    },
    {
      id: "BOT-EU-D1",
      name: "Formato E3",
      faction: "Europa",
      track: "Diplomazia",
      condition: "Nucleare \u2265 8",
      priority1: "Sviluppo Diplomazia \xB7 Nucleare \u22121",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-EU-D2",
      name: "Alto Rappresentante",
      faction: "Europa",
      track: "Diplomazia",
      condition: "Crisi Bellica \u2264 5",
      priority1: "Sviluppo Diplomazia \xB7 Crisi Bellica +1",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-EU-D3",
      name: "Conferenza di Bruxelles",
      faction: "Europa",
      track: "Diplomazia",
      condition: "Opinione \u2264 \u22123",
      priority1: "Sviluppo Diplomazia \xB7 Opinione +1",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-EU-D4",
      name: "Missione diplomatica",
      faction: "Europa",
      track: "Diplomazia",
      condition: "Nessuna Diplomazia UE sul tabellone",
      priority1: "Schiera Diplomazia UE",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-EU-D5",
      name: "Snapback europeo",
      faction: "Europa",
      track: "Diplomazia",
      condition: "Nucleare \u2265 11",
      priority1: "Sviluppo Diplomazia \xB7 Sanzioni +1",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-EU-D6",
      name: "Dialogo con Pechino",
      faction: "Europa",
      track: "Diplomazia",
      condition: "Cina Diplomazia \u2265 7",
      priority1: "Sviluppo Diplomazia \xD72",
      priority2: "Sviluppo Diplomazia"
    },
    {
      id: "BOT-EU-C1",
      name: "Aiuti allo Yemen",
      faction: "Europa",
      track: "Consenso",
      condition: "Nessun Aiuti umanitari sul tabellone",
      priority1: "Schiera Aiuti umanitari in Yemen",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-EU-C2",
      name: "Consiglio europeo",
      faction: "Europa",
      track: "Consenso",
      condition: "Europa Consenso \u2264 2",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-EU-C3",
      name: "Bollette pi\xF9 leggere",
      faction: "Europa",
      track: "Consenso",
      condition: "Europa Economia \u2265 7",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-EU-C4",
      name: "Accoglienza profughi",
      faction: "Europa",
      track: "Consenso",
      condition: "Crisi Bellica \u2264 4",
      priority1: "Sviluppo Consenso \xB7 Opinione +1",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-EU-C5",
      name: "Sanzioni a Mosca",
      faction: "Europa",
      track: "Consenso",
      condition: "Russia Consenso \u2265 6",
      priority1: "Sviluppo Consenso \xD72",
      priority2: "Sviluppo Consenso"
    },
    {
      id: "BOT-EU-C6",
      name: "Fronte atlantico",
      faction: "Europa",
      track: "Consenso",
      condition: "Coalizione Consenso \u2265 6",
      priority1: "Sviluppo Consenso \xB7 Sviluppo Diplomazia",
      priority2: "Sviluppo Consenso"
    }
  ],
  events: [
    {
      id: "E01",
      name: "Scoperta Sito Nucleare Segreto",
      globals: [
        {
          track: "Nucleare",
          delta: 2
        },
        {
          track: "Sanzioni",
          delta: 1
        },
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Europa",
        "Iran",
        "Cina",
        "Coalizione",
        "Russia"
      ],
      advancers: [
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E02",
      name: "Test Nucleare Sotterraneo",
      globals: [
        {
          track: "Nucleare",
          delta: 3
        },
        {
          track: "Sanzioni",
          delta: 2
        },
        {
          track: "Crisi Bellica",
          delta: -1
        },
        {
          track: "Opinione",
          delta: 2
        }
      ],
      changes: [
        {
          faction: "Coalizione",
          track: "Militare",
          delta: 1
        }
      ],
      order: [
        "Russia",
        "Europa",
        "Iran",
        "Cina",
        "Coalizione"
      ],
      advancers: [
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E03",
      name: "Fuga Scienziato Nucleare",
      globals: [
        {
          track: "Nucleare",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: -1
        },
        {
          faction: "Coalizione",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Cina",
        "Coalizione",
        "Russia",
        "Europa",
        "Iran"
      ],
      advancers: [
        "Russia",
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E04",
      name: "Sabotaggio Impianto Natanz",
      globals: [
        {
          track: "Nucleare",
          delta: -2
        },
        {
          track: "Crisi Bellica",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Coalizione",
          track: "Militare",
          delta: 1
        }
      ],
      order: [
        "Iran",
        "Cina",
        "Coalizione",
        "Russia",
        "Europa"
      ],
      advancers: [
        "Iran",
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E05",
      name: "Ispezione AIEA Bloccata",
      globals: [
        {
          track: "Nucleare",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: -1
        },
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Coalizione",
        "Russia",
        "Europa",
        "Iran",
        "Cina"
      ],
      advancers: [
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E06",
      name: "Rapporto AIEA Allarmante",
      globals: [
        {
          track: "Sanzioni",
          delta: 1
        },
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Coalizione",
        "Russia",
        "Iran",
        "Europa",
        "Cina"
      ],
      advancers: [
        "Coalizione",
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E07",
      name: "Breakout Nucleare Imminente",
      globals: [
        {
          track: "Nucleare",
          delta: 2
        },
        {
          track: "Sanzioni",
          delta: 1
        },
        {
          track: "Crisi Bellica",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Coalizione",
          track: "Militare",
          delta: 1
        }
      ],
      order: [
        "Russia",
        "Iran",
        "Europa",
        "Cina",
        "Coalizione"
      ],
      advancers: [
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E08",
      name: "Accordo Nucleare Last Minute",
      globals: [
        {
          track: "Nucleare",
          delta: -2
        },
        {
          track: "Sanzioni",
          delta: -1
        },
        {
          track: "Crisi Bellica",
          delta: 2
        },
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: 2
        },
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Iran",
        "Europa",
        "Cina",
        "Coalizione",
        "Russia"
      ],
      advancers: [
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E09",
      name: "Trasferimento Tecnologia",
      globals: [
        {
          track: "Nucleare",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Russia",
          track: "Diplomazia",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Militare",
          delta: 1
        }
      ],
      order: [
        "Europa",
        "Cina",
        "Coalizione",
        "Russia",
        "Iran"
      ],
      advancers: [
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E10",
      name: "Centrifughe Avanzate IR-9",
      globals: [
        {
          track: "Nucleare",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -1
        }
      ],
      order: [
        "Cina",
        "Coalizione",
        "Russia",
        "Iran",
        "Europa"
      ],
      advancers: [
        "Iran",
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E11",
      name: "Uranio Arricchito 90%",
      globals: [
        {
          track: "Nucleare",
          delta: 3
        },
        {
          track: "Sanzioni",
          delta: 1
        },
        {
          track: "Crisi Bellica",
          delta: -1
        },
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [],
      order: [
        "Russia",
        "Iran",
        "Coalizione",
        "Europa",
        "Cina"
      ],
      advancers: [
        "Iran"
      ],
      blocksRound: false
    },
    {
      id: "E12",
      name: "Plutonio Weapons-Grade",
      globals: [
        {
          track: "Nucleare",
          delta: 2
        },
        {
          track: "Sanzioni",
          delta: 1
        },
        {
          track: "Crisi Bellica",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -2
        }
      ],
      order: [
        "Cina",
        "Russia",
        "Iran",
        "Coalizione",
        "Europa"
      ],
      advancers: [
        "Iran",
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E13",
      name: "Missile Nucleare Testato",
      globals: [
        {
          track: "Nucleare",
          delta: 2
        },
        {
          track: "Sanzioni",
          delta: 1
        },
        {
          track: "Crisi Bellica",
          delta: -2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Militare",
          delta: 1
        },
        {
          faction: "Europa",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Europa",
        "Cina",
        "Russia",
        "Iran",
        "Coalizione"
      ],
      advancers: [
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E14",
      name: "Deterrenza Nucleare Dichiarata",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -1
        },
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: 2
        },
        {
          faction: "Iran",
          track: "Militare",
          delta: 1
        }
      ],
      order: [
        "Iran",
        "Coalizione",
        "Europa",
        "Cina",
        "Russia"
      ],
      advancers: [
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E15",
      name: "Smantellamento Volontario",
      globals: [
        {
          track: "Nucleare",
          delta: -3
        },
        {
          track: "Sanzioni",
          delta: -2
        },
        {
          track: "Crisi Bellica",
          delta: 2
        },
        {
          track: "Opinione",
          delta: -2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: 2
        },
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: 2
        }
      ],
      order: [
        "Coalizione",
        "Europa",
        "Cina",
        "Russia",
        "Iran"
      ],
      advancers: [
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E16",
      name: "Attacco Aereo Israeliano",
      globals: [
        {
          track: "Nucleare",
          delta: -2
        },
        {
          track: "Crisi Bellica",
          delta: -2
        }
      ],
      changes: [
        {
          faction: "Coalizione",
          track: "Militare",
          delta: 1
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: 1
        }
      ],
      order: [
        "Europa",
        "Coalizione",
        "Cina",
        "Iran",
        "Russia"
      ],
      advancers: [
        "Iran"
      ],
      blocksRound: false
    },
    {
      id: "E17",
      name: "Risposta Missilistica Iran",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: 1
        },
        {
          faction: "Coalizione",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Coalizione",
        "Cina",
        "Iran",
        "Russia",
        "Europa"
      ],
      advancers: [
        "Iran"
      ],
      blocksRound: false
    },
    {
      id: "E18",
      name: "Scontro Navale Hormuz",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Militare",
          delta: -1
        },
        {
          faction: "Coalizione",
          track: "Militare",
          delta: -1
        }
      ],
      order: [
        "Cina",
        "Iran",
        "Russia",
        "Europa",
        "Coalizione"
      ],
      advancers: [
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E19",
      name: "Abbattimento Drone USA",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: 1
        },
        {
          faction: "Coalizione",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Iran",
        "Russia",
        "Europa",
        "Coalizione",
        "Cina"
      ],
      advancers: [
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E20",
      name: "Attacco Base USA Iraq",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -2
        }
      ],
      changes: [
        {
          faction: "Coalizione",
          track: "Consenso",
          delta: -2
        },
        {
          faction: "Iran",
          track: "Militare",
          delta: 1
        }
      ],
      order: [
        "Russia",
        "Europa",
        "Coalizione",
        "Cina",
        "Iran"
      ],
      advancers: [
        "Cina",
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E21",
      name: "Assassinio Generale IRGC",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: 2
        },
        {
          faction: "Iran",
          track: "Militare",
          delta: -1
        }
      ],
      order: [
        "Coalizione",
        "Europa",
        "Cina",
        "Iran",
        "Russia"
      ],
      advancers: [
        "Iran"
      ],
      blocksRound: false
    },
    {
      id: "E22",
      name: "Operazione Speciale Fallita",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -1
        },
        {
          track: "Opinione",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Coalizione",
          track: "Consenso",
          delta: -1
        },
        {
          faction: "Coalizione",
          track: "Diplomazia",
          delta: -1
        }
      ],
      order: [
        "Iran",
        "Russia",
        "Coalizione",
        "Europa",
        "Cina"
      ],
      advancers: [
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E23",
      name: "Escalation Regionale",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -2
        }
      ],
      changes: [
        {
          faction: "Russia",
          track: "Militare",
          delta: 1
        },
        {
          faction: "Europa",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Cina",
        "Iran",
        "Russia",
        "Coalizione",
        "Europa"
      ],
      advancers: [
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E24",
      name: "Mobilitazione Generale",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -2
        },
        {
          faction: "Iran",
          track: "Militare",
          delta: 2
        }
      ],
      order: [
        "Europa",
        "Cina",
        "Iran",
        "Russia",
        "Coalizione"
      ],
      advancers: [
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E25",
      name: "Attacco Cyber Massivo",
      globals: [
        {
          track: "Nucleare",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Cina",
          track: "Militare",
          delta: 1
        }
      ],
      order: [
        "Russia",
        "Coalizione",
        "Europa",
        "Cina",
        "Iran"
      ],
      advancers: [
        "Iran",
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E26",
      name: "Blackout Infrastrutture",
      globals: [],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -2
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Iran",
        "Russia",
        "Europa",
        "Cina",
        "Coalizione"
      ],
      advancers: [
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E27",
      name: "Attacco Petroliere",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Europa",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Cina",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Russia",
        "Europa",
        "Cina",
        "Coalizione",
        "Iran"
      ],
      advancers: [
        "Iran"
      ],
      blocksRound: false
    },
    {
      id: "E28",
      name: "Sequestro Nave Commerciale",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -1
        },
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Europa",
          track: "Consenso",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Militare",
          delta: 1
        }
      ],
      order: [
        "Coalizione",
        "Iran",
        "Russia",
        "Europa",
        "Cina"
      ],
      advancers: [
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E29",
      name: "Incidente Friendly Fire",
      globals: [
        {
          track: "Crisi Bellica",
          delta: 1
        },
        {
          track: "Opinione",
          delta: -2
        }
      ],
      changes: [
        {
          faction: "Coalizione",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Cina",
        "Coalizione",
        "Iran",
        "Russia",
        "Europa"
      ],
      advancers: [
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E30",
      name: "Evacuazione Civili",
      globals: [],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: -1
        },
        {
          faction: "Europa",
          track: "Consenso",
          delta: -1
        },
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Europa",
        "Cina",
        "Coalizione",
        "Iran",
        "Russia"
      ],
      advancers: [
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E31",
      name: "Summit Vienna Fallito",
      globals: [],
      changes: [
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: -1
        }
      ],
      order: [
        "Russia",
        "Europa",
        "Iran",
        "Coalizione",
        "Cina"
      ],
      advancers: [
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E32",
      name: "Rottura Negoziati",
      globals: [
        {
          track: "Sanzioni",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: -1
        },
        {
          faction: "Coalizione",
          track: "Diplomazia",
          delta: -1
        }
      ],
      order: [
        "Iran",
        "Coalizione",
        "Cina",
        "Russia",
        "Europa"
      ],
      advancers: [
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E33",
      name: "Nuove Sanzioni ONU",
      globals: [
        {
          track: "Sanzioni",
          delta: 2
        },
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -2
        },
        {
          faction: "Coalizione",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Cina",
        "Russia",
        "Europa",
        "Iran",
        "Coalizione"
      ],
      advancers: [
        "Russia",
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E34",
      name: "Veto Russia-Cina",
      globals: [
        {
          track: "Sanzioni",
          delta: -2
        },
        {
          track: "Opinione",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Russia",
          track: "Diplomazia",
          delta: 1
        },
        {
          faction: "Cina",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Coalizione",
        "Cina",
        "Russia",
        "Europa",
        "Iran"
      ],
      advancers: [
        "Iran",
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E35",
      name: "Risoluzione Condanna",
      globals: [
        {
          track: "Sanzioni",
          delta: 1
        },
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: -1
        }
      ],
      order: [
        "Europa",
        "Iran",
        "Coalizione",
        "Cina",
        "Russia"
      ],
      advancers: [
        "Iran"
      ],
      blocksRound: false
    },
    {
      id: "E36",
      name: "Espulsione Diplomatici",
      globals: [
        {
          track: "Opinione",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: -1
        },
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: -1
        }
      ],
      order: [
        "Coalizione",
        "Iran",
        "Russia",
        "Europa",
        "Cina"
      ],
      advancers: [
        "Coalizione",
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E37",
      name: "Canale Segreto Aperto",
      globals: [
        {
          track: "Crisi Bellica",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: 1
        },
        {
          faction: "Coalizione",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Cina",
        "Coalizione",
        "Iran",
        "Russia",
        "Europa"
      ],
      advancers: [
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E38",
      name: "Mediazione Oman",
      globals: [
        {
          track: "Crisi Bellica",
          delta: 2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: 1
        },
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Iran",
        "Russia",
        "Europa",
        "Cina",
        "Coalizione"
      ],
      advancers: [
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E39",
      name: "Proposta Pace Sorpresa",
      globals: [
        {
          track: "Nucleare",
          delta: -1
        },
        {
          track: "Sanzioni",
          delta: -1
        },
        {
          track: "Crisi Bellica",
          delta: 2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: 1
        },
        {
          faction: "Cina",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Russia",
        "Europa",
        "Cina",
        "Coalizione",
        "Iran"
      ],
      advancers: [
        "Coalizione",
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E40",
      name: "Accordo Preliminare",
      globals: [
        {
          track: "Crisi Bellica",
          delta: 2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: 1
        },
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Europa",
        "Cina",
        "Coalizione",
        "Iran",
        "Russia"
      ],
      advancers: [
        "Russia",
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E41",
      name: "Firma Trattato",
      globals: [
        {
          track: "Nucleare",
          delta: -2
        },
        {
          track: "Sanzioni",
          delta: -1
        },
        {
          track: "Crisi Bellica",
          delta: 2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: 2
        },
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: 1
        },
        {
          faction: "Cina",
          track: "Diplomazia",
          delta: 1
        }
      ],
      order: [
        "Europa",
        "Coalizione",
        "Iran",
        "Russia",
        "Cina"
      ],
      advancers: [
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E42",
      name: "Violazione Accordo",
      globals: [
        {
          track: "Nucleare",
          delta: 1
        },
        {
          track: "Sanzioni",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: -2
        }
      ],
      order: [
        "Russia",
        "Cina",
        "Europa",
        "Coalizione",
        "Iran"
      ],
      advancers: [
        "Coalizione",
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E43",
      name: "Ritiro USA da Trattato",
      globals: [
        {
          track: "Sanzioni",
          delta: 1
        },
        {
          track: "Crisi Bellica",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Coalizione",
          track: "Diplomazia",
          delta: -1
        },
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: -1
        }
      ],
      order: [
        "Cina",
        "Europa",
        "Coalizione",
        "Iran",
        "Russia"
      ],
      advancers: [
        "Cina",
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E44",
      name: "Sanzioni Secondarie UE",
      globals: [
        {
          track: "Sanzioni",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Europa",
          track: "Economia",
          delta: -1
        }
      ],
      order: [
        "Coalizione",
        "Iran",
        "Russia",
        "Cina",
        "Europa"
      ],
      advancers: [
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E45",
      name: "Coalizione Anti-Iran",
      globals: [
        {
          track: "Sanzioni",
          delta: 1
        },
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Coalizione",
          track: "Diplomazia",
          delta: 2
        }
      ],
      order: [
        "Iran",
        "Russia",
        "Cina",
        "Europa",
        "Coalizione"
      ],
      advancers: [
        "Iran"
      ],
      blocksRound: false
    },
    {
      id: "E46",
      name: "Crollo Prezzo Petrolio",
      globals: [],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -2
        },
        {
          faction: "Russia",
          track: "Economia",
          delta: -1
        }
      ],
      order: [
        "Cina",
        "Europa",
        "Russia",
        "Coalizione",
        "Iran"
      ],
      advancers: [
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E47",
      name: "Spike Prezzo Petrolio",
      globals: [
        {
          track: "Sanzioni",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: 2
        },
        {
          faction: "Russia",
          track: "Economia",
          delta: 1
        },
        {
          faction: "Europa",
          track: "Economia",
          delta: -1
        }
      ],
      order: [
        "Russia",
        "Coalizione",
        "Iran",
        "Cina",
        "Europa"
      ],
      advancers: [
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E48",
      name: "Sanzioni SWIFT Totali",
      globals: [
        {
          track: "Sanzioni",
          delta: 2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -2
        },
        {
          faction: "Cina",
          track: "Economia",
          delta: -1
        }
      ],
      order: [
        "Iran",
        "Cina",
        "Europa",
        "Russia",
        "Coalizione"
      ],
      advancers: [
        "Iran",
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E49",
      name: "Collasso Rial Iraniano",
      globals: [
        {
          track: "Sanzioni",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -3
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Coalizione",
        "Iran",
        "Cina",
        "Europa",
        "Russia"
      ],
      advancers: [
        "Iran",
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E50",
      name: "Contrabbando Massiccio",
      globals: [
        {
          track: "Sanzioni",
          delta: -2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: 2
        },
        {
          faction: "Coalizione",
          track: "Diplomazia",
          delta: -1
        }
      ],
      order: [
        "Europa",
        "Russia",
        "Coalizione",
        "Iran",
        "Cina"
      ],
      advancers: [
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E51",
      name: "Accordo Petrolio Yuan",
      globals: [
        {
          track: "Sanzioni",
          delta: -2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: 2
        },
        {
          faction: "Cina",
          track: "Economia",
          delta: 1
        },
        {
          faction: "Coalizione",
          track: "Economia",
          delta: -1
        }
      ],
      order: [
        "Russia",
        "Coalizione",
        "Europa",
        "Iran",
        "Cina"
      ],
      advancers: [
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E52",
      name: "Crisi Energetica Europa",
      globals: [
        {
          track: "Sanzioni",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Europa",
          track: "Economia",
          delta: -2
        },
        {
          faction: "Russia",
          track: "Economia",
          delta: 1
        }
      ],
      order: [
        "Coalizione",
        "Europa",
        "Iran",
        "Cina",
        "Russia"
      ],
      advancers: [
        "Iran"
      ],
      blocksRound: false
    },
    {
      id: "E53",
      name: "Recessione Globale",
      globals: [
        {
          track: "Sanzioni",
          delta: -1
        },
        {
          track: "Crisi Bellica",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Coalizione",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Cina",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Europa",
          track: "Economia",
          delta: -1
        }
      ],
      order: [
        "Europa",
        "Iran",
        "Cina",
        "Russia",
        "Coalizione"
      ],
      advancers: [
        "Cina",
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E54",
      name: "Fuga Capitali Golfo",
      globals: [],
      changes: [
        {
          faction: "Coalizione",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Cina",
          track: "Economia",
          delta: 1
        },
        {
          faction: "Iran",
          track: "Economia",
          delta: -1
        }
      ],
      order: [
        "Cina",
        "Russia",
        "Coalizione",
        "Europa",
        "Iran"
      ],
      advancers: [
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E55",
      name: "Investimenti Cina Bloccati",
      globals: [],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Cina",
          track: "Economia",
          delta: -1
        }
      ],
      order: [
        "Iran",
        "Cina",
        "Russia",
        "Coalizione",
        "Europa"
      ],
      advancers: [
        "Russia",
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E56",
      name: "Aiuti Umanitari Bloccati",
      globals: [
        {
          track: "Opinione",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: -1
        },
        {
          faction: "Europa",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Russia",
        "Cina",
        "Coalizione",
        "Europa",
        "Iran"
      ],
      advancers: [
        "Coalizione",
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E57",
      name: "Mercato Nero Fiorente",
      globals: [
        {
          track: "Sanzioni",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: 1
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Europa",
        "Iran",
        "Russia",
        "Cina",
        "Coalizione"
      ],
      advancers: [
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E58",
      name: "Inflazione Galoppante Iran",
      globals: [
        {
          track: "Sanzioni",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -2
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Coalizione",
        "Europa",
        "Iran",
        "Russia",
        "Cina"
      ],
      advancers: [
        "Coalizione",
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E59",
      name: "Proteste Economiche",
      globals: [
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: -2
        }
      ],
      order: [
        "Iran",
        "Russia",
        "Cina",
        "Coalizione",
        "Europa"
      ],
      advancers: [
        "Coalizione",
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E60",
      name: "Razionamento Carburante",
      globals: [],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: 1
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: -2
        }
      ],
      order: [
        "Cina",
        "Coalizione",
        "Europa",
        "Iran",
        "Russia"
      ],
      advancers: [
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E61",
      name: "Proteste Mahsa Amini 2.0",
      globals: [
        {
          track: "Opinione",
          delta: 2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: -3
        }
      ],
      order: [
        "Russia",
        "Coalizione",
        "Iran",
        "Europa",
        "Cina"
      ],
      advancers: [
        "Iran"
      ],
      blocksRound: false
    },
    {
      id: "E62",
      name: "Repressione Violenta",
      globals: [
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: 1
        },
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: -1
        }
      ],
      order: [
        "Europa",
        "Cina",
        "Russia",
        "Coalizione",
        "Iran"
      ],
      advancers: [
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E63",
      name: "Sciopero Generale",
      globals: [],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -2
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: -2
        }
      ],
      order: [
        "Iran",
        "Europa",
        "Cina",
        "Russia",
        "Coalizione"
      ],
      advancers: [
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E64",
      name: "Defezione Militare",
      globals: [
        {
          track: "Nucleare",
          delta: -1
        },
        {
          track: "Opinione",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Militare",
          delta: -2
        }
      ],
      order: [
        "Cina",
        "Russia",
        "Coalizione",
        "Iran",
        "Europa"
      ],
      advancers: [
        "Iran",
        "Russia"
      ],
      blocksRound: false
    },
    {
      id: "E65",
      name: "Colpo di Stato Fallito",
      globals: [
        {
          track: "Crisi Bellica",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Militare",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: -1
        }
      ],
      order: [
        "Coalizione",
        "Iran",
        "Europa",
        "Cina",
        "Russia"
      ],
      advancers: [
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E66",
      name: "Riforma Interna Sorpresa",
      globals: [
        {
          track: "Sanzioni",
          delta: -1
        },
        {
          track: "Crisi Bellica",
          delta: 1
        },
        {
          track: "Opinione",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: 2
        }
      ],
      order: [
        "Europa",
        "Iran",
        "Coalizione",
        "Russia",
        "Cina"
      ],
      advancers: [
        "Iran",
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E67",
      name: "Elezioni Truccate",
      globals: [
        {
          track: "Opinione",
          delta: 2
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: -1
        }
      ],
      order: [
        "Cina",
        "Europa",
        "Iran",
        "Coalizione",
        "Russia"
      ],
      advancers: [
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E68",
      name: "Nuovo Leader Supremo",
      globals: [],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: -2
        },
        {
          faction: "Iran",
          track: "Militare",
          delta: 1
        }
      ],
      order: [
        "Iran",
        "Coalizione",
        "Russia",
        "Cina",
        "Europa"
      ],
      advancers: [
        "Cina"
      ],
      blocksRound: false
    },
    {
      id: "E69",
      name: "Fazione Moderata al Potere",
      globals: [
        {
          track: "Nucleare",
          delta: -1
        },
        {
          track: "Crisi Bellica",
          delta: 1
        },
        {
          track: "Opinione",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: 2
        }
      ],
      order: [
        "Coalizione",
        "Russia",
        "Cina",
        "Europa",
        "Iran"
      ],
      advancers: [
        "Coalizione"
      ],
      blocksRound: false
    },
    {
      id: "E70",
      name: "Fazione Hardliner al Potere",
      globals: [
        {
          track: "Nucleare",
          delta: 1
        },
        {
          track: "Crisi Bellica",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Militare",
          delta: 1
        }
      ],
      order: [
        "Russia",
        "Cina",
        "Europa",
        "Iran",
        "Coalizione"
      ],
      advancers: [
        "Iran"
      ],
      blocksRound: false
    },
    {
      id: "E71",
      name: "Crisi Successione",
      globals: [
        {
          track: "Crisi Bellica",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: -3
        }
      ],
      order: [
        "Iran",
        "Coalizione",
        "Russia",
        "Cina",
        "Europa"
      ],
      advancers: [
        "Cina"
      ],
      blocksRound: true
    },
    {
      id: "E72",
      name: "Frammentazione IRGC",
      globals: [
        {
          track: "Nucleare",
          delta: -1
        },
        {
          track: "Crisi Bellica",
          delta: 1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Militare",
          delta: -2
        }
      ],
      order: [
        "Coalizione",
        "Russia",
        "Cina",
        "Europa",
        "Iran"
      ],
      advancers: [
        "Iran",
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E73",
      name: "Rivolta Etnica",
      globals: [],
      changes: [
        {
          faction: "Iran",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: -2
        }
      ],
      order: [
        "Cina",
        "Europa",
        "Iran",
        "Coalizione",
        "Russia"
      ],
      advancers: [
        "Russia",
        "Europa"
      ],
      blocksRound: false
    },
    {
      id: "E74",
      name: "Attentato Leader",
      globals: [
        {
          track: "Crisi Bellica",
          delta: -1
        },
        {
          track: "Opinione",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: -2
        }
      ],
      order: [
        "Europa",
        "Iran",
        "Coalizione",
        "Russia",
        "Cina"
      ],
      advancers: [
        "Europa"
      ],
      blocksRound: true
    },
    {
      id: "E75",
      name: "Unit\xE0 Nazionale Emergenza",
      globals: [
        {
          track: "Nucleare",
          delta: 1
        },
        {
          track: "Opinione",
          delta: -1
        }
      ],
      changes: [
        {
          faction: "Iran",
          track: "Consenso",
          delta: 3
        }
      ],
      order: [
        "Russia",
        "Cina",
        "Europa",
        "Iran",
        "Coalizione"
      ],
      advancers: [
        "Europa"
      ],
      blocksRound: false
    }
  ],
  objectives: [
    {
      id: "OBJ-IR-01",
      faction: "Iran",
      number: 1,
      name: "Soglia nucleare",
      condition: "Termina la partita con il Nucleare a 10 o pi\xF9.",
      points: 6
    },
    {
      id: "OBJ-IR-02",
      faction: "Iran",
      number: 2,
      name: "Breakout imminente",
      condition: "Termina la partita con Nucleare 12 o pi\xF9 e Sanzioni 5 o meno.",
      points: 6
    },
    {
      id: "OBJ-IR-03",
      faction: "Iran",
      number: 3,
      name: "Sanzioni infrante",
      condition: "Termina la partita con le Sanzioni a 3 o meno.",
      points: 4
    },
    {
      id: "OBJ-IR-04",
      faction: "Iran",
      number: 4,
      name: "Dominanza nel Golfo",
      condition: "Hai presenza (unit\xE0 o Influenza) in almeno 3 Stati tra Iraq, Yemen, Bahrein, Kuwait ed Emirati.",
      points: 6
    },
    {
      id: "OBJ-IR-05",
      faction: "Iran",
      number: 5,
      name: "Asse della resistenza",
      condition: "Controlli almeno 3 Stati tra Libano, Siria, Iraq e Yemen.",
      points: 6
    },
    {
      id: "OBJ-IR-06",
      faction: "Iran",
      number: 6,
      name: "Destabilizzare il nemico",
      condition: "Termina la partita con il Consenso della Coalizione a 3 o meno.",
      points: 4
    },
    {
      id: "OBJ-IR-07",
      faction: "Iran",
      number: 7,
      name: "Chiudere lo Stretto",
      condition: "Una tua Flotta veloce del Golfo occupa lo Stretto di Hormuz a fine partita.",
      points: 4
    },
    {
      id: "OBJ-IR-08",
      faction: "Iran",
      number: 8,
      name: "Sull'orlo della guerra",
      condition: "Termina la partita con Crisi Bellica 3 o meno e Nucleare 8 o pi\xF9.",
      points: 6
    },
    {
      id: "OBJ-IR-09",
      faction: "Iran",
      number: 9,
      name: "Stabilit\xE0 interna",
      condition: "Termina la partita con il Consenso dell'Iran a 7 o pi\xF9.",
      points: 3
    },
    {
      id: "OBJ-IR-10",
      faction: "Iran",
      number: 10,
      name: "Deterrenza missilistica",
      condition: "Hai almeno 2 Missili balistici sul tabellone a fine partita.",
      points: 4
    },
    {
      id: "OBJ-IR-11",
      faction: "Iran",
      number: 11,
      name: "Corridoio sciita",
      condition: "Hai presenza (unit\xE0 o Influenza) in Iran, in Iraq e in Siria.",
      points: 6
    },
    {
      id: "OBJ-IR-12",
      faction: "Iran",
      number: 12,
      name: "Milizie proxy sul campo",
      condition: "Hai almeno 3 Proxy regionali in 3 territori diversi.",
      points: 4
    },
    {
      id: "OBJ-IR-13",
      faction: "Iran",
      number: 13,
      name: "Guerra cyber",
      condition: "Hai almeno 2 IRGC Cyber Unit in territori diversi.",
      points: 3
    },
    {
      id: "OBJ-IR-14",
      faction: "Iran",
      number: 14,
      name: "Signore dello Stretto",
      condition: "Termina con Militare dell'Iran a 8 o pi\xF9 e presenza nello Stretto di Hormuz.",
      points: 4
    },
    {
      id: "OBJ-IR-15",
      faction: "Iran",
      number: 15,
      name: "Resistenza economica",
      condition: "Termina la partita con Economia dell'Iran a 7 o pi\xF9 e Consenso a 6 o pi\xF9.",
      points: 3
    },
    {
      id: "OBJ-CO-01",
      faction: "Coalizione",
      number: 1,
      name: "Nucleare bloccato",
      condition: "Termina la partita con il Nucleare a 5 o meno.",
      points: 6
    },
    {
      id: "OBJ-CO-02",
      faction: "Coalizione",
      number: 2,
      name: "Sanzioni massime",
      condition: "Termina la partita con le Sanzioni a 8 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-CO-03",
      faction: "Coalizione",
      number: 3,
      name: "Deterrenza stabile",
      condition: "Termina la partita con la Crisi Bellica a 6 o pi\xF9.",
      points: 3
    },
    {
      id: "OBJ-CO-04",
      faction: "Coalizione",
      number: 4,
      name: "Superiorit\xE0 tecnologica",
      condition: "Investi in tecnologia: termina con l'Economia della Coalizione a 8 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-CO-05",
      faction: "Coalizione",
      number: 5,
      name: "Diplomazia dominante",
      condition: "Termina la partita con la Diplomazia della Coalizione a 8 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-CO-06",
      faction: "Coalizione",
      number: 6,
      name: "Consenso consolidato",
      condition: "Termina la partita con il Consenso della Coalizione a 7 o pi\xF9.",
      points: 3
    },
    {
      id: "OBJ-CO-07",
      faction: "Coalizione",
      number: 7,
      name: "Iran destabilizzato",
      condition: "Termina la partita con il Consenso dell'Iran a 3 o meno.",
      points: 6
    },
    {
      id: "OBJ-CO-08",
      faction: "Coalizione",
      number: 8,
      name: "Opinione mondiale favorevole",
      condition: "Termina la partita con l'Opinione Globale a +4 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-CO-09",
      faction: "Coalizione",
      number: 9,
      name: "Accordo nucleare storico",
      condition: "Termina con Nucleare 4 o meno e Sanzioni 7 o pi\xF9.",
      points: 6
    },
    {
      id: "OBJ-CO-10",
      faction: "Coalizione",
      number: 10,
      name: "Isolamento diplomatico Russia",
      condition: "Termina la partita con la Diplomazia della Russia a 3 o meno.",
      points: 6
    },
    {
      id: "OBJ-CO-11",
      faction: "Coalizione",
      number: 11,
      name: "Scudo missilistico attivo",
      condition: "Hai almeno 2 Scudi Missilistici sul tabellone a fine partita.",
      points: 4
    },
    {
      id: "OBJ-CO-12",
      faction: "Coalizione",
      number: 12,
      name: "Controllo del Golfo",
      condition: "Hai presenza (unit\xE0 o Influenza) in almeno 3 Stati tra Kuwait, Bahrein, Qatar, Emirati, Oman e Arabia Saudita.",
      points: 4
    },
    {
      id: "OBJ-CO-13",
      faction: "Coalizione",
      number: 13,
      name: "Strike chirurgico",
      condition: "Termina con il Nucleare a 4 o meno e presenza (unit\xE0 o Influenza) in Iran.",
      points: 6
    },
    {
      id: "OBJ-CO-14",
      faction: "Coalizione",
      number: 14,
      name: "Superiorit\xE0 militare",
      condition: "Termina la partita con il Militare della Coalizione a 8 o pi\xF9.",
      points: 3
    },
    {
      id: "OBJ-CO-15",
      faction: "Coalizione",
      number: 15,
      name: "Hormuz libero",
      condition: "Un tuo Carrier Strike Group occupa lo Stretto di Hormuz a fine partita.",
      points: 4
    },
    {
      id: "OBJ-RU-01",
      faction: "Russia",
      number: 1,
      name: "Egemonia militare",
      condition: "Termina la partita con il Militare della Russia a 8 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-RU-02",
      faction: "Russia",
      number: 2,
      name: "Veto determinante",
      condition: "Termina con Diplomazia della Russia a 7 o pi\xF9 e Sanzioni 5 o meno.",
      points: 4
    },
    {
      id: "OBJ-RU-03",
      faction: "Russia",
      number: 3,
      name: "Energia come arma",
      condition: "Termina con Economia della Russia a 8 o pi\xF9 ed Economia dell'Europa a 4 o meno.",
      points: 6
    },
    {
      id: "OBJ-RU-04",
      faction: "Russia",
      number: 4,
      name: "Destabilizza l'Occidente",
      condition: "Termina la partita con il Consenso della Coalizione a 3 o meno.",
      points: 6
    },
    {
      id: "OBJ-RU-05",
      faction: "Russia",
      number: 5,
      name: "Stabilit\xE0 economica",
      condition: "Termina con Economia della Russia a 7 o pi\xF9 e Consenso a 6 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-RU-06",
      faction: "Russia",
      number: 6,
      name: "Guerra ibrida",
      condition: "Hai almeno 2 Cyber Russia in territori diversi.",
      points: 3
    },
    {
      id: "OBJ-RU-07",
      faction: "Russia",
      number: 7,
      name: "Asse Mosca\u2013Teheran",
      condition: "Termina con la Diplomazia di Russia e Iran entrambe a 6 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-RU-08",
      faction: "Russia",
      number: 8,
      name: "Tensione calcolata",
      condition: "Termina con Crisi Bellica 4 o meno e Militare della Russia a 6 o pi\xF9.",
      points: 6
    },
    {
      id: "OBJ-RU-09",
      faction: "Russia",
      number: 9,
      name: "Flotta in missione",
      condition: "Hai almeno 2 Flotte nel Mediterraneo sul tabellone a fine partita.",
      points: 4
    },
    {
      id: "OBJ-RU-10",
      faction: "Russia",
      number: 10,
      name: "Isolamento NATO",
      condition: "Termina la partita con la Diplomazia della Coalizione a 3 o meno.",
      points: 6
    },
    {
      id: "OBJ-RU-11",
      faction: "Russia",
      number: 11,
      name: "Presenza nel Mediterraneo",
      condition: "Hai presenza (unit\xE0 o Influenza) in almeno 2 Stati tra Siria, Libano e Turchia.",
      points: 4
    },
    {
      id: "OBJ-RU-12",
      faction: "Russia",
      number: 12,
      name: "Base navale Tartus",
      condition: "Controlli la Siria a fine partita (pi\xF9 elementi di ogni altra fazione).",
      points: 4
    },
    {
      id: "OBJ-RU-13",
      faction: "Russia",
      number: 13,
      name: "Controllo narrativo",
      condition: "Termina la partita con l'Opinione Globale a 0 o meno.",
      points: 4
    },
    {
      id: "OBJ-RU-14",
      faction: "Russia",
      number: 14,
      name: "Stabilit\xE0 Iran alleato",
      condition: "Termina con Consenso dell'Iran a 6 o pi\xF9 e presenza in Siria.",
      points: 3
    },
    {
      id: "OBJ-RU-15",
      faction: "Russia",
      number: 15,
      name: "Potenza navale",
      condition: "Termina con il Militare della Russia a 7 o pi\xF9 e una Flotta nel Mediterraneo sul tabellone.",
      points: 4
    },
    {
      id: "OBJ-CN-01",
      faction: "Cina",
      number: 1,
      name: "Potenza economica",
      condition: "Termina la partita con l'Economia della Cina a 9 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-CN-02",
      faction: "Cina",
      number: 2,
      name: "Via della Seta securizzata",
      condition: "Termina con il Consenso della Cina a 7 o pi\xF9 e una Flotta commerciale sul tabellone.",
      points: 4
    },
    {
      id: "OBJ-CN-03",
      faction: "Cina",
      number: 3,
      name: "Influenza commerciale dominante",
      condition: "Termina la partita con la Diplomazia della Cina a 8 o pi\xF9.",
      points: 6
    },
    {
      id: "OBJ-CN-04",
      faction: "Cina",
      number: 4,
      name: "Cyber superiorit\xE0",
      condition: "Termina con il Militare della Cina a 7 o pi\xF9 e una Cyber Unit sul tabellone.",
      points: 4
    },
    {
      id: "OBJ-CN-05",
      faction: "Cina",
      number: 5,
      name: "Neutralit\xE0 strategica",
      condition: "Termina con la Diplomazia della Cina a 7 o pi\xF9 e nessun tracciato della Cina in Crisi.",
      points: 4
    },
    {
      id: "OBJ-CN-06",
      faction: "Cina",
      number: 6,
      name: "BRI nel Golfo",
      condition: "Hai presenza (unit\xE0 o Influenza) in almeno 2 Stati tra Arabia Saudita, Emirati, Oman, Qatar, Bahrein e Kuwait.",
      points: 4
    },
    {
      id: "OBJ-CN-07",
      faction: "Cina",
      number: 7,
      name: "Flotta cinese nel Golfo",
      condition: "Hai almeno 2 Flotte commerciali sul tabellone a fine partita.",
      points: 4
    },
    {
      id: "OBJ-CN-08",
      faction: "Cina",
      number: 8,
      name: "Destabilizza Europa",
      condition: "Termina la partita con il Consenso dell'Europa a 3 o meno.",
      points: 6
    },
    {
      id: "OBJ-CN-09",
      faction: "Cina",
      number: 9,
      name: "Crisi sotto controllo",
      condition: "Termina la partita con la Crisi Bellica a 5 o pi\xF9.",
      points: 3
    },
    {
      id: "OBJ-CN-10",
      faction: "Cina",
      number: 10,
      name: "Mediatore di pace",
      condition: "Termina con Crisi Bellica 7 o pi\xF9 e Opinione tra \u22122 e +2.",
      points: 6
    },
    {
      id: "OBJ-CN-11",
      faction: "Cina",
      number: 11,
      name: "Accordo commerciale con Iran",
      condition: "Da partner economico: termina con l'Economia dell'Iran a 7 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-CN-12",
      faction: "Cina",
      number: 12,
      name: "Progetto BRI completato",
      condition: "Termina con Diplomazia ed Economia della Cina entrambe a 8 o pi\xF9.",
      points: 6
    },
    {
      id: "OBJ-CN-13",
      faction: "Cina",
      number: 13,
      name: "Stabilit\xE0 regionale",
      condition: "Almeno 3 fazioni terminano con il Consenso a 5 o pi\xF9.",
      points: 6
    },
    {
      id: "OBJ-CN-14",
      faction: "Cina",
      number: 14,
      name: "Cyber army attiva",
      condition: "Hai almeno 2 Cyber Unit in territori diversi.",
      points: 3
    },
    {
      id: "OBJ-CN-15",
      faction: "Cina",
      number: 15,
      name: "Porto strategico",
      condition: "Hai presenza (unit\xE0 o Influenza) in almeno 2 Stati tra Oman, Emirati, Qatar e Bahrein.",
      points: 4
    },
    {
      id: "OBJ-EU-01",
      faction: "Europa",
      number: 1,
      name: "Diplomazia attiva",
      condition: "Termina la partita con la Diplomazia dell'Europa a 8 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-EU-02",
      faction: "Europa",
      number: 2,
      name: "Aiuti umanitari",
      condition: "Hai almeno 2 Aiuti umanitari sul tabellone e Consenso dell'Europa a 6 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-EU-03",
      faction: "Europa",
      number: 3,
      name: "Coesione interna",
      condition: "Termina la partita con il Consenso dell'Europa a 8 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-EU-04",
      faction: "Europa",
      number: 4,
      name: "Sanzioni moderate",
      condition: "Termina la partita con le Sanzioni tra 4 e 7.",
      points: 3
    },
    {
      id: "OBJ-EU-05",
      faction: "Europa",
      number: 5,
      name: "Pace in vista",
      condition: "Termina la partita con la Crisi Bellica a 7 o pi\xF9.",
      points: 3
    },
    {
      id: "OBJ-EU-06",
      faction: "Europa",
      number: 6,
      name: "Multilateralismo vincente",
      condition: "Termina con Opinione +3 o pi\xF9 e Diplomazia dell'Europa a 7 o pi\xF9.",
      points: 6
    },
    {
      id: "OBJ-EU-07",
      faction: "Europa",
      number: 7,
      name: "Stabilit\xE0 energetica",
      condition: "Termina la partita con l'Economia dell'Europa a 8 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-EU-08",
      faction: "Europa",
      number: 8,
      name: "Peacekeeping",
      condition: "Hai almeno 3 Caschi blu sul tabellone, in almeno 2 territori.",
      points: 4
    },
    {
      id: "OBJ-EU-09",
      faction: "Europa",
      number: 9,
      name: "Accordo finale",
      condition: "Termina con Crisi Bellica 7 o pi\xF9, Sanzioni tra 3 e 6 e Opinione 0 o pi\xF9.",
      points: 6
    },
    {
      id: "OBJ-EU-10",
      faction: "Europa",
      number: 10,
      name: "Destabilizza Russia diplomaticamente",
      condition: "Termina la partita con la Diplomazia della Russia a 3 o meno.",
      points: 6
    },
    {
      id: "OBJ-EU-11",
      faction: "Europa",
      number: 11,
      name: "Stabilit\xE0 Iran",
      condition: "Da mediatrice: termina con il Consenso dell'Iran a 7 o pi\xF9.",
      points: 4
    },
    {
      id: "OBJ-EU-12",
      faction: "Europa",
      number: 12,
      name: "Peacekeeping nel Levante",
      condition: "Hai presenza (unit\xE0 o Influenza) in almeno 2 Stati tra Libano, Siria e Giordania.",
      points: 4
    },
    {
      id: "OBJ-EU-13",
      faction: "Europa",
      number: 13,
      name: "Fianco sud NATO protetto",
      condition: "Hai almeno 2 elementi (unit\xE0 o Influenza) in Turchia a fine partita.",
      points: 4
    },
    {
      id: "OBJ-EU-14",
      faction: "Europa",
      number: 14,
      name: "Accordo diplomatico",
      condition: "Termina con Opinione +2 o pi\xF9 e Consenso dell'Europa a 7 o pi\xF9.",
      points: 3
    },
    {
      id: "OBJ-EU-15",
      faction: "Europa",
      number: 15,
      name: "Fronte atlantico",
      condition: "Termina con il Consenso di Europa e Coalizione entrambi a 6 o pi\xF9.",
      points: 3
    }
  ],
  units: [
    {
      id: "IR-U01",
      name: "Forze convenzionali",
      faction: "Iran",
      cost: 1,
      attack: 0,
      defense: 1,
      naval: false,
      effect: "Esercito regolare. Presidio: in Iran l'Influenza iraniana non pu\xF2 essere Destabilizzata."
    },
    {
      id: "IR-U02",
      name: "IRGC",
      faction: "Iran",
      cost: 3,
      attack: 3,
      defense: 2,
      naval: false,
      effect: "\xC9lite: in Iran la difesa totale dell'unit\xE0 arriva a +5."
    },
    {
      id: "IR-U03",
      name: "Proxy regionali",
      faction: "Iran",
      cost: 1,
      attack: 1,
      defense: 2,
      naval: false,
      effect: "In caso di vittoria: \u22121 Consenso della fazione sconfitta. Influenza dell'Iran in questo Stato \u22121 OP."
    },
    {
      id: "IR-U04",
      name: "Missili balistici",
      faction: "Iran",
      cost: 3,
      attack: 4,
      defense: 0,
      naval: false,
      effect: "Solo attacco; max 2 per territorio. Valgono +0 se nel territorio c'\xE8 uno Scudo Missilistico.",
      maxPerTerritory: 2
    },
    {
      id: "IR-U05",
      name: "Flotta veloce del Golfo",
      faction: "Iran",
      cost: 2,
      attack: 2,
      defense: 2,
      naval: true,
      effect: "Solo navale; 2 nello Stretto di Hormuz attivano il Blocco di Hormuz."
    },
    {
      id: "IR-U06",
      name: "IRGC Cyber Unit",
      faction: "Iran",
      cost: 2,
      attack: 1,
      defense: 0,
      naval: false,
      effect: "Prima del combattimento: \u22121 alla difesa avversaria."
    },
    {
      id: "IR-U07",
      name: "Droni Shahed",
      faction: "Iran",
      cost: 2,
      attack: 2,
      defense: 0,
      naval: false,
      effect: "In caso di vittoria: \u22121 Consenso della fazione sconfitta."
    },
    {
      id: "CO-U01",
      name: "Convenzionale",
      faction: "Coalizione",
      cost: 1,
      attack: 0,
      defense: 1,
      naval: false,
      effect: "Difesa standard. Presidio: l'Influenza della Coalizione in questo Stato non pu\xF2 essere Destabilizzata."
    },
    {
      id: "CO-U02",
      name: "Forze Speciali",
      faction: "Coalizione",
      cost: 3,
      attack: 3,
      defense: 1,
      naval: false,
      effect: "In caso di vittoria: +1 Diplomazia Coalizione. In caso di sconfitta: \u22121 Consenso Coalizione."
    },
    {
      id: "CO-U03",
      name: "Aviazione Tattica",
      faction: "Coalizione",
      cost: 3,
      attack: 3,
      defense: 0,
      naval: false,
      effect: "Il bonus \xE8 annullato da una Difesa aerea S-400 nel territorio."
    },
    {
      id: "CO-U04",
      name: "Carrier Strike Group",
      faction: "Coalizione",
      cost: 4,
      attack: 2,
      defense: 3,
      naval: true,
      effect: "Solo navale; a Hormuz annulla il Blocco iraniano."
    },
    {
      id: "CO-U05",
      name: "Missili da crociera",
      faction: "Coalizione",
      cost: 3,
      attack: 3,
      defense: 0,
      naval: false,
      effect: "In Iran: \u22121 Nucleare in caso di vittoria."
    },
    {
      id: "CO-U06",
      name: "Scudo Missilistico",
      faction: "Coalizione",
      cost: 3,
      attack: 0,
      defense: 4,
      naval: false,
      effect: "Solo difesa; i Missili balistici nel suo territorio valgono +0."
    },
    {
      id: "RU-U01",
      name: "Consiglieri militari",
      faction: "Russia",
      cost: 2,
      attack: 1,
      defense: 1,
      naval: false,
      effect: "Sostegno: aggiunge +1 sia se sostiene l'attaccante sia il difensore."
    },
    {
      id: "RU-U02",
      name: "Difesa aerea S-400",
      faction: "Russia",
      cost: 3,
      attack: 2,
      defense: 3,
      naval: false,
      effect: "Annulla il bonus dell'Aviazione Tattica nel territorio."
    },
    {
      id: "RU-U03",
      name: "Forniture armi",
      faction: "Russia",
      cost: 2,
      attack: 1,
      defense: 0,
      naval: false,
      effect: "Sostegno: +1 in pi\xF9 alla parte sostenuta nel territorio."
    },
    {
      id: "RU-U04",
      name: "Flotta nel Mediterraneo",
      faction: "Russia",
      cost: 2,
      attack: 2,
      defense: 2,
      naval: true,
      effect: "Solo navale. Proiezione: Influenza russa \u22121 OP in Siria e Libano."
    },
    {
      id: "RU-U05",
      name: "Intelligence",
      faction: "Russia",
      cost: 2,
      attack: 1,
      defense: 0,
      naval: false,
      effect: "Al piazzamento: guarda la mano di una fazione. Rete informativa: a ogni tua attivazione guarda la mano di una fazione presente in questo Stato."
    },
    {
      id: "RU-U06",
      name: "Cyber Russia",
      faction: "Russia",
      cost: 2,
      attack: 1,
      defense: 1,
      naval: false,
      effect: "Interferenza: gli avversari pagano +1 OP per Influenza e schieramenti in questo Stato."
    },
    {
      id: "CN-U01",
      name: "Investimenti BRI",
      faction: "Cina",
      cost: 2,
      attack: 0,
      defense: 1,
      naval: false,
      effect: "Influenza cinese in questo Stato \u22121 OP."
    },
    {
      id: "CN-U02",
      name: "Flotta commerciale",
      faction: "Cina",
      cost: 2,
      attack: 0,
      defense: 1,
      naval: true,
      effect: "Solo navale. Rotte protette: una volta per round la Cina ignora una perdita di Economia da correlazioni, eventi o Blocco di Hormuz."
    },
    {
      id: "CN-U03",
      name: "Tecnologia duale",
      faction: "Cina",
      cost: 2,
      attack: 0,
      defense: 1,
      naval: false,
      effect: "Se difendono in questo Stato unit\xE0 di Iran o Russia: +1 alla difesa."
    },
    {
      id: "CN-U04",
      name: "Infrastrutture",
      faction: "Cina",
      cost: 2,
      attack: 0,
      defense: 1,
      naval: false,
      effect: "Dipendenza: l'Influenza cinese in questo Stato non pu\xF2 essere Destabilizzata."
    },
    {
      id: "CN-U05",
      name: "Satelliti / Spazio",
      faction: "Cina",
      cost: 2,
      attack: 1,
      defense: 0,
      naval: false,
      effect: "Al piazzamento: guarda la mano di una fazione. Rete informativa: a ogni tua attivazione guarda la mano di una fazione presente in questo Stato."
    },
    {
      id: "CN-U06",
      name: "Cyber Unit",
      faction: "Cina",
      cost: 2,
      attack: 1,
      defense: 0,
      naval: false,
      effect: "Interferenza: gli avversari pagano +1 OP per Influenza e schieramenti in questo Stato."
    },
    {
      id: "EU-U01",
      name: "Caschi blu",
      faction: "Europa",
      cost: 1,
      attack: 0,
      defense: 2,
      naval: false,
      effect: "Solo difesa; max 3 per territorio. Zona protetta: attaccare questo Stato costa 2 OP in pi\xF9.",
      maxPerTerritory: 3
    },
    {
      id: "EU-U02",
      name: "Missione navale UE",
      faction: "Europa",
      cost: 2,
      attack: 1,
      defense: 2,
      naval: true,
      effect: "Solo navale. Rotte sicure: una volta per round l'Europa ignora una perdita di Economia da correlazioni, eventi o Blocco di Hormuz."
    },
    {
      id: "EU-U03",
      name: "Aiuti umanitari",
      faction: "Europa",
      cost: 2,
      attack: 0,
      defense: 1,
      naval: false,
      effect: "Influenza europea in questo Stato \u22121 OP."
    },
    {
      id: "EU-U04",
      name: "Diplomazia UE",
      faction: "Europa",
      cost: 2,
      attack: 0,
      defense: 0,
      naval: false,
      effect: "Finch\xE9 \xE8 sul tabellone: Pressione globale dell'Europa \u22121 OP (minimo 1)."
    },
    {
      id: "EU-U05",
      name: "Intelligence",
      faction: "Europa",
      cost: 2,
      attack: 1,
      defense: 1,
      naval: false,
      effect: "Al piazzamento: guarda la mano di una fazione. Rete informativa: a ogni tua attivazione guarda la mano di una fazione presente in questo Stato."
    },
    {
      id: "EU-U06",
      name: "Cyber Unit",
      faction: "Europa",
      cost: 2,
      attack: 1,
      defense: 0,
      naval: false,
      effect: "Interferenza: gli avversari pagano +1 OP per Influenza e schieramenti in questo Stato."
    }
  ],
  territories: [
    {
      id: "turchia",
      name: "Turchia",
      capacity: 4,
      alignment: {
        Iran: 1,
        Coalizione: 0,
        Russia: 2,
        Cina: 1,
        Europa: 0
      }
    },
    {
      id: "siria",
      name: "Siria",
      capacity: 4,
      alignment: {
        Iran: 0,
        Coalizione: 2,
        Russia: 0,
        Cina: 1,
        Europa: 2
      }
    },
    {
      id: "libano",
      name: "Libano",
      capacity: 4,
      alignment: {
        Iran: 0,
        Coalizione: 2,
        Russia: 1,
        Cina: 1,
        Europa: 0
      }
    },
    {
      id: "iran",
      name: "Iran",
      capacity: 6,
      alignment: {
        Iran: 0,
        Coalizione: 2,
        Russia: 0,
        Cina: 0,
        Europa: 2
      }
    },
    {
      id: "iraq",
      name: "Iraq",
      capacity: 3,
      alignment: {
        Iran: 0,
        Coalizione: 1,
        Russia: 0,
        Cina: 0,
        Europa: 1
      }
    },
    {
      id: "israele",
      name: "Israele",
      capacity: 6,
      alignment: {
        Iran: 2,
        Coalizione: 0,
        Russia: 2,
        Cina: 2,
        Europa: 0
      }
    },
    {
      id: "giordania",
      name: "Giordania",
      capacity: 2,
      alignment: {
        Iran: 1,
        Coalizione: 0,
        Russia: 1,
        Cina: 1,
        Europa: 0
      }
    },
    {
      id: "egitto",
      name: "Egitto",
      capacity: 4,
      alignment: {
        Iran: 1,
        Coalizione: 0,
        Russia: 1,
        Cina: 1,
        Europa: 0
      }
    },
    {
      id: "arabia-saudita",
      name: "Arabia Saudita",
      capacity: 4,
      alignment: {
        Iran: 2,
        Coalizione: 0,
        Russia: 1,
        Cina: 0,
        Europa: 1
      }
    },
    {
      id: "kuwait",
      name: "Kuwait",
      capacity: 2,
      alignment: {
        Iran: 2,
        Coalizione: 0,
        Russia: 1,
        Cina: 1,
        Europa: 1
      }
    },
    {
      id: "bahrein",
      name: "Bahrein",
      capacity: 2,
      alignment: {
        Iran: 2,
        Coalizione: 0,
        Russia: 1,
        Cina: 1,
        Europa: 1
      }
    },
    {
      id: "qatar",
      name: "Qatar",
      capacity: 2,
      alignment: {
        Iran: 2,
        Coalizione: 0,
        Russia: 1,
        Cina: 0,
        Europa: 1
      }
    },
    {
      id: "emirati",
      name: "Emirati",
      capacity: 2,
      alignment: {
        Iran: 2,
        Coalizione: 0,
        Russia: 1,
        Cina: 0,
        Europa: 1
      }
    },
    {
      id: "oman",
      name: "Oman",
      capacity: 2,
      alignment: {
        Iran: 0,
        Coalizione: 0,
        Russia: 1,
        Cina: 0,
        Europa: 0
      }
    },
    {
      id: "yemen",
      name: "Yemen",
      capacity: 4,
      alignment: {
        Iran: 0,
        Coalizione: 2,
        Russia: 1,
        Cina: 1,
        Europa: 2
      }
    },
    {
      id: "hormuz",
      name: "Stretto di Hormuz",
      capacity: 2,
      alignment: {
        Iran: 1,
        Coalizione: 0,
        Russia: 0,
        Cina: 0,
        Europa: 0
      }
    }
  ],
  correlations: {
    Iran: {
      Economia: [
        {
          faction: "Cina",
          track: "Economia",
          delta: 1
        },
        {
          faction: "Europa",
          track: "Economia",
          delta: -1
        }
      ],
      Militare: [
        {
          faction: "Coalizione",
          track: "Militare",
          delta: 1
        },
        {
          faction: "Europa",
          track: "Consenso",
          delta: -1
        }
      ],
      Diplomazia: [
        {
          faction: "Russia",
          track: "Diplomazia",
          delta: 1
        },
        {
          faction: "Coalizione",
          track: "Consenso",
          delta: -1
        }
      ],
      Consenso: [
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: 1
        },
        {
          faction: "Europa",
          track: "Consenso",
          delta: 1
        }
      ]
    },
    Coalizione: {
      Economia: [
        {
          faction: "Europa",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Economia",
          delta: -1
        }
      ],
      Militare: [
        {
          faction: "Cina",
          track: "Militare",
          delta: 1
        },
        {
          faction: "Cina",
          track: "Consenso",
          delta: -1
        }
      ],
      Diplomazia: [
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: -1
        },
        {
          faction: "Cina",
          track: "Diplomazia",
          delta: -1
        }
      ],
      Consenso: [
        {
          faction: "Europa",
          track: "Consenso",
          delta: 1
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: -1
        }
      ]
    },
    Russia: {
      Economia: [
        {
          faction: "Europa",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Cina",
          track: "Consenso",
          delta: 1
        }
      ],
      Militare: [
        {
          faction: "Iran",
          track: "Militare",
          delta: 1
        },
        {
          faction: "Europa",
          track: "Militare",
          delta: 1
        }
      ],
      Diplomazia: [
        {
          faction: "Coalizione",
          track: "Diplomazia",
          delta: -1
        },
        {
          faction: "Cina",
          track: "Diplomazia",
          delta: 1
        }
      ],
      Consenso: [
        {
          faction: "Coalizione",
          track: "Consenso",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Consenso",
          delta: 1
        }
      ]
    },
    Cina: {
      Economia: [
        {
          faction: "Iran",
          track: "Economia",
          delta: 1
        },
        {
          faction: "Europa",
          track: "Economia",
          delta: -1
        }
      ],
      Militare: [
        {
          faction: "Coalizione",
          track: "Militare",
          delta: -1
        },
        {
          faction: "Iran",
          track: "Militare",
          delta: 1
        }
      ],
      Diplomazia: [
        {
          faction: "Coalizione",
          track: "Diplomazia",
          delta: -1
        },
        {
          faction: "Europa",
          track: "Diplomazia",
          delta: 1
        }
      ],
      Consenso: [
        {
          faction: "Europa",
          track: "Economia",
          delta: 1
        },
        {
          faction: "Coalizione",
          track: "Economia",
          delta: 1
        }
      ]
    },
    Europa: {
      Economia: [
        {
          faction: "Russia",
          track: "Economia",
          delta: -1
        },
        {
          faction: "Coalizione",
          track: "Economia",
          delta: 1
        }
      ],
      Militare: [
        {
          faction: "Russia",
          track: "Militare",
          delta: 1
        },
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: -1
        }
      ],
      Diplomazia: [
        {
          faction: "Iran",
          track: "Diplomazia",
          delta: 1
        },
        {
          faction: "Cina",
          track: "Diplomazia",
          delta: -1
        }
      ],
      Consenso: [
        {
          faction: "Coalizione",
          track: "Consenso",
          delta: 1
        },
        {
          faction: "Russia",
          track: "Consenso",
          delta: -1
        }
      ]
    }
  },
  initialTracks: {
    Iran: {
      Economia: 4,
      Militare: 7,
      Diplomazia: 4,
      Consenso: 5
    },
    Coalizione: {
      Economia: 5,
      Militare: 7,
      Diplomazia: 4,
      Consenso: 4
    },
    Russia: {
      Economia: 6,
      Militare: 6,
      Diplomazia: 4,
      Consenso: 4
    },
    Cina: {
      Economia: 7,
      Militare: 4,
      Diplomazia: 5,
      Consenso: 4
    },
    Europa: {
      Economia: 6,
      Militare: 4,
      Diplomazia: 6,
      Consenso: 4
    }
  }
};

// src/game-v3/bot-influence.json
var bot_influence_default = {
  "BOT-CN-C1": "oman",
  "BOT-CN-C2": "qatar",
  "BOT-CN-C3": "egitto",
  "BOT-CN-C4": "iran",
  "BOT-CN-C5": "arabia-saudita",
  "BOT-CN-C6": "emirati",
  "BOT-CN-D1": "emirati",
  "BOT-CN-D2": "oman",
  "BOT-CN-D3": "qatar",
  "BOT-CN-D4": "egitto",
  "BOT-CN-D5": "iran",
  "BOT-CN-D6": "arabia-saudita",
  "BOT-CN-E1": "iran",
  "BOT-CN-E2": "arabia-saudita",
  "BOT-CN-E3": "emirati",
  "BOT-CN-E4": "oman",
  "BOT-CN-E5": "qatar",
  "BOT-CN-E6": "egitto",
  "BOT-CN-M1": "arabia-saudita",
  "BOT-CN-M2": "emirati",
  "BOT-CN-M3": "oman",
  "BOT-CN-M4": "qatar",
  "BOT-CN-M5": "egitto",
  "BOT-CN-M6": "iran",
  "BOT-CO-C1": "kuwait",
  "BOT-CO-C2": "giordania",
  "BOT-CO-C3": "qatar",
  "BOT-CO-C4": "israele",
  "BOT-CO-C5": "arabia-saudita",
  "BOT-CO-C6": "emirati",
  "BOT-CO-D1": "emirati",
  "BOT-CO-D2": "kuwait",
  "BOT-CO-D3": "giordania",
  "BOT-CO-D4": "qatar",
  "BOT-CO-D5": "israele",
  "BOT-CO-D6": "arabia-saudita",
  "BOT-CO-E1": "israele",
  "BOT-CO-E2": "arabia-saudita",
  "BOT-CO-E3": "emirati",
  "BOT-CO-E4": "kuwait",
  "BOT-CO-E5": "giordania",
  "BOT-CO-E6": "qatar",
  "BOT-CO-M1": "arabia-saudita",
  "BOT-CO-M2": "emirati",
  "BOT-CO-M3": "kuwait",
  "BOT-CO-M4": "giordania",
  "BOT-CO-M5": "qatar",
  "BOT-CO-M6": "israele",
  "BOT-EU-C1": "egitto",
  "BOT-EU-C2": "oman",
  "BOT-EU-C3": "qatar",
  "BOT-EU-C4": "turchia",
  "BOT-EU-C5": "libano",
  "BOT-EU-C6": "giordania",
  "BOT-EU-D1": "giordania",
  "BOT-EU-D2": "egitto",
  "BOT-EU-D3": "oman",
  "BOT-EU-D4": "qatar",
  "BOT-EU-D5": "turchia",
  "BOT-EU-D6": "libano",
  "BOT-EU-E1": "turchia",
  "BOT-EU-E2": "libano",
  "BOT-EU-E3": "giordania",
  "BOT-EU-E4": "egitto",
  "BOT-EU-E5": "oman",
  "BOT-EU-E6": "qatar",
  "BOT-EU-M1": "libano",
  "BOT-EU-M2": "giordania",
  "BOT-EU-M3": "egitto",
  "BOT-EU-M4": "oman",
  "BOT-EU-M5": "qatar",
  "BOT-EU-M6": "turchia",
  "BOT-IR-C1": "yemen",
  "BOT-IR-C2": "bahrein",
  "BOT-IR-C3": "iran",
  "BOT-IR-C4": "iraq",
  "BOT-IR-C5": "siria",
  "BOT-IR-C6": "libano",
  "BOT-IR-D1": "libano",
  "BOT-IR-D2": "yemen",
  "BOT-IR-D3": "bahrein",
  "BOT-IR-D4": "iran",
  "BOT-IR-D5": "iraq",
  "BOT-IR-D6": "siria",
  "BOT-IR-E1": "iraq",
  "BOT-IR-E2": "siria",
  "BOT-IR-E3": "libano",
  "BOT-IR-E4": "yemen",
  "BOT-IR-E5": "bahrein",
  "BOT-IR-E6": "iran",
  "BOT-IR-M1": "siria",
  "BOT-IR-M2": "libano",
  "BOT-IR-M3": "yemen",
  "BOT-IR-M4": "bahrein",
  "BOT-IR-M5": "iran",
  "BOT-IR-M6": "iraq",
  "BOT-RU-C1": "turchia",
  "BOT-RU-C2": "egitto",
  "BOT-RU-C3": "libano",
  "BOT-RU-C4": "siria",
  "BOT-RU-C5": "iran",
  "BOT-RU-C6": "iraq",
  "BOT-RU-D1": "iraq",
  "BOT-RU-D2": "turchia",
  "BOT-RU-D3": "egitto",
  "BOT-RU-D4": "libano",
  "BOT-RU-D5": "siria",
  "BOT-RU-D6": "iran",
  "BOT-RU-E1": "siria",
  "BOT-RU-E2": "iran",
  "BOT-RU-E3": "iraq",
  "BOT-RU-E4": "turchia",
  "BOT-RU-E5": "egitto",
  "BOT-RU-E6": "libano",
  "BOT-RU-M1": "iran",
  "BOT-RU-M2": "iraq",
  "BOT-RU-M3": "turchia",
  "BOT-RU-M4": "egitto",
  "BOT-RU-M5": "libano",
  "BOT-RU-M6": "siria"
};

// src/game-v3/catalog.ts
var FACTION_CARDS = catalog_data_default.factionCards;
var EVENTS = catalog_data_default.events;
var BOT_CARDS = catalog_data_default.bots;
var BOT_INFLUENCE = bot_influence_default;
var OBJECTIVES = catalog_data_default.objectives;
var UNITS = catalog_data_default.units;
var TERRITORIES = catalog_data_default.territories;
var CORRELATIONS = catalog_data_default.correlations;
var INITIAL_TRACKS = catalog_data_default.initialTracks;
var CATALOG_PROVENANCE = catalog_data_default.provenance;
function assertCatalogComplete() {
  const fail = (message) => {
    throw new Error(`Catalogo tabletop incompleto: ${message}`);
  };
  const faction = (value) => FACTIONS.includes(value);
  const track = (value) => TRACKS.includes(value);
  const change = (value) => value && faction(value.faction) && track(value.track) && Number.isInteger(value.delta) && value.delta !== 0;
  const globals2 = /* @__PURE__ */ new Set(["Nucleare", "Sanzioni", "Crisi Bellica", "Opinione"]);
  const globalChanges = (rows) => Array.isArray(rows) && rows.every(
    (row) => globals2.has(row.track) && Number.isInteger(row.delta) && row.delta !== 0
  );
  const counts = [
    ["fazioni", FACTION_CARDS, 347],
    ["eventi", EVENTS, 75],
    ["BOT", BOT_CARDS, 120],
    ["obiettivi", OBJECTIVES, 75],
    ["unit\xE0", UNITS, 31],
    ["territori", TERRITORIES, 16]
  ];
  for (const [label, rows, expected] of counts) {
    if (rows.length !== expected || new Set(rows.map((row) => row.id)).size !== expected) {
      fail(`${label}: attesi ${expected} ID univoci, ricevuti ${rows.length}`);
    }
    if (rows.some((row) => !row.id || !row.name?.trim())) fail(`${label}: ID o titolo mancante`);
  }
  if (Object.keys(BOT_INFLUENCE).length !== 120 || BOT_CARDS.some((c) => !TERRITORIES.some((t) => t.id === BOT_INFLUENCE[c.id]))) fail("120 destinazioni Influenza BOT richieste");
  if (FACTION_CARDS.filter((card) => card.special).length !== 15) fail("15 carte speciali richieste");
  for (const card of FACTION_CARDS) {
    if (!faction(card.origin) && card.origin !== "Neutrale" || !Number.isInteger(card.cost) || card.cost < 1 || card.cost > 4 || card.special !== /^(SE_|SC_)/.test(card.id) || typeof card.unlocksSpecial !== "boolean") fail(`metadati ${card.id}`);
    if (card.options?.length !== 3 || new Set(card.options.map((o) => o.boost.faction)).size !== 3 || card.options.some((o) => !change(o.boost) || o.boost.delta < 1 || !change(o.correlation) || !globalChanges(o.globals))) fail(`tre opzioni esplicite per ${card.id}`);
  }
  for (const event of EVENTS) {
    if (event.order.length !== 5 || new Set(event.order).size !== 5 || !event.order.every(faction) || !event.advancers.length || event.advancers.length > 2 || !event.advancers.every(faction) || new Set(event.advancers).size !== event.advancers.length || !globalChanges(event.globals) || !event.changes.every(change) || typeof event.blocksRound !== "boolean") fail(`evento ${event.id}`);
  }
  for (const f of FACTIONS) {
    for (const t of TRACKS) {
      if (BOT_CARDS.filter((b) => b.faction === f && b.track === t).length !== 6) fail(`BOT ${f}/${t}`);
      const links = CORRELATIONS[f]?.[t];
      if (links?.length !== 2 || !links.every(change)) fail(`correlazioni ${f}/${t}`);
      if (!Number.isInteger(INITIAL_TRACKS[f]?.[t]) || INITIAL_TRACKS[f][t] < 1 || INITIAL_TRACKS[f][t] > 10) fail(`inizio ${f}/${t}`);
    }
    if (TRACKS.reduce((sum, t) => sum + INITIAL_TRACKS[f][t], 0) !== 20) fail(`20 punti iniziali ${f}`);
    const objectives = OBJECTIVES.filter((o) => o.faction === f);
    if (objectives.length !== 15 || Array.from({ length: 15 }, (_, i) => i + 1).some((n) => !objectives.some((o) => o.number === n))) fail(`obiettivi ${f}`);
    const expectedUnits = f === "Iran" ? 7 : 6;
    if (UNITS.filter((u) => u.faction === f).length !== expectedUnits) fail(`unit\xE0 ${f}`);
  }
  if (BOT_CARDS.some((b) => !b.condition || !b.priority1 || !b.priority2)) fail("testo BOT mancante");
  if (OBJECTIVES.some((o) => !o.condition || ![3, 4, 6].includes(o.points))) fail("condizione/valore obiettivo");
  if (UNITS.some((u) => /dummy/i.test(u.name) || !u.effect || !Number.isInteger(u.cost) || !Number.isInteger(u.attack) || !Number.isInteger(u.defense))) fail("unit\xE0 segnaposto o incompleta");
  if (TERRITORIES.some((t) => !Number.isInteger(t.capacity) || t.capacity < 1 || Object.keys(t.alignment).length !== 5 || FACTIONS.some((f) => ![0, 1, 2].includes(t.alignment[f])))) fail("capienza/allineamento territorio");
}
assertCatalogComplete();

// src/game-v3/objectives.ts
var clean = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function controlsTerritory(state, faction, territory2) {
  return territoryController(state, territory2) === faction;
}
function objectiveComplete(state, objective) {
  const o = typeof objective === "string" ? OBJECTIVES.find((x) => x.id === objective) : objective;
  if (!o) return false;
  const f = o.faction, t = state.players[f].tracks, g = state.globals;
  const units = state.units.filter((u) => u.faction === f);
  const pieces = usesOfficialRules(state) ? [...units, ...(state.influence ?? []).filter((i) => i.faction === f)] : units;
  const named2 = (name) => units.filter((u) => clean(UNITS.find((d) => d.id === u.type)?.name ?? "") === clean(name));
  const at = (name) => pieces.filter((u) => clean(TERRITORIES.find((d) => d.id === u.territory)?.name ?? u.territory).includes(clean(name)));
  const presence = (names) => names.filter((n2) => at(n2).length > 0).length;
  const distinct = (name) => new Set(named2(name).map((u) => u.territory)).size;
  const control = (names) => names.filter((n2) => {
    const territory2 = TERRITORIES.find((d) => clean(d.name) === clean(n2));
    return territory2 && controlsTerritory(state, f, territory2.id);
  }).length;
  const track = (who, key) => state.players[who].tracks[key];
  const n = g.Nucleare, s = g.Sanzioni, c = g["Crisi Bellica"], p = g.Opinione;
  const rules = {
    Iran: [
      n >= 10,
      n >= 12 && s <= 5,
      s <= 3,
      presence(["Iraq", "Yemen", "Bahrein", "Kuwait", "Emirati"]) >= 3,
      control(["Libano", "Siria", "Iraq", "Yemen"]) >= 3,
      track("Coalizione", "Consenso") <= 3,
      named2("Flotta veloce del Golfo").some((u) => at("Hormuz").some((p2) => p2.id === u.id)),
      c <= 3 && n >= 8,
      t.Consenso >= 7,
      named2("Missili balistici").length >= 2,
      presence(["Iran", "Iraq", "Siria"]) === 3,
      distinct("Proxy regionali") >= 3,
      distinct("IRGC Cyber Unit") >= 2,
      t.Militare >= 8 && at("Hormuz").length > 0,
      t.Economia >= 7 && t.Consenso >= 6
    ],
    Coalizione: [
      n <= 5,
      s >= 8,
      c >= 6,
      t.Economia >= 8,
      t.Diplomazia >= 8,
      t.Consenso >= 7,
      track("Iran", "Consenso") <= 3,
      p >= 4,
      n <= 4 && s >= 7,
      track("Russia", "Diplomazia") <= 3,
      named2("Scudo Missilistico").length >= 2,
      presence(["Kuwait", "Bahrein", "Qatar", "Emirati", "Oman", "Arabia Saudita"]) >= 3,
      n <= 4 && at("Iran").length > 0,
      t.Militare >= 8,
      named2("Carrier Strike Group").some((u) => at("Hormuz").some((p2) => p2.id === u.id))
    ],
    Russia: [
      t.Militare >= 8,
      t.Diplomazia >= 7 && s <= 5,
      t.Economia >= 8 && track("Europa", "Economia") <= 4,
      track("Coalizione", "Consenso") <= 3,
      t.Economia >= 7 && t.Consenso >= 6,
      distinct("Cyber Russia") >= 2,
      t.Diplomazia >= 6 && track("Iran", "Diplomazia") >= 6,
      c <= 4 && t.Militare >= 6,
      named2("Flotta nel Mediterraneo").length >= 2,
      track("Coalizione", "Diplomazia") <= 3,
      presence(["Siria", "Libano", "Turchia"]) >= 2,
      control(["Siria"]) > 0,
      p <= 0,
      track("Iran", "Consenso") >= 6 && at("Siria").length > 0,
      t.Militare >= 7 && named2("Flotta nel Mediterraneo").length > 0
    ],
    Cina: [
      t.Economia >= 9,
      t.Consenso >= 7 && named2("Flotta commerciale").length > 0,
      t.Diplomazia >= 8,
      t.Militare >= 7 && named2("Cyber Unit").length > 0,
      t.Diplomazia >= 7 && TRACKS.every((k) => t[k] >= 4),
      presence(["Arabia Saudita", "Emirati", "Oman", "Qatar", "Bahrein", "Kuwait"]) >= 2,
      named2("Flotta commerciale").length >= 2,
      track("Europa", "Consenso") <= 3,
      c >= 5,
      c >= 7 && p >= -2 && p <= 2,
      track("Iran", "Economia") >= 7,
      t.Diplomazia >= 8 && t.Economia >= 8,
      FACTIONS.filter((who) => track(who, "Consenso") >= 5).length >= 3,
      distinct("Cyber Unit") >= 2,
      presence(["Oman", "Emirati", "Qatar", "Bahrein"]) >= 2
    ],
    Europa: [
      t.Diplomazia >= 8,
      named2("Aiuti umanitari").length >= 2 && t.Consenso >= 6,
      t.Consenso >= 8,
      s >= 4 && s <= 7,
      c >= 7,
      p >= 3 && t.Diplomazia >= 7,
      t.Economia >= 8,
      named2("Caschi blu").length >= 3 && distinct("Caschi blu") >= 2,
      c >= 7 && s >= 3 && s <= 6 && p >= 0,
      track("Russia", "Diplomazia") <= 3,
      track("Iran", "Consenso") >= 7,
      presence(["Libano", "Siria", "Giordania"]) >= 2,
      at("Turchia").length >= 2,
      p >= 2 && t.Consenso >= 7,
      t.Consenso >= 6 && track("Coalizione", "Consenso") >= 6
    ]
  };
  return rules[f][o.number - 1] ?? false;
}

// src/game-v3/bots.ts
var priorities = {
  Iran: ["Militare", "Economia", "Consenso", "Diplomazia"],
  Coalizione: ["Diplomazia", "Militare", "Economia", "Consenso"],
  Russia: ["Economia", "Militare", "Diplomazia", "Consenso"],
  Cina: ["Economia", "Diplomazia", "Consenso", "Militare"],
  Europa: ["Diplomazia", "Consenso", "Economia", "Militare"]
};
var norm = (s) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, " ").replace(/−/g, "-").replace(/\s+/g, " ").trim();
function firstFactionMention(text) {
  return [...FACTIONS].filter((f) => text.includes(norm(f))).sort((a, b) => text.indexOf(norm(a)) - text.indexOf(norm(b)))[0];
}
function weakestTrack(s, faction) {
  return [...priorities[faction]].sort((a, b) => s.players[faction].tracks[a] - s.players[faction].tracks[b])[0];
}
function chooseBotControlBonus(s, faction, choices) {
  if (choices.includes("Nucleare") && s.globals.Nucleare >= 14) return "Nucleare";
  const tracks = priorities[faction].filter((t) => choices.includes(t)).sort((a, b) => s.players[faction].tracks[a] - s.players[faction].tracks[b]);
  if (choices.includes("Nucleare") && (!tracks.length || s.players[faction].tracks[tracks[0]] >= 8)) return "Nucleare";
  const chosen = tracks[0] ?? choices[0];
  if (!chosen) throw new Error("Nessun bonus BOT disponibile");
  return chosen;
}
function chooseBotCorrelation(s, faction, track) {
  const changes = CORRELATIONS[faction][track];
  return changes.map((change, i) => ({ change, i })).sort((a, b) => {
    if (a.change.delta < 0 && b.change.delta >= 0) return -1;
    if (b.change.delta < 0 && a.change.delta >= 0) return 1;
    const delta = s.players[a.change.faction].points - s.players[b.change.faction].points;
    return a.change.delta < 0 ? -delta : delta;
  })[0].i;
}
function territory(text) {
  const value = norm(text);
  return [...TERRITORIES].sort((a, b) => b.name.length - a.name.length).find((t) => value.includes(norm(t.name)) || norm(t.name).includes("hormuz") && /hormuz|stretto/.test(value) || norm(t.name).includes("emirati") && value.includes("emirati"));
}
function hasUnit(s, faction, territoryId, unitName) {
  return s.units.some((u) => u.faction === faction && (!territoryId || u.territory === territoryId) && (!unitName || norm(UNITS.find((d) => d.id === u.type)?.name ?? "") === norm(unitName)));
}
function blockade(s) {
  const hormuz = TERRITORIES.find((t) => /hormuz/i.test(t.name));
  const local = s.units.filter((u) => u.territory === hormuz?.id);
  return local.filter((u) => /flotta veloce/i.test(UNITS.find((d) => d.id === u.type)?.name ?? "")).length >= 2 && !local.some((u) => /carrier strike/i.test(UNITS.find((d) => d.id === u.type)?.name ?? ""));
}
function botCondition(s, actor, condition) {
  const text = norm(condition).replace(/,\s*(?=crisi bellica)/g, " e ");
  if (text === "blocco di hormuz attivo") return blockade(s);
  if (text.startsWith("blocco di hormuz attivo o nessun")) {
    const h = territory("Hormuz");
    return blockade(s) || !hasUnit(s, "Coalizione", h?.id, "Carrier Strike Group");
  }
  if (text.includes("russia o cina hanno una cyber unit")) return s.units.some((u) => (u.faction === "Russia" || u.faction === "Cina") && /cyber/i.test(UNITS.find((d) => d.id === u.type)?.name ?? ""));
  if (text.includes("in libano ci sono unita di iran o")) {
    const t = territory("Libano");
    return !!t && (hasUnit(s, "Iran", t.id) || hasUnit(s, "Coalizione", t.id));
  }
  if (text.startsWith("meno di 2 flotte veloci")) {
    return s.units.filter((u) => /flotta veloce/i.test(UNITS.find((d) => d.id === u.type)?.name ?? "") && /hormuz/i.test(TERRITORIES.find((t) => t.id === u.territory)?.name ?? "")).length < 2;
  }
  if (/iran e coalizione hanno unita nello stesso territorio/.test(text) && !text.includes(" e iran")) {
    return TERRITORIES.some((t) => hasUnit(s, "Iran", t.id) && hasUnit(s, "Coalizione", t.id));
  }
  if (text.includes(" e iran e coalizione")) {
    const [numeric2] = text.split(" e iran e coalizione");
    return botCondition(s, actor, numeric2) && botCondition(s, actor, "Iran e Coalizione hanno unit\xE0 nello stesso territorio");
  }
  if (/oppure\s*[≥≤<>]/.test(text)) {
    const match = text.match(/^(opinione)\s*([≥≤<>]=?)\s*(-?\d+)\s*oppure\s*([≥≤<>]=?)\s*(-?\d+)$/);
    if (match) return botCondition(s, actor, `Opinione ${match[2]} ${match[3]}`) || botCondition(s, actor, `Opinione ${match[4]} ${match[5]}`);
  }
  if (text.includes(" e ") && /[≥≤<>]/.test(text)) return text.split(" e ").every((part) => botCondition(s, actor, part));
  const numeric = text.match(/^(?:(iran|coalizione|russia|cina|europa)\s+)?(economia|militare|diplomazia|consenso|nucleare|sanzioni|crisi bellica|opinione)\s*([≥≤<>]=?|=)\s*(-?\d+)$/);
  if (numeric) {
    const f = FACTIONS.find((f2) => norm(f2) === numeric[1]) ?? actor;
    const names = { economia: "Economia", militare: "Militare", diplomazia: "Diplomazia", consenso: "Consenso", nucleare: "Nucleare", sanzioni: "Sanzioni", "crisi bellica": "Crisi Bellica", opinione: "Opinione" };
    const key = names[numeric[2]], value = key in s.globals ? s.globals[key] : s.players[f].tracks[key], threshold = Number(numeric[4]);
    return numeric[3] === "\u2265" || numeric[3] === ">=" ? value >= threshold : numeric[3] === "\u2264" || numeric[3] === "<=" ? value <= threshold : numeric[3] === ">" ? value > threshold : numeric[3] === "<" ? value < threshold : value === threshold;
  }
  const places = TERRITORIES.filter((t) => {
    const n = norm(t.name);
    return text.includes(n) || n.includes("emirati") && text.includes("emirati") || n.includes("hormuz") && text.includes("stretto");
  });
  const who = firstFactionMention(text) ?? actor;
  const negative = /nessun|non ha/.test(text);
  const defs = UNITS.filter((d) => text.includes(norm(d.name)) || /missili balistici/.test(text) && /missili balistici/i.test(d.name) || /carrier strike group/.test(text) && /carrier strike group/i.test(d.name));
  if (defs.length) {
    const present = s.units.some((u) => defs.some((d) => d.id === u.type) && (!places.length || places.some((t) => t.id === u.territory)));
    return negative ? !present : present;
  }
  if (/unita|un unita/.test(text)) {
    const present = places.some((t) => hasUnit(s, who, t.id));
    return negative ? !present : present;
  }
  throw new Error(`Condizione BOT non riconosciuta: ${condition}`);
}
function conditionalTerritory(s, condition) {
  const text = norm(condition);
  if (text.includes("stesso territorio")) return TERRITORIES.find((t) => hasUnit(s, "Iran", t.id) && hasUnit(s, "Coalizione", t.id))?.id;
  if (text.includes("cyber")) return s.units.find((u) => (u.faction === "Russia" || u.faction === "Cina") && /cyber/i.test(UNITS.find((d) => d.id === u.type)?.name ?? ""))?.territory;
  if (text.includes("aviazione tattica")) return s.units.find((u) => /aviazione tattica/i.test(UNITS.find((d) => d.id === u.type)?.name ?? ""))?.territory;
  const who = firstFactionMention(text);
  const places = TERRITORIES.filter((t) => text.includes(norm(t.name)));
  return places.find((t) => !who || hasUnit(s, who, t.id))?.id;
}
function botPlan(s, actor, priority, condition = "") {
  const out = [];
  for (const raw of priority.split("\xB7")) {
    const part = norm(raw);
    const development2 = part.match(/^sviluppo (economia|militare|diplomazia|consenso)(?:\s*[×x]\s*(\d+))?$/);
    if (development2) {
      const track = { economia: "Economia", militare: "Militare", diplomazia: "Diplomazia", consenso: "Consenso" }[development2[1]];
      for (let i = 0; i < Number(development2[2] ?? 1); i++) out.push({ kind: "develop", track });
      continue;
    }
    if (part.startsWith("schiera ")) {
      const def = [...UNITS].filter((d) => d.faction === actor).sort((a, b) => b.name.length - a.name.length).find((d) => part.startsWith(`schiera ${norm(d.name)}`));
      if (!def) throw new Error(`Unit\xE0 BOT non riconosciuta: ${raw}`);
      let target = territory(part)?.id;
      if (part.includes("quel territorio") || part.includes("stesso territorio")) target = conditionalTerritory(s, condition);
      if (part.includes("con unita della coalizione")) target = s.units.find((u) => u.faction === "Coalizione")?.territory;
      if (part.includes("con piu unita")) target = [...TERRITORIES].sort((a, b) => s.units.filter((u) => u.territory === b.id && (u.faction === "Iran" || u.faction === "Coalizione")).length - s.units.filter((u) => u.territory === a.id && (u.faction === "Iran" || u.faction === "Coalizione")).length)[0]?.id;
      out.push({ kind: "deploy", unit: def.name, territory: target });
      continue;
    }
    if (part.startsWith("attacco")) {
      out.push({ kind: "attack", territory: part.includes("quel territorio") ? conditionalTerritory(s, condition) : territory(part)?.id });
      continue;
    }
    if (/opinione di 1 verso lo 0/.test(part)) {
      out.push({ kind: "global", track: "Opinione", delta: "zero" });
      continue;
    }
    const direct = part.match(/^(?:(iran|coalizione|russia|cina|europa)\s+)?(economia|militare|diplomazia|consenso|nucleare|sanzioni|crisi bellica|opinione)\s*([+-]\d+)$/);
    if (direct) {
      const f = FACTIONS.find((f2) => norm(f2) === direct[1]) ?? actor;
      const names = { economia: "Economia", militare: "Militare", diplomazia: "Diplomazia", consenso: "Consenso", nucleare: "Nucleare", sanzioni: "Sanzioni", "crisi bellica": "Crisi Bellica", opinione: "Opinione" };
      const key = names[direct[2]], delta = Number(direct[3]);
      if (["Nucleare", "Sanzioni", "Crisi Bellica", "Opinione"].includes(key)) out.push({ kind: "global", track: key, delta });
      else out.push({ kind: "track", change: { faction: f, track: key, delta } });
      continue;
    }
    throw new Error(`Priorit\xE0 BOT non riconosciuta: ${raw}`);
  }
  return out;
}

// src/game-v3/engine.ts
var assert = (test, message) => {
  if (!test) throw new Error(message);
};
var clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
var unitDef = (id) => {
  const d = UNITS.find((u) => u.id === id);
  assert(d, "Unit\xE0 sconosciuta");
  return d;
};
var territoryDef = (id) => {
  const d = TERRITORIES.find((t) => t.id === id);
  assert(d, "Territorio sconosciuto");
  return d;
};
var cardDef = (id) => {
  const d = FACTION_CARDS.find((c) => c.id === id);
  assert(d, "Carta sconosciuta");
  return d;
};
var named = (u, name) => unitDef(u.type).name.toLowerCase() === name.toLowerCase();
var inNamed = (u, name) => territoryDef(u.territory).name.toLowerCase().includes(name.toLowerCase());
var MODE_THRESHOLDS = { breve: 30, media: 60, lunga: 80 };
var usesOfficialRules = (s) => s.rulesRevision === "2026-11-16" || usesLatestRules(s);
var usesLatestRules = (s) => s.rulesRevision === "2026-11-21";
function occupiedSlots(s, territoryId) {
  const local = usesLatestRules(s) ? [] : s.units.filter((u) => u.territory === territoryId);
  const slots = /* @__PURE__ */ new Set([
    ...local.flatMap((u) => u.slot === void 0 ? [] : [u.slot]),
    ...usesOfficialRules(s) ? (s.influence ?? []).filter((i) => i.territory === territoryId).map((i) => i.slot) : []
  ]);
  for (const u of local.filter((u2) => u2.slot === void 0)) {
    void u;
    let slot = 0;
    while (slots.has(slot)) slot++;
    slots.add(slot);
  }
  return [...slots].sort((a, b) => a - b);
}
function territoryPresence(s, faction, territoryId) {
  if (s.players[faction]?.neutral) return 0;
  return s.units.filter((u) => u.faction === faction && u.territory === territoryId).length + (usesOfficialRules(s) ? (s.influence ?? []).filter((i) => i.faction === faction && i.territory === territoryId).length : 0);
}
var unitNamed = (u, name) => (UNITS.find((d) => d.id === u.type)?.name ?? "").toLowerCase() === name.toLowerCase();
var hasUnitIn = (s, faction, name, territoryId) => s.units.some((u) => u.faction === faction && unitNamed(u, name) && (!territoryId || u.territory === territoryId));
function interference(s, faction, territoryId) {
  return usesLatestRules(s) && s.units.some((u) => u.territory === territoryId && u.faction !== faction && (unitNamed(u, "Cyber Russia") || unitNamed(u, "Cyber Unit") && (u.faction === "Cina" || u.faction === "Europa")));
}
function influenceDiscount(s, faction, territoryId) {
  if (!usesLatestRules(s)) return false;
  if (faction === "Iran") return hasUnitIn(s, "Iran", "Proxy regionali", territoryId);
  if (faction === "Cina") return hasUnitIn(s, "Cina", "Investimenti BRI", territoryId);
  if (faction === "Europa") return hasUnitIn(s, "Europa", "Aiuti umanitari", territoryId);
  if (faction === "Russia") return ["siria", "libano"].includes(territoryId) && hasUnitIn(s, "Russia", "Flotta nel Mediterraneo");
  return false;
}
function presidio(s, faction, territoryId) {
  if (!usesLatestRules(s)) return false;
  if (faction === "Iran") return territoryId === "iran" && hasUnitIn(s, "Iran", "Forze convenzionali", "iran");
  if (faction === "Coalizione") return hasUnitIn(s, "Coalizione", "Convenzionale", territoryId);
  if (faction === "Cina") return hasUnitIn(s, "Cina", "Infrastrutture", territoryId);
  return false;
}
function attackCost(s, territoryId) {
  return 2 + (usesLatestRules(s) && hasUnitIn(s, "Europa", "Caschi blu", territoryId) ? 2 : 0);
}
function canPeek(s, actor, target) {
  return usesLatestRules(s) && target !== actor && s.peeked?.[actor] !== s.activation && s.units.some((u) => u.faction === actor && (unitNamed(u, "Intelligence") || unitNamed(u, "Satelliti / Spazio")) && territoryPresence(s, target, u.territory) > 0);
}
var ECONOMY_SHIELD = { Cina: "Flotta commerciale", Europa: "Missione navale UE" };
function shieldAvailable(s, c) {
  const unit = ECONOMY_SHIELD[c.faction];
  return usesLatestRules(s) && !!unit && c.track === "Economia" && c.delta < 0 && hasUnitIn(s, c.faction, unit) && s.economyShield?.[c.faction] !== s.actualRound;
}
function externalChange(s, c) {
  const unit = ECONOMY_SHIELD[c.faction];
  if (shieldAvailable(s, c)) {
    (s.economyShield ??= {})[c.faction] = s.actualRound;
    s.log.push(`${c.faction}: ${unit} \u2014 la perdita di Economia (${c.delta}) viene ignorata in questo round.`);
    return true;
  }
  changeTrack(s, c);
  return false;
}
function updateBlockade(s) {
  if (!usesLatestRules(s) || s.phase === "ended") return;
  const active = hormuzBlocked(s);
  if (active && !s.hormuzBlockade) {
    s.hormuzBlockade = true;
    s.log.push("Blocco di Hormuz attivato: Crisi Bellica \u22121, Opinione \u22121.");
    globals(s, [{ track: "Crisi Bellica", delta: -1 }, { track: "Opinione", delta: -1 }], "Iran");
  } else if (!active && s.hormuzBlockade) {
    s.hormuzBlockade = false;
    s.log.push("Blocco di Hormuz revocato.");
  }
}
function territoryController(s, territoryId) {
  const counts = FACTIONS.map((f) => ({ faction: f, count: territoryPresence(s, f, territoryId) })).sort((a, b) => b.count - a.count);
  return counts[0].count > 0 && counts[0].count > counts[1].count ? counts[0].faction : null;
}
function influenceCost(s, faction, territoryId) {
  const alignment = territoryDef(territoryId).alignment[faction];
  if (!usesLatestRules(s)) return 1 + alignment;
  const military = s.players[faction].tracks.Militare;
  const strength = !["Iran", "Coalizione"].includes(faction) && alignment > 0 ? military >= 8 ? -1 : military <= 3 ? 1 : 0 : 0;
  const opinion = faction === "Iran" && s.globals.Opinione <= -4 || faction === "Coalizione" && s.globals.Opinione >= 4 ? -1 : 0;
  return Math.max(1, 1 + alignment + strength + opinion - (influenceDiscount(s, faction, territoryId) ? 1 : 0) + (interference(s, faction, territoryId) ? 1 : 0));
}
function canInfluence(s, territoryId) {
  const t = TERRITORIES.find((t2) => t2.id === territoryId);
  return usesOfficialRules(s) && !!t && occupiedSlots(s, territoryId).length < t.capacity;
}
function firstFreeSlot(s, territoryId) {
  const occupied = occupiedSlots(s, territoryId);
  return Array.from({ length: territoryDef(territoryId).capacity }, (_, slot) => slot).find((slot) => !occupied.includes(slot)) ?? -1;
}
function controlBonusChoices(s, territoryId, controller = territoryController(s, territoryId)) {
  const name = territoryDef(territoryId).name;
  if (["Arabia Saudita", "Emirati", "Qatar", "Kuwait"].includes(name)) return ["Economia"];
  if (["Israele", "Turchia"].includes(name)) return ["Militare"];
  if (["Egitto", "Giordania", "Oman"].includes(name)) return ["Diplomazia"];
  if (["Siria", "Libano", "Yemen", "Bahrein"].includes(name)) return ["Consenso"];
  if (name === "Iraq") return ["Economia", "Militare"];
  if (name === "Iran") return controller === "Iran" ? ["Consenso", "Nucleare"] : ["Consenso"];
  if (name.includes("Hormuz")) return ["PV"];
  return [];
}
function random(rng) {
  const n = rng();
  assert(Number.isFinite(n) && n >= 0 && n < 1, "RNG deve restituire un numero in [0,1)");
  return n;
}
function shuffle(input, rng) {
  const out = [...input];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random(rng) * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
function record(fn) {
  return Object.fromEntries(FACTIONS.map((f) => [f, fn(f)]));
}
function currentActor(s) {
  return s.phase === "ended" ? null : s.pending?.actor ?? s.ops?.actor ?? s.order[s.turnIndex] ?? null;
}
function hormuzBlocked(s) {
  const local = s.units.filter((u) => inNamed(u, "Hormuz"));
  return local.filter((u) => u.faction === "Iran" && named(u, "Flotta veloce del Golfo")).length >= 2 && !local.some((u) => named(u, "Carrier Strike Group"));
}
function deployCost(s, faction, unitId, territoryId) {
  const u = unitDef(unitId), t = territoryDef(territoryId), eco = s.players[faction].tracks.Economia, crisis = s.globals["Crisi Bellica"];
  return Math.max(1, u.cost + (crisis <= 4 ? 2 : crisis <= 7 ? 1 : 0) + (eco <= 3 ? 1 : eco >= 8 ? -1 : 0) + t.alignment[faction] + (faction === "Coalizione" && hormuzBlocked(s) ? 1 : 0) + (interference(s, faction, territoryId) ? 1 : 0));
}
function changeTrack(s, c) {
  const before = s.players[c.faction].tracks[c.track];
  s.players[c.faction].tracks[c.track] = clamp(before + c.delta, 1, 10);
  s.log.push(`${c.faction}: ${c.track} ${before} \u2192 ${s.players[c.faction].tracks[c.track]}`);
}
function end(s, reason, responsible) {
  if (reason === "war" && usesLatestRules(s)) {
    finalScore(s, { responsible });
    s.queue = [];
    s.ops = null;
    s.combat = null;
    return;
  }
  s.phase = "ended";
  s.pending = null;
  s.queue = [];
  s.ops = null;
  if (usesOfficialRules(s)) s.roundClosure = false;
  s.result = { reason, winners: reason === "war" ? [] : [reason === "nuclear" ? "Iran" : "Coalizione"], scores: record((f) => s.players[f].points) };
  s.log.push(reason === "war" ? "Guerra totale: nessun vincitore." : `Partita terminata: vince ${s.result.winners.join(", ")} (${reason === "nuclear" ? "Nucleare 15" : "Sanzioni 10"}).`);
}
function globals(s, changes, responsible) {
  let war = false, nuclear = false, sanctions = false;
  for (const c of changes) {
    const before = s.globals[c.track];
    s.globals[c.track] = clamp(before + c.delta, c.track === "Opinione" ? -10 : 1, c.track === "Nucleare" ? 15 : 10);
    if (usesLatestRules(s) && c.track === "Nucleare" && s.players.Iran.neutral) s.globals.Nucleare = Math.min(14, s.globals.Nucleare);
    if (usesLatestRules(s) && c.track === "Sanzioni" && s.players.Coalizione.neutral) s.globals.Sanzioni = Math.min(9, s.globals.Sanzioni);
    s.log.push(`Globale: ${c.track} ${before} \u2192 ${s.globals[c.track]}`);
    war ||= s.globals["Crisi Bellica"] === 1;
    nuclear ||= s.globals.Nucleare === 15;
    sanctions ||= s.globals.Sanzioni === 10;
  }
  if (war) end(s, "war", responsible);
  else if (nuclear) end(s, "nuclear");
  else if (sanctions) end(s, "sanctions");
}
function draw(s, rng) {
  if (!s.deck.length && s.discard.length) {
    s.deck = shuffle(s.discard, rng);
    s.discard = [];
  }
  return s.deck.shift();
}
function dispose(s, id) {
  (cardDef(id).special ? s.removed : s.discard).push(id);
}
function takeCard(s, actor, id) {
  const hand = s.players[actor].hand, i = hand.indexOf(id);
  assert(i >= 0, "Carta non in mano");
  hand.splice(i, 1);
  dispose(s, id);
  return cardDef(id);
}
function moveTurnMarker(s, actor, cost) {
  if (!usesOfficialRules(s) || s.roundBlocked || !s.advancers.includes(actor)) return;
  const before = s.turnMarker ?? 0;
  s.turnMarker = before + cost;
  s.log.push(`Segna-turni: ${before} \u2192 ${s.turnMarker} (${actor}, ${cost} OP della carta).`);
}
function startRound(s, rng) {
  s.lap = 1;
  s.turnIndex = 0;
  s.ops = null;
  s.pending = null;
  s.queue = [];
  s.phase = "activation";
  if (usesOfficialRules(s)) {
    s.roundClosure = false;
    s.lastBotCards = {};
  }
  FACTIONS.forEach((f) => {
    s.players[f].vetoUsed = false;
    s.players[f].dividendUsed = false;
  });
  if (usesOfficialRules(s) && !s.eventDeck.length) {
    s.eventDeck = shuffle(EVENTS.map((e2) => e2.id), rng);
    s.log.push("Mazzo Eventi esaurito: gli Eventi vengono rimescolati.");
  }
  const id = s.eventDeck.shift();
  assert(id, "Mazzo eventi esaurito");
  const e = EVENTS.find((c) => c.id === id);
  assert(e, "Evento sconosciuto");
  s.event = id;
  s.roundBlocked = e.blocksRound;
  s.order = [.../* @__PURE__ */ new Set([...e.order, ...FACTIONS])];
  s.advancers = [...e.advancers];
  s.log.push(`Round ${s.round} (${s.actualRound}): [${e.id}] ${e.name}`);
  e.changes.forEach((c) => externalChange(s, c));
  globals(s, e.globals);
}
function createGame(options, rng = Math.random) {
  assert(options.bots.every((f) => FACTIONS.includes(f)), "Fazione BOT sconosciuta");
  assert((options.neutrals ?? []).every((f) => FACTIONS.includes(f) && !options.bots.includes(f)), "Fazioni neutrali non valide");
  assert(!options.mode || ["breve", "media", "lunga"].includes(options.mode), "Modalit\xE0 sconosciuta");
  const s = {
    version: 3,
    phase: "activation",
    round: 1,
    actualRound: 1,
    lap: 1,
    turnIndex: 0,
    activation: 1,
    rulesRevision: options.rulesRevision ?? "2026-11-16",
    mode: options.mode ?? "media",
    turnMarker: 0,
    ...options.botInfluenceEdition ? { botInfluenceEdition: options.botInfluenceEdition } : {},
    influence: [],
    nextInfluence: 1,
    lastBotCards: {},
    roundClosure: false,
    players: record((f) => ({ bot: options.bots.includes(f), neutral: options.neutrals?.includes(f) ?? false, tracks: { ...INITIAL_TRACKS[f] }, points: 0, hand: [], objectives: [], vetoUsed: false })),
    globals: { Nucleare: 4, Sanzioni: 3, "Crisi Bellica": 7, Opinione: 0 },
    order: [...FACTIONS],
    advancers: [],
    roundBlocked: false,
    event: null,
    deck: shuffle(FACTION_CARDS.filter((c) => !c.special).map((c) => c.id), rng),
    discard: [],
    specialReserve: shuffle(FACTION_CARDS.filter((c) => c.special).map((c) => c.id), rng),
    removed: [],
    eventDeck: shuffle(EVENTS.map((e) => e.id), rng),
    botDecks: record((f) => Object.fromEntries(TRACKS.map((t) => [t, shuffle(BOT_CARDS.filter((c) => c.faction === f && c.track === t).map((c) => c.id), rng)]))),
    units: [],
    nextUnit: 1,
    ops: null,
    pending: null,
    combat: null,
    queue: [],
    continuation: "finish",
    discardQueue: [],
    intel: record(() => []),
    result: null,
    log: []
  };
  if (usesLatestRules(s)) {
    s.deck = shuffle(FACTION_CARDS.map((c) => c.id), rng);
    s.specialReserve = [];
  }
  FACTIONS.forEach((f) => {
    if (!s.players[f].bot && !s.players[f].neutral) {
      for (let n = 0; n < 5; n++) {
        const card = draw(s, rng);
        if (card) s.players[f].hand.push(card);
      }
      s.players[f].objectives = shuffle(OBJECTIVES.filter((o) => o.faction === f).map((o) => o.id), rng).slice(0, 3);
    }
  });
  startRound(s, rng);
  return s;
}
function finalScore(s, war) {
  for (const f of FACTIONS) {
    const p = s.players[f];
    if (p.neutral) {
      p.points = 0;
      continue;
    }
    const scoringPieces = usesOfficialRules(s) ? s.influence ?? [] : s.units;
    p.points += scoringPieces.filter((u) => u.faction === f).reduce((n, u) => n + 1 + territoryDef(u.territory).alignment[f], 0);
    p.points += p.objectives.reduce((n, id) => n + (objectiveComplete(s, id) ? OBJECTIVES.find((o) => o.id === id).points : 0), 0);
    p.points += TRACKS.filter((t) => p.tracks[t] === 10).length * 2;
    if (war && !war.responsible) p.points -= 5;
  }
  const rank = (f) => [s.players[f].points, TRACKS.reduce((n, t) => n + s.players[f].tracks[t], 0), s.players[f].tracks.Consenso];
  const compare = (a, b) => {
    const aa = rank(a), bb = rank(b);
    return aa[0] - bb[0] || aa[1] - bb[1] || aa[2] - bb[2];
  };
  const eligible = FACTIONS.filter((f) => !s.players[f].neutral && f !== war?.responsible);
  const leader = [...eligible].sort((a, b) => compare(b, a))[0];
  s.result = {
    reason: war ? "war" : "points",
    winners: eligible.filter((f) => compare(f, leader) === 0),
    scores: record((f) => s.players[f].points),
    ...war?.responsible ? { responsible: war.responsible } : {}
  };
  s.phase = "ended";
  s.pending = null;
  if (usesOfficialRules(s)) s.roundClosure = false;
  s.log.push(`Punteggio finale: ${FACTIONS.map((f) => `${f} ${s.players[f].points} PV`).join(" \xB7 ")}. Vince: ${s.result.winners.join(", ")}.`);
}
function afterDiscards(s, rng) {
  if (usesOfficialRules(s)) {
    if ((s.turnMarker ?? 0) >= MODE_THRESHOLDS[s.mode ?? "media"]) {
      finalScore(s);
      return;
    }
    s.round++;
  } else {
    if (s.round >= 6 && !s.roundBlocked || s.actualRound >= 8) {
      finalScore(s);
      return;
    }
    if (!s.roundBlocked) s.round++;
  }
  s.actualRound++;
  startRound(s, rng);
}
function promptDiscard(s, rng) {
  while (s.discardQueue.length) {
    const f = s.discardQueue.shift(), p = s.players[f], limit = p.tracks.Consenso <= 3 ? 5 : 7;
    if (p.hand.length > limit) {
      s.phase = "discard";
      s.pending = { kind: "discard", actor: f, count: p.hand.length - limit, limit };
      return;
    }
  }
  afterDiscards(s, rng);
}
function scoreRound(s) {
  FACTIONS.forEach((f) => {
    const p = s.players[f], before = p.points;
    if (p.neutral) return;
    p.points = Math.max(0, p.points + TRACKS.reduce((n, t) => n + (p.tracks[t] >= 8 ? 1 : p.tracks[t] <= 3 ? -1 : 0), 0));
    s.log.push(`${f}: PV di fine round ${before} \u2192 ${p.points}`);
  });
}
function rotateUnits(s) {
  const expired = s.units.filter((u) => u.rotated);
  expired.forEach((u) => s.log.push(`${u.faction}: ${unitDef(u.type).name} torna in riserva da ${territoryDef(u.territory).name}.`));
  s.units = s.units.filter((u) => !u.rotated);
  s.units.forEach((u) => {
    u.rotated = true;
  });
  updateBlockade(s);
}
function refill(s, rng) {
  FACTIONS.forEach((f) => {
    if (s.players[f].bot && !s.players[f].standIn || s.players[f].neutral) return;
    const count = (s.players[f].tracks.Consenso <= 3 ? 1 : s.players[f].tracks.Consenso >= 8 ? 3 : 2) + (!usesOfficialRules(s) && s.advancers.includes(f) ? 1 : 0);
    for (let i = 0; i < count; i++) {
      const card = draw(s, rng);
      if (card) s.players[f].hand.push(card);
    }
  });
}
function endRound(s, rng) {
  s.log.push(`Fine round ${s.round} (${s.actualRound}): Tensione, ${usesOfficialRules(s) ? "Influenza BOT, controllo, " : ""}punteggio, durata unit\xE0 e rifornimento.`);
  if (s.globals.Sanzioni >= 8) changeTrack(s, { faction: "Iran", track: "Economia", delta: -1 });
  if (s.globals.Nucleare >= 12) globals(s, [{ track: "Crisi Bellica", delta: -1 }]);
  if (s.phase === "ended") return;
  if (s.globals.Opinione <= -6) changeTrack(s, { faction: "Iran", track: "Diplomazia", delta: 1 });
  if (s.globals.Opinione >= 6) changeTrack(s, { faction: "Coalizione", track: "Diplomazia", delta: 1 });
  if (usesLatestRules(s)) {
    if (s.units.some((u) => u.faction === "Coalizione" && u.territory === "iran")) {
      changeTrack(s, { faction: "Iran", track: "Consenso", delta: 1 });
      changeTrack(s, { faction: "Coalizione", track: "Consenso", delta: -1 });
      for (const faction of ["Russia", "Cina"]) changeTrack(s, { faction, track: "Diplomazia", delta: 1 });
    }
    if (hormuzBlocked(s)) {
      s.log.push("Blocco di Hormuz attivo: effetti di fine round.");
      externalChange(s, { faction: "Europa", track: "Economia", delta: -1 });
      externalChange(s, { faction: "Cina", track: "Economia", delta: -1 });
      changeTrack(s, { faction: "Russia", track: "Economia", delta: 1 });
      changeTrack(s, { faction: "Iran", track: "Consenso", delta: 1 });
      changeTrack(s, { faction: "Iran", track: "Economia", delta: -1 });
    }
  }
  if (usesOfficialRules(s)) {
    s.roundClosure = true;
    s.queue = [
      ...s.order.filter((f) => s.players[f].bot).map((actor) => ({ kind: "closure-bot", actor })),
      ...TERRITORIES.map((t) => ({ kind: "closure-control", territoryId: t.id })),
      { kind: "closure-score" },
      { kind: "closure-units" },
      { kind: "closure-refill" }
    ];
    drain(s, rng);
  } else {
    scoreRound(s);
    rotateUnits(s);
    refill(s, rng);
    s.discardQueue = [...s.order];
    promptDiscard(s, rng);
  }
}
function finish(s, rng) {
  s.ops = null;
  s.pending = null;
  s.combat = null;
  s.queue = [];
  s.phase = "activation";
  s.activation++;
  s.turnIndex++;
  if (s.turnIndex >= s.order.length) {
    s.turnIndex = 0;
    if (s.lap === 1) s.lap = 2;
    else endRound(s, rng);
  }
}
function canVeto(s, c) {
  return !s.players[c.faction].neutral && c.delta < 0 && s.players[c.faction].tracks.Diplomazia >= 8 && !s.players[c.faction].vetoUsed;
}
function applyVeto(s, c) {
  s.log.push(`${c.faction}: Veto sulla correlazione ${c.track} ${c.delta}; costo \u22121 Diplomazia.`);
  s.players[c.faction].vetoUsed = true;
  changeTrack(s, { faction: c.faction, track: "Diplomazia", delta: -1 });
}
function revealBotCard(s, actor, track) {
  const deck = s.botDecks[actor][track], id = deck.shift();
  assert(id, "Mazzo BOT vuoto");
  deck.push(id);
  const card = BOT_CARDS.find((b) => b.id === id);
  assert(card && card.faction === actor && card.track === track, "Carta BOT non valida per il mazzo");
  if (usesOfficialRules(s)) {
    s.lastBotCards ??= {};
    s.lastBotCards[actor] = id;
  }
  return card;
}
function promptBotInfluence(s, actor, cardId) {
  const id = cardId ?? s.lastBotCards?.[actor] ?? revealBotCard(s, actor, weakestTrack(s, actor)).id;
  if (usesLatestRules(s) && s.botInfluenceEdition === "2026-11-22") {
    const territory2 = territoryDef(BOT_INFLUENCE[id]);
    if (!canInfluence(s, territory2.id)) {
      const leftmost = (s.influence ?? []).filter((i) => i.territory === territory2.id).sort((a, b) => a.slot - b.slot)[0];
      assert(leftmost, "Stato BOT pieno senza Influenza");
      s.influence = s.influence.filter((i) => i.id !== leftmost.id);
      s.log.push(`${actor} BOT: scalza l\u2019Influenza di ${leftmost.faction} dal riquadro ${leftmost.slot + 1} in ${territory2.name}.`);
    }
    s.log.push(`${actor} BOT: [${id}] Influenza a fine round \u2192 ${territory2.name}.`);
    placeInfluence(s, actor, territory2.id);
    return;
  }
  s.phase = "bot-influence";
  s.pending = { kind: "bot-influence", actor, cardId: id };
  s.log.push(`${actor} BOT: [${id}] Influenza a fine round \u2014 il materiale disponibile non riporta lo Stato; indicarlo esplicitamente dalla carta originale.`);
}
function placeInfluence(s, actor, territoryId) {
  assert(canInfluence(s, territoryId), "Serve un riquadro libero per l\u2019Influenza");
  s.influence ??= [];
  s.nextInfluence ??= 1;
  const slot = firstFreeSlot(s, territoryId);
  assert(slot >= 0, "Nessun riquadro libero");
  s.influence.push({ id: `i${s.nextInfluence++}`, faction: actor, territory: territoryId, slot });
  s.log.push(`${actor}: piazza Influenza in ${territoryDef(territoryId).name}, riquadro ${slot + 1}.`);
}
function grantControlBonus(s, actor, territoryId, track) {
  s.log.push(`${actor}: bonus controllo ${territoryDef(territoryId).name}, ${track} +1.`);
  if (track === "PV") s.players[actor].points++;
  else if (track === "Nucleare") globals(s, [{ track: "Nucleare", delta: 1 }], actor);
  else changeTrack(s, { faction: actor, track, delta: 1 });
}
function resolveControl(s, territoryId) {
  const actor = territoryController(s, territoryId);
  if (usesLatestRules(s) && territoryId === "iran") {
    s.coalitionIranRounds = actor === "Coalizione" ? (s.coalitionIranRounds ?? 0) + 1 : 0;
    if (actor === "Coalizione") {
      changeTrack(s, { faction: "Iran", track: "Economia", delta: -1 });
      if (s.coalitionIranRounds >= 2) globals(s, [{ track: "Nucleare", delta: -2 }], actor);
      return;
    }
  }
  if (!actor) return;
  const choices = controlBonusChoices(s, territoryId, actor);
  if (choices.length > 1) {
    if (s.players[actor].bot) {
      const choice = chooseBotControlBonus(s, actor, choices);
      s.log.push(`${actor} BOT: sceglie automaticamente ${choice} per il controllo di ${territoryDef(territoryId).name}.`);
      grantControlBonus(s, actor, territoryId, choice);
    } else {
      s.phase = "control";
      s.pending = { kind: "control", actor, territoryId, choices };
    }
  } else if (choices.length) grantControlBonus(s, actor, territoryId, choices[0]);
}
function drain(s, rng) {
  while (s.queue.length && s.phase !== "ended") {
    const effect = s.queue.shift();
    if (effect.kind === "correlation") {
      if (shieldAvailable(s, effect.change)) externalChange(s, effect.change);
      else if (canVeto(s, effect.change)) {
        const p = s.players[effect.change.faction];
        if (p.bot) {
          if (p.tracks[effect.change.track] <= 3) applyVeto(s, effect.change);
          else changeTrack(s, effect.change);
        } else {
          s.phase = "veto";
          s.pending = { kind: "veto", actor: effect.change.faction, change: effect.change };
          return;
        }
      } else changeTrack(s, effect.change);
    } else if (effect.kind === "track") changeTrack(s, effect.change);
    else if (effect.kind === "globals") globals(s, effect.changes, effect.responsible);
    else if (effect.kind === "reward") {
      if (effect.favored !== effect.actor && (!usesLatestRules(s) || !s.players[effect.actor].dividendUsed)) {
        s.players[effect.actor].points++;
        s.players[effect.actor].dividendUsed = true;
        s.log.push(`${effect.actor}: dividendo diplomatico +1 PV.`);
      }
      if (effect.unlock && !usesLatestRules(s)) {
        const id = s.specialReserve.shift();
        if (id) {
          s.players[effect.actor].hand.push(id);
          s.log.push(`${effect.actor}: pesca una carta dalla Riserva speciale.`);
        }
      }
    } else if (effect.kind === "bot") executeBotAction(s, effect.actor, effect.track, effect.action, rng);
    else if (effect.kind === "closure-bot") promptBotInfluence(s, effect.actor);
    else if (effect.kind === "closure-control") resolveControl(s, effect.territoryId);
    else if (effect.kind === "closure-score") scoreRound(s);
    else if (effect.kind === "closure-units") rotateUnits(s);
    else if (effect.kind === "closure-refill") refill(s, rng);
    if (s.pending || s.phase === "support" || s.phase === "casualty") return;
  }
  if (s.phase === "ended") return;
  s.pending = null;
  if (s.roundClosure) {
    s.discardQueue = [...s.order];
    promptDiscard(s, rng);
    return;
  }
  if (s.continuation === "ops") s.phase = "ops";
  else finish(s, rng);
}
function development(s, actor, track, correlation) {
  assert(TRACKS.includes(track), "Tracciato non valido");
  const change = CORRELATIONS[actor][track][correlation];
  assert(change, "Scegli una delle due correlazioni");
  s.log.push(`${actor}: Sviluppo ${track}; correlazione ${change.faction} ${change.track} ${change.delta > 0 ? "+" : ""}${change.delta}.`);
  changeTrack(s, { faction: actor, track, delta: 1 });
  s.queue.unshift({ kind: "correlation", change });
}
var MAINTENANCE_COST = 1;
function maintainableUnits(s, faction) {
  return s.units.filter((u) => u.faction === faction && u.rotated);
}
function chooseBotMaintenance(s, actor) {
  const priority = (u) => {
    const own = territoryPresence(s, actor, u.territory);
    const rival = Math.max(0, ...FACTIONS.filter((f) => f !== actor).map((f) => territoryPresence(s, f, u.territory)));
    return own > rival ? own - 1 <= rival ? 3 : 1 : own === rival ? 2 : 0;
  };
  return maintainableUnits(s, actor).slice().sort((a, b) => priority(b) - priority(a) || unitDef(b.type).cost - unitDef(a.type).cost)[0];
}
function renewUnit(s, actor, unitId) {
  const u = s.units.find((x) => x.id === unitId);
  assert(u && u.faction === actor, "Scegli una tua unit\xE0 sul tabellone");
  assert(u.rotated, "Si mantengono solo le unit\xE0 in scadenza a fine round");
  u.rotated = false;
  return u;
}
function canDeploy(s, faction, unitId, territoryId) {
  const u = UNITS.find((d) => d.id === unitId), t = TERRITORIES.find((d) => d.id === territoryId);
  if (!u || !t || u.faction !== faction || u.naval && t.name.toLowerCase().includes("giordania")) return false;
  const local = s.units.filter((x) => x.territory === territoryId);
  const max = u.maxPerTerritory ?? (/missili balistici/i.test(u.name) ? 2 : /caschi blu/i.test(u.name) ? 3 : void 0);
  return !s.players[faction].neutral && (usesLatestRules(s) ? s.units.filter((x) => x.type === unitId).length < 5 : occupiedSlots(s, territoryId).length < t.capacity) && (!max || local.filter((x) => x.type === unitId).length < max);
}
function deployment(s, actor, unitId, territoryId, target, diplomacyEffect) {
  assert(canDeploy(s, actor, unitId, territoryId), "Schieramento non valido: fazione, capacit\xE0 o limite navale/unit\xE0");
  const d = unitDef(unitId), name = d.name.toLowerCase();
  const intelligence = /intelligence|satelliti/.test(name), cyber = name === "cyber russia" || name === "cyber unit";
  if (intelligence) assert(target && FACTIONS.includes(target), "Scegli esplicitamente la fazione di cui vedere la mano");
  if (cyber && !usesLatestRules(s)) assert(target && target !== actor && (usesLatestRules(s) ? territoryPresence(s, target, territoryId) > 0 : s.units.some((u) => u.territory === territoryId && u.faction === target)), "Cyber: scegli un avversario presente nello stesso territorio");
  if (name === "diplomazia ue" && !usesLatestRules(s)) assert(diplomacyEffect === "sanctions" || diplomacyEffect === "opinion", "Scegli l\u2019effetto diplomatico");
  s.log.push(`${actor}: schiera ${d.name} in ${territoryDef(territoryId).name}.`);
  s.units.push({
    id: `u${s.nextUnit++}`,
    type: unitId,
    faction: actor,
    territory: territoryId,
    placedRound: s.actualRound,
    rotated: false,
    ...usesOfficialRules(s) && !usesLatestRules(s) ? { slot: firstFreeSlot(s, territoryId) } : {}
  });
  if (usesLatestRules(s) && actor === "Coalizione" && territoryId === "iran") {
    globals(s, [{ track: "Crisi Bellica", delta: -1 }, { track: "Opinione", delta: -1 }], actor);
    if (s.result) return;
  }
  if (intelligence) s.intel[actor].push({ target, hand: [...s.players[target].hand], activation: s.activation });
  if (usesLatestRules(s)) {
    updateBlockade(s);
    return;
  }
  if (cyber) changeTrack(s, { faction: target, track: "Economia", delta: -1 });
  if (name === "investimenti bri") changeTrack(s, { faction: "Cina", track: "Diplomazia", delta: 1 });
  if (name === "tecnologia duale") changeTrack(s, { faction: "Cina", track: "Militare", delta: 1 });
  if (name === "infrastrutture") changeTrack(s, { faction: "Cina", track: "Consenso", delta: 1 });
  if (name === "aiuti umanitari") changeTrack(s, { faction: "Europa", track: "Consenso", delta: 1 });
  if (name === "caschi blu") globals(s, [{ track: "Opinione", delta: 1 }]);
  if (name === "diplomazia ue") globals(s, [{ track: diplomacyEffect === "sanctions" ? "Sanzioni" : "Opinione", delta: diplomacyEffect === "sanctions" ? -1 : 1 }]);
}
function beginAttack(s, actor, territory2, rng) {
  assert(actor === "Iran" || actor === "Coalizione", "Solo Iran e Coalizione possono attaccare");
  const defender = actor === "Iran" ? "Coalizione" : "Iran";
  assert(s.units.some((u) => u.territory === territory2 && u.faction === actor) && s.units.some((u) => u.territory === territory2 && u.faction === defender), "Servono unit\xE0 di entrambe le fazioni belligeranti nel territorio");
  s.log.push(`${actor}: attacco a ${defender} in ${territoryDef(territory2).name}.`);
  globals(s, [{ track: "Crisi Bellica", delta: -1 }], actor);
  if (s.phase === "ended") return;
  s.combat = { attacker: actor, defender, territory: territory2, supporters: s.order.filter((f) => f !== actor && f !== defender && s.units.some((u) => u.faction === f && u.territory === territory2)), supportIndex: 0, support: {} };
  promptSupport(s, rng);
}
function promptSupport(s, rng) {
  const c = s.combat;
  while (c.supportIndex < c.supporters.length) {
    const f = c.supporters[c.supportIndex];
    if (s.players[f].bot) {
      c.support[f] = f === "Europa" ? c.attacker === "Coalizione" ? "attacker" : "defender" : c.attacker === "Iran" ? "attacker" : "defender";
      s.log.push(`${f} BOT: sostiene ${c.support[f] === "attacker" ? c.attacker : c.defender} in ${territoryDef(c.territory).name}.`);
      c.supportIndex++;
    } else {
      s.phase = "support";
      s.pending = { kind: "support", actor: f };
      return;
    }
  }
  resolveCombat(s, rng);
}
function resolveCombat(s, rng) {
  const c = s.combat, local = s.units.filter((u) => u.territory === c.territory);
  const attacking = local.filter((u) => u.faction === c.attacker || c.support[u.faction] === "attacker");
  const defending = local.filter((u) => u.faction === c.defender || c.support[u.faction] === "defender");
  const defensiveSystems = usesLatestRules(s) ? local : defending;
  const s400 = defensiveSystems.some((u) => named(u, "Difesa aerea S-400")), shield = defensiveSystems.some((u) => named(u, "Scudo Missilistico"));
  const modifier = (f) => s.players[f].tracks.Militare <= 3 ? -1 : s.players[f].tracks.Militare >= 8 ? 1 : 0;
  c.dice = [1 + Math.floor(random(rng) * 6), 1 + Math.floor(random(rng) * 6)];
  c.attack = attacking.reduce((n, u) => n + (s400 && named(u, "Aviazione Tattica") || shield && named(u, "Missili balistici") ? 0 : unitDef(u.type).attack) + (usesLatestRules(s) && named(u, "Forniture armi") && c.support[u.faction] === "attacker" ? 1 : 0), 0) + modifier(c.attacker) + c.dice[0];
  const controllingFaction = territoryController(s, c.territory);
  c.defense = defending.reduce((n, u) => n + (named(u, "IRGC") && inNamed(u, "Iran") ? 5 : named(u, "Forniture armi") && c.support[u.faction] === "defender" ? 1 : unitDef(u.type).defense) + (usesOfficialRules(s) && !usesLatestRules(s) && controllingFaction === u.faction ? 1 : 0), 0) + modifier(c.defender) + c.dice[1] - attacking.filter((u) => named(u, "IRGC Cyber Unit")).length + (usesLatestRules(s) && defending.some((u) => u.faction === controllingFaction) ? 1 : 0);
  if (usesLatestRules(s) && hasUnitIn(s, "Cina", "Tecnologia duale", c.territory) && defending.some((u) => u.faction === "Iran" || u.faction === "Russia")) c.defense++;
  if (usesLatestRules(s) && c.territory === "iran" && c.defender === "Iran" && !defending.some((u) => named(u, "IRGC"))) c.defense++;
  c.winner = c.attack > c.defense ? c.attacker : c.defender;
  c.loser = c.winner === c.attacker ? c.defender : c.attacker;
  const eligible = local.filter((u) => u.faction === c.loser).map((u) => u.id);
  c.casualties = Math.min(eligible.length, Math.abs(c.attack - c.defense) >= 4 ? 2 : 1);
  s.phase = "casualty";
  s.pending = { kind: "casualty", actor: c.loser, count: c.casualties, unitIds: eligible };
  if (s.players[c.loser].bot) applyCasualties(s, eligible.sort((a, b) => {
    const aa = unitDef(s.units.find((u) => u.id === a).type), bb = unitDef(s.units.find((u) => u.id === b).type);
    return aa.cost - bb.cost;
  }).slice(0, c.casualties), rng, false);
}
function applyCasualties(s, ids, rng, resume2 = true) {
  const c = s.combat, p = s.pending;
  assert(p?.kind === "casualty", "Nessuna perdita da scegliere");
  assert(new Set(ids).size === ids.length && ids.length === p.count && ids.every((id) => p.unitIds.includes(id)), "Scegli esattamente le unit\xE0 da rimuovere");
  s.log.push(`${c.loser}: rimuove ${ids.map((id) => unitDef(s.units.find((u) => u.id === id).type).name).join(", ")} da ${territoryDef(c.territory).name}.`);
  const defeatedSpecialForces = usesLatestRules(s) && c.loser === "Coalizione" ? ids.filter((id) => {
    const u = s.units.find((candidate) => candidate.id === id);
    return u?.faction === "Coalizione" && named(u, "Forze Speciali");
  }).length : 0;
  s.units = s.units.filter((u) => !ids.includes(u.id));
  changeTrack(s, { faction: c.loser, track: "Consenso", delta: -1 });
  if (usesOfficialRules(s)) {
    const lost = (s.influence ?? []).filter((i) => i.territory === c.territory && i.faction === c.loser).sort((a, b) => a.slot - b.slot)[0];
    if (lost) {
      s.influence = s.influence.filter((i) => i.id !== lost.id);
      s.log.push(`${c.loser}: perde anche l\u2019Influenza pi\xF9 a sinistra in ${territoryDef(c.territory).name}.`);
    }
  }
  const winnerUnits = s.units.filter((u) => u.territory === c.territory && u.faction === c.winner);
  const bonus = winnerUnits.filter((u) => named(u, "Proxy regionali") || named(u, "Droni Shahed")).length;
  if (bonus) changeTrack(s, { faction: c.loser, track: "Consenso", delta: -bonus });
  const specialForces = winnerUnits.filter((u) => named(u, "Forze Speciali")).length;
  if (specialForces) changeTrack(s, { faction: "Coalizione", track: "Diplomazia", delta: specialForces });
  if (defeatedSpecialForces) changeTrack(s, { faction: "Coalizione", track: "Consenso", delta: -defeatedSpecialForces });
  const cruise = winnerUnits.filter((u) => named(u, "Missili da crociera") && inNamed(u, "Iran")).length;
  if (cruise) globals(s, [{ track: "Nucleare", delta: -cruise }]);
  if (usesLatestRules(s) && c.territory === "iran") globals(s, [{ track: c.winner === "Coalizione" ? "Nucleare" : "Opinione", delta: -1 }], c.winner);
  s.log.push(`Combattimento: ${c.attacker} ${c.attack} / ${c.defender} ${c.defense} (dadi ${c.dice?.join(" / ")}); vince ${c.winner}`);
  updateBlockade(s);
  s.combat = null;
  s.pending = null;
  if (s.phase !== "ended") {
    s.phase = s.continuation === "ops" ? "ops" : "activation";
    if (resume2) drain(s, rng);
  }
}
function executeBotAction(s, actor, track, action, rng) {
  if (action.kind === "develop") development(s, actor, action.track, chooseBotCorrelation(s, actor, action.track));
  else if (action.kind === "global") globals(s, [{ track: action.track, delta: action.delta === "zero" ? -Math.sign(s.globals.Opinione) : action.delta }], actor);
  else if (action.kind === "track") changeTrack(s, action.change);
  else if (action.kind === "attack") {
    const territory2 = action.territory ?? TERRITORIES.find((t) => s.units.some((u) => u.faction === "Iran" && u.territory === t.id) && s.units.some((u) => u.faction === "Coalizione" && u.territory === t.id))?.id;
    if (territory2 && s.globals["Crisi Bellica"] > 3 && s.units.some((u) => u.faction === actor && u.territory === territory2) && s.units.some((u) => u.faction === (actor === "Iran" ? "Coalizione" : "Iran") && u.territory === territory2)) beginAttack(s, actor, territory2, rng);
    else development(s, actor, track, chooseBotCorrelation(s, actor, track));
  } else {
    const def = UNITS.find((u) => u.faction === actor && u.name.toLowerCase() === action.unit.toLowerCase());
    if (!def) {
      development(s, actor, track, chooseBotCorrelation(s, actor, track));
      return;
    }
    const printedOrder = ["Turchia", "Siria", "Libano", "Israele", "Giordania", "Egitto", "Iraq", "Iran", "Kuwait", "Arabia Saudita", "Bahrein", "Qatar", "Emirati", "Oman", "Yemen"];
    const friendly = printedOrder.flatMap((name) => TERRITORIES.filter((t) => t.name === name && t.alignment[actor] === 0).map((t) => t.id));
    const hormuz = TERRITORIES.find((t) => t.name.includes("Hormuz"))?.id;
    const candidates = def.naval ? [usesLatestRules(s) ? action.territory ?? hormuz : hormuz] : [action.territory, ...friendly];
    let selected = candidates.find((t) => t && canDeploy(s, actor, def.id, t));
    const cyber = /^Cyber (Russia|Unit)$/i.test(def.name);
    if (cyber) selected = candidates.find((t) => t && canDeploy(s, actor, def.id, t) && s.units.some((u) => u.territory === t && u.faction !== actor));
    if (!selected) {
      const fallback = s.units.filter((u) => u.type === def.id).length >= 5 ? "Militare" : track;
      development(s, actor, usesLatestRules(s) ? fallback : "Militare", chooseBotCorrelation(s, actor, usesLatestRules(s) ? fallback : "Militare"));
      return;
    }
    const target = cyber ? s.units.find((u) => u.territory === selected && u.faction !== actor).faction : FACTIONS.find((f) => f !== actor);
    deployment(s, actor, def.id, selected, target, "opinion");
  }
}
var BOT_BASE_UNIT = {
  Iran: "Forze convenzionali",
  Coalizione: "Convenzionale",
  Russia: "Consiglieri militari",
  Cina: "Investimenti BRI",
  Europa: "Caschi blu"
};
function botActivation(s, actor, rng) {
  const maintained = chooseBotMaintenance(s, actor);
  if (maintained) {
    renewUnit(s, actor, maintained.id);
    s.log.push(`${actor} BOT: Mantenimento gratuito di ${unitDef(maintained.type).name} in ${territoryDef(maintained.territory).name} (${maintained.id}); resta un altro round. Massimo 1 unit\xE0 per attivazione.`);
  }
  const id = draw(s, rng);
  s.continuation = "finish";
  if (id) {
    const card2 = cardDef(id);
    const option = card2.options.find((o) => o.boost.faction === actor);
    if (usesLatestRules(s) && !option) s.discard.push(id);
    else dispose(s, id);
    if (!usesLatestRules(s) || option) moveTurnMarker(s, actor, card2.cost);
    s.log.push(`${actor} BOT rivela [${card2.id}] ${card2.name}${option ? ` \u2014 opzione ${card2.options.indexOf(option) + 1}` : " \u2014 nessuna opzione propria, passa al mazzo BOT"}.`);
    if (option) {
      changeTrack(s, option.boost);
      s.queue = [{ kind: "correlation", change: option.correlation }, { kind: "globals", changes: option.globals, responsible: actor }];
      drain(s, rng);
      return;
    }
  }
  const track = weakestTrack(s, actor), card = revealBotCard(s, actor, track);
  if (usesLatestRules(s)) moveTurnMarker(s, actor, 2);
  let p1 = botCondition(s, actor, card.condition);
  let actions = botPlan(s, actor, p1 ? card.priority1 : card.priority2, card.condition);
  if (actions.some((a) => a.kind === "attack") && s.globals["Crisi Bellica"] <= 3) {
    p1 = false;
    actions = botPlan(s, actor, card.priority2, card.condition);
  }
  let presence = "";
  if (usesLatestRules(s) && !s.units.some((u) => u.faction === actor) && !actions.some((a) => a.kind === "deploy")) {
    const i = actions.findIndex((a) => a.kind === "develop");
    if (i >= 0) {
      actions[i] = { kind: "deploy", unit: BOT_BASE_UNIT[actor], territory: BOT_INFLUENCE[card.id] };
      presence = ` \xB7 presenza minima: Schiera ${BOT_BASE_UNIT[actor]} in ${territoryDef(BOT_INFLUENCE[card.id]).name} al posto del primo Sviluppo`;
    }
  }
  s.log.push(`${actor}: [${card.id}] ${card.name} \u2014 ${p1 ? "P1" : "P2"} (${p1 ? card.priority1 : card.priority2})${presence}`);
  s.queue = actions.map((action) => ({ kind: "bot", actor, track, action }));
  drain(s, rng);
}
function setStandIn(state, faction, on, reason) {
  const s = structuredClone(state), p = s.players[faction];
  assert(s.phase !== "ended", "Partita terminata");
  assert(!p.neutral && (on ? !p.bot : !!p.standIn), on ? "Il posto \xE8 gi\xE0 automatico" : "Il posto non \xE8 in sostituzione");
  p.bot = on;
  p.standIn = on;
  s.log.push(on ? `${faction}: ${reason} Un BOT gioca al suo posto finch\xE9 il giocatore non riprende il controllo.` : `${faction}: il giocatore riprende il controllo. ${reason}`.trim());
  return s;
}
function standInResolve(s, actor, rng) {
  const p = s.pending;
  if (p?.kind === "discard" && p.actor === actor) {
    const ids = s.players[actor].hand.slice(-p.count);
    ids.forEach((id) => {
      s.players[actor].hand.splice(s.players[actor].hand.indexOf(id), 1);
      if (usesLatestRules(s)) s.discard.push(id);
      else dispose(s, id);
    });
    s.log.push(`${actor} BOT: scarta ${p.count} ${p.count === 1 ? "carta" : "carte"} per il limite di mano ${p.limit}.`);
    s.pending = null;
    promptDiscard(s, rng);
    return true;
  }
  if (p?.kind === "veto" && p.actor === actor) {
    if (s.players[actor].tracks[p.change.track] <= 3) applyVeto(s, p.change);
    else externalChange(s, p.change);
    s.pending = null;
    s.phase = s.continuation === "ops" ? "ops" : "activation";
    drain(s, rng);
    return true;
  }
  if (p?.kind === "support" && p.actor === actor && s.combat) {
    const c = s.combat;
    c.support[actor] = actor === "Europa" ? c.attacker === "Coalizione" ? "attacker" : "defender" : c.attacker === "Iran" ? "attacker" : "defender";
    s.log.push(`${actor} BOT: sostiene ${c.support[actor] === "attacker" ? c.attacker : c.defender} in ${territoryDef(c.territory).name}.`);
    c.supportIndex++;
    s.pending = null;
    promptSupport(s, rng);
    if (!s.pending && !s.result) drain(s, rng);
    return true;
  }
  if (p?.kind === "casualty" && p.actor === actor) {
    const ids = [...p.unitIds].sort((a, b) => unitDef(s.units.find((u) => u.id === a).type).cost - unitDef(s.units.find((u) => u.id === b).type).cost).slice(0, p.count);
    applyCasualties(s, ids, rng);
    return true;
  }
  if (s.phase === "ops" && s.ops?.actor === actor) {
    s.log.push(`${actor} BOT: conclude le Operazioni lasciate in sospeso; ${s.ops.remaining} OP non spesi si perdono.`);
    finish(s, rng);
    return true;
  }
  return false;
}
function reduce(state, actor, command, rng = Math.random) {
  const s = structuredClone(state);
  assert(s.version === 3 && s.phase !== "ended", "Partita terminata o versione non valida");
  assert(FACTIONS.includes(actor) && actor === currentActor(s), "Non \xE8 il turno di questa fazione");
  if (command.type === "bot-influence") {
    const p = s.pending;
    assert(usesOfficialRules(s) && s.roundClosure && s.phase === "bot-influence" && p?.kind === "bot-influence" && s.players[actor].bot, "Nessuna Influenza BOT pendente");
    const territory2 = territoryDef(command.territoryId);
    if (!canInfluence(s, territory2.id)) {
      const leftmost = (s.influence ?? []).filter((i) => i.territory === territory2.id).sort((a, b) => a.slot - b.slot)[0];
      if (leftmost) {
        s.influence = s.influence.filter((i) => i.id !== leftmost.id);
        s.log.push(`${actor} BOT: scalza l\u2019Influenza di ${leftmost.faction} dal riquadro ${leftmost.slot + 1} in ${territory2.name}.`);
      } else {
        const card = BOT_CARDS.find((b) => b.id === p.cardId);
        assert(card, "Carta BOT sconosciuta");
        const next = revealBotCard(s, actor, card.track);
        s.log.push(`${territory2.name}: solo unit\xE0, non vengono scalzate. Il BOT passa alla carta successiva [${next.id}].`);
        promptBotInfluence(s, actor, next.id);
        return s;
      }
    }
    placeInfluence(s, actor, territory2.id);
    s.pending = null;
    s.phase = "activation";
    drain(s, rng);
    return s;
  }
  if (command.type === "control-bonus") {
    const p = s.pending;
    assert(usesOfficialRules(s) && s.roundClosure && s.phase === "control" && p?.kind === "control", "Nessun bonus controllo pendente");
    assert(p.choices.includes(command.track), "Scegli uno dei bonus di questo Stato");
    grantControlBonus(s, actor, p.territoryId, command.track);
    if (!s.result) {
      s.pending = null;
      s.phase = "activation";
      drain(s, rng);
    }
    return s;
  }
  if (command.type === "advance-bot") {
    if (s.players[actor].bot && s.phase === "control" && s.pending?.kind === "control" && s.roundClosure) {
      const pending = s.pending, choice = chooseBotControlBonus(s, actor, pending.choices);
      s.log.push(`${actor} BOT: sceglie automaticamente ${choice} per il controllo di ${territoryDef(pending.territoryId).name}.`);
      grantControlBonus(s, actor, pending.territoryId, choice);
      if (!s.result) {
        s.pending = null;
        s.phase = "activation";
        drain(s, rng);
      }
      return s;
    }
    if (usesLatestRules(s) && s.players[actor].neutral) {
      assert(s.phase === "activation", "Fazione neutrale fuori attivazione");
      moveTurnMarker(s, actor, 2);
      s.log.push(`${actor}: fazione neutrale, salta l\u2019attivazione.`);
      finish(s, rng);
      return s;
    }
    if (s.players[actor].bot && s.players[actor].standIn && standInResolve(s, actor, rng)) return s;
    assert(s.players[actor].bot && s.phase === "activation", "Il BOT non pu\xF2 avanzare in questa fase");
    botActivation(s, actor, rng);
    return s;
  }
  assert(!s.players[actor].bot, "Usa advance-bot per la fazione automatica");
  if (command.type === "veto") {
    const p = s.pending;
    assert(s.phase === "veto" && p?.kind === "veto", "Nessun veto pendente");
    if (command.use) {
      assert(canVeto(s, p.change), "Veto non disponibile");
      applyVeto(s, p.change);
    } else {
      s.log.push(`${actor}: rinuncia al Veto.`);
      externalChange(s, p.change);
    }
    s.pending = null;
    s.phase = s.continuation === "ops" ? "ops" : "activation";
    drain(s, rng);
    return s;
  }
  if (command.type === "support") {
    assert(s.phase === "support" && s.combat && ["attacker", "defender", "none"].includes(command.side), "Sostegno non valido");
    s.log.push(`${actor}: ${command.side === "none" ? "nessun sostegno" : `sostiene ${command.side === "attacker" ? s.combat.attacker : s.combat.defender}`} in ${territoryDef(s.combat.territory).name}.`);
    s.combat.support[actor] = command.side;
    s.combat.supportIndex++;
    s.pending = null;
    promptSupport(s, rng);
    if (!s.pending && !s.result) drain(s, rng);
    return s;
  }
  if (command.type === "casualties") {
    assert(s.phase === "casualty", "Nessun combattimento pendente");
    applyCasualties(s, command.unitIds, rng);
    return s;
  }
  if (command.type === "discard") {
    const p = s.pending;
    assert(s.phase === "discard" && p?.kind === "discard", "Nessuno scarto pendente");
    assert(command.cardIds.length === p.count && new Set(command.cardIds).size === p.count && command.cardIds.every((id) => s.players[actor].hand.includes(id)), "Scarta il numero esatto di carte");
    s.log.push(`${actor}: scarta ${p.count} ${p.count === 1 ? "carta" : "carte"} per il limite di mano ${p.limit}.`);
    command.cardIds.forEach((id) => {
      s.players[actor].hand.splice(s.players[actor].hand.indexOf(id), 1);
      if (usesLatestRules(s)) s.discard.push(id);
      else dispose(s, id);
    });
    s.pending = null;
    promptDiscard(s, rng);
    return s;
  }
  if (command.type === "peek") {
    assert((s.phase === "activation" || s.phase === "ops") && canPeek(s, actor, command.target), "Rete informativa non disponibile");
    (s.peeked ??= {})[actor] = s.activation;
    s.intel[actor].push({ target: command.target, hand: [...s.players[command.target].hand], activation: s.activation });
    s.log.push(`${actor}: Rete informativa sulla mano di ${command.target}.`);
    return s;
  }
  if (command.type === "skip") {
    assert(s.phase === "activation" && !s.players[actor].hand.length, "Puoi saltare solo senza carte");
    s.log.push(`${actor}: salta l\u2019attivazione, mano vuota.`);
    finish(s, rng);
    return s;
  }
  if (command.type === "play-event") {
    assert(s.phase === "activation", "Non puoi giocare un evento in questa fase");
    const card = takeCard(s, actor, command.cardId), o = card.options[command.option];
    assert(o && Number.isInteger(command.option), "Opzione non valida");
    moveTurnMarker(s, actor, card.cost);
    s.log.push(`${actor}: gioca [${card.id}] ${card.name} come evento \u2014 opzione ${command.option + 1}, a favore di ${o.boost.faction}.`);
    s.continuation = "finish";
    changeTrack(s, o.boost);
    s.queue = [{ kind: "correlation", change: o.correlation }, { kind: "globals", changes: o.globals, responsible: actor }, { kind: "reward", actor, favored: o.boost.faction, unlock: card.unlocksSpecial }];
    drain(s, rng);
    return s;
  }
  if (command.type === "begin-ops") {
    assert(s.phase === "activation", "Non puoi iniziare OP in questa fase");
    const card = takeCard(s, actor, command.cardId);
    moveTurnMarker(s, actor, card.cost);
    s.log.push(`${actor}: gioca [${card.id}] ${card.name} per ${card.cost} OP.`);
    s.ops = { actor, card: card.id, remaining: card.cost, pressured: [] };
    s.phase = "ops";
    s.continuation = "ops";
    return s;
  }
  assert(s.phase === "ops" && s.ops, "Serve una carta giocata come OP");
  if (command.type === "finish-ops") {
    s.log.push(`${actor}: conclude le azioni OP; ${s.ops.remaining} OP non spesi si perdono.`);
    finish(s, rng);
    return s;
  }
  if (command.type === "develop") {
    assert(s.ops.remaining >= 2, "Servono 2 OP");
    s.ops.remaining -= 2;
    s.log.push(`${actor}: spende 2 OP per Sviluppo; restano ${s.ops.remaining} OP.`);
    development(s, actor, command.track, command.correlation);
    drain(s, rng);
  } else if (command.type === "pressure") {
    const { track, delta } = command;
    assert(["Nucleare", "Sanzioni", "Crisi Bellica", "Opinione"].includes(track) && (delta === 1 || delta === -1), "Pressione non valida");
    assert(!s.ops.pressured.includes(track), "Massimo un passo per tracciato globale per attivazione");
    assert(track !== "Nucleare" || (delta === 1 ? actor === "Iran" : actor === "Coalizione" || actor === "Europa"), "Pressione sul Nucleare non consentita");
    assert(track !== "Sanzioni" || (delta === 1 ? actor === "Coalizione" || actor === "Europa" : actor === "Iran" || actor === "Russia" || actor === "Cina"), "Pressione sulle Sanzioni non consentita");
    const dip = s.players[actor].tracks.Diplomazia, base = dip <= 3 ? 3 : dip >= 8 ? 1 : 2;
    const cost = Math.max(1, base - (usesLatestRules(s) && actor === "Europa" && hasUnitIn(s, "Europa", "Diplomazia UE") ? 1 : 0));
    assert(s.ops.remaining >= cost, "OP insufficienti");
    s.ops.remaining -= cost;
    s.ops.pressured.push(track);
    s.log.push(`${actor}: Pressione ${track} ${delta > 0 ? "+" : ""}${delta}, costo ${cost} OP; restano ${s.ops.remaining} OP.`);
    globals(s, [{ track, delta }], actor);
  } else if (command.type === "deploy") {
    const cost = deployCost(s, actor, command.unitId, command.territoryId);
    assert(s.ops.remaining >= cost, "OP insufficienti");
    s.log.push(`${actor}: spende ${cost} OP per Schieramento; restano ${s.ops.remaining - cost} OP.`);
    deployment(s, actor, command.unitId, command.territoryId, command.target, command.diplomacyEffect);
    if (s.ops) s.ops.remaining -= cost;
  } else if (command.type === "influence") {
    assert(usesOfficialRules(s), "Influenza non prevista dal regolamento di questo salvataggio");
    const cost = influenceCost(s, actor, command.territoryId);
    assert(s.ops.remaining >= cost, "OP insufficienti");
    placeInfluence(s, actor, command.territoryId);
    s.ops.remaining -= cost;
    s.log.push(`${actor}: spende ${cost} OP per Influenza; restano ${s.ops.remaining} OP.`);
  } else if (command.type === "destabilize") {
    assert(usesOfficialRules(s), "Destabilizzare non previsto dal regolamento di questo salvataggio");
    assert(s.ops.remaining >= 2, "Servono 2 OP");
    const marker = (s.influence ?? []).find((i) => i.id === command.influenceId);
    assert(marker && marker.faction !== actor, "Scegli un segnalino Influenza avversario");
    assert(usesLatestRules(s) || territoryPresence(s, actor, marker.territory) > 0, "Destabilizzare richiede presenza nello stesso Stato");
    assert(!presidio(s, marker.faction, marker.territory), "Presidio: questa Influenza non pu\xF2 essere Destabilizzata");
    s.influence = s.influence.filter((i) => i.id !== marker.id);
    s.ops.remaining -= 2;
    s.log.push(`${actor}: Destabilizzare rimuove Influenza ${marker.faction} da ${territoryDef(marker.territory).name}, costo 2 OP; restano ${s.ops.remaining} OP.`);
  } else if (command.type === "maintain") {
    assert(s.ops.remaining >= MAINTENANCE_COST, "Serve 1 OP");
    const u = renewUnit(s, actor, command.unitId);
    s.ops.remaining -= MAINTENANCE_COST;
    s.log.push(`${actor}: Mantenimento di ${unitDef(u.type).name} in ${territoryDef(u.territory).name}, costo 1 OP; restano ${s.ops.remaining} OP.`);
  } else if (command.type === "attack") {
    const cost = attackCost(s, command.territoryId);
    assert(s.ops.remaining >= cost, `Servono ${cost} OP`);
    s.ops.remaining -= cost;
    s.log.push(`${actor}: spende ${cost} OP per Attacco${cost > 2 ? " (Caschi blu: zona protetta)" : ""}; restano ${s.ops.remaining} OP.`);
    beginAttack(s, actor, command.territoryId, rng);
  } else throw new Error("Comando sconosciuto");
  return s;
}

// src/game-v3/server-core.ts
var HIDDEN = "?";
var TURN_LIMIT_MS = 24 * 60 * 60 * 1e3;
var mask = (ids) => ids.map(() => HIDDEN);
function redact(state) {
  if (state.phase === "ended") return state;
  const s = structuredClone(state);
  for (const f of FACTIONS) {
    s.players[f].hand = mask(s.players[f].hand);
    s.players[f].objectives = mask(s.players[f].objectives);
    s.intel[f] = [];
  }
  s.deck = mask(s.deck);
  s.specialReserve = mask(s.specialReserve);
  s.eventDeck = mask(s.eventDeck);
  for (const f of FACTIONS) for (const t of Object.keys(s.botDecks[f])) s.botDecks[f][t] = mask(s.botDecks[f][t]);
  return s;
}
function privateView(state, faction) {
  return { hand: [...state.players[faction].hand], objectives: [...state.players[faction].objectives], intel: structuredClone(state.intel[faction]) };
}
var isRedacted = (state) => FACTIONS.some((f) => state.players[f].hand.includes(HIDDEN) || state.players[f].objectives.includes(HIDDEN));
function runBots(state, rng = Math.random, limit = 400) {
  let s = state;
  for (let i = 0; i < limit; i++) {
    const actor = currentActor(s);
    if (!actor || s.phase === "ended") return s;
    const p = s.players[actor];
    if (!(p.bot || p.neutral)) return s;
    if (s.pending?.kind === "bot-influence") return s;
    s = reduce(s, actor, { type: "advance-bot" }, rng);
  }
  return s;
}
function applyCommand(state, caller, actor, command, rng = Math.random) {
  if (!caller.member) throw new Error("Non partecipi a questa partita.");
  const current = currentActor(state);
  if (actor !== current) throw new Error("Non \xE8 il turno di questa fazione.");
  const botChoice = state.players[actor].bot && state.pending?.kind === "bot-influence" && command.type === "bot-influence";
  if (!botChoice) {
    if (command.type === "advance-bot") throw new Error("I BOT vengono fatti giocare dal server.");
    if (caller.faction !== actor) throw new Error("Puoi muovere solo la tua fazione.");
  }
  return runBots(reduce(state, actor, command, rng), rng);
}
function applyTimeout(state, turnStartedAt, now, rng = Math.random) {
  const actor = currentActor(state);
  if (!actor || state.phase === "ended") return null;
  const p = state.players[actor];
  if (p.bot || p.neutral || now - turnStartedAt < TURN_LIMIT_MS) return null;
  return runBots(setStandIn(state, actor, true, "Tempo scaduto (24 ore)."), rng);
}
function substitute(state, caller, faction, rng = Math.random) {
  if (!caller.host && !caller.admin) throw new Error("Solo chi ha creato la partita o l\u2019amministratore pu\xF2 sostituire un giocatore.");
  return runBots(setStandIn(state, faction, true, "Sostituito dall\u2019organizzatore."), rng);
}
function resume(state, caller) {
  if (!caller.faction || !state.players[caller.faction].standIn) throw new Error("Il tuo posto non \xE8 in sostituzione.");
  return setStandIn(state, caller.faction, false, "");
}
function turnKey(state) {
  const a = currentActor(state);
  return `${a ?? "-"}:${state.activation}:${state.phase}:${a && state.players[a].bot ? "bot" : "human"}`;
}
function planStart(roster, neutrals, requested, gameLength) {
  const humans = roster.filter((p) => p.player_id && !p.is_bot);
  if (!humans.length || humans.some((p) => !FACTIONS.includes(p.faction))) throw new Error("Seleziona una fazione prima di iniziare.");
  const empty = FACTIONS.filter((f) => !humans.some((p) => p.faction === f));
  if (neutrals.some((f) => !empty.includes(f))) throw new Error("Solo i posti senza giocatore possono essere neutrali.");
  const mode = requested ?? (["breve", "media", "lunga"].includes(String(gameLength)) ? gameLength : "media");
  return { empty, bots: empty.filter((f) => !neutrals.includes(f)), neutrals, mode, limit: mode === "breve" ? 30 : mode === "media" ? 60 : 80 };
}

// supabase/functions/tabletop/main.ts
var ADMIN_EMAIL = "sdaddino@yahoo.it";
var cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
var json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
var HttpError = class extends Error {
  constructor(message, status = 400, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
  status;
  extra;
};
var db = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
var must = (r) => {
  if (r.error) throw new Error(r.error.message);
  return r.data;
};
async function callerFor(gameId, userId, email) {
  const game = must(await db.from("games").select("*").eq("id", gameId).maybeSingle());
  if (!game) throw new HttpError("Partita non trovata.", 404);
  const seats = must(await db.from("game_players").select("faction, player_id, is_bot").eq("game_id", gameId));
  const seat = seats.find((p) => p.player_id === userId && !p.is_bot);
  const admin = email.toLowerCase() === ADMIN_EMAIL;
  const host = game.created_by === userId;
  return { userId, faction: seat?.faction ?? null, member: !!seat || host || admin, host, admin, game };
}
async function load(gameId) {
  const row = must(await db.from("tabletop_games").select("*").eq("game_id", gameId).maybeSingle());
  if (row) return row;
  const pub = must(await db.from("game_state").select("special_uses, updated_at").eq("game_id", gameId).maybeSingle());
  const legacy = pub?.special_uses?.tabletop_v3;
  if (!legacy?.state || legacy.state.version !== 3 || isRedacted(legacy.state)) return null;
  const imported = { game_id: gameId, revision: legacy.revision, state: legacy.state, turn_key: turnKey(legacy.state), turn_started_at: pub?.updated_at ?? (/* @__PURE__ */ new Date()).toISOString() };
  must(await db.from("tabletop_games").upsert(imported, { onConflict: "game_id", ignoreDuplicates: true }));
  await publish(imported, null);
  return must(await db.from("tabletop_games").select("*").eq("game_id", gameId).single());
}
async function save(prev, gameId, state) {
  const key = turnKey(state);
  const row = {
    game_id: gameId,
    revision: (prev?.revision ?? 0) + 1,
    state,
    turn_key: key,
    turn_started_at: prev && prev.turn_key === key ? prev.turn_started_at : (/* @__PURE__ */ new Date()).toISOString()
  };
  if (prev) {
    const updated = must(await db.from("tabletop_games").update({ ...row, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("game_id", gameId).eq("revision", prev.revision).select("game_id"));
    if (!updated.length) throw new HttpError("Un altro giocatore ha aggiornato la partita. Stato ricaricato: ripeti la scelta.", 409);
  } else must(await db.from("tabletop_games").insert(row));
  await publish(row, prev);
  return row;
}
async function publish(row, prev) {
  const s = row.state;
  const existing = must(await db.from("game_state").select("special_uses").eq("game_id", row.game_id).maybeSingle());
  const values = {
    game_id: row.game_id,
    nucleare: s.globals.Nucleare,
    sanzioni: s.globals.Sanzioni,
    active_faction: currentActor(s),
    special_uses: { ...existing?.special_uses ?? {}, tabletop_v3: { revision: row.revision, state: redact(s), redacted: true, turnStartedAt: row.turn_started_at } }
  };
  must(existing ? await db.from("game_state").update(values).eq("game_id", row.game_id) : await db.from("game_state").insert(values));
  const seats = must(await db.from("game_players").select("faction, player_id, is_bot").eq("game_id", row.game_id));
  const humans = seats.filter((p) => p.player_id && !p.is_bot && FACTIONS.includes(p.faction));
  if (humans.length) must(await db.from("tabletop_private").upsert(humans.map((p) => ({
    game_id: row.game_id,
    faction: p.faction,
    player_id: p.player_id,
    revision: row.revision,
    ...privateView(s, p.faction),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  })), { onConflict: "game_id,faction" }));
  if (s.phase === "ended") {
    await db.from("games").update({ status: "finished", finished_at: (/* @__PURE__ */ new Date()).toISOString(), winner_faction: s.result?.winners.join(",") ?? null }).eq("id", row.game_id).neq("status", "finished");
  }
  const actor = currentActor(s);
  if (actor && !s.players[actor].bot && !s.players[actor].neutral && (!prev || prev.turn_key !== row.turn_key)) {
    const seat = humans.find((p) => p.faction === actor);
    if (seat) await notify(seat.player_id, row.game_id, actor).catch((e) => console.warn("push", e));
  }
}
async function notify(userId, gameId, faction) {
  const pub = Deno.env.get("VAPID_PUBLIC_KEY"), priv = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!pub || !priv) return;
  webpush.setVapidDetails("mailto:" + ADMIN_EMAIL, pub, priv);
  const subs = must(await db.from("push_subscriptions").select("*").eq("user_id", userId));
  const game = must(await db.from("games").select("name, code").eq("id", gameId).maybeSingle());
  const payload = JSON.stringify({ title: "Linea Rossa \xB7 tocca a te", body: `${game?.name ?? "Partita " + (game?.code ?? "")}: tocca a ${faction}.`, url: "/", gameId });
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub.subscription, payload, { TTL: 86400 });
    } catch (e) {
      const code = e.statusCode;
      if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("id", sub.id);
    }
  }
}
function view(row, caller) {
  return {
    revision: row.revision,
    state: redact(row.state),
    turnStartedAt: row.turn_started_at,
    mine: caller.faction && row.state.phase !== "ended" ? privateView(row.state, caller.faction) : null
  };
}
async function start(gameId, caller, mode, neutrals = []) {
  const game = caller.game;
  if (!caller.host && !caller.admin) throw new HttpError("Solo il creatore pu\xF2 avviare la partita.", 403);
  const existing = await load(gameId);
  if (existing) return existing;
  if (game.status !== "lobby") throw new HttpError("La partita \xE8 gi\xE0 stata avviata.");
  const members = must(await db.from("game_players").select("*").eq("game_id", gameId));
  const first = planStart(members, neutrals, mode, game.game_length);
  if (first.empty.length) must(await db.from("game_players").upsert(first.empty.map((f) => ({
    game_id: gameId,
    faction: f,
    player_id: null,
    is_bot: true,
    bot_difficulty: "normal",
    is_ready: true,
    turn_order: FACTIONS.indexOf(f) + 1
  })), { onConflict: "game_id,faction", ignoreDuplicates: true }));
  const plan = planStart(must(await db.from("game_players").select("*").eq("game_id", gameId)), neutrals, mode, game.game_length);
  const state = runBots(createGame({ bots: plan.bots, neutrals: plan.neutrals, mode: plan.mode, rulesRevision: "2026-11-21", botInfluenceEdition: "2026-11-22" }));
  const row = await save(null, gameId, state);
  must(await db.from("games").update({ status: state.phase === "ended" ? "finished" : "active", started_at: (/* @__PURE__ */ new Date()).toISOString(), max_turns: plan.limit, game_length: plan.mode, track_limit: plan.limit, allow_join: false }).eq("id", gameId).eq("status", "lobby"));
  return row;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const auth = await db.auth.getUser(token);
    if (auth.error || !auth.data.user) throw new HttpError("Accesso richiesto.", 401);
    const body = await req.json();
    if (!body.gameId) throw new HttpError("Partita mancante.");
    const caller = await callerFor(body.gameId, auth.data.user.id, auth.data.user.email ?? "");
    if (!caller.member) throw new HttpError("Non partecipi a questa partita.", 403);
    if (body.action === "start") return json(view(await start(body.gameId, caller, body.mode, body.neutrals ?? []), caller));
    let row = await load(body.gameId);
    if (!row) throw new HttpError("Stato della partita non disponibile.", 404);
    if (body.action === "sync") {
      const timedOut = applyTimeout(row.state, Date.parse(row.turn_started_at), Date.now());
      const next = timedOut ?? runBots(row.state);
      if (next !== row.state) {
        try {
          row = await save(row, body.gameId, next);
        } catch (e) {
          if (!(e instanceof HttpError && e.status === 409)) throw e;
          row = await load(body.gameId);
        }
      }
      return json(view(row, caller));
    }
    if (body.action === "command") {
      if (body.revision !== row.revision) throw new HttpError("Un altro giocatore ha aggiornato la partita. Stato ricaricato: ripeti la scelta.", 409, view(row, caller));
      return json(view(await save(row, body.gameId, applyCommand(row.state, caller, body.actor, body.command)), caller));
    }
    if (body.action === "substitute") return json(view(await save(row, body.gameId, substitute(row.state, caller, body.faction)), caller));
    if (body.action === "resume") return json(view(await save(row, body.gameId, resume(row.state, caller)), caller));
    throw new HttpError("Azione sconosciuta.");
  } catch (e) {
    const err = e instanceof HttpError ? e : new HttpError(e.message ?? "Errore", 400);
    return json({ error: err.message, view: err.extra ?? null }, err.status);
  }
});
