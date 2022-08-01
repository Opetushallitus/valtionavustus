import React from "react";
import * as Bacon from "baconjs";

import DateUtil from "soresu-form/web/DateUtil";
import {
  Avustushaku,
  ChangeLogEntry,
  Hakemus,
  HelpTexts,
} from "soresu-form/web/va/types";
import { VaCodeValue } from "../types";

import HakemusBudgetEditing from "../budgetedit/HakemusBudgetEditing";
import HakemusScoring from "./HakemusScoring";
import HakemusComments from "./HakemusComments";
import HakemusArviointiStatuses from "./HakemusArviointiStatuses";
import TraineeDayEditing from "../traineeday/TraineeDayEditing";
import ChooseRahoitusalueAndTalousarviotili from "./ChooseRahoitusalueAndTalousarviotili";
import SpecifyOppilaitos from "./SpecifyOppilaitos";
import AcademySize from "./AcademySize";
import Perustelut from "./Perustelut";
import PresenterComment from "./PresenterComment";
import EditStatus from "./EditStatus";
import ReSendDecisionEmail from "./ReSendDecisionEmail";
import ApplicationPayments from "./ApplicationPayments";
import HelpTooltip from "../HelpTooltip";
import HakemustenArviointiController from "../HakemustenArviointiController";
import { HakuData, SelectedHakemusAccessControl, UserInfo } from "../types";
import { ChangeRequest } from "./ChangeRequest";
import ProjectSelector from "../haku-details/ProjectSelector";

import "../style/admin.less";

type HakemusArviointiProps = {
  controller: HakemustenArviointiController;
  hakemus: Hakemus;
  avustushaku: Avustushaku;
  hakuData: HakuData;
  userInfo: UserInfo;
  helpTexts: HelpTexts;
  showOthersScores: boolean;
  multibatchEnabled: boolean;
  selectedHakemusAccessControl: SelectedHakemusAccessControl;
  multipleProjectCodesEnabled: boolean;
  projects: VaCodeValue[];
};

export const HakemusArviointi = ({
  controller,
  hakemus,
  avustushaku,
  hakuData,
  userInfo,
  showOthersScores,
  multibatchEnabled,
  helpTexts,
  selectedHakemusAccessControl,
  multipleProjectCodesEnabled,
  projects,
}: HakemusArviointiProps) => {
  const {
    allowHakemusCommenting,
    allowHakemusStateChanges,
    allowHakemusScoring,
    allowHakemusOfficerEditing,
    allowHakemusCancellation,
  } = selectedHakemusAccessControl;

  const selectProject = (option: VaCodeValue | null) => {
    if (option === null) {
      return;
    }

    controller.selectProject(hakemus, option);
  };

  return (
    <div id="arviointi-tab">
      <PresenterComment
        controller={controller}
        hakemus={hakemus}
        helpText={helpTexts["hankkeen_sivu__arviointi___valmistelijan_huomiot"]}
      />
      {multipleProjectCodesEnabled && (
        <div
          className="koodien-valinta-elementti"
          data-test-id="code-value-dropdown__project"
        >
          <h3 className="koodien-valinta-otsikko required">Projektikoodi</h3>
          <ProjectSelector
            updateValue={selectProject}
            codeOptions={projects}
            selectedValue={hakemus.project || ""}
            multipleProjectCodesEnabled={multipleProjectCodesEnabled}
            disabled={!allowHakemusStateChanges}
          />
        </div>
      )}
      <ChooseRahoitusalueAndTalousarviotili
        controller={controller}
        hakemus={hakemus}
        avustushaku={avustushaku}
        allowEditing={allowHakemusStateChanges}
        helpTexts={helpTexts}
      />
      <SpecifyOppilaitos
        controller={controller}
        hakemus={hakemus}
        avustushaku={avustushaku}
        allowEditing={allowHakemusStateChanges}
      />
      <AcademySize
        controller={controller}
        hakemus={hakemus}
        avustushaku={avustushaku}
        allowEditing={allowHakemusStateChanges}
      />
      <HakemusScoring
        controller={controller}
        hakemus={hakemus}
        avustushaku={avustushaku}
        helpTexts={helpTexts}
        allowHakemusScoring={allowHakemusScoring}
        userInfo={userInfo}
        showOthersScores={showOthersScores}
      />
      <HakemusComments
        controller={controller}
        comments={hakemus.comments}
        allowHakemusCommenting={allowHakemusCommenting}
        helpTexts={helpTexts}
      />
      <SetArviointiStatus
        controller={controller}
        hakemus={hakemus}
        allowEditing={allowHakemusStateChanges}
        helpTexts={helpTexts}
      />
      <Perustelut
        controller={controller}
        hakemus={hakemus}
        allowEditing={allowHakemusStateChanges}
        helpTexts={helpTexts}
      />
      <ChangeRequest
        controller={controller}
        hakemus={hakemus}
        avustushaku={avustushaku}
        allowEditing={allowHakemusStateChanges}
        helpTexts={helpTexts}
        userInfo={userInfo}
      />
      <SummaryComment
        controller={controller}
        hakemus={hakemus}
        allowEditing={allowHakemusStateChanges}
        helpTexts={helpTexts}
      />
      <HakemusBudgetEditing
        avustushaku={avustushaku}
        hakuData={hakuData}
        controller={controller}
        hakemus={hakemus}
        allowEditing={allowHakemusStateChanges}
        helpTexts={helpTexts}
      />
      {multibatchEnabled && avustushaku.content["multiplemaksuera"] && (
        <ApplicationPayments
          application={hakemus}
          grant={avustushaku}
          index={0}
          payments={hakemus.payments}
          onAddPayment={controller.addPayment}
          onRemovePayment={controller.removePayment}
          readonly={true}
        />
      )}
      <TraineeDayEditing
        avustushaku={avustushaku}
        hakuData={hakuData}
        controller={controller}
        hakemus={hakemus}
        allowEditing={allowHakemusStateChanges}
      />
      <EditStatus
        avustushaku={avustushaku}
        hakemus={hakemus}
        allowEditing={allowHakemusOfficerEditing}
        status="officer_edit"
        helpTexts={helpTexts}
      />
      {hakemus.status === "draft" && userInfo.privileges.includes("va-admin") && (
        <div className="value-edit">
          <button
            onClick={() =>
              controller.setHakemusStatus(
                hakemus,
                "submitted",
                "Submitted by admin"
              )
            }
            data-test-id="submit-hakemus"
          >
            Merkitse hakemus lähetetyksi
          </button>
        </div>
      )}
      <EditStatus
        avustushaku={avustushaku}
        hakemus={hakemus}
        allowEditing={allowHakemusCancellation}
        status="cancelled"
        helpTexts={helpTexts}
      />
      <ReSendDecisionEmail
        avustushaku={avustushaku}
        hakemus={hakemus}
        hakuData={hakuData}
        helpTexts={helpTexts}
      />
      <ChangeLog hakemus={hakemus} />
    </div>
  );
};

