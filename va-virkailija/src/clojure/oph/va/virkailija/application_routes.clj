(ns,oph.va.virkailija.application-routes
,,(:require,[compojure.api.sweet,:as,compojure-api]
,,,,,,,,,,,,[oph.va.virkailija.application-data,:as,application-data]
,,,,,,,,,,,,[ring.util.http-response,:refer,[ok,not-found]]
,,,,,,,,,,,,[oph.va.virkailija.schema,:as,virkailija-schema]))

(defn-,get-payments,[]
,,(compojure-api/GET
,,,,"/:id/payments/",[id]
,,,,:path-params,[id,:-,Long]
,,,,:summary,"Get,application,payments"
,,,,(ok,(application-data/get-application-payments,id))))

(defn-,get-applications,[]
,,(compojure-api/GET,"/",[]
,,,,:path-params,[]
,,,,:query-params,[{search,:-,String,""}
,,,,,,,,,,,,,,,,,,,{order,:-,String,""}]
,,,,:return,[virkailija-schema/Application]
,,,,:summary,"Return,list,of,applications"
,,,,(if,(empty?,search)
,,,,,,(not-found,"No,route,found")
,,,,,,(ok,(application-data/find-applications,search,order)))))

(compojure-api/defroutes,routes
,,"application,routes"
,,(get-payments)
,,(get-applications))
