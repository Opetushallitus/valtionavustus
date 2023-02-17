import React from "react";
import _ from "lodash";
import ClassNames from "classnames";

import {
  scoreToFI,
  createAverageSummaryText,
  myScoringIsComplete,
  scoringByOid,
  othersScorings,
} from "../ScoreResolver";
import HelpTooltip from "../HelpTooltip";
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from "../hakemustenArviointi/arviointiStore";
import {
  getLoadedState,
  removeScore,
  setScore,
  toggleShowOthersScore,
} from "../hakemustenArviointi/arviointiReducer";
import { LocalizedText, Score, Scoring } from "soresu-form/web/va/types";
import { UserInfo } from "../types";
import { useParams } from "react-router-dom";
import { useHakemus } from "../hakemustenArviointi/useHakemus";

interface Props {
  allowHakemusScoring?: boolean;
}

const HakemusScoring = ({ allowHakemusScoring }: Props) => {
  const hakemus = useHakemus();
  const {
    userInfo: myUserInfo,
    hakuData,
    helpTexts,
  } = useHakemustenArviointiSelector((state) =>
    getLoadedState(state.arviointi)
  );
  const { avustushaku } = hakuData;
  const showOthersScoresState = useHakemustenArviointiSelector(
    (state) => state.arviointi.showOthersScores
  );

  const allScoresOfHakemus = hakemus.scores ?? [];
  const scoringOfHakemus = hakemus.arvio ? hakemus.arvio.scoring : undefined;
  const allowSeeingOthersScores =
    (scoringOfHakemus && myScoringIsComplete(scoringOfHakemus, myUserInfo)) ||
    !allowHakemusScoring;
  const showOthersScores = showOthersScoresState && allowSeeingOthersScores;

  const valintaperusteet = avustushaku.content["selection-criteria"].items;
  const myOwnValintaPerusteRows = createValintaPerusteRows(
    allScoresOfHakemus,
    valintaperusteet,
    myUserInfo["person-oid"],
    allowHakemusScoring
  );
  const othersScoreDisplays = showOthersScores
    ? createOthersScoreDisplays(
        allScoresOfHakemus,
        scoringOfHakemus,
        valintaperusteet,
        myUserInfo
      )
    : undefined;
  return valintaperusteet && valintaperusteet.length > 0 ? (
    <div
      key="hakemus-scoring-container"
      id="hakemus-scoring-container"
      className="hakemus-arviointi-section"
    >
      <label>Valintaperusteet:</label>
      <HelpTooltip
        testId={"tooltip-valintaperusteet"}
        content={helpTexts["hankkeen_sivu__arviointi___valintaperusteet"]}
        direction={"arviointi"}
      />
      <table className="valintaperuste-list">
        <tbody>{myOwnValintaPerusteRows}</tbody>
      </table>
      <SeeOthersScores
        showOthersScores={showOthersScores}
        scoring={scoringOfHakemus}
        userInfo={myUserInfo}
        allowSeeingOthersScores={allowSeeingOthersScores}
      />
      {othersScoreDisplays}
    </div>
  ) : null;
};

const createValintaPerusteRows = (
  allScoresOfHakemus: Score[],
  valintaperusteet: LocalizedText[],
  personOid: string,
  allowHakemusScoring?: boolean
) => {
  let perusteIndex = 0;
  return valintaperusteet.map((peruste) => {
    return (
      <ValintaPerusteRow
        valintaperuste={peruste}
        allScoresOfThisPeruste={findScores(perusteIndex)}
        selectionCriteriaIndex={perusteIndex}
        personOid={personOid}
        key={personOid + perusteIndex++}
        allowHakemusScoring={allowHakemusScoring}
      />
    );
  });

  function findScores(perusteIndex: number) {
    return allScoresOfHakemus.filter(
      (s) => s["selection-criteria-index"] === perusteIndex
    );
  }
};

const createOthersScoreDisplays = (
  allScoresOfHakemus: Score[],
  scoringOfHakemus: Scoring | undefined,
  valintaperusteet: LocalizedText[],
  myUserInfo: UserInfo
) => {
  const othersPersonOids = othersScorings(scoringOfHakemus, myUserInfo).map(
    (s) => s["person-oid"]
  );
  return othersPersonOids.map((oid) => {
    const userScoring = scoringByOid(scoringOfHakemus, oid);
    const userLabel =
      userScoring?.["first-name"] + " " + userScoring?.["last-name"];
    return (
      <table key={"peruste-list-of" + oid} className="valintaperuste-list">
        <thead>
          <tr>
            <th className="valintaperuste-scoring-user">{userLabel}</th>
          </tr>
        </thead>
        <tbody>
          {createValintaPerusteRows(
            allScoresOfHakemus,
            valintaperusteet,
            oid,
            false
          )}
        </tbody>
      </table>
    );
  });
};

