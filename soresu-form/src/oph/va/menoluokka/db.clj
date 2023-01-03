(ns,oph.va.menoluokka.db
,,(:use,[oph.soresu.common.db]
,,,,,,,,[clojure.data,:as,data]
,,,,,,,,[clojure.tools.trace,:only,[trace]])
,,(:require,[oph.soresu.form.formutil,:as,formutil])
,,(:import,[java.util,Date]))

(defn-,remove-whitespace,[input]
,,(clojure.string/replace,input,#"\s",""))

(defn-,answer->menoluokka-row,[answers,hakemus-id,menoluokka]
,,{:menoluokka_id,(:id,menoluokka)
,,,:hakemus_id,hakemus-id
,,,:amount,(Integer/parseInt,(remove-whitespace,(formutil/find-answer-value,answers,(str,(:type,menoluokka),".amount"))))})

(defn,store-menoluokka-hakemus-rows,[avustushaku-id,hakemus-id,answers]
,,(with-tx,(fn,[tx]
,,,,,,,,,,,,,(let,[menoluokka-types,(query,tx,"SELECT,id,,type,FROM,virkailija.menoluokka,WHERE,avustushaku_id,=,?",[avustushaku-id])
,,,,,,,,,,,,,,,,,,,menoluokka-rows,(map,(partial,answer->menoluokka-row,answers,hakemus-id),menoluokka-types)]
,,,,,,,,,,,,,,,(doseq,[menoluokka,menoluokka-rows]
,,,,,,,,,,,,,,,,,(execute!,tx
,,,,,,,,,,,,,,,,,,,,,,,,,,,"INSERT,INTO,virkailija.menoluokka_hakemus,(menoluokka_id,,hakemus_id,,amount)
,,,,,,,,,,,,,,,,,,,,,,,,,,,,VALUES,(?,,?,,?)
,,,,,,,,,,,,,,,,,,,,,,,,,,,,ON,CONFLICT,(hakemus_id,,menoluokka_id),DO,UPDATE,SET
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,amount,=,EXCLUDED.amount"
,,,,,,,,,,,,,,,,,,,,,,,,,,,[(:menoluokka_id,menoluokka),(:hakemus_id,menoluokka),(:amount,menoluokka)]))))))
