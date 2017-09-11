import _ from 'lodash'

import JsUtil from '../JsUtil'

export default class FormUtil {
  static scrollTo(element, duration, afterScroll) {
    if(!afterScroll) {
      afterScroll = function(){}
    }
    const aboutSame = function(current, target) {
      return Math.abs(current - target) < 1
    }
    const startScrollPos = window.pageYOffset
    const offsetFromTop = document.getElementById("container").getBoundingClientRect().top + startScrollPos
    const targetScrollPos = element.getBoundingClientRect().top + startScrollPos - offsetFromTop
    if (aboutSame(startScrollPos, targetScrollPos)) {
      afterScroll()
      return
    }
    const diff = targetScrollPos - startScrollPos
    const scrollStep = Math.PI / (duration / 10)
    var count = 0
    const scrollInterval = setInterval(function(){
      count = count + 1
      const nextScrollPos = startScrollPos + diff * (0.5 - 0.5 * Math.cos(count * scrollStep))
      window.scrollTo (0, nextScrollPos)
      if(aboutSame(nextScrollPos, targetScrollPos)) {
        clearInterval(scrollInterval)
        afterScroll()
      }
    },10)
  }

  static idIsSameOrSameIfIndexIgnoredPredicate(fieldId) {
    return field => { return field.id === fieldId || FormUtil.isSameIfIndexIgnored(field.id, fieldId)}
  }

  static findChildIndexAccordingToFieldSpecification(specificationChildren, currentChildren, fieldId) {
    const newFieldSpecIndex = _.findIndex(specificationChildren, FormUtil.idIsSameOrSameIfIndexIgnoredPredicate(fieldId))
    for (var index = 0; index < currentChildren.length; index++) {
      const sibling = currentChildren[index]
      const siblingSpecIndex = _.findIndex(specificationChildren, FormUtil.idIsSameOrSameIfIndexIgnoredPredicate(sibling.id))
      if(siblingSpecIndex > newFieldSpecIndex){
        break
      }
    }
    return index
  }

  static findField(formContent, fieldId) {
    return JsUtil.findFirst(formContent, n => { return n.id === fieldId })
  }

  static findFieldByFieldType(formContent, fieldType) {
    return JsUtil.findFirst(formContent, n => { return n.fieldType === fieldType })
  }

  static findFieldsByFieldType(formContent, fieldType) {
    return JsUtil.flatFilter(formContent, n => { return n.fieldType === fieldType })
  }

  static findFieldIgnoringIndex(formContent, fieldId) {
    return JsUtil.findFirst(formContent, FormUtil.idIsSameOrSameIfIndexIgnoredPredicate(fieldId))
  }

  static findSubFieldIds(field) {
    return JsUtil.traverseMatching(field.children, n => { return n.id}, n => { return n.id})
  }

  static findFieldIndex(formContent, fieldId) {
    return JsUtil.findIndexOfFirst(formContent, FormUtil.idIsSameOrSameIfIndexIgnoredPredicate(fieldId))
  }

  static findFieldWithDirectChild(formContent, childId) {
    return JsUtil.findFirst(formContent, n => { return _.some(n.children, c => { return c.id === childId })})
  }

  static findGrowingParent(formContent, fieldId) {
    const allGrowingFieldsets = JsUtil.flatFilter(formContent, n => { return n.fieldType === "growingFieldset" })
    return JsUtil.findJsonNodeContainingId(allGrowingFieldsets, fieldId)
  }

  static isSameIfIndexIgnored(id1, id2) {
    if(!id1 || !id2) return false
    return this.withOutIndex(id1) === this.withOutIndex(id2)
  }

  static withOutIndex(id) {
    const partWithOutIndex = function(part) {
      const index = FormUtil.parseIndexFrom(part)
      if(index === "") {
        return part
      }
      else {
        return part.substring(0, part.lastIndexOf("-"))
      }
    }
    return _.map(id.split("."), part => {return partWithOutIndex(part)}).join(".")
  }

  static parseIndexFrom(id) {
    if (!id || id.length < 0) {
      throw new Error("Cannot parse index from empty id")
    }
    const index = _.last(id.split("-"))
    if (!index || index.length == 0 || isNaN(index) || !(_.isFinite(parseInt(index)))) {
      return ""
    }
    return parseInt(index)
  }

  static mergeDeepFieldTrees(tree, ...restTrees) {
    const copiedTree = _.cloneDeep(tree)

    _.forEach(restTrees, anotherTree => {
      traverse(copiedTree, anotherTree)
    })

    return copiedTree

    function traverse(dstTree, srcTree) {
      const dstChildren = dstTree.children

      if (dstChildren && dstChildren.length > 0) {
        // lookup optimization
        const dstChildrenById = _.reduce(dstChildren, (acc, field) => {
          acc[field.id] = field
          return acc
        }, {})

        const srcChildren = srcTree.children || []

        for (let index = 0; index < srcChildren.length; index += 1) {
          const srcChild = srcChildren[index]
          const dstChild = dstChildrenById[srcChild.id]

          if (dstChild) {  // dst child exists, check subchildren of dst and src recursively
            traverse(dstChild, srcChild)
          } else {         // dst child does not exist, copy src as is
            const copied = _.cloneDeep(srcChild)
            dstChildren.push(copied)
            dstChildrenById[copied.id] = copied
          }
        }
      } else if (srcTree.children && srcTree.children.length > 0) {
        dstTree.children = _.cloneDeep(srcTree.children)
      }
    }
  }
}
