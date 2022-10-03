import React from "react";
import { Avustushaku, Hakemus } from "soresu-form/web/va/types";
import { useHakemustenArviointiDispatch } from "../hakemustenArviointi/arviointiStore";
import {
  setArvioValue,
  startHakemusArvioAutoSave,
} from "../hakemustenArviointi/arviointiReducer";

type OppilaitosRowProps = {
  value: string;
  allowEditing?: boolean;
  onChange: ((e: React.ChangeEvent<HTMLInputElement>) => void) | undefined;
  onDelete?: ((_e: any) => void) | undefined;
};

const OppilaitosRow = ({
  value,
  allowEditing,
  onChange,
  onDelete,
}: OppilaitosRowProps) => {
  const deleteButton = onDelete ? (
    <button type="button" onClick={onDelete}>
      Poista
    </button>
  ) : null;
  return (
    <div>
      <input
        type="text"
        name="oppilaitos"
        size={50}
        maxLength={50}
        value={value}
        disabled={!allowEditing}
        onChange={onChange}
      />
      {deleteButton}
    </div>
  );
};

type SpecifyOppilaitosProps = {
  avustushaku: Avustushaku;
  hakemus: Hakemus;
  allowEditing?: boolean;
};

const SpecifyOppilaitos = ({
  avustushaku,
  hakemus,
  allowEditing,
}: SpecifyOppilaitosProps) => {
  const dispatch = useHakemustenArviointiDispatch();
  if (avustushaku["haku-type"] !== "yleisavustus") {
    return null;
  }
  const currentOppilaitokset = hakemus.arvio.oppilaitokset?.names ?? [];
  const oppilaitosRows = [];
  const onOppilaitosChange = function (index: number) {
    return allowEditing
      ? (event: React.ChangeEvent<HTMLInputElement>) => {
          const oppilaitokset = {
            names: [...(hakemus.arvio.oppilaitokset?.names ?? [])],
          };
          const oppilaitos = event.target.value;
          if (index + 1 > oppilaitokset.names.length) {
            oppilaitokset.names.push(oppilaitos);
          } else {
            oppilaitokset.names[index] = oppilaitos;
          }
          dispatch(
            setArvioValue({
              hakemusId: hakemus.id,
              key: "oppilaitokset",
              value: oppilaitokset,
            })
          );
          dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }));
        }
      : undefined;
  };
  const onOppilaitosRemove = function (index: number) {
    return allowEditing
      ? () => {
          const oppilaitokset = {
            names: [...(hakemus.arvio.oppilaitokset?.names ?? [])],
          };
          if (index >= 0 && oppilaitokset.names.length > 0) {
            oppilaitokset.names.splice(index, 1);
            dispatch(
              setArvioValue({
                hakemusId: hakemus.id,
                key: "oppilaitokset",
                value: oppilaitokset,
              })
            );
            dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }));
          }
        }
      : undefined;
  };
  let oppilaitosIndex = 0;
  for (; oppilaitosIndex < currentOppilaitokset.length; oppilaitosIndex++) {
    oppilaitosRows.push(
      <OppilaitosRow
        key={"oppilaitos-" + oppilaitosIndex}
        value={currentOppilaitokset[oppilaitosIndex]}
        onChange={onOppilaitosChange(oppilaitosIndex)}
        onDelete={onOppilaitosRemove(oppilaitosIndex)}
        allowEditing={allowEditing}
      />
    );
  }
  oppilaitosRows.push(
    <OppilaitosRow
      key={"oppilaitos-" + oppilaitosIndex}
      value=""
      onChange={onOppilaitosChange(oppilaitosIndex)}
      allowEditing={allowEditing}
    />
  );

  return (
    <div className="hakemus-arviointi-section">
      <label>Tukea saavat oppilaitokset / toimipisteet:</label>
      {oppilaitosRows}
    </div>
  );
};

export default SpecifyOppilaitos;
