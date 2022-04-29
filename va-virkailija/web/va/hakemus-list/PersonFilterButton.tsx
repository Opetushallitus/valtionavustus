import React, { useState } from "react";
import classNames from "classnames";

import { HakemusFilter, Role, State } from "../types";
import HakemustenArviointiController from "../HakemustenArviointiController";

import styles from "./Person.module.less";

export type RoleField = "evaluator" | "presenter";

const getRoleButtonAriaLabel = (roleField: RoleField, name: string) => {
  return roleField === "presenter"
    ? `Rajaa valmistelijalla ${name}`
    : `Rajaa arvioijalla ${name}`;
};

type RoleButtonProps = {
  roleField: RoleField;
  role: Role;
  controller: HakemustenArviointiController;
  hakemusFilter: HakemusFilter;
};

const RoleButton = ({
  role,
  roleField,
  controller,
  hakemusFilter,
}: RoleButtonProps) => {
  const currentFilter = hakemusFilter[roleField];
  const onClick = () => {
    const newFilter = currentFilter === role.id ? undefined : role.id;
    controller.setFilter(roleField, newFilter);
    controller.closeHakemusDetail();
  };
  const { id, name } = role;
  const active = id === currentFilter;
  return (
    <button
      onClick={onClick}
      aria-label={getRoleButtonAriaLabel(roleField, name)}
      className={classNames(styles.roleButton, { [styles.selected]: active })}
    >
      {name}
    </button>
  );
};

type RoleContainerProps = {
  roleName: string;
  roleField: "evaluator" | "presenter";
  roles: Role[];
  controller: HakemustenArviointiController;
  hakemusFilter: HakemusFilter;
};

const RoleContainer = ({
  roleName,
  roleField,
  roles,
  controller,
  hakemusFilter,
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
            hakemusFilter={hakemusFilter}
          />
        ))}
      </div>
    </React.Fragment>
  );
};

const PersonSelectPanel = ({
  state,
  controller,
  setIsOpen,
}: PersonFilterButtonProps & { setIsOpen: (isOpen: boolean) => void }) => {
  const hakemusFilter = state.hakemusFilter;
  const roles = [...state.hakuData.roles].sort((a, b) =>
    a.name > b.name ? -1 : 1
  );
  const presenters = roles.filter((r) =>
    ["presenting_officer", "vastuuvalmistelija"].includes(r.role)
  );

  return (
    <div className="panel person-panel">
      <button
        onClick={() => setIsOpen(false)}
        className={styles.close}
        aria-label="Sulje valmistelija ja arvioija rajain"
      />
      <RoleContainer
        roleName="Valmistelija"
        roleField="presenter"
        roles={presenters}
        controller={controller}
        hakemusFilter={hakemusFilter}
      />
      <RoleContainer
        roleName="Arvioija"
        roleField="evaluator"
        roles={roles}
        controller={controller}
        hakemusFilter={hakemusFilter}
      />
    </div>
  );
};

interface ControlledSelectPanelProps {
  onClickClose: () => void;
  roles: Role[];
  roleField: RoleField;
  onClickRole: (id: number) => void;
  activeId?: number;
}

export function ControlledSelectPanel({
  roleField,
  roles,
  onClickClose,
  onClickRole,
  activeId,
}: ControlledSelectPanelProps) {
  const roleName = {
    presenter: "Valmistelija",
    evaluator: "Arvioija",
  };
  const roleFieldRoles =
    roleField === "presenter"
      ? roles.filter((r) =>
          ["presenting_officer", "vastuuvalmistelija"].includes(r.role)
        )
      : roles;
  return (
    <React.Fragment>
      <button
        onClick={onClickClose}
        className={styles.close}
        aria-label="Sulje valmistelija ja arvioija rajain"
      />
      <div className={styles.roleTitle}>{[roleName[roleField]]}</div>
      <div className={styles.roleContainer}>
        {roleFieldRoles.map(({ id, name }) => {
          const active = id === activeId;
          return (
            <button
              key={`${roleField}-${id}`}
              onClick={() => onClickRole(id)}
              aria-label={getRoleButtonAriaLabel(roleField, name)}
              className={classNames(styles.roleButton, {
                [styles.selected]: active,
              })}
            >
              {name}
            </button>
          );
        })}
      </div>
    </React.Fragment>
  );
}

type PersonFilterButtonProps = {
  controller: HakemustenArviointiController;
  state: State;
};

export const PersonFilterButton = ({
  state,
  controller,
}: PersonFilterButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hakemusFilter = state.hakemusFilter;
  const activeFilterCount =
    (hakemusFilter.evaluator ? 1 : 0) + (hakemusFilter.presenter ? 1 : 0);
  const onClick = () => {
    controller.togglePersonSelect(undefined);
    setIsOpen(!isOpen);
  };

  return (
    <div className="person-filter-button">
      <button
        onClick={onClick}
        className={`btn btn-sm btn-simple btn-role ${
          activeFilterCount ? "btn-selected--border" : "btn-role--center"
        }`}
      >
        <span hidden={!activeFilterCount} className="btn-role__count">
          {activeFilterCount}
        </span>
      </button>
      {isOpen && (
        <PersonSelectPanel
          state={state}
          controller={controller}
          setIsOpen={setIsOpen}
        />
      )}
    </div>
  );
};
