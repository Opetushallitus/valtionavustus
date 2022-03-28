import React from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import FormUtil from 'soresu-form/web/form/FormUtil'

import HakemustenArviointiController from "../HakemustenArviointiController";
import {HakemusFilter, HakuData} from "../types";

import './hakemus-filter.less'

const ToggleFilterButton  = ({controller,hakemusFilter}: Props) => {
  const activeFilterCount = hakemusFilter.answers.length
  const hasActiveFilters = activeFilterCount>0
  const onFilter = () => controller.toggleHakemusFilter()
  const buttonClass = ClassNames('hakemus-btn')
  const suffix = hasActiveFilters ? `(${activeFilterCount})` : 'listaa'
  return (
    <button className={buttonClass} onClick={onFilter}>Rajaa {suffix}</button>
  )
}

const FilterQuestion = ({question, controller, hakemusFilter}: {question: Question, controller: HakemustenArviointiController, hakemusFilter: HakemusFilter}) =>{
  const openQuestions = hakemusFilter.openQuestions
  const activeFilterCount = question.options.filter((o)=>o.selected).length
  const onQuestionClick = () => {
    const questionId = question.id
    const newOpenQuestions = openQuestions.includes(questionId) ? _.without(openQuestions,questionId) : openQuestions.concat(questionId)
    controller.setFilter("openQuestions",newOpenQuestions)
  }

  const questionClass = ClassNames('hakemus-filter-question',{
    'hakemus-filter-question--open': question.open
  })

  return(
    <div>
      <div className={questionClass} onClick={onQuestionClick}>{question.label} <span hidden={activeFilterCount === 0}>({activeFilterCount})</span></div>
      <div className="hakemus-filter-options" hidden={!question.open}>
        {question.options.map((option)=><FilterOption key={option.label} hakemusFilter={hakemusFilter} question={question} option={option} controller={controller}></FilterOption>)}
      </div>
    </div>
  )
}

const FilterOption = ({question,option,controller,hakemusFilter}: {question: Question, option: QuestionOption, controller: HakemustenArviointiController, hakemusFilter: HakemusFilter}) => {
  const answers = hakemusFilter.answers
  const onClick = () => {
    const filterChange = {
      id:question.id,
      answer:option.value
    }
    const newFilter = _.some(answers, filterChange) ? _.reject(answers,filterChange) : answers.concat(filterChange)
    controller.setFilter('answers',newFilter)
  }

  const btnClass = ClassNames('btn','btn-sm','btn-simple',{
    'btn-selected': option.selected
  })

  return (
    <button className={btnClass} style={{marginRight:10}} onClick={onClick}>{option.label}</button>
  )
}

const RemoveFilter = ({controller,hakemusFilter}: Props) => {
  const hidden = hakemusFilter.answers.length === 0 &&
    !_.isNumber(hakemusFilter.evaluator) &&
    !_.isNumber(hakemusFilter.presenter)
  const onRemove = () => controller.clearFilters()
  const explanation = "Poista listan rajaukset"
  return <button aria-label={explanation} title={explanation} hidden={hidden} className="hakemus-filter-remove" onClick={onRemove} />
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

const FilterList  = ({hakemusFilter,hakuData,controller}: Props) => {
  const open = hakemusFilter.isOpen
  const form = hakuData.form
  const radioQuestions = FormUtil.findFieldsByFieldType(form.content, "radioButton")
  const checkboxQuestions = FormUtil.findFieldsByFieldType(form.content, "checkboxButton")
  const dropdownQuestions = FormUtil.findFieldsByFieldType(form.content, "dropdown")
  const questions = radioQuestions.concat(checkboxQuestions).concat(dropdownQuestions)
  const answers = hakemusFilter.answers

  const selectedPredicate = (questionId: string, answer: string) => answers.some(a => a.answer === answer && a.id === questionId)
  const buildQuestions = (): Question[] => {
    const openQuestions = hakemusFilter.openQuestions
    const filterQuestions = questions.map((r)=> {
      const options = r.options?.asMutable() ?? []
      return {
        id: r.id,
        label: r.label?.fi,
        options: options.map(option => ({
          label: option.label.fi,
          value: option.value,
          selected: selectedPredicate(r.id, option.value)
        })),
        open: openQuestions.includes(r.id)
      }
    })
    if (!_.isEmpty(hakuData.avustushaku.content.rahoitusalueet)) {
      const rahoitusalueet = hakuData.avustushaku.content["rahoitusalueet"] ?? []
      filterQuestions.unshift({
        id: "rahoitusalue",
        label: "Rahoitusalue",
        options: rahoitusalueet.concat([{rahoitusalue: "Ei rahoitusaluetta", talousarviotilit: []}]).map((row)=>({
          label: row.rahoitusalue,
          value: row.rahoitusalue,
          selected: selectedPredicate("rahoitusalue", row.rahoitusalue)
        })),
        open: openQuestions.includes("rahoitusalue")
      })
    }

    const tags = _.uniq(_.flatten(hakuData.hakemukset.map((i)=>_.get(i, 'arvio.tags.value'))))
    if(tags.length>0){
      filterQuestions.push({
        id: "tags",
        label: "Tagit",
        options: tags.map((tag)=>({
          label: tag,
          value: tag,
          selected: selectedPredicate("tags", tag)
        })),
        open: _.includes(openQuestions, "tags")
      })
    }
    return filterQuestions
  }

  const filterQuestions = buildQuestions()

  const onToggleFilter = () => controller.toggleHakemusFilter()

  return (
    <div hidden={!open} className="panel hakemus-filter-panel">
      <button className="close" onClick={onToggleFilter}>x</button>
      {filterQuestions.map((question)=><FilterQuestion key={question.label} hakemusFilter={hakemusFilter}
                                                       question={question} controller={controller}></FilterQuestion>)}
    </div>
  )
}

interface Props {
  controller: HakemustenArviointiController
  hakemusFilter: HakemusFilter
  hakuData: HakuData
}

const HakemusFilter = (props: Props) =>
(
  <div className="hakemus-filter-container">
    <ToggleFilterButton {...props}/>
    <RemoveFilter {...props}/>
    <FilterList {...props}/>
  </div>
)

export default HakemusFilter
