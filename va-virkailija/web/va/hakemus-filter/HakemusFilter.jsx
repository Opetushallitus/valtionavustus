import React, { Component } from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

import FormUtil from 'soresu-form/web/form/FormUtil'

const ToggleFilterButton  = ({controller,hakemusFilter}) => {
  const activeFilterCount = hakemusFilter.answers.length
  const hasActiveFilters = activeFilterCount>0
  const onFilter = () => controller.toggleHakemusFilter()
  const buttonClass = ClassNames('btn btn-sm',{
    'btn-blue': hasActiveFilters,
    'btn-simple': !hasActiveFilters
  })
  return (
    <button className={buttonClass} style={{fontSize:12,marginTop:-4}} onClick={onFilter}>Rajaa <span hidden={!hasActiveFilters}>({activeFilterCount})</span></button>
  )
}

const FilterQuestion = ({question, controller, hakemusFilter}) =>{
  const openQuestions = hakemusFilter.openQuestions
  const activeFilterCount = question.options.filter((o)=>o.selected).length
  const onQuestionClick = (questionId) => {
    const newOpenQuestions = _.includes(openQuestions, questionId) ? _.without(openQuestions,questionId) : openQuestions.concat(questionId)
    controller.setFilter("openQuestions",newOpenQuestions)
  }

  const questionClass = ClassNames('hakemus-filter-question',{
    'hakemus-filter-question--open': question.open
  });
  return(
    <div>
      <div className={questionClass} onClick={onQuestionClick.bind(this,question.id)}>{question.label} <span hidden={activeFilterCount==0}>({activeFilterCount})</span></div>
      <div className="hakemus-filter-options" hidden={!question.open}>
        {question.options.map((option)=><FilterOption key={option.label} hakemusFilter={hakemusFilter} question={question} option={option} controller={controller}></FilterOption>)}
      </div>
    </div>
  )
}

const FilterOption = ({question,option,controller,hakemusFilter}) => {
  const answers = hakemusFilter.answers
  const onClick = (option) => {
    const filterChange = {
      id:question.id,
      answer:option.value
    }
    const newFilter = _.some(answers, filterChange) ? _.reject(answers,filterChange) : answers.concat(filterChange)
    controller.setFilter('answers',newFilter)
  }

  const btnClass = ClassNames('btn','btn-sm','btn-simple',{
    'btn-selected': option.selected
  });

  return (
    <button className={btnClass} style={{marginRight:10}} onClick={onClick.bind(this, option)}>{option.label}</button>
  )
}

const RemoveFilter = ({controller,hakemusFilter}) => {
  const hidden = hakemusFilter.answers.length==0 &&
    !_.isNumber(hakemusFilter.evaluator) &&
    !_.isNumber(hakemusFilter.presenter)
  const onRemove = () => controller.clearFilters()
  return <span hidden={hidden} className="hakemus-filter-remove" onClick={onRemove}>Poista rajaimet</span>
}

const FilterList  = ({hakemusFilter,hakuData,controller}) => {
  const open = hakemusFilter.isOpen
  const form = hakuData.form
  const radioQuestions = FormUtil.findFieldsByFieldType(form.content, "radioButton")
  const checkboxQuestions = FormUtil.findFieldsByFieldType(form.content, "checkboxButton")
  const dropdownQuestions = FormUtil.findFieldsByFieldType(form.content, "dropdown")
  const questions = radioQuestions.concat(checkboxQuestions).concat(dropdownQuestions)
  const answers = hakemusFilter.answers

  const buildQuestions = () => {
    const selectedPredicate = (questionId, answer) => _.some(answers, (a)=>a.answer == answer && a.id == questionId)
    const mapOption = (questionId, option) =>(
      {
        label: option.label.fi,
        value: option.value,
        selected: selectedPredicate(questionId, option.value)
      }
    )
    const openQuestions = hakemusFilter.openQuestions
    const filterQuestions = questions.map((r)=> {
      return {
        id: r.id,
        label: r.label.fi,
        options: r.options.asMutable().map(_.partial(mapOption, r.id)),
        open: _.contains(openQuestions, r.id)
      }
    })
    if (!_.isEmpty(hakuData.avustushaku.content.rahoitusalueet)) {
      filterQuestions.unshift({
        id: "rahoitusalue",
        label: "Rahoitusalue",
        options: hakuData.avustushaku.content["rahoitusalueet"].concat([{rahoitusalue: "Ei rahoitusaluetta"}]).map((row)=>({
          label: row.rahoitusalue,
          value: row.rahoitusalue,
          selected: selectedPredicate("rahoitusalue", row.rahoitusalue)
        })),
        open: _.contains(openQuestions, "rahoitusalue")
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
        open: _.contains(openQuestions, "tags")
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

const HakemusFilter = (props) =>
(
  <div className="hakemus-filter-container">
    <ToggleFilterButton {...props}/>
    <RemoveFilter {...props}/>
    <FilterList {...props}/>
  </div>
)

export default HakemusFilter
