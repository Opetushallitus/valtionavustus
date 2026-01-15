import React from 'react'
import { VaCodeValue } from '../../types'
import ProjectSelector from '../../common-components/ProjectSelector'

import './projektien-valinta.css'
import { useHakujenHallintaDispatch, useHakujenHallintaSelector } from '../hakujenHallintaStore'
import { VirkailijaAvustushaku, updateProjects } from '../hakuReducer'

interface ProjectSelectorsProps {
  avustushaku: VirkailijaAvustushaku
  codeOptions: VaCodeValue[]
  disabled: boolean
}

export default function ProjectSelectors(props: ProjectSelectorsProps) {
  const loadingProjects = useHakujenHallintaSelector((s) => s.haku.loadingProjects)
  const dispatch = useHakujenHallintaDispatch()
  let { codeOptions, disabled, avustushaku } = props
  const projects = [...(avustushaku.projects ?? [])].sort((a, b) =>
    a['code-value'].localeCompare(b['code-value'])
  )
  disabled = disabled || loadingProjects

  codeOptions = makeNoProjectCodeFirstElement(codeOptions)

  const updateValue = (projectIndex: number) => (option: VaCodeValue | null) => {
    if (option === null) {
      return
    }
    projects[projectIndex] = option
    dispatch(
      updateProjects({
        avustushakuId: avustushaku.id,
        projects,
      })
    )
  }

  const addRow = () => {
    dispatch(
      updateProjects({
        avustushakuId: avustushaku.id,
        projects: [codeOptions[0], ...projects],
      })
    )
  }

  const removeRow = (project: VaCodeValue | null) => () => {
    if (project) {
      const newProjects = projects.filter((p) => p.id !== project.id)
      dispatch(updateProjects({ avustushakuId: avustushaku.id, projects: newProjects }))
    }
  }

  return (
    <div className="projekti-valitsimet">
      {projects.length < 1 ? (
        <ProjectSelector
          codeOptions={codeOptions.filter((k) => k['value-type'] === 'project')}
          disabled={disabled}
          updateValue={updateValue(0)}
          removeRow={removeRow(null)}
          addRow={addRow}
        />
      ) : (
        projects.map((project, ind) => {
          return (
            <ProjectSelector
              key={`${project.id}-${ind}`}
              codeOptions={codeOptions.filter((k) => k['value-type'] === 'project')}
              selectedValue={project}
              disabled={disabled}
              updateValue={updateValue(ind)}
              removeRow={removeRow(project)}
              addRow={addRow}
            />
          )
        })
      )}
    </div>
  )
}

function makeNoProjectCodeFirstElement(codeOptions: VaCodeValue[]) {
  const noProjectCodeInd = codeOptions.findIndex(
    (code: VaCodeValue) => code['code-value'] === 'Ei projektikoodia'
  )
  const noProjectCode = codeOptions[noProjectCodeInd]
  codeOptions.splice(noProjectCodeInd, 1)
  return [noProjectCode, ...codeOptions]
}
