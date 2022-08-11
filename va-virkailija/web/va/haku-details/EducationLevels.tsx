import React, { Component } from "react";
import { HelpTexts, RahoitusAlue } from "soresu-form/web/va/types";
import HelpTooltip from "../HelpTooltip";
import { Avustushaku } from "../hakujenHallinta/hakuReducer";

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

function getId(levelIndex: number, valueIndex: number) {
  return `education-level-${levelIndex}-${valueIndex}`;
}

function renderItemValues({
  index,
  title,
  values,
  onChange,
  isTitle,
  onAdd,
  onRemove,
  readOnly,
}: RenderableItemProps) {
  const onAddWithFocusNext = (i: number) => {
    onAdd();
    setTimeout(() => {
      const next = document.getElementById(getId(index, i + 1));
      if (next) {
        next.focus();
      }
    }, 300);
  };
  return values.map((v, i) => (
    <div key={i}>
      {!isTitle ? (
        <span>
          <input
            id={getId(index, i)}
            value={v}
            onChange={onChange}
            name="education-levels"
            className={`education-level-field ${
              readOnly ? "disabled-input" : null
            }`}
            type="text"
            title={
              readOnly
                ? "Vanhoja rahoitusalueita (nyk. koulutusaste) ei voi muokata"
                : undefined
            }
            readOnly={readOnly}
            data-index={i}
            data-title={title}
          />
          {v && !readOnly && i === values.length - 1 ? (
            <button
              className="add"
              onClick={onAddWithFocusNext.bind(null, i)}
              tabIndex={-1}
            />
          ) : null}
          {(i === values.length && i > 0) || v ? (
            <button className="remove" onClick={onRemove(i)} tabIndex={-1} />
          ) : null}
        </span>
      ) : null}
    </div>
  ));
}

type RenderableItemProps = EducationLevelItem & {
  index: number;
  values: string[];
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  onAdd: () => void;
  onRemove: (index: number) => () => void;
  disabled: boolean;
};

function renderItem(item: RenderableItemProps) {
  return (
    <tr
      key={item.index}
      className={item.disabled ? "haku-edit-disabled-form" : ""}
    >
      {item.isChild ? <td /> : null}
      <td>{item.title}</td>
      <td>{renderItemValues(item)}</td>
      {item.isChild ? null : <td />}
    </tr>
  );
}

function isBlockedBy(
  blockers: EducationLevelTitle[],
  itemValues: { [p: string]: string[] }
): boolean {
  if (blockers) {
    return !!blockers.find(
      (v: EducationLevelTitle) =>
        itemValues[v] && itemValues[v].find((x) => x.length > 0)
    );
  }
  return false;
}

interface EducationLevelsProps {
  enabled: boolean;
  values: RahoitusAlue[];
  grant: Avustushaku;
  onAdd: (avustushaku: Avustushaku, rahoitusAlue: string) => void;
  onRemove: (
    avustushaku: Avustushaku,
    rahoitusalue: string,
    index: number
  ) => () => void;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  helpTexts: HelpTexts;
}

export default class EducationLevels extends Component<EducationLevelsProps> {
  render() {
    const { enabled, values, onChange, helpTexts, onAdd, onRemove, grant } =
      this.props;
    const itemValues: { [p: string]: string[] } = values.reduce(
      (a: { [index: string]: string[] }, c) => {
        a[c.rahoitusalue] = c.talousarviotilit;
        return a;
      },
      {}
    );

    return (
      <div className={enabled ? "" : "haku-edit-disabled-form"}>
        <h3>
          Koulutusasteet (kirjoita talousarviotili ottaaksesi käyttöön, esim.
          29.10.30.20)
          <HelpTooltip
            content={
              helpTexts["hakujen_hallinta__haun_tiedot___koulutusasteet"]
            }
          />
        </h3>
        <table className="education-levels-table">
          <tbody>
            {educationLevels.map((el, index) =>
              renderItem(
                Object.assign(el, {
                  index: index,
                  values:
                    itemValues[el.title] && itemValues[el.title].length > 0
                      ? itemValues[el.title]
                      : [""],
                  onChange: onChange,
                  onAdd: onAdd.bind(null, grant, el.title),
                  onRemove: onRemove.bind(null, grant, el.title),
                  disabled: isBlockedBy(el.blockedBy || [], itemValues),
                })
              )
            )}
          </tbody>
        </table>
      </div>
    );
  }
}
