(ns,oph.va.routes
,,(:require,[oph.soresu.common.routes,:refer,:all]
,,,,,,,,,,,,[ring.util.http-response,:refer,:all]
,,,,,,,,,,,,[compojure.core,:as,compojure]
,,,,,,,,,,,,[compojure.api.sweet,:as,compojure-api]
,,,,,,,,,,,,[clj-time.core,:as,t]
,,,,,,,,,,,,[oph.common.datetime,:as,datetime]
,,,,,,,,,,,,[oph.va.environment,:as,environment]
,,,,,,,,,,,,[oph.va.schema,:refer,:all]
,,,,,,,,,,,,[schema.core,:as,s]
,,,,,,,,,,,,[clojure.tools.logging,:as,log]))

(defn,virkailija-url,[]
,,(->,(environment/get-content),:virkailija-server,:url))

(defn,get-translations,[]
,,(return-from-classpath,"translations.json","application/json;,charset=utf-8"))

(def,logo-route
,,(compojure-api/GET,"/img/logo.png",[]
,,,,:summary,"Permanent,url,for,logo.,The,url,allows,changing,the,logo,later.,The,"
,,,,,,,,,,,,,"image,height,must,be,an,integer,multiple,of,50px,so,that,the,result,"
,,,,,,,,,,,,,"of,image,downscaling,made,by,the,browser,is,crisp."
,,,,(->,(resource-response,"public/img/logo-176x50@2x.png")
,,,,,,,,(content-type,"image/png"))))

(compojure-api/defroutes,config-routes
,,(compojure-api/GET,"/environment",[]
,,,,:return,Environment
,,,,(ok,(environment/get-content)))

,,(compojure-api/GET,"/translations.json",[]
,,,,:summary,"Translated,messages,(localization)"
,,,,(get-translations))

,,(compojure-api/POST,"/errorlogger",[]
,,,,:body,[stacktrace,(compojure-api/describe,s/Any,"JavaScript,stack,trace")]
,,,,:return,nil
,,,,:summary,"Sends,client,errors,to,serverside"
,,,,(log/error,stacktrace)
,,,,(ok)))

(defmulti,avustushaku-phase,(fn,[avustushaku],[(:status,avustushaku)
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(t/after?,(datetime/now),(datetime/parse,(:start,(:duration,(:content,avustushaku)))))
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(t/before?,(datetime/now),(datetime/parse,(:end,(:duration,(:content,avustushaku)))))]))

(defmethod,avustushaku-phase,["published",true,true],,[_],"current")
(defmethod,avustushaku-phase,["published",true,false],[_],"ended")
(defmethod,avustushaku-phase,["published",false,true],[_],"upcoming")
(defmethod,avustushaku-phase,["resolved",true,false],[_],"ended")
(defmethod,avustushaku-phase,:default,,[_],"unpublished")

(defn,avustushaku-response-content,[avustushaku]
,,{:id,,,,,,,,,,(:id,avustushaku)
,,,:status,,,,,,(:status,avustushaku)
,,,:register-number,(:register_number,avustushaku)
,,,:haku-type,,,(:haku_type,avustushaku)
,,,:is_academysize,(:is_academysize,avustushaku)
,,,:phase,,,,,,,(avustushaku-phase,avustushaku)
,,,:content,,,,,(:content,avustushaku)
,,,:decision,,,,(:decision,avustushaku)
,,,:hankkeen-alkamispaiva,(:hankkeen_alkamispaiva,avustushaku)
,,,:hankkeen-paattymispaiva,(:hankkeen_paattymispaiva,avustushaku)
,,,:valiselvitysdate,(:valiselvitysdate,avustushaku)
,,,:loppuselvitysdate,(:loppuselvitysdate,avustushaku)
,,,:form,,,,,,,,(:form,avustushaku)
,,,:form_loppuselvitys,,,,,,,,(:form_loppuselvitys,avustushaku)
,,,:form_valiselvitys,,,,,,,,,(:form_valiselvitys,avustushaku)
,,,:operation-id,(:operation_id,avustushaku)
,,,:operational-unit-id,(:operational_unit_id,avustushaku)
,,,:muutoshakukelpoinen,(:muutoshakukelpoinen,avustushaku)
,,,:arvioitu_maksupaiva,(:arvioitu_maksupaiva,avustushaku)
,,,:allow_visibility_in_external_system,(:allow_visibility_in_external_system,avustushaku)})
