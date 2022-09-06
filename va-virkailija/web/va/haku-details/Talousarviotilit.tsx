import React from "react";
import Select, { SingleValue } from "react-select";
import {
  useHakujenHallintaDispatch,
  useHakujenHallintaSelector,
} from "../hakujenHallinta/hakujenHallintaStore";
import {
  replaceTalousarviotilit,
  selectSelectedAvustushaku,
  TalousarviotiliWithKoulutusasteet,
} from "../hakujenHallinta/hakuReducer";
import { useGetTalousarvioTilitQuery } from "../hakujenHallinta/hakuApiSlice";
import { TalousarviotiliWithUsageInfo } from "../koodienhallinta/types";
import HelpTooltip from "../HelpTooltip";

import styles from "./Talousarviotilit.module.less";

const Koulutusasteet = [
  "Varhaiskasvatus",
  "Yleissivistävä koulutus, ml. varhaiskasvatus",
  "Esiopetus",
  "Perusopetus",
  "Lukiokoulutus",
  "Taiteen perusopetus",
  "Ammatillinen koulutus",
  "Vapaa sivistystyö",
  "Kansalaisopisto",
  "Tiedeolympialaistoiminta",
  "Suomi-koulut ja kotiperuskoulut",
  "Muut järjestöt",
  "Kristillisten koulujen kerhotoiminta",
  "Kansanopisto",
  "Opintokeskus",
  "Kesäyliopisto",
  "Korkeakoulutus",
  "Aikuiskoulutus ja vapaa sivistystyö",
  "Koko opetustoimi",
  "Poikkeus",
  "Muut hakuryhmät",
  "Muut",
] as const;

const koulutusasteToOption = (aste: string) => {
  return {
    value: aste,
    label: aste,
  };
};

const koulutusasteOptions = Koulutusasteet.map(koulutusasteToOption);

interface Option {
  value: string;
  label: string;
}

const mapTiliOption = ({
  id,
  code,
  name,
  year,
}: TalousarviotiliWithUsageInfo): Option => {
  const yearLabel = Boolean(year) ? `(${year})` : "";
  return {
    value: `${id}`,
    label: `${code} ${name ?? ""} ${yearLabel}`,
  };
};

interface TalousarvioSelectProps {
  options: Option[];
  selectedTalousarvioTili?: TalousarviotiliWithKoulutusasteet;
  allSelectedTalousarvioTili: TalousarviotiliWithKoulutusasteet[];
  onTalousarvioChange: (index: number) => (option: SingleValue<Option>) => void;
  onAddNewTalousarvio: (index: number) => () => void;
  onRemoveTalousarvio: (index: number) => () => void;
  talousarvioTiliIndex: number;
  isDisabled: boolean;
  children: React.ReactNode;
}

const TalousarvioSelect = ({
  selectedTalousarvioTili,
  options,
  allSelectedTalousarvioTili,
  onTalousarvioChange,
  onAddNewTalousarvio,
  onRemoveTalousarvio,
  talousarvioTiliIndex,
  isDisabled,
  children,
}: TalousarvioSelectProps) => {
  const selectedTalousarvioTiliOption = selectedTalousarvioTili
    ? mapTiliOption(selectedTalousarvioTili)
    : undefined;
  const rowCanNotBeDisabled =
    allSelectedTalousarvioTili.length === 0 && talousarvioTiliIndex === 0;
  return (
    <div className={styles.talousarviotiliSelect}>
      <div className={styles.talousarvioSelectContainer}>
        <div>
          <div>
            TA-tili
            <HelpTooltip content="" /> *
          </div>
          <Select
            value={selectedTalousarvioTiliOption}
            options={options}
            isDisabled={isDisabled}
            id={`ta-tili-select-${talousarvioTiliIndex}`}
            classNamePrefix="taTiliSelection"
            noOptionsMessage={() => "Ei talousarviotilejä"}
            isOptionDisabled={(option) =>
              allSelectedTalousarvioTili.some(
                (tili) => String(tili.id) === option.value
              )
            }
            onChange={onTalousarvioChange(talousarvioTiliIndex)}
            placeholder="Valitse talousarviotili"
          />
        </div>
        {children}
      </div>
      <div className={styles.outsideButtonPair}>
        <button
          title="Lisää talousarviotili"
          onClick={onAddNewTalousarvio(talousarvioTiliIndex)}
        >
          <PlusIcon />
        </button>
        <button
          disabled={rowCanNotBeDisabled}
          title="Poista talousarviotili"
          onClick={onRemoveTalousarvio(talousarvioTiliIndex)}
        >
          <MinusIcon />
        </button>
      </div>
    </div>
  );
};

