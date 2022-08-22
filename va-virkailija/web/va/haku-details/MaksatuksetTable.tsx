import React, { ChangeEvent, useEffect, useState } from "react";

import { Maksatus } from "./Maksatukset";
import { useSelector } from "react-redux";
import {
  selectLoadedInitialData,
  selectSelectedAvustushaku,
} from "../hakujenHallinta/hakuReducer";
import { VaCodeValue } from "../types";
import { useHakujenHallintaSelector } from "../hakujenHallinta/hakujenHallintaStore";

type PaymentsTableProps = {
  payments?: Maksatus[];
  testId: string;
};

type SortKey =
  | "pitkaviite"
  | "project-code"
  | "paymentstatus"
  | "organization-name"
  | "project-name"
  | "payment-sum"
  | "lkp-account"
  | "takp-account"
  | "bank-iban"
  | "accounting";

type Filter = {
  [k in SortKey]?: string;
};

const paymentStatusTranslation = {
  created: "Luotu",
  waiting: "Odottaa",
  sent: "Lähetetty",
  paid: "Maksettu",
};

const filterBy =
  (filter: Filter, project?: VaCodeValue | null) => (p: Maksatus) => {
    if (
      filter["project-code"] &&
      project &&
      !project["code-value"].includes(filter["project-code"])
    ) {
      return false;
    }
    if (filter.pitkaviite && !p.pitkaviite.includes(filter.pitkaviite)) {
      return false;
    }
    if (
      filter.paymentstatus &&
      !paymentStatusTranslation[p["paymentstatus-id"]].includes(
        filter.paymentstatus
      )
    ) {
      return false;
    }
    if (
      filter["organization-name"] &&
      !p.hakemus?.["organization-name"].includes(filter["organization-name"])
    ) {
      return false;
    }
    if (
      filter["project-name"] &&
      !p.hakemus?.["project-name"].includes(filter["project-name"])
    ) {
      return false;
    }
    if (
      filter["payment-sum"] &&
      !p["payment-sum"].toString().includes(filter["payment-sum"])
    ) {
      return false;
    }
    if (
      filter["bank-iban"] &&
      !p.hakemus?.answers
        .find((a) => a.key === "bank-iban")
        ?.value.includes(filter["bank-iban"])
    ) {
      return false;
    }
    if (
      filter["lkp-account"] &&
      !p.hakemus?.["lkp-account"].includes(filter["lkp-account"])
    ) {
      return false;
    }
    if (
      filter["takp-account"] &&
      !p.hakemus?.["takp-account"].includes(filter["takp-account"])
    ) {
      return false;
    }
    if (
      filter["accounting"] &&
      !p["payment-sum"].toString().includes(filter.accounting)
    ) {
      return false;
    }
    return true;
  };

type MaksatuksetPhaseProps = {
  payments: Maksatus[];
  phase: string;
  filter: Filter;
  multipleProjectCodesEnabled: boolean;
};

