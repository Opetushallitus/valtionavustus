import _ from 'lodash'
import { Immutable, ImmutableArray } from 'seamless-immutable'

import JsUtil from '../JsUtil'
import { Field, FieldType } from '../va/types'

type FieldOrArray = Field | Field[] | ImmutableArray<Field>

type ReturnType<T> = T extends ImmutableArray<infer R>
  ? Immutable<R>
  : T extends Array<infer R>
  ? R
  : T

export default class FormUtil {
  static scrollTo(element: Element, duration: number, afterScroll?: () => any) {
    const aboutSame = function (current: number, target: number) {
      return Math.abs(current - target) < 1
    }
    const startScrollPos = window.pageYOffset
    const offsetFromTop =
      (document.getElementById('container')?.getBoundingClientRect().top as number) + startScrollPos
    const targetScrollPos = element.getBoundingClientRect().top + startScrollPos - offsetFromTop
    if (aboutSame(startScrollPos, targetScrollPos)) {
      afterScroll?.()
      return
    }
    const diff = targetScrollPos - startScrollPos
    const scrollStep = Math.PI / (duration / 10)
    let count = 0
    const scrollInterval = setInterval(function () {
      count = count + 1
      const nextScrollPos = startScrollPos + diff * (0.5 - 0.5 * Math.cos(count * scrollStep))
      window.scrollTo(0, nextScrollPos)
      if (aboutSame(nextScrollPos, targetScrollPos)) {
        clearInterval(scrollInterval)
        afterScroll?.()
      }
    }, 10)
  }

  static idIsSameOrSameIfIndexIgnoredPredicate(findId: string) {
    const findIdSansIndex = findId ? FormUtil.withOutIndex(findId) : findId
    return (field: Field) => {
      const givenFieldId = field.id
      if (givenFieldId === findIdSansIndex) {
        return true
      }
      if (!givenFieldId || !findIdSansIndex) {
        return false
      }
      return FormUtil.withOutIndex(givenFieldId) === findIdSansIndex
    }
  }

  static findChildIndexAccordingToFieldSpecification(
    specificationChildren: Field[],
    currentChildren: Field[],
    fieldId: string
  ) {
    const newFieldSpecIndex = _.findIndex(
      specificationChildren,
      FormUtil.idIsSameOrSameIfIndexIgnoredPredicate(fieldId)
    )
    let index = 0
    for (; index < currentChildren.length; index++) {
      const sibling = currentChildren[index]
      const siblingSpecIndex = _.findIndex(
        specificationChildren,
        FormUtil.idIsSameOrSameIfIndexIgnoredPredicate(sibling.id)
      )
      if (siblingSpecIndex > newFieldSpecIndex) {
        break
      }
    }
    return index
  }

  static findField(formContent: Field[], fieldId: string) {
    return JsUtil.findFirst(formContent, (n: Field) => n.id === fieldId)
  }

  static findIndexOfField(formContent: Field[], fieldId: string) {
    return JsUtil.findIndexOfFirst(formContent, (n: Field) => n.id === fieldId)
  }

  static findFieldByFieldType(formContent: FieldOrArray, fieldType: FieldType) {
    return JsUtil.findFirst(formContent, (n: Field) => n.fieldType === fieldType)
  }

  static findFieldsByFieldType<T extends FieldOrArray>(formContent: T, fieldType: FieldType) {
    return JsUtil.flatFilter(formContent, (n: ReturnType<T>) => n.fieldType === fieldType)
  }

  static findFieldIgnoringIndex(formContent: Field | Field[], fieldId: string) {
    return JsUtil.findFirst(formContent, FormUtil.idIsSameOrSameIfIndexIgnoredPredicate(fieldId))
  }

  static findSubFieldIds(field: Field) {
    return JsUtil.traverseMatching(
      field.children ?? [],
      (n: Field) => !!n.id,
      (n: Field) => n.id
    )
  }

  static findFieldWithDirectChild(formContent: Field | Field[], childId: string) {
    return JsUtil.findFirst(
      formContent,
      (n: Field) => n.children?.some((c) => c.id === childId) ?? false
    )
  }

  static findGrowingParent(formContent: Field[], fieldId: string) {
    const allGrowingFieldsets = JsUtil.flatFilter(
      formContent,
      (n: Field) => n.fieldType === 'growingFieldset'
    )
    return JsUtil.findJsonNodeContainingId<Field>(allGrowingFieldsets, fieldId)
  }

  static withOutIndex(id: string) {
    const partWithOutIndex = function (part: string) {
      const index = FormUtil.parseIndexFrom(part)
      if (index === '') {
        return part
      } else {
        return part.substring(0, part.lastIndexOf('-'))
      }
    }
    return id.split('.').map(partWithOutIndex).join('.')
  }

  static parseIndexFrom(id: string) {
    if (!id || id.length < 0) {
      throw new Error('Cannot parse index from empty id')
    }
    const index = _.last(id.split('-'))
    if (!index || index.length === 0 || isNaN(parseInt(index)) || !_.isFinite(parseInt(index))) {
      return ''
    }
    return parseInt(index)
  }

  static mergeDeepFieldTrees(tree: Partial<Field>, ...restTrees: Partial<Field>[]) {
    const copiedTree = _.cloneDeep(tree)

    restTrees.forEach((anotherTree) => {
      traverse(copiedTree, anotherTree)
    })

    return copiedTree

    function traverse(dstTree: Partial<Field>, srcTree: Partial<Field>) {
      const dstChildren = dstTree.children

      if (dstChildren && dstChildren.length > 0) {
        // lookup optimization
        const dstChildrenById = dstChildren.reduce((acc: Record<string, Partial<Field>>, field) => {
          acc[field.id] = field
          return acc
        }, {})

        const srcChildren = srcTree.children || []

        for (let index = 0; index < srcChildren.length; index += 1) {
          const srcChild = srcChildren[index]
          const dstChild = dstChildrenById[srcChild.id]

          if (dstChild) {
            // dst child exists, check subchildren of dst and src recursively
            traverse(dstChild, srcChild)
          } else {
            // dst child does not exist, copy src as is
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
