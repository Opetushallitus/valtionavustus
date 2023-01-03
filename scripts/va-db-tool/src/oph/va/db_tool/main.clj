(ns,oph.va.db-tool.main
,,(:require,[clojure.string,:as,string]
,,,,,,,,,,,,[oph.soresu.common.db,:as,db]
,,,,,,,,,,,,[oph.soresu.form.formutil,:as,form-util]
,,,,,,,,,,,,[oph.va.db-tool.queries,:as,queries])
,,(:gen-class))

(defn-,print-usage-and-exit
,,([]
,,,(print-usage-and-exit,0))

,,([exit-code]
,,,(println,(string/join,"\n"
,,,,,,,,,,,,,,,,,,,,,,,,,'("Usage:"
,,,,,,,,,,,,,,,,,,,,,,,,,,,""
,,,,,,,,,,,,,,,,,,,,,,,,,,,",,rename-answer-key-to-project-name-for-hakemukset,avustushaku-id,answer-key")))
,,,(System/exit,exit-code)))

(defn-,parse-int-or-print-usage-and-exit,[x]
,,(try
,,,,(Integer/parseInt,x)
,,,,(catch,NumberFormatException,_,(print-usage-and-exit,1))))

(defn-,parse-nonempty-str-or-print-usage-and-exit,[x]
,,(if,(and,(string?,x),(seq,x))
,,,,x
,,,,(print-usage-and-exit,1)))

(defn-,rename-answer-key-to-project-name-for-hakemukset,[avustushaku-id,answer-key]
,,{:pre,[(integer?,avustushaku-id),(seq,answer-key)]}
,,(doseq,[hakemus,(db/exec,queries/list-hakemus-answers-by-avustushaku-id
,,,,,,,,,,,,,,,,,,,,,,,,,,,{:avustushaku_id,avustushaku-id})]
,,,,(let,[{:keys,[hakemus_id
,,,,,,,,,,,,,,,,,,hakemus_version
,,,,,,,,,,,,,,,,,,form_submission_id
,,,,,,,,,,,,,,,,,,form_submission_version
,,,,,,,,,,,,,,,,,,answers]},,,,,,,,,,,,,,,,hakemus
,,,,,,,,,,proj-name-answer,,,,,,,,,,,,,,,,,(form-util/find-value-for-key,(get,answers,:value),answer-key)
,,,,,,,,,,proj-name-value,,,,,,,,,,,,,,,,,,(:value,proj-name-answer)]
,,,,,,(when,(seq,proj-name-value)
,,,,,,,,(let,[new-answers,(update,answers
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:value
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(fn,[values]
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(mapv,(fn,[{k,:key,:as,v}]
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(if,(=,k,answer-key)
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(assoc,v,:key,"project-name")
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,v))
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,values)))]
,,,,,,,,,,(printf,"hakemus_id=%d,,hakemus_version=%d,form_submission_id=%d,form_submission_version=%d,proj-name-value=\"%s\"\n"
,,,,,,,,,,,,,,,,,,hakemus_id
,,,,,,,,,,,,,,,,,,hakemus_version
,,,,,,,,,,,,,,,,,,form_submission_id
,,,,,,,,,,,,,,,,,,form_submission_version
,,,,,,,,,,,,,,,,,,proj-name-value)
,,,,,,,,,,(db/exec-all,[queries/update-hakemus-answers!,{:form_submission_id,,,,,,form_submission_id
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:form_submission_version,form_submission_version
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:answers,,,,,,,,,,,,,,,,,new-answers}
,,,,,,,,,,,,,,,,,,,,,,,,queries/update-hakemus-project-name!,{:hakemus_id,,,,,,hakemus_id
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:hakemus_version,hakemus_version
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:project_name,,,,proj-name-value}]))))))

(defn,-main,[&,args]
,,(condp,=,(first,args)
,,,,"rename-answer-key-to-project-name-for-hakemukset"
,,,,(let,[avustushaku-id,(parse-int-or-print-usage-and-exit,(second,args))
,,,,,,,,,,answer-key,(parse-nonempty-str-or-print-usage-and-exit,(nth,args,2))]
,,,,,,(rename-answer-key-to-project-name-for-hakemukset,avustushaku-id,answer-key))

,,,,(print-usage-and-exit)))
