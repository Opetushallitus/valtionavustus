import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import FormUtil from 'soresu-form/web/form/FormUtil'

import './hakemus-filter.css'
import { useHakemustenArviointiDispatch, useHakemustenArviointiSelector } from '../arviointiStore'
import {
  clearFilters,
  setAnswerFilter,
  setOpenQuestions,
  TAG_ID,
  toggleFilter,
} from '../filterReducer'

const ToggleFilterButton = () => {
  const dispatch = useHakemustenArviointiDispatch()
  const activeFilterCount = useHakemustenArviointiSelector((state) => state.filter.answers.length)
  const hasActiveFilters = activeFilterCount > 0
  const onFilter = () => dispatch(toggleFilter())
  const buttonClass = ClassNames('hakemus-btn')
  const suffix = hasActiveFilters ? `(${activeFilterCount})` : 'listaa'
  return (
    <button className={buttonClass} onClick={onFilter} data-test-id="rajaa-listaa">
      Rajaa {suffix}
    </button>
  )
}

const FilterQuestion = ({ question }: { question: Question }) => {
  const openQuestions = useHakemustenArviointiSelector((state) => state.filter.openQuestions)
  const dispatch = useHakemustenArviointiDispatch()
  const activeFilterCount = question.options.filter((o) => o.selected).length
  const onQuestionClick = () => {
    const questionId = question.id
    const newOpenQuestions = openQuestions.includes(questionId)
      ? _.without(openQuestions, questionId)
      : openQuestions.concat(questionId)
    dispatch(setOpenQuestions(newOpenQuestions))
  }

  const questionClass = ClassNames('hakemus-filter-question', {
    'hakemus-filter-question--open': question.open,
  })

  return (
    <div>
      <div className={questionClass} onClick={onQuestionClick}>
        {question.label} <span hidden={activeFilterCount === 0}>({activeFilterCount})</span>
      </div>
      <div className="hakemus-filter-options" hidden={!question.open}>
        {question.options.map((option) => (
          <FilterOption key={option.label} question={question} option={option}></FilterOption>
        ))}
      </div>
    </div>
  )
}

const FilterOption = ({ question, option }: { question: Question; option: QuestionOption }) => {
  const answers = useHakemustenArviointiSelector((state) => state.filter.answers)
  const dispatch = useHakemustenArviointiDispatch()
  const onClick = () => {
    const filterChange = {
      id: question.id,
      answer: option.value,
    }
    const newFilter = _.some(answers, filterChange)
      ? _.reject(answers, filterChange)
      : answers.concat(filterChange)
    dispatch(setAnswerFilter(newFilter))
  }

  const btnClass = ClassNames('btn', 'btn-sm', 'btn-simple', {
    'btn-selected': option.selected,
  })

  return (
    <button className={btnClass} style={{ marginRight: 10 }} onClick={onClick}>
      {option.label}
    </button>
  )
}

const RemoveFilter = () => {
  const answersLength = useHakemustenArviointiSelector((state) => state.filter.answers.length)
  const dispatch = useHakemustenArviointiDispatch()
  const hidden = answersLength === 0
  const onRemove = () => dispatch(clearFilters())
  const explanation = 'Poista listan rajaukset'
  return (
    <button
      aria-label={explanation}
      title={explanation}
      hidden={hidden}
      className="hakemus-filter-remove"
      onClick={onRemove}
    />
  )
}

interface QuestionOption {
  label: string
  value: string
  selected: boolean
}

interface Question {
  id: string
  label?: string
  options: QuestionOption[]
  open: boolean
}

const FilterList = () => {
  const dispatch = useHakemustenArviointiDispatch()
  const hakuData = useHakemustenArviointiSelector(
    (state) => state.arviointi.avustushakuData?.hakuData
  )
  const { form, hakemukset = [] } = hakuData ?? {}
  const formContent = form?.content ?? []
  const hakemusFilter = useHakemustenArviointiSelector((state) => state.filter)
  const open = hakemusFilter.isOpen
  const radioQuestions = FormUtil.findFieldsByFieldType(formContent, 'radioButton')
  const checkboxQuestions = FormUtil.findFieldsByFieldType(formContent, 'checkboxButton')
  const dropdownQuestions = FormUtil.findFieldsByFieldType(formContent, 'dropdown')
  const questions = radioQuestions.concat(checkboxQuestions).concat(dropdownQuestions)
  const answers = hakemusFilter.answers

  const selectedPredicate = (questionId: string, answer: string) =>
    answers.some((a) => a.answer === answer && a.id === questionId)
  const buildQuestions = (): Question[] => {
    const openQuestions = hakemusFilter.openQuestions
    const filterQuestions = questions.map((r) => {
      const options = r.options ?? []
      return {
        id: r.id,
        label: r.label?.fi,
        options: options.map((option) => ({
          label: option.label.fi,
          value: option.value,
          selected: selectedPredicate(r.id, option.value),
        })),
        open: openQuestions.includes(r.id),
      }
    })

    const tags = _.uniq(
      hakemukset.flatMap((i) => {
        const tags = i.arvio.tags?.value
        return tags ?? []
      })
    )
    if (tags.length > 0) {
      filterQuestions.push({
        id: TAG_ID,
        label: 'Tagit',
        options: tags.map((tag) => ({
          label: tag,
          value: tag,
          selected: selectedPredicate(TAG_ID, tag),
        })),
        open: openQuestions.includes(TAG_ID),
      })
    }
    return filterQuestions
  }

  const filterQuestions = buildQuestions()

  const onToggleFilter = () => dispatch(toggleFilter())

  return (
    <div hidden={!open} className="panel hakemus-filter-panel">
      <button className="close" onClick={onToggleFilter} data-test-id="rajaa-listaa-close">
        x
      </button>
      {filterQuestions.map((question) => (
        <FilterQuestion key={question.label} question={question}></FilterQuestion>
      ))}
    </div>
  )
}

const HakemusFilter = () => (
  <div className="hakemus-filter-container">
    <ToggleFilterButton />
    <RemoveFilter />
    <FilterList />
  </div>
)

export default HakemusFilter
