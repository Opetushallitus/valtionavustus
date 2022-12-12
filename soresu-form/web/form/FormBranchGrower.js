import _ from "lodash";

import InputValueStorage from "./InputValueStorage";
import JsUtil from "../JsUtil";
import FormUtil from "./FormUtil";
import Immutable from "seamless-immutable";

export default class FormBranchGrower {
  static addFormFieldsForGrowingFieldsInInitialRender(
    formSpecificationContent,
    formContent,
    answers,
    addPlaceHolders
  ) {
    function populateRepeatingItem(baseObject, key, valueOfElement) {
      _.assign(baseObject, { id: key });
      baseObject.children = baseObject.children
        ? baseObject.children.map((c) => {
            const primitiveElement = _.cloneDeep(c);
            const distinguisherOfElement = _.last(
              primitiveElement.id.split(".")
            ); // e.g. "email"
            _.forEach(valueOfElement, (primitiveElementValueObject) => {
              if (
                _.endsWith(
                  primitiveElementValueObject.key,
                  "." + distinguisherOfElement
                )
              ) {
                primitiveElement.id = primitiveElementValueObject.key;
              }
            });
            return primitiveElement;
          })
        : [];
      return baseObject;
    }

    function populateGrowingSet(
      growingParentElement,
      childPrototype,
      valuesTreeOfElement
    ) {
      growingParentElement.children = _.map(
        valuesTreeOfElement,
        (itemValueObject) => {
          const o = {};
          _.assign(o, childPrototype);
          populateRepeatingItem(o, itemValueObject.key, itemValueObject.value);
          return o;
        }
      );
      growingParentElement.children.sort((firstChild, secondChild) => {
        return JsUtil.naturalCompare(firstChild.id, secondChild.id);
      });
    }

    _.forEach(
      JsUtil.flatFilter(formContent, (n) => {
        return n.fieldType === "growingFieldset";
      }),
      (g) => {
        const growingSetValue = InputValueStorage.readValue(
          formContent,
          answers,
          g.id
        );
        const childPrototype =
          FormBranchGrower.getGrowingFieldSetChildPrototype(
            formSpecificationContent,
            g.id
          );
        if (growingSetValue != null && !_.isEmpty(growingSetValue)) {
          populateGrowingSet(g, childPrototype, growingSetValue);
        }
        if (addPlaceHolders) {
          if (haveChildrenAnswers(g.children, growingSetValue)) {
            const enabledPlaceHolderChild = FormBranchGrower.createNewChild(
              g,
              childPrototype,
              true
            );
            g.children.push(enabledPlaceHolderChild);
          }
          const disabledPlaceHolderChild = FormBranchGrower.createNewChild(
            g,
            childPrototype,
            false
          );
          g.children.push(disabledPlaceHolderChild);
        }
      }
    );
  }

  static getGrowingFieldSetChildPrototype(
    formSpecificationContent,
    growingParentId
  ) {
    const growingParentSpecification = FormUtil.findField(
      formSpecificationContent,
      growingParentId
    );
    if (growingParentSpecification.children.length === 0) {
      throw new Error(
        "Expected an existing child for growing set '" +
          growingParentId +
          "' to get the field configurations from there."
      );
    }
    return growingParentSpecification.children[0];
  }

  static expandGrowingFieldSetIfNeeded(state, fieldUpdate) {
    const growingParent = fieldUpdate.growingParent;
    if (!growingParent) {
      return;
    }

    function getGrowingParentChildrenEnsuringTheyAreMutable(growingParent) {
      for (const children of growingParent.children) {
        if (children.children.some((child) => Immutable.isImmutable(child))) {
          children.children = Immutable.asMutable(children.children, {
            deep: true,
          });
        }
      }
      return growingParent.children;
    }

    const growingChildren =
      getGrowingParentChildrenEnsuringTheyAreMutable(growingParent);

    if (
      growingChildren &&
      FormUtil.findField(
        growingChildren[growingChildren.length - 2],
        fieldUpdate.id
      )
    ) {
      // Is the user currently editing a field in last enabled child? If
      // so, enable the disabled child and set required status for all
      // fields in current child.

      const childPrototype = FormBranchGrower.getGrowingFieldSetChildPrototype(
        state.configuration.form.content,
        growingParent.id
      );

      JsUtil.fastTraverse(growingChildren[growingChildren.length - 2], (f) => {
        if (f.id != null) {
          if (FormUtil.findFieldIgnoringIndex(childPrototype, f.id).required) {
            f.required = true;
          }
        }
        return true;
      });

      JsUtil.fastTraverse(growingChildren[growingChildren.length - 1], (f) => {
        if (f.id != null) {
          delete f.forceDisabled;
        }
        return true;
      });

      growingChildren.push(
        FormBranchGrower.createNewChild(growingParent, childPrototype, false)
      );
    }
  }

  /**
   * Assumes that the current direct children of parentNode have ids ending with numbers.
   * That number will be incremented for the direct children, and if those have more children,
   * their ids will be replicated with their path from the growing parent as prefix. Like this:
   *
   * other-organisations
   * |
   * +-- other-organisations-1  // existing node
   * |   |
   * |   +-- other-organisations.other-organisations-1.name
   * |   |
   * |   +-- other-organisations.other-organisations-1.email
   * |
   * +-- other-organisations-2  // new node
   *     |
   *     +-- other-organisations.other-organisations-2.name
   *     |
   *     +-- other-organisations.other-organisations-2.email
   *
   * @param parentNode  Node whose children are repeated
   */
  static createNewChild(parentNode, childPrototype, enable) {
    const currentLastChild = _.last(parentNode.children);
    const newChild = childPrototype.asMutable({ deep: true });
    populateNewIdsTo(newChild, currentLastChild);
    JsUtil.fastTraverse(newChild, (f) => {
      if (f.id != null) {
        if (f.required) {
          f.required = false;
        }
        if (!enable) {
          f.forceDisabled = true;
        }
      }
      return true;
    });
    return newChild;

    function populateNewIdsTo(node, currentLastChild) {
      const prototypeId = node.id;
      const lastIndex = FormUtil.parseIndexFrom(currentLastChild.id);
      node.id = FormUtil.withOutIndex(prototypeId) + "-" + (lastIndex + 1);
      _.forEach(node.children, (n) => {
        n.id = n.id.replace(prototypeId, node.id);
      });
    }
  }
}

const haveChildrenAnswers = (children, answers) =>
  children.length > 1 || hasFirstChildAnswer(children, answers);

const hasFirstChildAnswer = (children, answers) =>
  children.length > 0 &&
  !areAllFieldAnswersEmpty(
    InputValueStorage.readValue(null, answers, children[0].id)
  );

const areAllFieldAnswersEmpty = (answers) =>
  _.every(answers, (a) => _.isEmpty(a.value));