interface KoulutusasteSelectProps {
  selectedKoulutusasteet: string[];
  isDisabled: boolean;
  onKoulutusasteChange: (
    koulutusasteIndex: number
  ) => (option: SingleValue<Option>) => void;
  onAddRow: (koulutusasteIndex: number) => void;
  onRemoveRow: (koulutusasteIndex: number) => void;
}

const KoulutusasteSelect = ({
  selectedKoulutusasteet,
  isDisabled,
  onKoulutusasteChange,
  onAddRow,
  onRemoveRow,
}: KoulutusasteSelectProps) => {
  const koulutusPlaceholder = isDisabled
    ? "Valitse ensin talousarviotili"
    : "Valitse talousarviotilin koulutusaste";
  const koulutusasteSelection =
    selectedKoulutusasteet.length === 0 ? (
      <div>
        <div>
          Koulutusaste
          <HelpTooltip content="" /> *
        </div>
        <Select
          isDisabled={isDisabled}
          options={koulutusasteOptions}
          id={"koulutusaste-select-0"}
          classNamePrefix="koulutusasteSelection"
          isOptionDisabled={(option) =>
            selectedKoulutusasteet.some((aste) => aste === option.value)
          }
          onChange={onKoulutusasteChange(0)}
          placeholder={koulutusPlaceholder}
        />
      </div>
    ) : (
      selectedKoulutusasteet.map((aste, index) => {
        const value = koulutusasteToOption(aste);
        return (
          <div
            key={aste !== "" ? `koulutusaste-${aste}` : `koulutusaste-${index}`}
          >
            {index === 0 && (
              <div>
                Koulutusaste
                <HelpTooltip content="" /> *
              </div>
            )}
            <div className={styles.koulutusasteSelect}>
              <Select
                isDisabled={isDisabled}
                key={aste}
                id={`koulutusaste-select-${index}`}
                value={value}
                options={koulutusasteOptions}
                classNamePrefix="koulutusasteSelection"
                isOptionDisabled={(option) =>
                  selectedKoulutusasteet.some((aste) => aste === option.value)
                }
                onChange={onKoulutusasteChange(index)}
                placeholder={koulutusPlaceholder}
              />
              <div className={styles.buttonPairContainer}>
                <button
                  title={"Lisää uusi koulutusastevalinta"}
                  onClick={() => onAddRow(index)}
                >
                  <PlusIcon />
                </button>
                <button
                  title={`Poista koulutusaste ${aste} talousarviotililtä`}
                  onClick={() => onRemoveRow(index)}
                >
                  <MinusIcon />
                </button>
              </div>
            </div>
          </div>
        );
      })
    );
  return <div>{koulutusasteSelection}</div>;
};

interface TalousarviotilitProps {
  options: Option[];
  selectedTalousarvioTili?: TalousarviotiliWithKoulutusasteet;
  allSelectedTalousarvioTili: TalousarviotiliWithKoulutusasteet[];
  onTalousarvioChange: (
    koulutusasteet: string[]
  ) => (index: number) => (option: SingleValue<Option>) => void;
  onKoulutusasteChange: (
    koulutusasteIndex: number
  ) => (option: SingleValue<Option>) => void;
  onAddKoulutusasteRow: (koulutusasteIndex: number) => void;
  onRemoveKoulutusasteRow: (koulutusasteIndex: number) => void;
  onAddNewTalousarvio: (index: number) => () => void;
  onRemoveTalousarvio: (index: number) => () => void;
  talousarvioTiliIndex: number;
  disabled: boolean;
}

