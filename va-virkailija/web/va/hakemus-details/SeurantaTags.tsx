import React, { useState } from "react";
import _ from "lodash";
import ClassNames from "classnames";
import { Hakemus } from "soresu-form/web/va/types";
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from "../hakemustenArviointi/arviointiStore";
import {
  getLoadedState,
  setArvioValue,
  startHakemusArvioAutoSave,
} from "../hakemustenArviointi/arviointiReducer";

interface Props {
  hakemus: Hakemus;
}

const SeurantaTags = ({ hakemus }: Props) => {
  const dispatch = useHakemustenArviointiDispatch();
  const hakemukset = useHakemustenArviointiSelector(
    (state) => getLoadedState(state.arviointi).hakuData.hakemukset
  );
  const [newTag, setNewTag] = useState("");
  const currentTags = hakemus.arvio?.tags?.value ?? [];

  const onToggleTag = (value: string) => {
    const newTags = currentTags.includes(value)
      ? currentTags.filter((tag) => tag !== value)
      : currentTags.concat(value);
    dispatch(
      setArvioValue({
        hakemusId: hakemus.id,
        key: "tags",
        value: {
          value: newTags,
        },
      })
    );
    dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }));
  };

  const predefinedTags = ["budjettimuutos", "sisällön muutos", "lisäaika"];
  const hakuUsedTags = _.uniq(
    _.flatten(hakemukset.map((i) => _.get(i, "arvio.tags.value")))
  );
  const allTags = _.sortBy(_.uniq(hakuUsedTags.concat(predefinedTags)));

  const classNames = (tag: string) => {
    const selected = currentTags.includes(tag);
    return ClassNames("btn btn-tag btn-sm", {
      "btn-simple": !selected,
      "btn-selected": selected,
    });
  };

  const newTagChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toLowerCase();
    setNewTag(value);
  };

  const addTag = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    onToggleTag(newTag);
    setNewTag("");
  };

  return (
    <div>
      <h2>
        Tagit
        <button
          className="btn btn-selected btn-sm btn-tag-example"
          style={{ marginLeft: 10, marginRight: 10 }}
        >
          Valittu tagi
        </button>
        <button className="btn btn-simple btn-sm btn-tag-example">
          Ei käytössä
        </button>
      </h2>
      {allTags.map((tag, index) => (
        <button
          key={index}
          className={classNames(tag)}
          onClick={_.partial(onToggleTag, tag)}
        >
          {tag}
        </button>
      ))}
      <div>
        <form onSubmit={addTag}>
          <input
            type="text"
            onChange={newTagChanged}
            value={newTag}
            placeholder="Uusi tagi"
            style={{ padding: 4, fontSize: 12 }}
          />
          <button
            type="submit"
            className="btn btn-sm"
            style={{ marginLeft: 5 }}
            disabled={newTag.length === 0}
          >
            Lisää uusi tagi
          </button>
        </form>
      </div>
    </div>
  );
};

export default SeurantaTags;
