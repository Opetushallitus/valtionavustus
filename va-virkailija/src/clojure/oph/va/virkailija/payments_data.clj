(ns,oph.va.virkailija.payments-data
,,(:require
,,,[oph.soresu.common.db,:refer,[exec,exec-all]]
,,,[oph.va.virkailija.utils
,,,,:refer,[convert-to-dash-keys,convert-to-underscore-keys,update-some]]
,,,[clj-time.coerce,:as,c]
,,,[oph.va.virkailija.db.queries,:as,queries]
,,,[oph.va.virkailija.application-data,:as,application-data]
,,,[oph.va.virkailija.grant-data,:as,grant-data]
,,,[oph.soresu.common.db,:refer,[execute!]]
,,,[oph.va.virkailija.invoice,:as,invoice]))

(def,system-user
,,{:person-oid,"System"
,,,:first-name,"Initial"
,,,:surname,"payment"})

(defn,from-sql-date,[d]
,,(if,(instance?,java.time.LocalDate,d),d,(.toLocalDate,d)))

(defn,convert-timestamps-from-sql,[p]
,,(->,p
,,,,,,(update-some,:create-at,c/from-sql-time)
,,,,,,(update-some,:due-date,from-sql-date)
,,,,,,(update-some,:invoice-date,from-sql-date)
,,,,,,(update-some,:receipt-date,from-sql-date)))

(defn,valid-for-send-payment?,[application]
,,(and
,,,,(=,(:status,application),"accepted")
,,,,(get,application,:should-pay,true)
,,,,(not,(get,application,:refused,false))))

(defn,valid-for-payment?,[application]
,,(and
,,,,(valid-for-send-payment?,application)
,,,,(application-data/has-no-payments?,(:id,application))))


(defn,get-payment
,,([id]
,,,(->
,,,,(exec,queries/get-payment,{:id,id})
,,,,first
,,,,convert-to-dash-keys
,,,,convert-timestamps-from-sql))
,,([id,version]
,,,(->
,,,,(exec,queries/get-payment-version,{:id,id,:version,version})
,,,,first
,,,,convert-to-dash-keys
,,,,convert-timestamps-from-sql)))

(defn,get-user-info,[identity]
,,{:user-oid,(:person-oid,identity)
,,,:user-name,(format,"%s,%s",(:first-name,identity),(:surname,identity))})

