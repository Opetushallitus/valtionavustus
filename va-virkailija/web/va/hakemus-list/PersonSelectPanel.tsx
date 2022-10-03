import React from "react";
import classNames from "classnames";

import { Hakemus } from "soresu-form/web/va/types";

import { Role } from "../types";

import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from "../hakemustenArviointi/arviointiStore";
import {
  getLoadedState,
  startHakemusArvioAutoSave,
  toggleHakemusRole,
  togglePersonSelect,
} from "../hakemustenArviointi/arviointiReducer";

import styles from "./Person.module.less";

export const isPresenterRole = ({ role }: Role): boolean =>
  ["presenting_officer", "vastuuvalmistelija"].includes(role);
export const isPresenter = (hakemus: Hakemus, { id }: { id: number }) =>
  hakemus.arvio["presenter-role-id"] === id;
export const isEvaluator = (hakemus: Hakemus, { id }: { id: number }) =>
  hakemus.arvio.roles["evaluators"].includes(id);

type RoleButtonProps = {
  role: Role;
  roleField: "evaluators" | "presenter";
  hakemus: Hakemus;
};

const getRoleButtonAriaLabel = (
  isPresenterField: boolean,
  active: boolean,
  name: string
) => {
  if (isPresenterField) {
    return active
      ? `Poista ${name} valmistelijan roolista`
      : `Lisää ${name} valmistelijaksi`;
  }
  return active
    ? `Poista ${name} arvioijan roolista`
    : `Lisää ${name} arvioijaksi`;
};

const RoleButton = ({ role, roleField, hakemus }: RoleButtonProps) => {
  const dispatch = useHakemustenArviointiDispatch();
  const isPresenterField = roleField === "presenter";
  const active = isPresenterField
    ? isPresenter(hakemus, role)
    : isEvaluator(hakemus, role);
  const ariaLabel = getRoleButtonAriaLabel(isPresenterField, active, role.name);
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        dispatch(
          toggleHakemusRole({
            roleId: role.id,
            hakemusId: hakemus.id,
            roleField,
          })
        );
        dispatch(startHakemusArvioAutoSave({ hakemusId: hakemus.id }));
      }}
      className={classNames(styles.roleButton, { [styles.selected]: active })}
      aria-label={ariaLabel}
    >
      {role.name}
    </button>
  );
};

type RoleContainerProps = {
  roleName: string;
  roleField: "evaluators" | "presenter";
  roles: Role[];
  hakemus: Hakemus;
};

const RoleContainer = ({
  roleName,
  roleField,
  roles,
  hakemus,
}: RoleContainerProps) => {
  return (
    <React.Fragment>
      <div className={styles.roleTitle}>{roleName}</div>
      <div className={styles.roleContainer}>
        {roles.map((role) => (
          <RoleButton
            key={`${roleName}-${role.id}`}
            role={role}
            roleField={roleField}
            hakemus={hakemus}
          />
        ))}
      </div>
    </React.Fragment>
  );
};

type PersonSelectButtonProps = {
  hakemus: Hakemus;
  toggleSplitView: (forceValue?: boolean) => void;
};

export const PersonSelectPanel = ({
  hakemus,
}: Omit<PersonSelectButtonProps, "toggleSplitView">) => {
  const hakuDataRoles = useHakemustenArviointiSelector(
    (state) => getLoadedState(state.arviointi).hakuData.roles
  );
  const dispatch = useHakemustenArviointiDispatch();
  const roles = [...hakuDataRoles].sort((a, b) => (a.name > b.name ? -1 : 1));
  const presenters = roles.filter(isPresenterRole);
  return (
    <div className="panel person-panel person-panel--top">
      <button
        onClick={(e) => {
          e.stopPropagation();
          dispatch(togglePersonSelect(undefined));
        }}
        className={styles.close}
        aria-label="Sulje valmistelija ja arvioija valitsin"
      />
      <RoleContainer
        roleName="Valmistelija"
        roleField="presenter"
        roles={presenters}
        hakemus={hakemus}
      />
      <RoleContainer
        roleName="Arvioijat"
        roleField="evaluators"
        roles={roles}
        hakemus={hakemus}
      />
    </div>
  );
};
