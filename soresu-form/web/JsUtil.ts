import _ from 'lodash'


const fastTraverseArray = (array: any[], func: any) => {
  for (let i = 0; i < array.length; i += 1) {
    const elem = array[i]
    if (!!elem && _.isObject(elem)) {
      JsUtil.fastTraverse(elem, func)
    }
  }
}

const fastTraverseObject = (obj: any, func: (x: any) => boolean) => {
  const keys = Object.keys(obj)
  keys.forEach((k: string) => {
    const elem: any = obj[k]
    if (!!elem && _.isObject(elem)) {
      JsUtil.fastTraverse(elem, func)
    }
  })
}

export default class JsUtil {
  static flatFilter(objectOrArray: any,
                    nodePredicate: (x: any) => boolean) {
    return JsUtil.traverseMatching(objectOrArray, nodePredicate, _.identity)
  }

  static traverseMatching(objectOrArray: any,
                          nodePredicate: (x: any) => boolean,
                          operation: (x: any) => any): any[] {
    const results: any[] = []
    JsUtil.fastTraverse(objectOrArray, (element) => {
      if (nodePredicate(element)) {
        results.push(operation(element))
      }
      return true
    })
    return results
  }

  static findFirst(objectOrArray: any,
                   nodePredicate: (x: any) => boolean) {
    let found = false
    let object = null
    JsUtil.fastTraverse(objectOrArray, (element) => {
      if (found) {
        return false  // no need to search further
      } else {
        if (nodePredicate(element)) {
          found = true
          object = element
          return false
        }
        return true  // keep searching
      }
    })
    return object
  }

  static findIndexOfFirst(objectOrArray: any,
                          nodePredicate: (x: any) => boolean) {
    let index = 0
    let found = false
    JsUtil.fastTraverse(objectOrArray, (element) => {
      if (found) {
        return false  // no need to search further
      } else {
        if (nodePredicate(element)) {
          found = true
          return false
        }
        index += 1
        return true  // keep searching
      }
    })
    return found ? index : -1
  }

  static findJsonNodeContainingId(objectOrArray: any, idToFind: string) {
    const allNodesContainingNode = _.filter(objectOrArray, function (parentNode: any) {
      return JsUtil.findFirst(parentNode, (childNode: any) => childNode.id === idToFind) !== null
    })
    if (allNodesContainingNode.length > 1) {
      throw new Error("Cannot handle case with " + allNodesContainingNode.length +
        " parents (" + JSON.stringify(allNodesContainingNode) + "), expected a single one. fieldId=" + idToFind)
    }
    return _.head(allNodesContainingNode)
  }

  static fastTraverse(x: any, func: (x: any) => boolean) {
    const shouldContinue = func(x)

    if (shouldContinue) {
      if (_.isArray(x)) {
        fastTraverseArray(x, func)
      } else if (_.isObject(x)) {
        fastTraverseObject(x, func)
      }
    }
  }

  static naturalCompare(a: string, b: string) {
    if (!_.isString(a) || !_.isString(b)) {
      console.log('Warning: do not know how to do natural comparison of "' + a + '" and "' + b + '", returning 0')
      return 0
    }
    const ax: [number, string][] = []
    const bx: [number, string][] = []

    a.replace(/(\d+)|(\D+)/g, function (_, offset: number, original: string) {
      ax.push([offset || Infinity, original || ""]);
      return original
    })
    b.replace(/(\d+)|(\D+)/g, function (_, offset: number, original: string) {
      bx.push([offset || Infinity, original || ""]);
      return original
    })

    while (ax.length && bx.length) {
      const an = ax.shift()
      const bn = bx.shift()
      const nn = (an![0] - bn![0]) || an![1].localeCompare(bn![1])
      if (nn) {
        return nn
      }
    }

    return ax.length - bx.length
  }
}
