import React from "react";
import { Avustushaku, Hakemus } from "soresu-form/web/va/types";
import HakemustenArviointiController from "../HakemustenArviointiController";

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
  controller: HakemustenArviointiController;
  hakemus: Hakemus;
  allowEditing?: boolean;
};

export default class SpecifyOppilaitos extends React.Component<SpecifyOppilaitosProps> {
  constructor(props: SpecifyOppilaitosProps) {
    super(props);
  }

  render() {
    const avustushaku = this.props.avustushaku;
    if (avustushaku["haku-type"] !== "yleisavustus") {
      return null;
    }
    const hakemus = this.props.hakemus;
    const allowEditing = this.props.allowEditing;
    const currentOppilaitokset = hakemus.arvio.oppilaitokset?.names ?? [];
    const controller = this.props.controller;
    const oppilaitosRows = [];
    const onOppilaitosChange = function (index: number) {
      return allowEditing
        ? (event: React.ChangeEvent<HTMLInputElement>) => {
            controller.setOppilaitos(hakemus, index, event.target.value);
          }
        : undefined;
    };
    const onOppilaitosRemove = function (index: number) {
      return allowEditing
        ? () => {
            controller.removeOppilaitos(hakemus, index);
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
  }
}
