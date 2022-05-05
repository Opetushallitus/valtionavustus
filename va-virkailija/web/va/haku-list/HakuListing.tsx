import React, { ChangeEvent, useState } from "react";
import moment from "moment";

import DateUtil from "soresu-form/web/DateUtil";
import { Avustushaku } from "soresu-form/web/va/types";
import {
  fiLongFormat,
  fiShortFormat,
} from "soresu-form/web/va/i18n/dateformat";

import HakuStatus from "../avustushaku/HakuStatus";
import HakuPhase from "../avustushaku/HakuPhase";
import HakuStatuses, {
  HakuStatus as HakuStatusType,
} from "../haku-details/HakuStatuses";
import HakuPhases, {
  HakuPhase as HakuPhaseType,
} from "../haku-details/HakuPhases";
import HakujenHallintaController from "../HakujenHallintaController";
import { Filter, FilterId } from "../types";

import "../style/table.less";
import "./haku-listing.less";

interface HakuListingProps {
  hakuList: Avustushaku[];
  selectedHaku: Avustushaku;
  controller: HakujenHallintaController;
  filter: Filter;
}

function _fieldGetter(fieldName: string) {
  switch (fieldName) {
    case "phase":
      return (haku: Avustushaku) => haku.phase;
    case "status":
      return (haku: Avustushaku) => haku.status;
    case "avustushaku":
      return (haku: Avustushaku) => haku.content.name.fi;
    case "startdate":
      return (haku: Avustushaku) => haku.content.duration.start;
    case "enddate":
      return (haku: Avustushaku) => haku.content.duration.end;
  }
  throw Error("No field getter for " + fieldName);
}

function isValidDateFilter(value: string) {
  return moment(value, [fiShortFormat], true).isValid() || value === "";
}

function _filterWithDatePredicate(
  fieldGetter: (a: Avustushaku) => string | Date,
  filterStart: string,
  filterEnd: string
) {
  if (
    (!filterStart && !filterEnd) ||
    !isValidDateFilter(filterStart) ||
    !isValidDateFilter(filterEnd)
  ) {
    return () => true;
  }

  return function (avustushaku: Avustushaku) {
    const value = fieldGetter(avustushaku);
    const filterStartDate = moment(filterStart || "1.1.1970", fiLongFormat);
    const filterEndDate = moment(filterEnd || "1.1.2444", fiLongFormat);
    return moment(value)
      .startOf("day")
      .isBetween(filterStartDate, filterEndDate, null, "[]");
  };
}

function _filterWithArrayPredicate<T>(
  fieldGetter: (a: Avustushaku) => T,
  filter: T[]
) {
  return function (avustushaku: Avustushaku) {
    return filter.includes(fieldGetter(avustushaku));
  };
}

function _filterWithStrPredicate(
  fieldGetter: (a: Avustushaku) => string,
  filter: string
) {
  if (!filter.length) {
    return function () {
      return true;
    };
  }
  return function (avustushaku: Avustushaku) {
    if (!fieldGetter(avustushaku).length) {
      return false;
    }
    return (
      fieldGetter(avustushaku).toUpperCase().indexOf(filter.toUpperCase()) >= 0
    );
  };
}

export const HakuListing = (props: HakuListingProps) => {
  const { hakuList, selectedHaku, controller, filter } = props;

  const onFilterChange = function (filterId: FilterId) {
    return (e: ChangeEvent<HTMLInputElement>) => {
      controller.setFilter(filterId, e.target.value);
    };
  };

  const filteredHakuList = hakuList
    .filter(_filterWithArrayPredicate(_fieldGetter("status"), filter.status))
    .filter(_filterWithArrayPredicate(_fieldGetter("phase"), filter.phase))
    .filter(
      _filterWithStrPredicate(
        _fieldGetter("avustushaku") as (a: Avustushaku) => string,
        filter.avustushaku
      )
    )
    .filter(
      _filterWithDatePredicate(
        _fieldGetter("startdate"),
        filter.startdatestart,
        filter.startdateend
      )
    )
    .filter(
      _filterWithDatePredicate(
        _fieldGetter("enddate"),
        filter.enddatestart,
        filter.enddateend
      )
    );

  const onRemoveFilters = () => {
    controller.clearFilters();
  };

  const hasFilters =
    filter.status.length !== HakuStatuses.allStatuses().length ||
    filter.phase.length !== HakuPhases.allStatuses().length ||
    filter.avustushaku.length ||
    filter.startdatestart.length ||
    filter.startdateend.length ||
    filter.enddatestart.length ||
    filter.enddateend.length;

  const hakuElements = filteredHakuList.map((haku) => (
    <HakuRow
      haku={haku}
      key={haku.id}
      selectedHaku={selectedHaku}
      controller={controller}
    />
  ));
  return (
    <div className="section-container listing-table haku-list">
      <table key="hakuListing">
        <thead>
          <tr>
            <th className="name-column">
              <input
                className="text-filter"
                style={{ width: 300 }}
                placeholder="Avustushaku"
                onChange={onFilterChange("avustushaku")}
                value={filter.avustushaku}
              ></input>
              {!!hasFilters && (
                <a className="haku-filter-remove" onClick={onRemoveFilters}>
                  Poista rajaimet
                </a>
              )}
            </th>
            <th className="status-column">
              <StatusFilter
                controller={controller}
                hakuList={hakuList}
                filter={filter}
                label="Tila"
                statusValues={HakuStatuses.allStatuses()}
                statusToFi={HakuStatuses.statusToFI}
                filterField="status"
              />
            </th>
            <th className="phase-column">
              <StatusFilter
                controller={controller}
                hakuList={hakuList}
                filter={filter}
                label="Vaihe"
                statusValues={HakuPhases.allStatuses()}
                statusToFi={HakuPhases.statusToFI}
                filterField="phase"
              />
            </th>
            <th className="start-column">
              <DateFilter
                controller={controller}
                filter={filter}
                label="Haku alkaa"
                filterField="startdate"
              />
            </th>
            <th className="end-column">
              <DateFilter
                controller={controller}
                filter={filter}
                label="Haku päättyy"
                filterField="enddate"
              />
            </th>
          </tr>
        </thead>
        <tbody>{hakuElements}</tbody>
      </table>
      <div className="list-total">
        {filteredHakuList.length}/{hakuList.length} {} hakua
      </div>
    </div>
  );
};

