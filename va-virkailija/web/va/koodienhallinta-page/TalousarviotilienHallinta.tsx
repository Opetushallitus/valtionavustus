import React, { useCallback, useEffect, useState } from 'react'
import * as yup from 'yup'

import * as styles from './TalousarviotilienHallinta.module.css'

import { Field, FormikProvider, useFormik } from 'formik'
import {
  useCreateTalousarviotiliMutation,
  useGetTalousarvioTilitQuery,
  useRemoveTalousarviotiliMutation,
  useUpdateTalousarviotiliMutation,
} from '../apiSlice'
import { TalousarviotiliWithUsageInfo } from './types'
import useOutsideClick from '../useOutsideClick'
import {
  IconAdd,
  IconButton,
  IconEdit,
  IconRemove,
  IconSave,
} from '../common-components/IconButton'
import { editTalousarviotili, stopEditing, useAppDispatch, useAppSelector } from './store'

const Label = ({ text, labelFor }: { text: string; labelFor: string }) => {
  return (
    <div>
      <label htmlFor={labelFor}>{text}</label>
      <span className={styles.required}>*</span>
    </div>
  )
}

const TalousarviotiliSchema = yup.object().shape({
  year: yup
    .number()
    .typeError('Vuosi pitää olla numero')
    .min(1970, 'Vuosi voi olla minimissään 1970')
    .max(2100, 'Vuosi voi olla maksimissaan 2100')
    .required('Vuosi on pakollinen'),
  code: yup
    .string()
    .matches(/^(\d{1,2}\.)(\d{1,2}\.)*(\d{1,2}\.?)$|^\d{3}$/, 'Tarkista koodi')
    .required('Koodi on pakollinen'),
  name: yup.string().required('Nimi on pakollinen'),
  amount: yup
    .number()
    .positive('Euromäärä ei voi olla negatiivinen')
    .typeError('Euromäärän pitää olla numero')
    .required('Euromäärä on pakollinen'),
})

interface FieldInputProps {
  name: string
  placeholder?: string
  error?: string
  className: string
  disabled?: boolean
}

const FieldInput = ({ name, placeholder, className, error, disabled }: FieldInputProps) => {
  return (
    <div className={styles.fieldContainer}>
      <Field
        className={`${className} ${error ? styles.inputError : ''}`}
        id={name}
        name={name}
        placeholder={placeholder}
        disabled={disabled}
      />
      {error && (
        <div className={styles.error} data-test-id={`error-${name}`}>
          {error}
        </div>
      )}
    </div>
  )
}

const NewTiliRow = () => {
  const [createTalousarviotili] = useCreateTalousarviotiliMutation()
  const formik = useFormik({
    initialValues: {
      year: '',
      code: '',
      name: '',
      amount: '',
    },
    validationSchema: TalousarviotiliSchema,
    onSubmit: async (values, formikHelpers) => {
      const { year, code, name, amount } = values
      try {
        await createTalousarviotili({
          code,
          name,
          year: Number(year),
          amount: Number(amount),
        }).unwrap()
        formikHelpers.resetForm()
      } catch (e: any) {
        if ('status' in e && e.status === 422) {
          formikHelpers.setErrors({
            code: `Koodi ${code} on jo olemassa vuodelle ${year}`,
          })
        }
      } finally {
        formikHelpers.setSubmitting(false)
      }
    },
  })
  const submitDisabled = formik.isSubmitting || !formik.isValid
  return (
    <FormikProvider value={formik}>
      <form data-test-id="new-talousarviotili-form" onSubmit={formik.handleSubmit}>
        <div className={styles.tiliRow}>
          <FieldInput
            name="year"
            placeholder="Vuosiluku"
            className={styles.input}
            error={formik.touched.year ? formik.errors.year : undefined}
          />
          <FieldInput
            name="code"
            placeholder="Syötä TA-tilin koodi"
            className={styles.input}
            error={formik.touched.code ? formik.errors.code : undefined}
          />
          <FieldInput
            name="name"
            placeholder="Syötä tilin nimi"
            className={styles.input}
            error={formik.touched.name ? formik.errors.name : undefined}
          />
          <FieldInput
            name="amount"
            placeholder="Syötä euromäärä"
            className={styles.inputEuro}
            error={formik.touched.amount ? formik.errors.amount : undefined}
          />
          <AvustushautUsingTili avustushaut={[]} />
          <div className={styles.buttonContainer}>
            <IconButton
              type="submit"
              title="Tallenna uusi talousarviotili"
              disabled={submitDisabled}
            >
              <IconAdd />
            </IconButton>
          </div>
        </div>
      </form>
    </FormikProvider>
  )
}

const AvustushautUsingTili = ({
  avustushaut,
}: Pick<TalousarviotiliWithUsageInfo, 'avustushaut'>) => {
  const [toggled, toggle] = useState(false)
  const toggleOpen = useCallback(() => toggle((prevState) => !prevState), [])
  const ref = useOutsideClick<HTMLDivElement>(toggleOpen)
  const notInUse = avustushaut.length === 0
  const buttonText = notInUse ? 'Ei käytössä' : `${avustushaut.length} avustuksessa`
  return (
    <div className={styles.isInUse}>
      {toggled && (
        <div className={styles.usedInPopup} ref={ref}>
          {avustushaut.map(({ id, name }) => {
            return (
              <a key={`avustushaku-${id}`} href={`/admin/haku-editor/?avustushaku=${id}`}>
                {name}
              </a>
            )
          })}
        </div>
      )}
      <button onClick={toggleOpen} disabled={notInUse}>
        {buttonText}
      </button>
    </div>
  )
}

