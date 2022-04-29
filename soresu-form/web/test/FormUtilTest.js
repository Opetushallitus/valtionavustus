import { expect } from "chai";
import _ from "lodash";
import FormUtil from "../form/FormUtil";

describe("Form util", function () {
  it("returns first field matching id", function () {
    const objFoo1 = { id: "foo-1", content: "cont" };
    const objFoo = { id: "foo", children: [objFoo1] };
    const objMan = { id: "man" };
    const tree = { children: [{ id: "bar" }, objFoo, objMan] };
    expect(FormUtil.findField(tree, "foo")).to.equal(objFoo);
    expect(FormUtil.findField(tree, "foo-1")).to.equal(objFoo1);
    expect(FormUtil.findField(tree, "man")).to.equal(objMan);
    expect(FormUtil.findField(tree, "nosuch")).to.be.null;
  });

  it("returns index of first field matching id", function () {
    const tree = {
      children: [
        { id: "bar" },
        { id: "foo", children: [{ id: "foo-1", content: "cont" }] },
        { id: "man" },
      ],
    };
    expect(FormUtil.findIndexOfField(tree, "foo")).to.equal(3);
    expect(FormUtil.findIndexOfField(tree, "man")).to.equal(6);
    expect(FormUtil.findIndexOfField(tree, "foo-1")).to.equal(5);
    expect(FormUtil.findIndexOfField(tree, "foo-2")).to.equal(-1);
    expect(FormUtil.findIndexOfField(tree, "nosuch")).to.equal(-1);
  });

  it("returns first field matching type", function () {
    const tree = {
      children: [
        {
          id: "foo1",
          children: [{ id: "foo2", fieldType: "vaBudget" }],
        },
        { id: "foo3" },
      ],
    };
    expect(FormUtil.findFieldByFieldType(tree, "vaBudget")).to.eql({
      id: "foo2",
      fieldType: "vaBudget",
    });
  });

  describe("Finding first matching field, ignoring identifier index suffix", function () {
    it("returns found object when ids match exactly, when id does not have index suffix", function () {
      const obj1 = { id: "foo2", content: "cont" };
      const obj2 = { id: "bar" };
      const tree = {
        children: [{ id: "foo", children: [obj1] }, obj2],
      };
      expect(FormUtil.findFieldIgnoringIndex(tree, "foo2")).to.equal(obj1);
      expect(FormUtil.findFieldIgnoringIndex(tree, "bar")).to.equal(obj2);
    });

    it("returns found root object when id with suffix matches to root id without index suffix", function () {
      const obj = { id: "foo", children: [{ id: "foo-1", content: "cont" }] };
      const tree = {
        children: [obj, { id: "bar" }],
      };
      expect(FormUtil.findFieldIgnoringIndex(tree, "foo-1")).to.equal(obj);
      expect(FormUtil.findFieldIgnoringIndex(tree, "foo-2")).to.equal(obj);
    });

    it("returns first found root object", function () {
      const obj = {
        id: "foo-1",
        children: [{ id: "foo-1-1", content: "cont" }],
      };
      const tree = {
        children: [obj, { id: "foo-1" }],
      };
      expect(FormUtil.findFieldIgnoringIndex(tree, "foo-1")).to.equal(obj);
      expect(FormUtil.findFieldIgnoringIndex(tree, "foo")).to.equal(obj);
    });

    it("returns null when no ids match", function () {
      const tree = {
        children: [{ id: "bar" }],
      };
      expect(FormUtil.findFieldIgnoringIndex(tree, "foo")).to.be.null;
    });
  });

  it("returns first field having child with matching id", function () {
    const tree = {
      children: [
        {
          id: "foo1",
          children: [
            { id: "foo21", content: "cont" },
            { id: "foo22", content: "cont" },
          ],
        },
      ],
    };
    expect(FormUtil.findFieldWithDirectChild(tree, "foo22")).to.eql({
      id: "foo1",
      children: [
        { id: "foo21", content: "cont" },
        { id: "foo22", content: "cont" },
      ],
    });
  });

  describe("finding index of child field according to field specification", function () {
    const parentFieldChildrenSpec = [
      {
        label: {
          fi: "Hankkeen nimi",
          sv: "Projektets namn",
        },
        fieldClass: "formField",
        helpText: {
          fi: "",
          sv: "",
        },
        id: "project-name",
        params: {
          size: "large",
          maxlength: 200,
        },
        required: true,
        fieldType: "textField",
      },
      {
        label: {
          fi: "Asiointikieli",
          sv: "Projektets språk",
        },
        fieldClass: "formField",
        helpText: {
          fi: "",
          sv: "",
        },
        id: "language",
        options: [
          {
            value: "fi",
            label: {
              fi: "Suomi",
              sv: "Finska",
            },
          },
          {
            value: "sv",
            label: {
              fi: "Ruotsi",
              sv: "Svenska",
            },
          },
        ],
        required: true,
        fieldType: "radioButton",
      },
      {
        label: {
          fi: "Onko kyseessä yhteishanke",
          sv: "Är projektet ett samprojekt",
        },
        fieldClass: "formField",
        helpText: {
          fi: "",
          sv: "",
        },
        id: "combined-effort",
        options: [
          {
            value: "yes",
            label: {
              fi: "Kyllä",
              sv: "Ja",
            },
          },
          {
            value: "no",
            label: {
              fi: "Ei",
              sv: "Nej",
            },
          },
        ],
        required: true,
        fieldType: "radioButton",
      },
      {
        fieldClass: "wrapperElement",
        id: "other-organizations",
        fieldType: "growingFieldset",
        children: [
          {
            fieldClass: "wrapperElement",
            id: "other-organizations-1",
            fieldType: "growingFieldsetChild",
            children: [
              {
                label: {
                  fi: "Hankkeen muut organisaatiot",
                  sv: "Övriga samarbetspartner",
                },
                fieldClass: "formField",
                helpText: {
                  fi: "",
                  sv: "",
                },
                id: "other-organizations.other-organizations-1.name",
                params: {
                  size: "large",
                  maxlength: 80,
                },
                required: true,
                fieldType: "textField",
              },
              {
                label: {
                  fi: "Yhteyshenkilön sähköposti",
                  sv: "Kontaktpersonens e-postadress",
                },
                fieldClass: "formField",
                helpText: {
                  fi: "",
                  sv: "",
                },
                id: "other-organizations.other-organizations-1.email",
                params: {
                  size: "small",
                  maxlength: 80,
                },
                required: true,
                fieldType: "emailField",
              },
            ],
          },
        ],
        params: {
          showOnlyFirstLabels: true,
        },
      },
      {
        label: {
          fi: "Muut yhteistyökumppanit",
          sv: "Övriga samarbetspartner",
        },
        fieldClass: "formField",
        helpText: {
          fi: "",
          sv: "",
        },
        id: "other-partners",
        params: {
          maxlength: 1000,
        },
        required: false,
        fieldType: "textArea",
      },
    ];

    const parentFieldChildren = [
      {
        label: {
          fi: "Hankkeen nimi",
          sv: "Projektets namn",
        },
        fieldClass: "formField",
        helpText: {
          fi: "",
          sv: "",
        },
        id: "project-name",
        params: {
          size: "large",
          maxlength: 200,
        },
        required: true,
        fieldType: "textField",
      },
      {
        label: {
          fi: "Asiointikieli",
          sv: "Projektets språk",
        },
        fieldClass: "formField",
        helpText: {
          fi: "",
          sv: "",
        },
        id: "language",
        options: [
          {
            value: "fi",
            label: {
              fi: "Suomi",
              sv: "Finska",
            },
          },
          {
            value: "sv",
            label: {
              fi: "Ruotsi",
              sv: "Svenska",
            },
          },
        ],
        required: true,
        fieldType: "radioButton",
      },
      {
        label: {
          fi: "Onko kyseessä yhteishanke",
          sv: "Är projektet ett samprojekt",
        },
        fieldClass: "formField",
        helpText: {
          fi: "",
          sv: "",
        },
        id: "combined-effort",
        options: [
          {
            value: "yes",
            label: {
              fi: "Kyllä",
              sv: "Ja",
            },
          },
          {
            value: "no",
            label: {
              fi: "Ei",
              sv: "Nej",
            },
          },
        ],
        required: true,
        fieldType: "radioButton",
      },
      {
        label: {
          fi: "Muut yhteistyökumppanit",
          sv: "Övriga samarbetspartner",
        },
        fieldClass: "formField",
        helpText: {
          fi: "",
          sv: "",
        },
        id: "other-partners",
        params: {
          maxlength: 1000,
        },
        required: false,
        fieldType: "textArea",
      },
    ];

    it("returns index of found children", function () {
      expect(
        FormUtil.findChildIndexAccordingToFieldSpecification(
          parentFieldChildrenSpec,
          parentFieldChildren,
          "other-organizations"
        )
      ).to.equal(3);
    });

    it("returns 0 when not found", function () {
      expect(
        FormUtil.findChildIndexAccordingToFieldSpecification(
          parentFieldChildrenSpec,
          parentFieldChildren,
          "nosuch"
        )
      ).to.equal(0);
    });
  });

  it("returns the growing fieldset by the id of a child element", function () {
    const calcId = "alphakoulutusosiot.alphakoulutusosio-1.koulutettavapaivat";
    const growingFieldSet = {
      id: "koulutusosiot",
      children: [
        {
          id: "koulutusosio-1",
          children: [
            {
              id: calcId,
              fieldType: "vaTraineeDayCalculator",
              fieldClass: "formField",
            },
          ],
          fieldType: "growingFieldsetChild",
          fieldClass: "wrapperElement",
        },
      ],
      fieldType: "growingFieldset",
      fieldClass: "wrapperElement",
    };

    const tree = [
      {
        id: "koulutusosiot-theme",
        children: [growingFieldSet],
      },
    ];

    expect(FormUtil.findGrowingParent(tree, calcId)).to.equal(growingFieldSet);
  });

  it("returns predicate for checking if id is same or same if ignoring index", () => {
    _.forEach(
      [
        ["foo", "foo", true],
        ["foo-1", "foo-1", true],
        ["foo-1", "foo-2", true],
        ["foo-2", "foo-1", true],
        ["foo-1", "foo", true],
        ["foo", "foo-1", true],

        ["foo.bar", "foo.bar", true],

        ["foo.bar-1", "foo.bar-1", true],
        ["foo.bar", "foo.bar-1", true],
        ["foo.bar-1", "foo.bar", true],

        ["foo-1.bar-1", "foo-1.bar-1", true],

        ["foo-1.bar-1", "foo.bar-1", true],
        ["foo-1.bar-1", "foo-1.bar", true],
        ["foo-1.bar-1", "foo.bar", true],

        ["foo.bar-1", "foo-1.bar-1", true],
        ["foo-1.bar", "foo-1.bar-1", true],
        ["foo.bar", "foo-1.bar-1", true],

        ["foo.bar", "foo.man", false],
        ["", "foo", false],
        ["foo", "", false],
        ["", "", true],
        [null, null, true],
        [undefined, undefined, true],
        [null, "", false],
        [null, undefined, false],
        [undefined, null, false],
        [undefined, "", false],
      ],
      ([findId, fieldId, expected]) => {
        expect(
          FormUtil.idIsSameOrSameIfIndexIgnoredPredicate(findId)({
            id: fieldId,
          })
        ).to.equal(expected);
      }
    );
  });

  it("returns id without index", function () {
    expect(FormUtil.withOutIndex("foo.man-1.bar_zap-2")).to.equal(
      "foo.man.bar_zap"
    );
  });

  describe("Deep-merging field trees", function () {
    it("merges two trees", function () {
      const a = {
        children: [
          { id: "1-a" },
          {
            id: "1-c",
            children: [{ id: "2-a" }],
          },
        ],
      };
      const b = {
        children: [
          {
            id: "1-c",
            children: [{ id: "2-b" }],
          },
          { id: "1-b" },
        ],
      };
      const c = {
        children: [
          { id: "1-a" },
          {
            id: "1-c",
            children: [{ id: "2-a" }, { id: "2-b" }],
          },
          { id: "1-b" },
        ],
      };
      expect(FormUtil.mergeDeepFieldTrees(a, b)).to.eql(c);
    });

    it("returns new copy", function () {
      const a = { children: [{ id: "1-a" }] };
      const aCopy = _.cloneDeep(a);
      const b = { children: [{ id: "1-b" }] };
      const bCopy = _.cloneDeep(b);
      const c = FormUtil.mergeDeepFieldTrees(a, b);
      expect(c).not.to.equal(a);
      expect(c).not.to.equal(b);
      expect(a).to.eql(aCopy);
      expect(b).to.eql(bCopy);
    });

    it("ignores empty source object", function () {
      const tree = {
        children: [
          { id: "1-a" },
          {
            id: "1-c",
            children: [{ id: "2-a" }],
          },
        ],
      };
      expect(FormUtil.mergeDeepFieldTrees(tree, {})).to.eql(tree);
    });

    it("merges three trees", function () {
      const a = {
        children: [
          { id: "1-a" },
          {
            id: "1-d",
            children: [{ id: "2-a" }, { id: "2-d" }],
          },
        ],
      };
      const b = {
        children: [
          {
            id: "1-d",
            children: [
              { id: "2-b" },
              {
                id: "2-d",
                children: [{ id: "3-b" }],
              },
            ],
          },
          { id: "1-b" },
        ],
      };
      const c = {
        children: [
          { id: "1-c" },
          {
            id: "1-d",
            children: [
              {
                id: "2-d",
                children: [{ id: "3-c" }],
              },
              { id: "2-c" },
            ],
          },
        ],
      };
      const d = {
        children: [
          { id: "1-a" },
          {
            id: "1-d",
            children: [
              { id: "2-a" },
              {
                id: "2-d",
                children: [{ id: "3-b" }, { id: "3-c" }],
              },
              { id: "2-b" },
              { id: "2-c" },
            ],
          },
          { id: "1-b" },
          { id: "1-c" },
        ],
      };
      expect(FormUtil.mergeDeepFieldTrees(a, b, c)).to.eql(d);
    });
  });
});
