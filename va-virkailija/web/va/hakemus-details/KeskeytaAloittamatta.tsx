import React from "react";
import { Hakemus } from "soresu-form/web/va/types";
import { setKeskeytettyAloittamatta } from "../hakemustenArviointi/arviointiReducer";
import { useHakemustenArviointiDispatch } from "../hakemustenArviointi/arviointiStore";

interface Props {
  hakemus: Hakemus;
}

const groupOptions = [
  { htmlId: "set-keskeyta-aloittamatta-false", value: false, label: "Ei" },
  { htmlId: "set-keskeyta-aloittamatta-true", value: true, label: "Kyllä" },
];

export default function KeskeytaAloittamatta({ hakemus }: Props) {
  const dispatch = useHakemustenArviointiDispatch();
  const onHakemusKeskeytaAloittamatta = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    dispatch(
      setKeskeytettyAloittamatta({
        hakemusId: hakemus.id,
        keskeyta: event.target.value === "true",
      })
    );
  };

  const options = groupOptions.flatMap((spec) => [
    <input
      id={spec.htmlId}
      key={spec.htmlId}
      type="radio"
      name="keskeyta-aloittamatta"
      value={String(spec.value)}
      onChange={onHakemusKeskeytaAloittamatta}
      checked={spec.value === !!hakemus["keskeytetty-aloittamatta"]}
    />,
    <label key={spec.htmlId + "-label"} htmlFor={spec.htmlId}>
      {spec.label}
    </label>,
  ]);

  return (
    <div id="keskeyta-aloittamatta">
      <h3>
        Keskeytä aloittamatta
      </h3>
      <fieldset className="soresu-radiobutton-group">{options}</fieldset>
    </div>
  );
};
