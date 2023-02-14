import { test, expect } from "@playwright/test";
import JsUtil from "../../../soresu-form/web/JsUtil";

test.describe.parallel("Js util", () => {
  test("collects objects matching a predicate", function () {
    const found = JsUtil.flatFilter(Tree, (el: any) => /id-\d+/.test(el.id));
    expect(found).toEqual([
      { id: "id-1" },
      { id: "id-2" },
      { id: "id-3", token: Token },
      { id: "id-4" },
    ]);
  });

  test("finds first matching object", function () {
    const object = JsUtil.findFirst(Tree, (el: any) => el.token === Token);
    expect(object).toEqual({ id: "id-3", token: Token });
  });

  test.describe("finding index of first matching object", function () {
    test("returns index when object matches", function () {
      const index = JsUtil.findIndexOfFirst(
        Tree,
        (el: any) => el.token === Token
      );
      expect(index).toEqual(TraversingStepsToToken - 1);
    });

    test("returns 0 when matching root object", function () {
      const index = JsUtil.findIndexOfFirst(Tree, (el: any) => el.a1 && el.b1);
      expect(index).toEqual(0);
    });

    test("returns -1 when match is not found", function () {
      const index = JsUtil.findIndexOfFirst(
        Tree,
        (el: any) => el.token === "nosuch"
      );
      expect(index).toEqual(-1);
    });
  });

  test.describe("finding json node containing id", function () {
    test("finds node", function () {
      const toBeFound = {
        id: "id-b",
        children: [{ id: "id-b1" }, { id: "id-b2" }],
      };
      const tree = { a: { id: "id-a" }, b: toBeFound };
      const node = JsUtil.findJsonNodeContainingId(tree, "id-b2");
      expect(node).toEqual(toBeFound);
    });

    test("throws exception if json tree contains searched id in different subtrees", function () {
      const tree = { a: { id: "id" }, b: { id: "id" } };
      const expectedMsg =
        'Cannot handle case with 2 parents ([{"id":"id"},{"id":"id"}]), expected a single one. fieldId=id';
      expect(function () {
        JsUtil.findJsonNodeContainingId(tree, "id");
      }).toThrow(expectedMsg);
    });
  });
});

const Token = "find me";

const TraversingStepsToToken = 13;

const Tree = {
  a1: {
    a2a: [{ a3a: { id: "id-1" } }, { a3b: { id: "id-2" } }],
    a2b: { id: "id-foo" },
  },
  b1: [
    {
      b2a: [{ b3a: { id: "id-3", token: Token } }, { b3a: { id: "id-4" } }],
    },
  ],
};
