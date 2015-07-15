import _ from 'lodash'
import traverse from 'traverse'

import InputValueStorage from './InputValueStorage.js'
import JsUtil from './JsUtil.js'


export default class FormBranchGrower {
  static addFormFieldsForGrowingFieldsInInitialRender(formContent, answers) {
    function populateRepeatingItem(baseObject, key, valueOfElement) {
      _.assign(baseObject, { "id": key })
      baseObject.children = baseObject.children.map(c => {
        const primitiveElement = _.cloneDeep(c)
        const distinguisherOfElement = _.last(primitiveElement.id.split('.')) // e.g. "email"
        _.forEach(valueOfElement, primitiveElementValueObject => {
          if (_.endsWith(primitiveElementValueObject.key, '.' + distinguisherOfElement)) {
            primitiveElement.id = primitiveElementValueObject.key
          }
        })
        return primitiveElement
      })
      return baseObject
    }

    function populateGrowingSet(growingParentElement, valuesTreeOfElement) {
      if (growingParentElement.children.length === 0) {
        throw new Error("Expected an existing child for growing set '" + growingParentElement.id + "' to get the field configurations from there.")
      }
      const childPrototype = growingParentElement.children[0]
      growingParentElement.children = _.map(valuesTreeOfElement, itemValueObject => {
        const o = {}
        _.assign(o, childPrototype)
        populateRepeatingItem(o, itemValueObject.key, itemValueObject.value)
        return o
      })
    }

    _.forEach(JsUtil.flatFilter(formContent, n => { return n.displayAs === "growingFieldset"}), g => {
      const growingSetValue = InputValueStorage.readValue(formContent, answers, g.id)
      if (!_.isUndefined(growingSetValue) && !_.isEmpty(growingSetValue)) {
        populateGrowingSet(g, growingSetValue)
      }
      const firstChildValue = g.children.length > 0 ? InputValueStorage.readValue(formContent, answers, g.children[0].id) : undefined
      if (g.children.length > 1 || (!_.isUndefined(growingSetValue) && !_.isEmpty(firstChildValue))) {
        const enabledPlaceHolderChild = FormBranchGrower.createNewChild(g, true)
        g.children.push(enabledPlaceHolderChild)
      }
      const disabledPlaceHolderChild = FormBranchGrower.createNewChild(g, false)
      g.children.push(disabledPlaceHolderChild)
    })
  }

  static expandGrowingFieldSetIfNeeded(state, fieldUpdate) {
    if (growingFieldSetExpandMustBeTriggered(state, fieldUpdate)) {
      expandGrowingFieldset(state, fieldUpdate)
    }

    function growingFieldSetExpandMustBeTriggered(state, fieldUpdate) {
      const growingSetOfThisField = fieldUpdate.growingParent
      if (!growingSetOfThisField) {
        return false
      }

      const allFieldIdsInSameGrowingSet = JsUtil.
        flatFilter(growingSetOfThisField, n => { return !_.isUndefined(n.id) }).
        map(n => { return n.id })
      const wholeSetIsValid = _.reduce(allFieldIdsInSameGrowingSet, (acc, fieldId) => {
        return acc && (state.clientSideValidation[fieldId] !== false)
      }, true)

      // TODO: Assess if the "last" check is needed. Possibly it's enough that the whole thing is valid, minus last row that needs to be skipped in validation, when there are filled rows.
      const lastChildOfGrowingSet = _.last(_.filter(growingSetOfThisField.children, f => { return !f.forceDisabled }))
      const thisFieldIsInLastChildToBeRepeated = _.some(lastChildOfGrowingSet.children, x => { return x.id === fieldUpdate.id })

      return wholeSetIsValid && thisFieldIsInLastChildToBeRepeated
    }

    function expandGrowingFieldset(state, fieldUpdate) {
      const growingFieldSet = fieldUpdate.growingParent
      _.forEach(JsUtil.flatFilter(growingFieldSet.children, n => { return !_.isUndefined(n.id) }), n => {
        n.forceDisabled = false
      })
      const allExistingFieldIds = JsUtil.flatFilter(state.form.content, n => { return !_.isUndefined(n.id) }).
        map(n => { return n.id })
      const newSet = FormBranchGrower.createNewChild(growingFieldSet)
      growingFieldSet.children.push(newSet)
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
  static createNewChild(parentNode, enable) {
    const parentId = parentNode.id
    const currentLastChild = _.last(parentNode.children)
    const newChild = _.cloneDeep(currentLastChild)
    populateNewIdsTo(newChild, parentId, parentNode)
    _.forEach(JsUtil.flatFilter(newChild, n => { return !_.isUndefined(n.id) }),
      field => {
        field.skipValidationOnMount = true
        field.forceDisabled = !enable
      }
    )
    return newChild

    function populateNewIdsTo(node) {
      const oldId = node.id
      var oldIndex = parseIndexFrom(oldId)
      node.id = oldId.replace(oldIndex, oldIndex + 1)
      _.forEach(node.children, n => {
        n.id = n.id.replace(oldId, node.id)
      })
    }

    function parseIndexFrom(id) {
      if (!id || id.length < 0) {
        throw new Error("Cannot parse index from empty id")
      }
      const index = _.last(id.split("-"))
      if (!index || index.length == 0 || isNaN(index) || !(_.isFinite(parseInt(index)))) {
        return ""
      }
      return parseInt(index)
    }
  }
}