class ChangeLog extends React.Component<{ hakemus: Hakemus }> {
  render() {
    const hakemus = this.props.hakemus;
    const changelogs = hakemus.arvio.changelog;
    if (!changelogs) {
      return null;
    }
    return (
      <div className="changelog">
        <h2 className="changelog__heading">Muutoshistoria</h2>
        {changelogs.length ? (
          <table className="changelog__table">
            {changelogs.map((changelog, index) => (
              <ChangeLogRow
                key={index}
                changelog={changelog}
                hakemus={hakemus}
              />
            ))}
          </table>
        ) : (
          <div>Ei muutoksia</div>
        )}
      </div>
    );
  }
}

type ChangeLogRowProps = {
  hakemus: Hakemus;
  changelog: ChangeLogEntry;
};

type ChangeLogRowState = {
  currentHakemusId: number;
  open: boolean;
};

class ChangeLogRow extends React.Component<
  ChangeLogRowProps,
  ChangeLogRowState
> {
  constructor(props: ChangeLogRowProps) {
    super(props);
    this.state = ChangeLogRow.initialState(props);
  }

  static getDerivedStateFromProps(
    props: ChangeLogRowProps,
    state: ChangeLogRowState
  ) {
    if (props.hakemus.id !== state.currentHakemusId) {
      return ChangeLogRow.initialState(props);
    } else {
      return null;
    }
  }

  static initialState(props: ChangeLogRowProps) {
    return {
      currentHakemusId: props.hakemus.id,
      open: false,
    };
  }

  render() {
    const changelog = this.props.changelog;
    const types = {
      "budget-change": "Budjetti päivitetty",
      "oppilaitokset-change": "Oppilaitokset päivitetty",
      "summary-comment": "Perustelut hakijalle",
      "overridden-answers-change": "Sisältöä päivitetty",
      "presenter-comment": "Valmistelijan huomiot päivitetty",
      "status-change": "Tila päivitetty",
      "should-pay-change": "Maksuun kyllä/ei päivitetty",
    };
    const typeTranslated = types[changelog.type] || changelog.type;
    const dateStr =
      DateUtil.asDateString(changelog.timestamp) +
      " " +
      DateUtil.asTimeString(changelog.timestamp);

    const toggleOpen = () => {
      this.setState({ open: !this.state.open });
    };

    return (
      <tbody>
        <tr className="changelog__row">
          <td className="changelog__date">{dateStr}</td>
          <td className="changelog__name">
            {changelog["first-name"]} {changelog["last-name"]}
          </td>
          <td className="changelog__type">
            <a onClick={toggleOpen}>{typeTranslated}</a>
          </td>
        </tr>
        <tr>
          {this.state.open && (
            <td colSpan={3}>
              <pre className="changelog__data">
                {JSON.stringify(changelog.data)}
              </pre>
            </td>
          )}
        </tr>
      </tbody>
    );
  }
}

