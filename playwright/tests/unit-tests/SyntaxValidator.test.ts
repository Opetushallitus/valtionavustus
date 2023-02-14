import { test, expect } from "@playwright/test";
import SyntaxValidator from "../../../soresu-form/web/form/SyntaxValidator";

test.describe.parallel("Syntax validator", function () {
  test("validates email", function () {
    expect(SyntaxValidator.validateEmail("user@example.com")).toEqual(
      undefined
    );
    expect(SyntaxValidator.validateEmail("first.last@example.com")).toEqual(
      undefined
    );
    expect(SyntaxValidator.validateEmail("First.LAST@example.com")).toEqual(
      undefined
    );
    expect(
      SyntaxValidator.validateEmail("valid.email@my-example.DOT.com")
    ).toEqual(undefined);
    expect(SyntaxValidator.validateEmail("valid+param@example.com")).toEqual(
      undefined
    );
    expect(SyntaxValidator.validateEmail("nosuch")).toEqual({ error: "email" });
    expect(SyntaxValidator.validateEmail("example.com")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("invalid@example")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("invalid@example,com")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("invalid@example.,com")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("first last@example.com")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("first. last@example.com")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("first .last@example.com")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("äö@example.com")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("\xa9@example.com")).toEqual({
      error: "email",
    });
    expect(
      SyntaxValidator.validateEmail("invalid.em%0Ail@example.com")
    ).toEqual({ error: "email" });
    expect(
      SyntaxValidator.validateEmail("invalid.em%0ail@example.com")
    ).toEqual({ error: "email" });
    expect(SyntaxValidator.validateEmail(" user@example.com")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail(";user@example.com")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("user@example.com ")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("user@example.com;")).toEqual({
      error: "email",
    });
    expect(
      SyntaxValidator.validateEmail("Matti Meikalainen <matti@example.com>")
    ).toEqual({ error: "email" });
    expect(
      SyntaxValidator.validateEmail("Matti Meikälainen <matti@example.com>")
    ).toEqual({ error: "email" });
    expect(
      SyntaxValidator.validateEmail("user1@example.com user2@example.com")
    ).toEqual({ error: "email" });
    expect(
      SyntaxValidator.validateEmail("user1@example.com, user2@example.com")
    ).toEqual({ error: "email" });
    expect(
      SyntaxValidator.validateEmail("user1@example.com; user2@example.com")
    ).toEqual({ error: "email" });
    expect(SyntaxValidator.validateEmail("%0a@example.com")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("%0A@example.com")).toEqual({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("")).toEqual({ error: "email" });
    expect(SyntaxValidator.validateEmail(42)).toEqual({ error: "email" });
    expect(SyntaxValidator.validateEmail(null)).toEqual({ error: "email" });
  });

  test("validates URL", function () {
    expect(
      SyntaxValidator.validateUrl(
        "http://www.example.com/foo/?bar=baz&ans=42&quux"
      )
    ).toEqual(undefined);
    expect(SyntaxValidator.validateUrl("https://www.example.com/")).toEqual(
      undefined
    );
    expect(SyntaxValidator.validateUrl("http://exa-MPLE.com/")).toEqual(
      undefined
    );
    expect(
      SyntaxValidator.validateUrl(
        "http://www.exa-mple.com/search?q=foo:bar+AND+man:'zap'&qs=id,bid&qss=json&rest_params=~:/@!$()*,;%#mg=o"
      )
    ).toEqual(undefined);
  });

  test("validates Finnish business-id", function () {
    expect(SyntaxValidator.validateBusinessId("1629284-5")).toEqual(undefined);
    expect(SyntaxValidator.validateBusinessId("0165761-0")).toEqual(undefined);
    expect(SyntaxValidator.validateBusinessId("0208201-1")).toEqual(undefined);
    expect(SyntaxValidator.validateBusinessId("1629284-6")).toEqual({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId("165761-0")).toEqual({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId(" 0208201-1")).toEqual({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId(";0208201-1")).toEqual({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId("0208201-1 ")).toEqual({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId("0208201-1;")).toEqual({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId("")).toEqual({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId(42)).toEqual({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId(null)).toEqual({
      error: "finnishBusinessId",
    });
  });
});
