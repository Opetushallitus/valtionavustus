type EducationLevelTitle =
  | "Varhaiskasvatus"
  | "Yleissivistävä koulutus, ml. varhaiskasvatus"
  | "Esiopetus"
  | "Perusopetus"
  | "Lukiokoulutus"
  | "Taiteen perusopetus"
  | "Ammatillinen koulutus"
  | "Vapaa sivistystyö"
  | "Kansalaisopisto"
  | "Tiedeolympialaistoiminta"
  | "Suomi-koulut ja kotiperuskoulut"
  | "Muut järjestöt"
  | "Kristillisten koulujen kerhotoiminta"
  | "Kansanopisto"
  | "Opintokeskus"
  | "Kesäyliopisto"
  | "Korkeakoulutus"
  | "Aikuiskoulutus ja vapaa sivistystyö"
  | "Koko opetustoimi"
  | "Poikkeus"
  | "Muut hakuryhmät"
  | "Muut";

interface EducationLevelItem {
  title: EducationLevelTitle;
  blockedBy?: EducationLevelTitle[];
  isChild?: boolean;
  isTitle?: boolean;
  readOnly?: boolean;
}

export const educationLevels: EducationLevelItem[] = [
  {
    title: "Yleissivistävä koulutus, ml. varhaiskasvatus",
    blockedBy: [
      "Varhaiskasvatus",
      "Esiopetus",
      "Perusopetus",
      "Lukiokoulutus",
      "Taiteen perusopetus",
    ],
  },
  {
    title: "Varhaiskasvatus",
    isChild: true,
    blockedBy: ["Yleissivistävä koulutus, ml. varhaiskasvatus"],
  },
  {
    title: "Esiopetus",
    isChild: true,
    blockedBy: ["Yleissivistävä koulutus, ml. varhaiskasvatus"],
  },
  {
    title: "Perusopetus",
    isChild: true,
    blockedBy: ["Yleissivistävä koulutus, ml. varhaiskasvatus"],
  },
  {
    title: "Lukiokoulutus",
    isChild: true,
    blockedBy: ["Yleissivistävä koulutus, ml. varhaiskasvatus"],
  },
  {
    title: "Taiteen perusopetus",
    isChild: true,
    blockedBy: ["Yleissivistävä koulutus, ml. varhaiskasvatus"],
  },
  { title: "Ammatillinen koulutus" },
  { title: "Vapaa sivistystyö", isTitle: true },
  { title: "Kansalaisopisto", isChild: true },
  { title: "Kansanopisto", isChild: true },
  { title: "Opintokeskus", isChild: true },
  { title: "Kesäyliopisto", isChild: true },
  { title: "Korkeakoulutus" },
  {
    title: "Muut hakuryhmät",
    blockedBy: [
      "Tiedeolympialaistoiminta",
      "Suomi-koulut ja kotiperuskoulut",
      "Muut järjestöt",
      "Kristillisten koulujen kerhotoiminta",
      "Muut",
    ],
  },
  {
    title: "Tiedeolympialaistoiminta",
    isChild: true,
    blockedBy: ["Muut hakuryhmät"],
  },
  {
    title: "Suomi-koulut ja kotiperuskoulut",
    isChild: true,
    blockedBy: ["Muut hakuryhmät"],
  },
  { title: "Muut järjestöt", isChild: true, blockedBy: ["Muut hakuryhmät"] },
  {
    title: "Kristillisten koulujen kerhotoiminta",
    isChild: true,
    blockedBy: ["Muut hakuryhmät"],
  },
  { title: "Aikuiskoulutus ja vapaa sivistystyö", readOnly: true },
  { title: "Koko opetustoimi", readOnly: true },
  { title: "Poikkeus", readOnly: true },
  { title: "Muut", isChild: true, blockedBy: ["Muut hakuryhmät"] },
];