const TalousarvioTili = ({
  selectedTalousarvioTili,
  allSelectedTalousarvioTili,
  options,
  onTalousarvioChange,
  onKoulutusasteChange,
  onAddKoulutusasteRow,
  onRemoveKoulutusasteRow,
  onAddNewTalousarvio,
  onRemoveTalousarvio,
  talousarvioTiliIndex,
  disabled,
}: TalousarviotilitProps) => {
  const selectedKoulutusasteet = selectedTalousarvioTili?.koulutusasteet ?? [];
  return (
    <div
      className={styles.container}
      id={`ta-tili-container-${talousarvioTiliIndex}`}
    >
      <TalousarvioSelect
        isDisabled={disabled}
        options={options}
        selectedTalousarvioTili={selectedTalousarvioTili}
        allSelectedTalousarvioTili={allSelectedTalousarvioTili}
        onTalousarvioChange={onTalousarvioChange(selectedKoulutusasteet)}
        onAddNewTalousarvio={onAddNewTalousarvio}
        onRemoveTalousarvio={onRemoveTalousarvio}
        talousarvioTiliIndex={talousarvioTiliIndex}
      >
        <KoulutusasteSelect
          selectedKoulutusasteet={selectedKoulutusasteet}
          onKoulutusasteChange={onKoulutusasteChange}
          isDisabled={disabled || !selectedTalousarvioTili}
          onAddRow={onAddKoulutusasteRow}
          onRemoveRow={onRemoveKoulutusasteRow}
        />
      </TalousarvioSelect>
    </div>
  );
};

export const Talousarviotilit = () => {
  const { data, isLoading } = useGetTalousarvioTilitQuery();
  const talousarvioOptions = data?.map(mapTiliOption) ?? [];
  const selectedHaku = useHakujenHallintaSelector(selectSelectedAvustushaku);
  const { talousarviotilit = [] } = selectedHaku;
  const dispatch = useHakujenHallintaDispatch();
  const allSelectedTalousarvioTilit = talousarviotilit.filter(
    (tili): tili is TalousarviotiliWithKoulutusasteet => tili !== undefined
  );
  if (isLoading) {
    return null;
  }
  const onTalousarvioChange =
    (koulutusasteet: string[]) =>
    (index: number) =>
    (option: SingleValue<Option>) => {
      if (!option) {
        return;
      }
      const talousarviotili = data?.find(
        ({ id }) => String(id) === option.value
      );
      if (!talousarviotili) {
        return;
      }
      const newTalousarviotilit = [...talousarviotilit];
      newTalousarviotilit.splice(index, 1, {
        ...talousarviotili,
        koulutusasteet,
      });
      dispatch(
        replaceTalousarviotilit({
          avustushakuId: selectedHaku.id,
          talousarviotilit: newTalousarviotilit,
        })
      );
    };
  const onKoulutusasteChange =
    (talousarviotiliIndex: number) =>
    (koulutusasteIndex: number) =>
    (option: SingleValue<Option>) => {
      const newTalousarviotilit = [...talousarviotilit];
      const talousarviotili = newTalousarviotilit[talousarviotiliIndex];
      if (!option || !talousarviotili) {
        return;
      }
      const koulutusasteet = [...talousarviotili.koulutusasteet];
      koulutusasteet.splice(koulutusasteIndex, 1, option.value);
      newTalousarviotilit.splice(talousarviotiliIndex, 1, {
        ...talousarviotili,
        koulutusasteet,
      });
      dispatch(
        replaceTalousarviotilit({
          avustushakuId: selectedHaku.id,
          talousarviotilit: newTalousarviotilit,
        })
      );
    };
  const onRemoveKoulutusaste =
    (talousarviotiliIndex: number) => (koulutusasteIndex: number) => {
      const newTalousarviotilit = [...talousarviotilit];
      const talousarviotili = newTalousarviotilit[talousarviotiliIndex];
      if (!talousarviotili) {
        return;
      }
      const koulutusasteet = [...talousarviotili.koulutusasteet];
      koulutusasteet.splice(koulutusasteIndex, 1);
      newTalousarviotilit.splice(talousarviotiliIndex, 1, {
        ...talousarviotili,
        koulutusasteet,
      });
      dispatch(
        replaceTalousarviotilit({
          avustushakuId: selectedHaku.id,
          talousarviotilit: newTalousarviotilit,
        })
      );
    };
  const onAddKoulutusasteRow =
    (talousarviotiliIndex: number) => (index: number) => {
      const newTalousarviotilit = [...talousarviotilit];
      const talousarviotili = newTalousarviotilit[talousarviotiliIndex];
      if (!talousarviotili) {
        return;
      }
      const koulutusasteet = [...talousarviotili.koulutusasteet];
      koulutusasteet.splice(index + 1, 0, "");
      newTalousarviotilit.splice(talousarviotiliIndex, 1, {
        ...talousarviotili,
        koulutusasteet,
      });
      dispatch(
        replaceTalousarviotilit({
          avustushakuId: selectedHaku.id,
          talousarviotilit: newTalousarviotilit,
        })
      );
    };
  const onAddTalousarvioTili = (index: number) => () => {
    const newTalousarvioTilit = [...talousarviotilit];
    if (newTalousarvioTilit.length === 0) {
      newTalousarvioTilit.splice(0, 0, undefined, undefined);
    } else {
      newTalousarvioTilit.splice(index + 1, 0, undefined);
    }
    dispatch(
      replaceTalousarviotilit({
        avustushakuId: selectedHaku.id,
        talousarviotilit: newTalousarvioTilit,
      })
    );
  };
  const onRemoveTalousarvio = (index: number) => () => {
    const newTalousarvioTilit = [...talousarviotilit];
    newTalousarvioTilit.splice(index, 1);
    dispatch(
      replaceTalousarviotilit({
        avustushakuId: selectedHaku.id,
        talousarviotilit: newTalousarvioTilit,
      })
    );
  };
  if (talousarviotilit.length === 0) {
    const noOpForEmptyTalousarvioTili = () => () => {};
    return (
      <div aria-busy={isLoading} aria-live="polite">
        <TalousarvioTili
          disabled={isLoading}
          allSelectedTalousarvioTili={allSelectedTalousarvioTilit}
          options={talousarvioOptions}
          selectedTalousarvioTili={undefined}
          onTalousarvioChange={onTalousarvioChange}
          onKoulutusasteChange={noOpForEmptyTalousarvioTili}
          onAddKoulutusasteRow={noOpForEmptyTalousarvioTili}
          onRemoveKoulutusasteRow={noOpForEmptyTalousarvioTili}
          onAddNewTalousarvio={onAddTalousarvioTili}
          onRemoveTalousarvio={onRemoveTalousarvio}
          talousarvioTiliIndex={0}
        />
      </div>
    );
  }
  return (
    <div aria-busy={isLoading} aria-live="polite">
      {talousarviotilit.map((talousarviotili, index) => (
        <TalousarvioTili
          key={
            talousarviotili
              ? `${talousarviotili?.name}-${talousarviotili?.id}`
              : `empty-${index}`
          }
          disabled={isLoading}
          allSelectedTalousarvioTili={allSelectedTalousarvioTilit}
          options={talousarvioOptions}
          selectedTalousarvioTili={talousarviotili}
          onTalousarvioChange={onTalousarvioChange}
          onKoulutusasteChange={onKoulutusasteChange(index)}
          onAddKoulutusasteRow={onAddKoulutusasteRow(index)}
          onRemoveKoulutusasteRow={onRemoveKoulutusaste(index)}
          onAddNewTalousarvio={onAddTalousarvioTili}
          onRemoveTalousarvio={onRemoveTalousarvio}
          talousarvioTiliIndex={index}
        />
      ))}
    </div>
  );
};

