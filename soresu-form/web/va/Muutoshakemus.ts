import moment, { Moment } from "moment";
import * as yup from "yup";

import {
  Meno,
  Muutoshakemus,
  PaatosStatus,
  Talousarvio,
  TalousarvioValues,
} from "./types/muutoshakemus";
import { isoFormat, fiLongFormat } from "soresu-form/web/va/i18n/dateformat";
import { Avustushaku } from "./types";

export const getTalousarvioSchema = (
  talousarvio: TalousarvioValues,
  e: any
) => {
  const menos = Object.keys(talousarvio).reduce((acc, key) => {
    if (key !== "originalSum" && key !== "currentSum") {
      return { ...acc, [key]: yup.number().min(0).required(e.required) };
    } else {
      return acc;
    }
  }, {});

  return {
    ...menos,
    originalSum: yup.number().required(e.required),
    currentSum: yup
      .number()
      .test(
        "current-sum",
        e.talousarvioSum(talousarvio.originalSum),
        (s) => s === talousarvio.originalSum
      )
      .required(e.required),
  };
};

export const getTalousarvioValues = (
  talousarvio: Meno[]
): TalousarvioValues => {
  const menos = talousarvio.reduce(
    (acc: object, meno: Meno) => ({ ...acc, [meno.type]: meno.amount }),
    {}
  );
  const sum = talousarvio.reduce(
    (acc: number, meno: Meno) => acc + meno.amount,
    0
  );
  return {
    ...menos,
    originalSum: sum,
    currentSum: sum,
  };
};

export function getProjectEndDate(
  avustushaku?: Avustushaku,
  muutoshakemukset?: Muutoshakemus[],
  beforeMuutoshakemus?: Muutoshakemus
): string | undefined {
  if (!avustushaku) {
    return undefined;
  }
  return toFinnishDateFormat(
    getProjectEndMoment(avustushaku, muutoshakemukset, beforeMuutoshakemus)
  );
}

export function getProjectEndMoment(
  avustushaku: Avustushaku,
  muutoshakemukset?: Muutoshakemus[],
  beforeMuutoshakemus?: Muutoshakemus
): Moment {
  const filteredMuutoshakemukset =
    beforeMuutoshakemus && muutoshakemukset
      ? muutoshakemukset.filter(
          (m) => m["created-at"] < beforeMuutoshakemus["created-at"]
        )
      : muutoshakemukset;
  const latestAcceptedMuutoshakemus = getLatestProjectEndDate(
    filteredMuutoshakemukset
  );
  return latestAcceptedMuutoshakemus
    ? latestAcceptedMuutoshakemus
    : dateStringToMoment(avustushaku["hankkeen-paattymispaiva"]);
}

export const isAcceptedWithChanges = (
  status: PaatosStatus | null | undefined
): boolean => status === "accepted_with_changes";

export const isAccepted = (status: PaatosStatus | null | undefined): boolean =>
  status === "accepted";

export const isAcceptedWithOrWithoutChanges = (
  status: PaatosStatus | null | undefined
): boolean => isAccepted(status) || isAcceptedWithChanges(status);

export const isRejected = (status: PaatosStatus | null | undefined): boolean =>
  status === "rejected";

function acceptedTalousarvioFilter(m: Muutoshakemus) {
  return (
    m["paatos-talousarvio"]?.length &&
    isAcceptedWithOrWithoutChanges(m["paatos-status-talousarvio"])
  );
}

export function getTalousarvio(
  muutoshakemukset: Muutoshakemus[],
  hakemusTalousarvio?: Talousarvio,
  beforeMuutoshakemus?: Muutoshakemus
): Talousarvio {
  const sortedMuutoshakemukset = sortByCreatedAtDescending(muutoshakemukset);
  const muutoshakemuksetBeforeCurrent = beforeMuutoshakemus
    ? sortedMuutoshakemukset.filter(
        (m) => m["created-at"] < beforeMuutoshakemus["created-at"]
      )
    : sortedMuutoshakemukset;
  const acceptedTalousarvioMuutoshakemuses =
    muutoshakemuksetBeforeCurrent.filter(acceptedTalousarvioFilter);
  const paatosTalousarvios = acceptedTalousarvioMuutoshakemuses.map(
    (m) => m["paatos-talousarvio"]
  );
  return [...paatosTalousarvios, hakemusTalousarvio][0] || [];
}

function sortByCreatedAtDescending(
  muutoshakemukset: Muutoshakemus[]
): Muutoshakemus[] {
  return [...muutoshakemukset].sort((m1, m2) =>
    m1["created-at"] > m2["created-at"] ? -1 : 1
  );
}

function getLatestProjectEndDate(
  muutoshakemukset: Muutoshakemus[] | undefined
): Moment | undefined {
  if (!muutoshakemukset) return undefined;
  const acceptedWithProjectEnd = muutoshakemukset.filter(
    (m) =>
      isAcceptedWithOrWithoutChanges(m["paatos-status-jatkoaika"]) &&
      m["haen-kayttoajan-pidennysta"]
  );
  if (acceptedWithProjectEnd.length) {
    const latestAcceptedMuutoshakemus = sortByCreatedAtDescending(
      acceptedWithProjectEnd
    )[0];
    return isAcceptedWithChanges(
      latestAcceptedMuutoshakemus["paatos-status-jatkoaika"]
    )
      ? dateStringToMoment(
          latestAcceptedMuutoshakemus["paatos-hyvaksytty-paattymispaiva"]
        )
      : dateStringToMoment(
          latestAcceptedMuutoshakemus["haettu-kayttoajan-paattymispaiva"]
        );
  } else {
    return undefined;
  }
}

export function dateStringToMoment(date: string | undefined): Moment {
  return moment(date, isoFormat);
}

export function toFinnishDateFormat(date: Moment): string | undefined {
  return date.isValid() ? date.format(fiLongFormat) : undefined;
}

export const dateStringToMaybeFinnishDate = (
  date: string | undefined
): string | undefined => {
  if (!date) {
    return undefined;
  }
  return toFinnishDateFormat(dateStringToMoment(date));
};