function UneditableTiliRow({ code, avustushaut }: TalousarviotiliWithUsageInfo) {
  const formik = useFormik({
    initialValues: { year: '', code, name: '', amount: '' },
    onSubmit: async () => {},
  })
  return (
    <FormikProvider value={formik}>
      <form className={styles.tiliRow} onSubmit={(e) => e.preventDefault()}>
        <FieldInput name="year" className={styles.input} disabled={true} />
        <FieldInput name="code" className={styles.input} disabled={true} />
        <FieldInput name="name" className={styles.input} disabled={true} />
        <FieldInput name="amount" className={styles.inputEuro} disabled={true} />
        <AvustushautUsingTili avustushaut={avustushaut} />
      </form>
    </FormikProvider>
  )
}

const TiliRow = ({ id, year, code, name, amount, avustushaut }: TalousarviotiliWithUsageInfo) => {
  const dispatch = useAppDispatch()

  const talousarviotiliIdInEditing = useAppSelector(
    (state) => state.talousarviotilienHallinta.talousarviotiliIdInEditing
  )
  const editing = talousarviotiliIdInEditing === id
  const [removeTalousarviotili, { isLoading: isLoadingDelete }] = useRemoveTalousarviotiliMutation()
  const [updateTalousarviotili, { isLoading: isLoadingUpdate }] = useUpdateTalousarviotiliMutation()
  const isLoading = isLoadingDelete || isLoadingUpdate
  const tiliInUse = avustushaut.length > 0
  const deleteDisabled = isLoading || tiliInUse

  const formik = useFormik({
    initialValues: { year, code, name: name ?? '', amount },
    validationSchema: TalousarviotiliSchema,
    onSubmit: async (values, formikHelpers) => {
      const { year, code, name, amount } = values
      try {
        await updateTalousarviotili({
          id,
          code,
          name,
          year: Number(year),
          amount: Number(amount),
        }).unwrap()
      } catch (e: any) {
        if ('status' in e && e.status === 422) {
          formikHelpers.setErrors({
            code: `Koodi ${code} on jo olemassa vuodelle ${year}`,
          })
        }
      } finally {
        formikHelpers.setSubmitting(false)
        dispatch(stopEditing())
      }
    },
  })

  useEffect(() => {
    const switchedToEditOtherTalousarviotili = !editing && talousarviotiliIdInEditing !== undefined
    if (switchedToEditOtherTalousarviotili) formik.resetForm()
  }, [editing, talousarviotiliIdInEditing])

  const submitDisabled = formik.isSubmitting || !formik.isValid
  const deleteTili = async () => {
    if (
      window.confirm(`Oletko aivan varma, että haluat poistaa talousarviotilin ${code} ${name}?`)
    ) {
      try {
        await removeTalousarviotili(id)
      } catch (e) {
        console.log(e)
      }
    }
  }
  return (
    <FormikProvider value={formik}>
      <form
        onSubmit={formik.handleSubmit}
        className={`${styles.tiliRow} ${editing ? styles.tiliRowEditing : ''}`}
        data-test-id={name}
      >
        <FieldInput
          name="year"
          placeholder="Vuosiluku"
          className={styles.input}
          disabled={!editing}
          error={formik.touched.year ? formik.errors.year : undefined}
        />
        <FieldInput
          name="code"
          placeholder="Syötä TA-tilin koodi"
          className={styles.input}
          disabled={!editing}
          error={formik.touched.code ? formik.errors.code : undefined}
        />
        <FieldInput
          name="name"
          placeholder="Syötä tilin nimi"
          className={styles.input}
          disabled={!editing}
          error={formik.touched.name ? formik.errors.name : undefined}
        />
        <FieldInput
          name="amount"
          placeholder="Syötä euromäärä"
          className={styles.inputEuro}
          disabled={!editing}
          error={formik.touched.amount ? formik.errors.amount : undefined}
        />
        <AvustushautUsingTili avustushaut={avustushaut} />
        <div className={styles.buttonContainer}>
          {editing ? (
            <IconButton
              title="Tallenna talousarviotilin tiedot"
              type="submit"
              disabled={submitDisabled}
            >
              <IconSave />
            </IconButton>
          ) : (
            <IconButton
              disabled={isLoading}
              onClick={(e) => {
                e.preventDefault()
                dispatch(editTalousarviotili(id))
              }}
              title="Muokkaa talousarviotiliä"
            >
              <IconEdit />
            </IconButton>
          )}
          {!editing && (
            <IconButton
              disabled={deleteDisabled}
              title={`Poista talousarviotili ${code}`}
              onClick={deleteTili}
            >
              <IconRemove />
            </IconButton>
          )}
        </div>
      </form>
    </FormikProvider>
  )
}

export const TalousarviotilienHallinta = () => {
  const { data } = useGetTalousarvioTilitQuery()
  return (
    <div className={styles.grid}>
      <div className={styles.row}>
        <Label text="Vuosiluku" labelFor="year"></Label>
        <Label text="TA-tilin koodi" labelFor="code"></Label>
        <Label text="TA-tilin nimi" labelFor="name"></Label>
        <Label text="TA-tilin euromäärä" labelFor="amount"></Label>
        <div>
          <span>Käytössä</span>
        </div>
      </div>
      <NewTiliRow />
      {data?.map((tili) =>
        tili['migrated-from-not-normalized-ta-tili'] ? (
          <UneditableTiliRow key={tili.id} {...tili} />
        ) : (
          <TiliRow key={tili.id} {...tili} />
        )
      )}
    </div>
  )
}