const PlusIcon = () => (
  <svg
    width="20"
    height="21"
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 0.5C4.45312 0.5 0 4.99219 0 10.5C0 16.0469 4.45312 20.5 10 20.5C15.5078 20.5 20 16.0469 20 10.5C20 4.99219 15.5078 0.5 10 0.5ZM13.75 11.4375H10.9375V14.25C10.9375 14.7969 10.5078 15.1875 10 15.1875C9.45312 15.1875 9.0625 14.7969 9.0625 14.25V11.4375H6.25C5.70312 11.4375 5.3125 11.0469 5.3125 10.5C5.3125 9.99219 5.70312 9.5625 6.25 9.5625H9.0625V6.75C9.0625 6.24219 9.45312 5.8125 10 5.8125C10.5078 5.8125 10.9375 6.24219 10.9375 6.75V9.5625H13.75C14.2578 9.5625 14.6875 9.99219 14.6875 10.5C14.6875 11.0469 14.2578 11.4375 13.75 11.4375Z"
      fill="#499CC7"
    />
  </svg>
);

const MinusIcon = () => (
  <svg
    width="20"
    height="21"
    viewBox="0 0 20 21"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 0.5C4.45312 0.5 0 4.99219 0 10.5C0 16.0469 4.45312 20.5 10 20.5C15.5078 20.5 20 16.0469 20 10.5C20 4.99219 15.5078 0.5 10 0.5ZM13.75 11.4375H6.25C5.70312 11.4375 5.3125 11.0469 5.3125 10.5C5.3125 9.99219 5.70312 9.5625 6.25 9.5625H13.75C14.2578 9.5625 14.6875 9.99219 14.6875 10.5C14.6875 11.0469 14.2578 11.4375 13.75 11.4375Z"
      fill="#BA3E35"
    />
  </svg>
);
