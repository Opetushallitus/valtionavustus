(ns,oph.va.virkailija.payments-routes
,,(:require,[compojure.api.sweet,:as,compojure-api]
,,,,,,,,,,,,[oph.va.virkailija.payments-data,:as,payments-data]
,,,,,,,,,,,,[ring.util.http-response,:refer,[ok,not-found,bad-request]]
,,,,,,,,,,,,[oph.va.virkailija.schema,:as,virkailija-schema]
,,,,,,,,,,,,[oph.va.virkailija.authentication,:as,authentication]))

(defn-,create-payment,[]
,,(compojure-api/POST
,,,,"/",[:as,request]
,,,,:body,[payment-values
,,,,,,,,,,,(compojure-api/describe,virkailija-schema/Payment,"Create,payment")]
,,,,:return,virkailija-schema/Payment
,,,,:summary,"Create,new,payment,for,application"
,,,,(let,[identity,(authentication/get-request-identity,request)]
,,,,,,(ok,(payments-data/create-payment,payment-values,identity)))))

(defn-,delete-payment,[]
,,(compojure-api/DELETE
,,,,"/:id/",[id,:as,request]
,,,,:path-params,[id,:-,Long]
,,,,:summary,"Delete,payment,with,paymentstatus,waiting"
,,,,(if-let,[payment,(payments-data/get-payment,id)]
,,,,,,(if,(=,(:paymentstatus-id,payment),"waiting")
,,,,,,,,(do,(payments-data/delete-payment,id)
,,,,,,,,,,,,(ok,""))
,,,,,,,,(bad-request,"Only,newly,created,is,allowed,to,be,deleted"))
,,,,,,(not-found,""))))

(compojure-api/defroutes
,,routes
,,"payment,routes"
,,(create-payment)
,,(delete-payment))
