import React, { useState } from "react";

import DateUtil from "soresu-form/web/DateUtil";
import { Comment, HelpTexts } from "soresu-form/web/va/types";
import NameFormatter from "soresu-form/web/va/util/NameFormatter";

import HelpTooltip from "../HelpTooltip";
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from "../hakemustenArviointi/arviointiStore";
import {
  addHakemusComment,
  getSelectedHakemus,
} from "../hakemustenArviointi/arviointiReducer";

type HakemusCommentsProps = {
  helpTexts: HelpTexts;
  comments?: Comment[];
  allowHakemusCommenting?: boolean;
};

const HakemusComments = ({
  helpTexts,
  allowHakemusCommenting,
  comments,
}: HakemusCommentsProps) => {
  const dispatch = useHakemustenArviointiDispatch();
  const hakemus = useHakemustenArviointiSelector(getSelectedHakemus);
  const [comment, setComment] = useState("");
  const [added, setAdded] = useState(false);
  const addComment = async () => {
    dispatch(addHakemusComment({ hakemusId: hakemus.id, comment }));
    setComment("");
    setAdded(true);
  };

  const hasComments = comments && comments.length;
  return (
    <div id="hakemus-comment-container" className="hakemus-arviointi-section">
      <label>Kommentit</label>
      <HelpTooltip
        testId={"tooltip-kommentit"}
        content={helpTexts["hankkeen_sivu__arviointi___kommentit"]}
        direction={"arviointi"}
      />
      {hasComments ? (
        <div className="comment-list">
          {comments.map((c) => (
            <Comment comment={c} key={c.id} />
          ))}
        </div>
      ) : (
        <div>Ei kommentteja</div>
      )}
      <textarea
        rows={3}
        className="comment-input"
        id="comment-input"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        hidden={!allowHakemusCommenting}
        disabled={!allowHakemusCommenting}
      />
      <button
        type="button"
        disabled={comment.length === 0}
        onClick={addComment}
        data-test-id="send-comment"
      >
        Lisää
      </button>
      <span hidden={!added}>Kommentti lisätty</span>
    </div>
  );
};

const Comment = ({ comment }: { comment: Comment }) => {
  const firstName = NameFormatter.onlyFirstForename(comment.first_name);
  const lastName = comment.last_name;
  const nameShort = NameFormatter.shorten(firstName, lastName);
  const paragraphs = comment.comment.split("\n");

  const dateTime = new Date(comment.created_at);
  const dateTimeString =
    DateUtil.asDateString(dateTime) + " " + DateUtil.asTimeString(dateTime);
  const toolTipString =
    firstName + " " + lastName + " " + dateTimeString + ": " + comment.comment;
  return (
    <div className="single-comment" title={toolTipString}>
      <div>
        {nameShort}:{" "}
        {paragraphs.map((text, index) => (
          <p key={index}>{text}</p>
        ))}
      </div>
      <div className="comment-datetime">{dateTimeString}</div>
    </div>
  );
};

export default HakemusComments;