type SetArviointiStatusProps = {
  controller: HakemustenArviointiController;
  hakemus: Hakemus;
  helpTexts: HelpTexts;
  allowEditing?: boolean;
};

class SetArviointiStatus extends React.Component<SetArviointiStatusProps> {
  render() {
    const hakemus = this.props.hakemus;
    const allowEditing = this.props.allowEditing;
    const arvio = hakemus.arvio;
    const status = arvio ? arvio.status : undefined;
    const controller = this.props.controller;
    const helpTexts = this.props.helpTexts;
    const statuses = [];
    const statusValues = HakemusArviointiStatuses.statuses;
    for (let i = 0; i < statusValues.length; i++) {
      const htmlId = "set-arvio-status-" + statusValues[i];
      const statusFI = HakemusArviointiStatuses.statusToFI(statusValues[i]);
      const onChange = allowEditing
        ? controller.setHakemusArvioStatus(hakemus, statusValues[i])
        : undefined;
      statuses.push(
        <input
          id={htmlId}
          type="radio"
          key={htmlId}
          name="status"
          value={statusValues[i]}
          disabled={!allowEditing}
          onChange={onChange}
          checked={statusValues[i] === status}
        />
      );
      statuses.push(
        <label key={htmlId + "-label"} htmlFor={htmlId}>
          {statusFI}
        </label>
      );
    }

    return (
      <div className="hakemus-arviointi-section">
        <label>Hakemuksen tila:</label>
        <HelpTooltip
          testId={"tooltip-tila"}
          content={helpTexts["hankkeen_sivu__arviointi___hakemuksen_tila"]}
          direction={"arviointi"}
        />
        <fieldset className="soresu-radiobutton-group">{statuses}</fieldset>
      </div>
    );
  }
}

type SummaryCommentProps = {
  controller: HakemustenArviointiController;
  hakemus: Hakemus;
  helpTexts: HelpTexts;
  allowEditing?: boolean;
};

type SummaryCommentState = {
  currentHakemusId: number;
  summaryComment: string;
};

class SummaryComment extends React.Component<
  SummaryCommentProps,
  SummaryCommentState
> {
  summaryCommentBus: Bacon.Bus<[a: Hakemus, b: string]>;

  constructor(props: SummaryCommentProps) {
    super(props);
    this.state = SummaryComment.initialState(props);
    this.summaryCommentBus = new Bacon.Bus();
    this.summaryCommentBus
      .debounce(1000)
      .onValue(([hakemus, newSummaryComment]) =>
        this.props.controller.setHakemusSummaryComment(
          hakemus,
          newSummaryComment
        )
      );
  }

  static getDerivedStateFromProps(
    props: SummaryCommentProps,
    state: SummaryCommentState
  ) {
    if (props.hakemus.id !== state.currentHakemusId) {
      return SummaryComment.initialState(props);
    } else {
      return null;
    }
  }

  static initialState(props: SummaryCommentProps) {
    return {
      currentHakemusId: props.hakemus.id,
      summaryComment: SummaryComment.getSummaryComment(props.hakemus),
    };
  }

  static getSummaryComment(hakemus: Hakemus) {
    const arvio = hakemus.arvio ? hakemus.arvio : { "summary-comment": "" };
    return arvio["summary-comment"] ?? "";
  }

  summaryCommentUpdated(newSummaryComment: string) {
    this.setState({ summaryComment: newSummaryComment });
    this.summaryCommentBus.push([this.props.hakemus, newSummaryComment]);
  }

  render() {
    const allowEditing = this.props.allowEditing;
    const helpTexts = this.props.helpTexts;

    return (
      <div className="value-edit summary-comment">
        <label htmlFor="summary-comment">Huomautus päätöslistaan</label>
        <HelpTooltip
          testId={"tooltip-huomautus"}
          content={
            helpTexts["hankkeen_sivu__arviointi___huomautus_päätöslistaan"]
          }
          direction="arviointi-slim"
        />
        <textarea
          id="summary-comment"
          rows={1}
          disabled={!allowEditing}
          value={this.state.summaryComment}
          onChange={(evt) => this.summaryCommentUpdated(evt.target.value)}
          maxLength={128}
        />
      </div>
    );
  }
}
