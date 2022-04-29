import { expect } from "chai";
import SyntaxValidator from "../form/SyntaxValidator";

describe("Syntax validator", function () {
  it("validates email", function () {
    expect(SyntaxValidator.validateEmail("user@example.com")).to.equal(
      undefined
    );
    expect(SyntaxValidator.validateEmail("first.last@example.com")).to.equal(
      undefined
    );
    expect(SyntaxValidator.validateEmail("First.LAST@example.com")).to.equal(
      undefined
    );
    expect(
      SyntaxValidator.validateEmail("valid.email@my-example.DOT.com")
    ).to.equal(undefined);
    expect(SyntaxValidator.validateEmail("valid+param@example.com")).to.equal(
      undefined
    );
    expect(SyntaxValidator.validateEmail("nosuch")).to.eql({ error: "email" });
    expect(SyntaxValidator.validateEmail("example.com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("invalid@example")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("invalid@example,com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("invalid@example.,com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("first last@example.com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("first. last@example.com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("first .last@example.com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("äö@example.com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("\xa9@example.com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("invalid.em%0Ail@example.com")).to.eql(
      { error: "email" }
    );
    expect(SyntaxValidator.validateEmail("invalid.em%0ail@example.com")).to.eql(
      { error: "email" }
    );
    expect(SyntaxValidator.validateEmail(" user@example.com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail(";user@example.com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("user@example.com ")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("user@example.com;")).to.eql({
      error: "email",
    });
    expect(
      SyntaxValidator.validateEmail("Matti Meikalainen <matti@example.com>")
    ).to.eql({ error: "email" });
    expect(
      SyntaxValidator.validateEmail("Matti Meikälainen <matti@example.com>")
    ).to.eql({ error: "email" });
    expect(
      SyntaxValidator.validateEmail("user1@example.com user2@example.com")
    ).to.eql({ error: "email" });
    expect(
      SyntaxValidator.validateEmail("user1@example.com, user2@example.com")
    ).to.eql({ error: "email" });
    expect(
      SyntaxValidator.validateEmail("user1@example.com; user2@example.com")
    ).to.eql({ error: "email" });
    expect(SyntaxValidator.validateEmail("%0a@example.com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("%0A@example.com")).to.eql({
      error: "email",
    });
    expect(SyntaxValidator.validateEmail("")).to.eql({ error: "email" });
    expect(SyntaxValidator.validateEmail(42)).to.eql({ error: "email" });
    expect(SyntaxValidator.validateEmail(null)).to.eql({ error: "email" });
  });

  it("validates URL", function () {
    expect(
      SyntaxValidator.validateUrl(
        "http://www.example.com/foo/?bar=baz&ans=42&quux"
      )
    ).to.eql(undefined);
    expect(SyntaxValidator.validateUrl("https://www.example.com/")).to.eql(
      undefined
    );
    expect(SyntaxValidator.validateUrl("http://exa-MPLE.com/")).to.eql(
      undefined
    );
    expect(
      SyntaxValidator.validateUrl(
        "http://www.exa-mple.com/search?q=foo:bar+AND+man:'zap'&qs=id,bid&qss=json&rest_params=~:/@!$()*,;%#mg=o"
      )
    ).to.eql(undefined);
  });

  it("validates Finnish business-id", function () {
    expect(SyntaxValidator.validateBusinessId("1629284-5")).to.equal(undefined);
    expect(SyntaxValidator.validateBusinessId("0165761-0")).to.equal(undefined);
    expect(SyntaxValidator.validateBusinessId("0208201-1")).to.equal(undefined);
    expect(SyntaxValidator.validateBusinessId("1629284-6")).to.eql({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId("165761-0")).to.eql({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId(" 0208201-1")).to.eql({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId(";0208201-1")).to.eql({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId("0208201-1 ")).to.eql({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId("0208201-1;")).to.eql({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId("")).to.eql({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId(42)).to.eql({
      error: "finnishBusinessId",
    });
    expect(SyntaxValidator.validateBusinessId(null)).to.eql({
      error: "finnishBusinessId",
    });
  });
});