export default HakemusScoring;

interface ValintaPerusteProps {
  valintaperuste: LocalizedText;
  allScoresOfThisPeruste: Score[];
  selectionCriteriaIndex: number;
  personOid: string;
  allowHakemusScoring?: boolean;
}

const ValintaPerusteRow = ({
  valintaperuste,
  allowHakemusScoring,
  allScoresOfThisPeruste,
  selectionCriteriaIndex,
  personOid,
}: ValintaPerusteProps) => {
  const scoreOfUser = allScoresOfThisPeruste.find(
    (s) => s["person-oid"] === personOid
  );
  const scoreOfUserFi = scoreToFI(scoreOfUser ? scoreOfUser.score : null);
  const starElements = _.map(_.range(4), (i) => (
    <StarElement
      key={i}
      indexOfStar={i}
      scoreOfUser={scoreOfUser}
      selectionCriteriaIndex={selectionCriteriaIndex}
      allowHakemusScoring={allowHakemusScoring}
    />
  ));

  const textInFinnish = valintaperuste.fi;
  const textInSwedish = valintaperuste.sv;

  return (
    <tr className="single-valintaperuste">
      <td
        className="valintaperuste-text"
        title={textInFinnish + " / " + textInSwedish}
      >
        {textInFinnish}
      </td>
      <td className="score-row">
        {starElements}
        <div className="score-text">{scoreOfUserFi}</div>
      </td>
    </tr>
  );
};

interface StarElementProps {
  indexOfStar: number;
  scoreOfUser: Score | undefined;
  selectionCriteriaIndex: number;
  allowHakemusScoring: boolean | undefined;
}

const StarElement = ({
  allowHakemusScoring,
  scoreOfUser,
  indexOfStar,
  selectionCriteriaIndex,
}: StarElementProps) => {
  const { hakemusId: hakemusIdFromParams } = useParams();
  const hakemusId = Number(hakemusIdFromParams);
  const dispatch = useHakemustenArviointiDispatch();
  const createOnClickHandler = (index: number, score: number) => {
    return () => {
      if (scoreOfUser && score === scoreOfUser.score) {
        dispatch(removeScore({ hakemusId, index }));
      } else {
        dispatch(
          setScore({
            hakemusId,
            selectionCriteriaIndex: index,
            newScore: score,
          })
        );
      }
    };
  };

  const starTitle = scoreToFI(indexOfStar);
  const starVisible = scoreOfUser && scoreOfUser.score >= indexOfStar;
  const starImage = starVisible
    ? "/virkailija/img/star_on.png"
    : "/virkailija/img/star_off.png";

  const enableEditing = !!allowHakemusScoring;
  const classNames = ClassNames("single-score", { editable: enableEditing });
  const onClick = enableEditing
    ? createOnClickHandler(selectionCriteriaIndex, indexOfStar)
    : undefined;
  const showHover =
    enableEditing && !starVisible
      ? (event: any) => {
          event.target.setAttribute("src", "/virkailija/img/star_hover.png");
        }
      : undefined;
  const hideHover =
    enableEditing && !starVisible
      ? (event: any) => {
          event.target.setAttribute("src", starImage);
        }
      : undefined;
  return (
    <img
      className={classNames}
      src={starImage}
      title={starTitle}
      onClick={onClick}
      onMouseOver={showHover}
      onMouseOut={hideHover}
    />
  );
};

interface SeeOthersScoresProps {
  showOthersScores?: boolean;
  scoring?: Scoring;
  userInfo: UserInfo;
  allowSeeingOthersScores: boolean;
}

const SeeOthersScores = ({
  scoring,
  showOthersScores,
  allowSeeingOthersScores,
  userInfo,
}: SeeOthersScoresProps) => {
  const dispatch = useHakemustenArviointiDispatch();
  const othersScoringsCount =
    allowSeeingOthersScores && scoring
      ? othersScorings(scoring, userInfo).length
      : 0;
  const classNames = ClassNames("see-others-scoring", {
    disabled: !allowSeeingOthersScores || othersScoringsCount === 0,
  });

  const labelText = resolveLabelText();
  const titleText = allowSeeingOthersScores
    ? createAverageSummaryText(scoring, userInfo)
    : undefined;

  return (
    <div className={classNames}>
      <a
        title={titleText}
        onClick={(e) => {
          e.preventDefault();
          if (othersScoringsCount > 0) {
            dispatch(toggleShowOthersScore());
          }
        }}
      >
        {labelText}
      </a>
    </div>
  );

  function resolveLabelText() {
    if (!allowSeeingOthersScores) {
      return "";
    }
    if (othersScoringsCount === 0) {
      return "Ei arvioita muilta";
    }
    return showOthersScores
      ? "Piilota muiden arviot"
      : "Katso muiden arviot (" + othersScoringsCount + ")";
  }
};