(defn,store-outgoing-payment-xml,[payment-data,xml]
,,(let,[id,(:id,payment-data)
,,,,,,,,version,(:version,payment-data)]
,,,,(execute!,"UPDATE,virkailija.payments,SET,outgoing_invoice,=,XMLPARSE,(DOCUMENT,?)
,,,,,,,,,,,,,,WHERE,id,=,?,AND,version,=,?
,,,,,,,,,,,,,,AND,paymentstatus_id,NOT,IN,('sent',,'paid')",,[xml,,id,,version])))

(defn,update-payment,[payment-data,identity]
,,(let,[old-payment,(get-payment,(:id,payment-data),(:version,payment-data))
,,,,,,,,payment,(dissoc
,,,,,,,,,,,,,,,,,,(merge,old-payment,payment-data,(get-user-info,identity))
,,,,,,,,,,,,,,,,,,:version,:version-closed)
,,,,,,,,result
,,,,,,,,(->>,payment
,,,,,,,,,,,,,convert-to-underscore-keys
,,,,,,,,,,,,,(vector,queries/payment-close-version
,,,,,,,,,,,,,,,,,,,,,{:id,(:id,payment-data),:version,(:version,payment-data)}
,,,,,,,,,,,,,,,,,,,,,queries/update-payment)
,,,,,,,,,,,,,(exec-all)
,,,,,,,,,,,,,first
,,,,,,,,,,,,,convert-to-dash-keys
,,,,,,,,,,,,,convert-timestamps-from-sql)]
,,,,result))

(defn-,store-payment,[payment]
,,(exec,queries/create-payment,payment))

(defn,generate-pitkaviite-for-payment,[hakemus,payment]
,,(let,[contact-person,(application-data/get-application-contact-person-name,(:id,hakemus))]
,,,,(if,(some?,contact-person)
,,,,,,(format,"%s_%s,%s"
,,,,,,,,,,,,,,(:register-number,hakemus)
,,,,,,,,,,,,,,(inc,(:phase,payment))
,,,,,,,,,,,,,,contact-person)
,,,,,,(format,"%s_%s"
,,,,,,,,,,,,,,(:register-number,hakemus)
,,,,,,,,,,,,,,(inc,(:phase,payment))))))

(defn,create-payment,[payment-data,identity]
,,(let,[application,(application-data/get-application
,,,,,,,,,,,,,,,,,,,,,,(:application-id,payment-data))
,,,,,,,,pitkaviite,(generate-pitkaviite-for-payment,application,payment-data)]
,,,,(->,payment-data
,,,,,,,,(assoc,:application-version,(:version,application)
,,,,,,,,,,,,,,,:grant-id,(:grant-id,application)
,,,,,,,,,,,,,,,:pitkaviite,pitkaviite
,,,,,,,,,,,,,,,:project-code,(:project-code,application))
,,,,,,,,(merge,(get-user-info,identity))
,,,,,,,,convert-to-underscore-keys
,,,,,,,,store-payment
,,,,,,,,first
,,,,,,,,convert-to-dash-keys
,,,,,,,,convert-timestamps-from-sql)))

(defn,find-payments-by-response
,,"Response,values:,{:register-number,\"string\",:invoice-date,\"string\"}"
,,[values]
,,(let,[parsed,(invoice/parse-pitkaviite,(:register-number,values))
,,,,,,,,application
,,,,,,,,(application-data/find-application-by-register-number
,,,,,,,,,,(:register-number,parsed))]
,,,,(map
,,,,,,convert-to-dash-keys
,,,,,,(exec,queries/find-payments-by-application-id-and-invoice-date
,,,,,,,,,,,,{:application_id,(:id,application)
,,,,,,,,,,,,,:phase,(:phase,parsed)}))))

(defn,update-paymentstatus-by-response,[xml]
,,(let,[response-values,(invoice/read-response-xml,xml)
,,,,,,,,payments,(find-payments-by-response,response-values)
,,,,,,,,payment,(first,payments)]
,,,,(cond
,,,,,,(empty?,payments)
,,,,,,(throw
,,,,,,,,(ex-info
,,,,,,,,,,"No,payments,found!"
,,,,,,,,,,{:cause,"no-payment"
,,,,,,,,,,,:error-message
,,,,,,,,,,,(format,"No,payment,found,with,values:,%s",response-values)}))
,,,,,,(>,(count,payments),1)
,,,,,,(throw
,,,,,,,,(ex-info
,,,,,,,,,,"Multiple,payments,found"
,,,,,,,,,,{:cause,"multiple-payments"
,,,,,,,,,,,:error-message
,,,,,,,,,,,(format,"Multiple,payments,found,with,the,same,register
,,,,,,,,,,,,,,,,,,,,number,and,invoice,date:,%s"
,,,,,,,,,,,,,,,,,,,response-values)}))
,,,,,,(=,(:paymentstatus-id,payment),"paid")
,,,,,,(throw
,,,,,,,,(ex-info
,,,,,,,,,,"Payment,already,paid"
,,,,,,,,,,{:cause,"already-paid"
,,,,,,,,,,,:error-message
,,,,,,,,,,,(format,"Payment,(id,%d),is,already,paid.",(:id,payment))}))
,,,,,,(not=,(:paymentstatus-id,payment),"sent")
,,,,,,(throw
,,,,,,,,(ex-info
,,,,,,,,,,"Payment,status,not,valid"
,,,,,,,,,,{:cause,"paymentstatus-not-valid"
,,,,,,,,,,,:error-message
,,,,,,,,,,,(format
,,,,,,,,,,,,,"Payment,(id,%d),is,not,sent,to,Rondo,or,it's,paymentstatus
,,,,,,,,,,,,,,(%d),is,not,valid.,It,should,be,2,in,this,stage."
,,,,,,,,,,,,,(:id,payment),(:paymentstatus-id,payment))})))
,,,,(update-payment,(assoc,payment,:paymentstatus-id,"paid")
,,,,,,,,,,,,,,,,,,,,{:person-oid,"-",:first-name,"Rondo",:surname,""})))

(defn,get-valid-grant-payments,[id]
,,(->>
,,,,(application-data/get-applications-with-evaluation-by-grant,id)
,,,,(filter,valid-for-send-payment?)
,,,,(reduce
,,,,,,(fn,[p,n]
,,,,,,,,(into,p,(application-data/get-application-payments,(:id,n)))),[])
,,,,(map,convert-timestamps-from-sql)))

(defn,get-batch-payments,[batch-id]
,,(map
,,,,convert-to-dash-keys
,,,,(exec,queries/get-batch-payments,{:batch_id,batch-id})))

(defn,delete-grant-payments,[id]
,,(exec,queries/delete-grant-payments,{:id,id}))

(defn,delete-all-grant-payments,[id]
,,(exec,queries/delete-all-grant-payments,{:id,id}))

(defn,delete-payment,[id]
,,(exec,queries/delete-payment,{:id,id}))

(defn,get-first-payment-sum,[application,grant]
,,(int
,,,,(let,[budget-granted,(or,(:budget-granted,application)
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(get-in,application,[:arvio,:budget-granted]))]
,,,,,,(if,(and
,,,,,,,,,,,(get-in,grant,[:content,:multiplemaksuera],false)
,,,,,,,,,,,(or,(=,(get-in,grant,[:content,:payment-size-limit],"no-limit")
,,,,,,,,,,,,,,,,,,"no-limit")
,,,,,,,,,,,,,,,(>=,budget-granted
,,,,,,,,,,,,,,,,,,,(get-in,grant,[:content,:payment-fixed-limit],0))))
,,,,,,,(*,(/,(get-in,grant,[:content,:payment-min-first-batch],60),100.0)
,,,,,,,,,,budget-granted)
,,,,,,,budget-granted))))

(defn,create-payment-values,[application,sum,phase]
,,{:application-id,(:id,application)
,,,:application-version,(:version,application)
,,,:paymentstatus-id,"created"
,,,:batch-id,nil
,,,:payment-sum,sum
,,,:phase,phase})

(defn,create-grant-payments
,,([grant-id,phase,identity]
,,,(let,[grant,(grant-data/get-grant,grant-id)]
,,,,,(doall
,,,,,,,(map
,,,,,,,,,#(create-payment
,,,,,,,,,,,,(create-payment-values,%,(get-first-payment-sum,%,grant),phase)
,,,,,,,,,,,,identity)
,,,,,,,,,(filter
,,,,,,,,,,,valid-for-payment?
,,,,,,,,,,,(application-data/get-applications-with-evaluation-by-grant
,,,,,,,,,,,,,grant-id))))))
,,([grant-id,phase],(create-grant-payments,grant-id,phase,system-user)))
