import React from "react";
import { useHakemustenArviointiDispatch } from "../hakemustenArviointi/arviointiStore";
import {
  setArvioValue,
  startHakemusArvioAutoSave,
} from "../hakemustenArviointi/arviointiReducer";
import { useHakemus } from "../hakemustenArviointi/useHakemus";

const ShouldPayComments = () => {
  const dispatch = useHakemustenArviointiDispatch();
  const hakemus = useHakemus();
  const shouldPayComments = hakemus.arvio?.["should-pay-comments"];
  const onChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch(
      setArvioValue({
        hakemusId: hakemus.id,
        key: "should-pay-comments",
        value: event.target.value,
      })
    );
    dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }));
  };
  return (
    <div className="value-edit should-pay-comment">
      <label htmlFor="should-pay-comment">Perustelut, miksi ei makseta: </label>
      <textarea
        id="should-pay-comment"
        rows={5}
        disabled={hakemus.arvio["should-pay"]}
        value={shouldPayComments || ""}
        onChange={onChange}
        maxLength={128}
      />
    </div>
  );
};

export default ShouldPayComments;
