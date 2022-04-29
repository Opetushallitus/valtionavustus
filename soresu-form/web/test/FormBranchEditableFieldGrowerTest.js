import { expect } from "chai";
import Immutable from "seamless-immutable";
import FormUtil from "../form/FormUtil";
import { ensureFirstChildIsRequired } from "../form/FormBranchEditableFieldGrower";

describe("FormBranchEditableFieldGrower", () => {
  it("modifies form fields and answers for growing fieldset fields so that both have fieldset child in fieldset prototype position", () => {
    const answersObject = makeAnswersObject([
      makeGrowingFieldsetAnswer("growingFieldsetChild", [
        {
          key: 2,
          value: [
            { key: "name", value: "Name2", fieldType: "textField" },
            {
              key: "email",
              value: "u2@example.com",
              fieldType: "vaEmailNotification",
            },
          ],
        },
        {
          key: 3,
          value: [
            { key: "name", value: "Name3", fieldType: "textField" },
            {
              key: "email",
              value: "u3@example.com",
              fieldType: "vaEmailNotification",
            },
          ],
        },
      ]),
    ]);

    const state = {
      configuration: {
        form: {
          content: [
            makeWrapperFieldSpec([
              makeGrowingFieldsetSpec(
                "growingFieldsetChild",
                [1],
                [
                  { key: "name", fieldType: "textField" },
                  { key: "email", fieldType: "vaEmailNotification" },
                ]
              ),
            ]),
          ],
        },
      },
      form: {
        content: [
          makeWrapperFieldSpec([
            makeGrowingFieldsetSpec(
              "growingFieldsetChild",
              [2, 3],
              [
                { key: "name", fieldType: "textField" },
                { key: "email", fieldType: "vaEmailNotification" },
              ]
            ),
          ]),
        ],
        validationErrors: Immutable({}),
      },
      saveStatus: {
        values: answersObject,
      },
      extensionApi: {},
    };

    ensureFirstChildIsRequired(
      state,
      FormUtil.findField(state.form.content, "my-fieldset")
    );

    expect(getFieldsetIdTree(state.form.content)).to.eql([
      ["my-fieldset-1", ["my-fieldset-1.name", "my-fieldset-1.email"]],
      ["my-fieldset-3", ["my-fieldset-3.name", "my-fieldset-3.email"]],
    ]);

    expect(answersObject).to.eql({
      value: [
        {
          fieldType: "growingFieldset",
          key: "my-fieldset",
          value: [
            {
              fieldType: "growingFieldsetChild",
              key: "my-fieldset-3",
              value: [
                {
                  fieldType: "textField",
                  key: "my-fieldset-3.name",
                  value: "Name3",
                },
                {
                  fieldType: "vaEmailNotification",
                  key: "my-fieldset-3.email",
                  value: "u3@example.com",
                },
              ],
            },
            {
              fieldType: "growingFieldsetChild",
              key: "my-fieldset-1",
              value: [
                {
                  fieldType: "textField",
                  key: "my-fieldset-1.name",
                  value: "Name2",
                },
                {
                  fieldType: "vaEmailNotification",
                  key: "my-fieldset-1.email",
                  value: "u2@example.com",
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("modifies form fields and answers for growing fieldset with vaProjectDescription type children", () => {
    const answersObject = makeAnswersObject([
      makeGrowingFieldsetAnswer("vaProjectDescription", [
        {
          key: 2,
          value: [
            { key: "goal", value: "Goal2", fieldType: "textField" },
            { key: "money", value: "12", fieldType: "moneyField" },
          ],
        },
      ]),
    ]);

    const state = {
      configuration: {
        form: {
          content: [
            makeWrapperFieldSpec([
              makeGrowingFieldsetSpec(
                "vaProjectDescription",
                [1],
                [
                  { key: "goal", fieldType: "textField" },
                  { key: "money", fieldType: "moneyField" },
                ]
              ),
            ]),
          ],
        },
      },
      form: {
        content: [
          makeWrapperFieldSpec(
            makeGrowingFieldsetSpec(
              "vaProjectDescription",
              [2],
              [
                { key: "goal", fieldType: "textField" },
                { key: "money", fieldType: "moneyField" },
              ]
            )
          ),
        ],
        validationErrors: Immutable({}),
      },
      saveStatus: {
        values: answersObject,
      },
      extensionApi: {},
    };

    ensureFirstChildIsRequired(
      state,
      FormUtil.findField(state.form.content, "my-fieldset")
    );

    expect(getFieldsetIdTree(state.form.content)).to.eql([
      ["my-fieldset-1", ["my-fieldset-1.goal", "my-fieldset-1.money"]],
    ]);

    expect(answersObject).to.eql({
      value: [
        {
          fieldType: "growingFieldset",
          key: "my-fieldset",
          value: [
            {
              fieldType: "vaProjectDescription",
              key: "my-fieldset-1",
              value: [
                {
                  fieldType: "textField",
                  key: "my-fieldset-1.goal",
                  value: "Goal2",
                },
                {
                  fieldType: "moneyField",
                  key: "my-fieldset-1.money",
                  value: "12",
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it("triggers validation for modified fields", () => {
    const answersObject = makeAnswersObject([
      makeGrowingFieldsetAnswer("growingFieldsetChild", [
        {
          key: 2,
          value: [{ key: "money", value: "invalid2", fieldType: "moneyField" }],
        },
        {
          key: 3,
          value: [{ key: "money", value: "invalid3", fieldType: "moneyField" }],
        },
      ]),
    ]);

    const state = {
      configuration: {
        form: {
          content: [
            makeWrapperFieldSpec([
              makeGrowingFieldsetSpec(
                "growingFieldsetChild",
                [1],
                [{ key: "money", fieldType: "moneyField" }]
              ),
            ]),
          ],
        },
      },
      form: {
        content: [
          makeWrapperFieldSpec([
            makeGrowingFieldsetSpec(
              "growingFieldsetChild",
              [2, 3],
              [{ key: "money", fieldType: "moneyField" }]
            ),
          ]),
        ],
        validationErrors: Immutable({}),
      },
      saveStatus: {
        values: answersObject,
      },
      extensionApi: {},
    };

    ensureFirstChildIsRequired(
      state,
      FormUtil.findField(state.form.content, "my-fieldset")
    );

    expect(state.form.validationErrors).to.eql({
      "my-fieldset-1.money": [{ error: "money" }],
    });
  });

  it("clears previous validation error for modified field", () => {
    const answersObject = makeAnswersObject([
      makeGrowingFieldsetAnswer("growingFieldsetChild", [
        {
          key: 2,
          value: [{ key: "money", value: "", fieldType: "moneyField" }],
        },
      ]),
    ]);

    const state = {
      configuration: {
        form: {
          content: [
            makeWrapperFieldSpec([
              makeGrowingFieldsetSpec(
                "growingFieldsetChild",
                [1],
                [{ key: "money", fieldType: "moneyField", required: true }]
              ),
            ]),
          ],
        },
      },
      form: {
        content: [
          makeWrapperFieldSpec([
            makeGrowingFieldsetSpec(
              "growingFieldsetChild",
              [2],
              [{ key: "money", fieldType: "moneyField" }]
            ),
          ]),
        ],
        validationErrors: Immutable({
          "my-fieldset-2.money": [{ error: "required" }],
        }),
      },
      saveStatus: {
        values: answersObject,
      },
      extensionApi: {},
    };

    ensureFirstChildIsRequired(
      state,
      FormUtil.findField(state.form.content, "my-fieldset")
    );

    expect(state.form.validationErrors).to.eql({
      "my-fieldset-1.money": [{ error: "required" }],
    });
  });

  it("sets modified field required if the prototype field was required", () => {
    const answersObject = makeAnswersObject([
      makeGrowingFieldsetAnswer("growingFieldsetChild", [
        {
          key: 2,
          value: [{ key: "money", value: "", fieldType: "moneyField" }],
        },
        {
          key: 3,
          value: [{ key: "money", value: "3", fieldType: "moneyField" }],
        },
      ]),
    ]);

    const state = {
      configuration: {
        form: {
          content: [
            makeWrapperFieldSpec([
              makeGrowingFieldsetSpec(
                "growingFieldsetChild",
                [1],
                [{ key: "money", fieldType: "moneyField", required: true }]
              ),
            ]),
          ],
        },
      },
      form: {
        content: [
          makeWrapperFieldSpec([
            makeGrowingFieldsetSpec(
              "growingFieldsetChild",
              [2, 3],
              [{ key: "money", fieldType: "moneyField" }]
            ),
          ]),
        ],
        validationErrors: Immutable({}),
      },
      saveStatus: {
        values: answersObject,
      },
      extensionApi: {},
    };

    ensureFirstChildIsRequired(
      state,
      FormUtil.findField(state.form.content, "my-fieldset")
    );

    expect(FormUtil.findField(state.form.content, "my-fieldset-1")).to.eql({
      children: [
        {
          fieldClass: "formField",
          fieldType: "moneyField",
          helpText: {
            fi: "",
            sv: "",
          },
          id: "my-fieldset-1.money",
          label: {
            fi: "",
            sv: "",
          },
          params: {
            maxlength: 80,
            size: "small",
          },
          required: true,
        },
      ],
      fieldClass: "wrapperElement",
      fieldType: "growingFieldsetChild",
      id: "my-fieldset-1",
    });

    expect(
      FormUtil.findField(state.form.content, "my-fieldset-1.money").required
    ).be.true;
    expect(
      FormUtil.findField(state.form.content, "my-fieldset-3.money").required
    ).be.false;

    expect(state.form.validationErrors).to.eql({
      "my-fieldset-1.money": [{ error: "required" }],
    });
  });
});

const makeAnswersObject = (answers) => ({ value: answers });

const makeWrapperFieldSpec = (children) => ({
  fieldClass: "wrapperElement",
  id: "my-info",
  fieldType: "theme",
  children: children,
  label: {
    fi: "",
    sv: "",
  },
});

const makeGrowingFieldsetSpec = (childFieldType, childKeys, childFields) => ({
  fieldClass: "wrapperElement",
  id: "my-fieldset",
  fieldType: "growingFieldset",
  children: childKeys.map((key) =>
    makeGrowingFieldsetChildSpec(childFieldType, key, childFields)
  ),
});

const makeGrowingFieldsetChildSpec = (fieldType, key, fields) => ({
  fieldClass: "wrapperElement",
  id: `my-fieldset-${key}`,
  fieldType: fieldType,
  children: fields.map((f) => makeGrowingFieldsetChildFieldSpec(key, f)),
});

const makeGrowingFieldsetChildFieldSpec = (
  childKey,
  { key: answerKey, fieldType, required = false }
) => ({
  label: {
    fi: "",
    sv: "",
  },
  fieldClass: "formField",
  helpText: {
    fi: "",
    sv: "",
  },
  id: `my-fieldset-${childKey}.${answerKey}`,
  params: {
    size: "small",
    maxlength: 80,
  },
  required: required,
  fieldType: fieldType,
});

const makeGrowingFieldsetAnswer = (childFieldType, childValues) => ({
  key: "my-fieldset",
  value: childValues.map((val) =>
    makeGrowingFieldsetChildAnswer(childFieldType, val)
  ),
  fieldType: "growingFieldset",
});

const makeGrowingFieldsetChildAnswer = (fieldType, { key, value }) => ({
  key: `my-fieldset-${key}`,
  value: value.map((val) => makeGrowingFieldsetChildFieldAnswer(key, val)),
  fieldType: fieldType,
});

const makeGrowingFieldsetChildFieldAnswer = (
  childKey,
  { key: answerKey, value, fieldType }
) => ({
  key: `my-fieldset-${childKey}.${answerKey}`,
  value: value,
  fieldType: fieldType,
});

const getFieldsetIdTree = (formSpec) =>
  FormUtil.findField(formSpec, "my-fieldset").children.map((c) => [
    c.id,
    c.children.map((c) => c.id),
  ]);
