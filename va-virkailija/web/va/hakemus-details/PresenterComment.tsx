import React from "react";

import HelpTooltip from "../HelpTooltip";
import { useHakemustenArviointiDispatch } from "../hakemustenArviointi/arviointiStore";
import {
  setArvioValue,
  startHakemusArvioAutoSave,
} from "../hakemustenArviointi/arviointiReducer";
import { useHakemus } from "../hakemustenArviointi/useHakemus";

type PresenterCommentProps = {
  helpText: string;
};

const PresenterComment = ({ helpText }: PresenterCommentProps) => {
  const dispatch = useHakemustenArviointiDispatch();
  const hakemus = useHakemus();

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    dispatch(
      setArvioValue({
        hakemusId: hakemus.id,
        key: "presentercomment",
        value,
      })
    );
    dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }));
  };
  return (
    <div className="value-edit">
      <label>
        Valmistelijan huomiot
        <HelpTooltip content={helpText} direction={"valmistelijan-huomiot"} />
      </label>
      <textarea
        rows={5}
        value={hakemus.arvio.presentercomment ?? ""}
        onChange={onChange}
      ></textarea>
    </div>
  );
};

export default PresenterComment;
