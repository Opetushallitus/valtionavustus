import React from "react";
import classNames from "classnames";

import { Hakemus } from "soresu-form/web/va/types";

import { Role, State } from "../types";
import HakemustenArviointiController from "../HakemustenArviointiController";

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
  controller: HakemustenArviointiController;
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

const RoleButton = ({
  role,
  roleField,
  controller,
  hakemus,
}: RoleButtonProps) => {
  const onClick = () =>
    controller.toggleHakemusRole(role.id, hakemus, roleField);
  const isPresenterField = roleField === "presenter";
  const active = isPresenterField
    ? isPresenter(hakemus, role)
    : isEvaluator(hakemus, role);
  const ariaLabel = getRoleButtonAriaLabel(isPresenterField, active, role.name);
  return (
    <button
      onClick={onClick}
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
  controller: HakemustenArviointiController;
  hakemus: Hakemus;
};

const RoleContainer = ({
  roleName,
  roleField,
  roles,
  controller,
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
            controller={controller}
            hakemus={hakemus}
          />
        ))}
      </div>
    </React.Fragment>
  );
};

type PersonSelectButtonProps = {
  controller: HakemustenArviointiController;
  hakemus: Hakemus;
  state: State;
  toggleSplitView: (forceValue?: boolean) => void;
};

export const PersonSelectPanel = ({
  hakemus,
  state,
  controller,
}: Omit<PersonSelectButtonProps, "toggleSplitView">) => {
  const roles = [...state.hakuData.roles].sort((a, b) =>
    a.name > b.name ? -1 : 1
  );
  const presenters = roles.filter(isPresenterRole);
  const onCloseClick = () => controller.togglePersonSelect(undefined);
  return (
    <div className="panel person-panel person-panel--top">
      <button
        onClick={onCloseClick}
        className={styles.close}
        aria-label="Sulje valmistelija ja arvioija valitsin"
      />
      <RoleContainer
        roleName="Valmistelija"
        roleField="presenter"
        roles={presenters}
        controller={controller}
        hakemus={hakemus}
      />
      <RoleContainer
        roleName="Arvioijat"
        roleField="evaluators"
        roles={roles}
        controller={controller}
        hakemus={hakemus}
      />
    </div>
  );
};