const MaksatuksetPhase = ({
  payments,
  phase,
  filter,
  multipleProjectCodesEnabled,
}: MaksatuksetPhaseProps) => {
  const [visiblePayments, setVisiblePayments] = useState<Maksatus[]>(payments);
  const selectedHaku = useSelector(selectSelectedAvustushaku);
  const { projects } = selectedHaku;
  const projectId = selectedHaku["project-id"];
  const project = projects ? projects.find((p) => p.id === projectId) : null;

  useEffect(() => {
    const filtered = payments.filter(filterBy(filter, project));
    setVisiblePayments(filtered);
  }, [filter, payments]);

  return (
    <React.Fragment key={`phase-${phase}`}>
      <table className="maksatukset_payments-table">
        <thead className="phase-header">
          <tr>
            <td>
              <div>{Number.parseInt(phase) + 1}. erä</div>
            </td>
          </tr>
        </thead>
      </table>
      <div className="maksatukset_table-container">
        <table className="maksatukset_payments-table">
          <tbody className="maksatukset_table-body">
            {visiblePayments.map((p, i) => (
              <tr
                key={`maksatus-${p.id}`}
                className={i % 2 === 0 ? "white" : "gray"}
              >
                <td className="align-right semi-narrow-column">
                  {p.pitkaviite}
                </td>
                <td className="narrow-column">
                  {paymentStatusTranslation[p["paymentstatus-id"]]}
                </td>
                <td>{p.hakemus?.["organization-name"]}</td>
                <td>
                  <a
                    target="_blank"
                    href={`/avustushaku/${p.hakemus?.["grant-id"]}/hakemus/${p.hakemus?.id}/arviointi`}
                  >
                    {p.hakemus?.["project-name"]}
                  </a>
                </td>
                {multipleProjectCodesEnabled && (
                  <td className="align-left semi-narrow-column">
                    {project ? (
                      project["code-value"]
                    ) : (
                      <span className={"maksatukset_error-text"}>
                        Projektikoodi puuttuu
                      </span>
                    )}
                  </td>
                )}
                <td className="align-right narrow-column">
                  {p["payment-sum"]} €
                </td>
                <td className="semi-narrow-column">
                  {p.hakemus?.answers.find((a) => a.key === "bank-iban")?.value}
                </td>
                <td className="narrow-column">
                  {p.hakemus?.["lkp-account"] ?? "LKP-tili puuttuu"}
                </td>
                <td className="narrow-column">
                  {p.hakemus?.["takp-account"] ?? "TAKP-tili puuttuu"}
                </td>
                <td className="align-right narrow-column">
                  {p["payment-sum"]} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <table className="maksatukset_payments-table">
        <tfoot className="phase-header">
          <tr>
            <td className="semi-narrow-column">
              {visiblePayments.length}/{payments.length} maksatusta
            </td>
            <td className="narrow-column"></td>
            <td></td>
            <td className="align-right">Yhteensä</td>
            <td className="align-right narrow-column">
              {visiblePayments.reduce(
                (acc, cur) => acc + cur["payment-sum"],
                0
              )}{" "}
              €
            </td>
            <td className="semi-narrow-column"></td>
            <td className="narrow-column"></td>
            <td className="narrow-column"></td>
            <td className="align-right narrow-column">
              {visiblePayments.reduce(
                (acc, cur) => acc + cur["payment-sum"],
                0
              )}{" "}
              €
            </td>
          </tr>
        </tfoot>
      </table>
    </React.Fragment>
  );
};

export const MaksatuksetTable = ({ payments, testId }: PaymentsTableProps) => {
  const [filter, setFilter] = useState<Filter>({});
  const setFilterByKey =
    (key: SortKey) => (e: ChangeEvent<HTMLInputElement>) => {
      setFilter({ ...filter, [key]: e.target.value });
    };

  const groupedPayments = (payments ?? []).reduce((acc, cur) => {
    const phase = `${cur.phase}`;
    if (phase) {
      return { ...acc, [phase]: [...(acc[phase] ?? []), cur] };
    }
    return acc;
  }, {} as { [k in string]: Maksatus[] });
  const { environment } = useHakujenHallintaSelector(selectLoadedInitialData);
  const multipleProjectCodesEnabled =
    environment["multiple-project-codes"]?.["enabled?"] === true;

  return (
    <div data-test-id={testId}>
      <table className="maksatukset_payments-table">
        <thead className="maksatukset_table-header">
          <tr>
            <th className="semi-narrow-column">
              <div>Pitkäviite</div>
              <input onChange={setFilterByKey("pitkaviite")} />
            </th>
            <th className="narrow-column">
              <div>Tila</div>
              <input onChange={setFilterByKey("paymentstatus")} />
            </th>
            <th>
              <div>Toimittajan nimi</div>
              <input onChange={setFilterByKey("organization-name")} />
            </th>
            <th>
              <div>Hanke</div>
              <input onChange={setFilterByKey("project-name")} />
            </th>
            {multipleProjectCodesEnabled && (
              <th className={"semi-narrow-column"}>
                <div>Projektikoodi</div>
                <input onChange={setFilterByKey("project-code")} />
              </th>
            )}
            <th className="narrow-column">
              <div>Maksuun</div>
              <input onChange={setFilterByKey("payment-sum")} />
            </th>
            <th className="semi-narrow-column">
              <div>Pankkitilin IBAN</div>
              <input onChange={setFilterByKey("bank-iban")} />
            </th>
            <th className="narrow-column">
              <div>LKP-tili</div>
              <input onChange={setFilterByKey("lkp-account")} />
            </th>
            <th className="narrow-column">
              <div>TaKp-tili</div>
              <input onChange={setFilterByKey("takp-account")} />
            </th>
            <th className="narrow-column">
              <div>Tiliöinti</div>
              <input onChange={setFilterByKey("accounting")} />
            </th>
          </tr>
        </thead>
      </table>
      {Object.keys(groupedPayments).map((phase) => (
        <MaksatuksetPhase
          phase={phase}
          payments={groupedPayments[phase]}
          filter={filter}
          multipleProjectCodesEnabled={multipleProjectCodesEnabled}
        />
      ))}
      {!payments ||
        (payments.length === 0 && (
          <div className="maksatukset_no-payments">Ei maksatuksia</div>
        ))}
    </div>
  );
};