interface HakuRowProps {
  haku: Avustushaku;
  selectedHaku: Avustushaku;
  controller: HakujenHallintaController;
}

const HakuRow = (props: HakuRowProps) => {
  function toDateStr(dateTime: string | Date) {
    return (
      DateUtil.asDateString(dateTime) + " " + DateUtil.asTimeString(dateTime)
    );
  }

  const haku = props.haku;
  const htmlId = "haku-" + haku.id;
  const thisIsSelected = haku === props.selectedHaku;
  const rowClass = thisIsSelected
    ? "selected overview-row"
    : "unselected overview-row";
  const controller = props.controller;
  return (
    <tr id={htmlId} className={rowClass} onClick={controller.selectHaku(haku)}>
      <td className="name-column">{haku.content.name.fi}</td>
      <td className="status-column">
        <HakuStatus status={haku.status} />
      </td>
      <td className="phase-column">
        <HakuPhase phase={haku.phase} />
      </td>
      <td className="start-column">{toDateStr(haku.content.duration.start)}</td>
      <td className="end-column">{toDateStr(haku.content.duration.end)}</td>
    </tr>
  );
};

interface StatusFilterProps<T> {
  controller: HakujenHallintaController;
  hakuList: Avustushaku[];
  filter: Filter;
  label: string;
  statusValues: T[];
  statusToFi: (s: T) => string;
  filterField: FilterId;
}

const StatusFilter = <T extends HakuStatusType | HakuPhaseType>(
  props: StatusFilterProps<T>
) => {
  const {
    controller,
    hakuList,
    filter,
    label,
    statusValues,
    statusToFi,
    filterField,
  } = props;
  const [open, setOpen] = useState(false);

  function handleClick() {
    setOpen(!open);
  }

  const statusFilter = filter[filterField] as T[];
  const statuses = [];
  const onCheckboxChange = function (status: T) {
    return function () {
      if (statusFilter.includes(status)) {
        controller.setFilter(
          filterField,
          statusFilter.filter((s) => s !== status)
        );
      } else {
        controller.setFilter(filterField, [...statusFilter, status]);
      }
    };
  };

  const onDelete = function () {
    setOpen(false);
    controller.setFilter(filterField, statusValues as string[]);
  };
  const hasFilters = statusFilter.length !== statusValues.length;

  for (let i = 0; i < statusValues.length; i++) {
    const status = statusValues[i];
    const checked = statusFilter.includes(status);
    const htmlId = "filter-by-status-" + status;
    const kpl = hakuList.filter(
      _filterWithArrayPredicate(_fieldGetter(filterField), [status])
    ).length;
    statuses.push(
      <div key={status}>
        <input
          id={htmlId}
          type="checkbox"
          checked={checked}
          onChange={onCheckboxChange(status)}
          value={status}
        />
        <label htmlFor={htmlId}>
          {statusToFi(status)} ({kpl})
        </label>
      </div>
    );
  }

  return (
    <div className="status-filter">
      <a onClick={handleClick}>{label}</a>
      <button
        type="button"
        hidden={!hasFilters}
        onClick={onDelete}
        className="filter-remove"
        title="Poista tilojen rajaukset"
        tabIndex={-1}
      />
      <div className="status-filter-popup popup-box-shadow" hidden={!open}>
        {statuses}
      </div>
    </div>
  );
};

interface DateFilterProps {
  controller: HakujenHallintaController;
  filter: Filter;
  label: string;
  filterField: "startdate" | "enddate";
}

const DateFilter = (props: DateFilterProps) => {
  const { controller, filter, label, filterField } = props;
  const [open, setOpen] = useState(false);
  const startValue = filter[(filterField + "start") as FilterId] as string;
  const endValue = filter[(filterField + "end") as FilterId] as string;

  const handleClick = () => setOpen(!open);

  const updateStart = (value: string) => {
    controller.setFilter((filterField + "start") as FilterId, value);
  };

  const updateEnd = (value: string) => {
    controller.setFilter((filterField + "end") as FilterId, value);
  };

  const onDelete = () => {
    updateStart("");
    updateEnd("");
  };

  return (
    <div className="status-filter">
      <a onClick={handleClick}>{label}</a>
      <button
        type="button"
        hidden={!startValue && !endValue}
        onClick={onDelete}
        className="filter-remove"
        title="Poista tilojen rajaukset"
        tabIndex={-1}
      />
      <div className="status-filter-popup popup-box-shadow" hidden={!open}>
        <label>Alkaen</label>
        <input
          type="text"
          onChange={(e) => updateStart(e.target.value)}
          className={!isValidDateFilter(startValue) ? "error" : ""}
          placeholder="p.k.vvvv"
          value={startValue}
        />
        <label>Loppuu</label>
        <input
          type="text"
          onChange={(e) => updateEnd(e.target.value)}
          className={!isValidDateFilter(endValue) ? "error" : ""}
          placeholder="p.k.vvvv"
          value={endValue}
        />
      </div>
    </div>
  );
};
