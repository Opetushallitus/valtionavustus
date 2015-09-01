import _ from 'lodash'

import InputValueStorage from './InputValueStorage.js'
import JsUtil from './JsUtil.js'
import FormUtil from './FormUtil.js'

export default class FormBranchGrower {
  static addFormFieldsForGrowingFieldsInInitialRender(formSpecificationContent, formContent, answers) {
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

    function populateGrowingSet(growingParentElement, childPrototype, valuesTreeOfElement) {
      growingParentElement.children = _.map(valuesTreeOfElement, itemValueObject => {
        const o = {}
        _.assign(o, childPrototype.asMutable({deep: true}))
        populateRepeatingItem(o, itemValueObject.key, itemValueObject.value)
        return o
      })
    }

    _.forEach(JsUtil.flatFilter(formContent, n => { return n.displayAs === "growingFieldset"}), g => {
      const growingSetValue = InputValueStorage.readValue(formContent, answers, g.id)
      const childPrototype = FormBranchGrower.getGrowingFieldSetChildPrototype(formSpecificationContent, g.id)
      if (!_.isUndefined(growingSetValue) && !_.isEmpty(growingSetValue)) {
        populateGrowingSet(g, childPrototype, growingSetValue)
      }
      const firstChildValue = g.children.length > 0 ? InputValueStorage.readValue(formContent, answers, g.children[0].id) : undefined
      if (g.children.length > 1 || (!_.isUndefined(growingSetValue) && !_.isEmpty(firstChildValue))) {
        const enabledPlaceHolderChild = FormBranchGrower.createNewChild(g, childPrototype, true)
        g.children.push(enabledPlaceHolderChild)
      }
      const disabledPlaceHolderChild = FormBranchGrower.createNewChild(g, childPrototype, false)
      g.children.push(disabledPlaceHolderChild)
    })
  }

  static getGrowingFieldSetChildPrototype(formSpecificationContent, growingParentId) {
    const growingParentSpecification = FormUtil.findField(formSpecificationContent, growingParentId)
    if (growingParentSpecification.children.length === 0) {
        throw new Error("Expected an existing child for growing set '" + growingParentId + "' to get the field configurations from there.")
    }
    return growingParentSpecification.children[0]
  }

  static expandGrowingFieldSetIfNeeded(state, fieldUpdate) {
    if (growingFieldSetExpandMustBeTriggered(state, fieldUpdate)) {
      expandGrowingFieldset(state, fieldUpdate)
    }

    function growingFieldSetExpandMustBeTriggered(state, fieldUpdate) {
      const growingParent = fieldUpdate.growingParent
      if (!growingParent) {
        return false
      }
      const allFieldIdsInSameGrowingSet = JsUtil.flatFilter(growingParent.children, n => { return !_.isUndefined(n.id)}).
        map(n => { return n.id })
      const wholeSetIsValid = _.reduce(allFieldIdsInSameGrowingSet, (acc, fieldId) => {
        return acc && (!state.form.validationErrors[fieldId] || state.form.validationErrors[fieldId].length === 0)
      }, true)

       // TODO: Assess if the "last" check is needed. Possibly it's enough that the whole thing is valid, minus last row that needs to be skipped in validation, when there are filled rows.
      const lastChildOfGrowingSet = _.last(_.filter(growingParent.children, f => { return !f.forceDisabled }))
      const thisFieldIsInLastChildToBeRepeated = _.some(lastChildOfGrowingSet.children, x => { return x.id === fieldUpdate.id })

      return wholeSetIsValid && thisFieldIsInLastChildToBeRepeated
    }

    function expandGrowingFieldset(state, fieldUpdate) {
      const growingParent = fieldUpdate.growingParent
      _.forEach(JsUtil.flatFilter(growingParent.children, n => { return !_.isUndefined(n.id) }), n => {
        n.forceDisabled = false
      })
      const childPrototype = FormBranchGrower.getGrowingFieldSetChildPrototype(state.configuration.form.content, growingParent.id)
      const newSet = FormBranchGrower.createNewChild(growingParent, childPrototype, false)
      growingParent.children.push(newSet)
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
    const currentLastChild = _.last(parentNode.children)
    const newChild = childPrototype.asMutable({deep: true})
    populateNewIdsTo(newChild, currentLastChild)
    _.forEach(JsUtil.flatFilter(newChild, n => { return !_.isUndefined(n.id) }),
      field => {
        field.skipValidationOnMount = true
        field.forceDisabled = !enable
      }
    )
    return newChild

    function populateNewIdsTo(node, currentLastChild) {
      const prototypeId = node.id
      var lastIndex = FormUtil.parseIndexFrom(currentLastChild.id)
      var newId =  FormUtil.withOutIndex(prototypeId) + "-" + (lastIndex + 1)
      node.id = newId
      _.forEach(node.children, n => {
        n.id = n.id.replace(prototypeId, node.id)
      })
    }
  }
}