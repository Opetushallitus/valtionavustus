import React, {Component} from 'react'
import _ from 'lodash'
import ClassNames from 'classnames'

export default class SeurantaTags extends Component {

  constructor(props){
    super(props)
    this.state = {newTag:""}
  }

  render() {
    const {controller, hakemus, hakuData} = this.props
    const currentTags = hakemus.arvio.tags.value

    const onToggleTag = (value) =>{
      const newTags = _.includes(currentTags, value) ? _.without(currentTags,value) : currentTags.concat(value)
      controller.setTags(hakemus,newTags)
    }

    const predefinedTags = ["budjettimuutos", "sisällön muutos", "lisäaika"]
    const hakuUsedTags = _.uniq(_.flatten(hakuData.hakemukset.map((i)=>_.get(i, 'arvio.tags.value'))))
    var allTags = _.sortBy(_.uniq(hakuUsedTags.concat(predefinedTags)))

    const classNames = (tag) =>{
      const selected = _.contains(currentTags,tag)
      return ClassNames("btn btn-tag btn-sm", {
        "btn-simple": !selected,
        "btn-selected": selected
      })
    }

    const newTagChanged = (event) => {
      const value = event.target.value.toLowerCase()
      this.setState({newTag:value})
    }

    const addTag = (event) =>{
      event.preventDefault()
      onToggleTag(this.state.newTag)
      this.setState({newTag:""})
    }

    return (
      <div>
        <h2>Tagit
          <button className="btn btn-selected btn-sm btn-tag-example" style={{marginLeft:10,marginRight:10}}>Valittu tagi</button>
          <button className="btn btn-simple btn-sm btn-tag-example">Ei käytössä</button>
        </h2>
        {allTags.map((tag,index)=>
          <button key={index} className={classNames(tag)} onClick={_.partial(onToggleTag,tag)}>{tag}</button>
        )}
        <div>
          <form onSubmit={addTag} >
            <input type="text" onChange={newTagChanged} value={this.state.newTag} placeholder="Uusi tagi" style={{padding: 4, fontSize: 12}}/>
            <button type="submit" className="btn btn-sm" style={{marginLeft:5}} disabled={this.state.newTag.length==0}>Lisää uusi tagi</button>
          </form>
        </div>

      </div>
    )
  }
}
