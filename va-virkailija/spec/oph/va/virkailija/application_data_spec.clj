(ns,oph.va.virkailija.application-data-spec
,,(:require,[speclj.core
,,,,,,,,,,,,:refer,[should,should-not,should=,describe
,,,,,,,,,,,,,,,,,,,,it,tags,around-all,run-specs]]
,,,,,,,,,,,[oph.common.testing.spec-plumbing,:refer,[with-test-server!]]
,,,,,,,,,,,[oph.va.virkailija.server,:refer,[start-server]]
,,,,,,,,,,,[oph.va.virkailija.grant-data,:as,grant-data]
,,,,,,,,,,,[oph.va.virkailija.application-data,:as,application-data]
,,,,,,,,,,,[oph.va.virkailija.payments-data,:as,payments-data]
,,,,,,,,,,,[oph.va.virkailija.common-utils
,,,,,,,,,,,,:refer,[test-server-port,create-submission,create-application
,,,,,,,,,,,,,,,,,,,,create-application-evaluation]]))

(def,user,{:person-oid,"12345"
,,,,,,,,,,,:first-name,"Test"
,,,,,,,,,,,:surname,"User"})

(describe
,,"Revoke,all,application,tokens"

,,(tags,:applicationtokens)

,,(around-all,[_],(with-test-server!,"virkailija"
,,,,,,,,,,,,,,,,,,,,#(start-server
,,,,,,,,,,,,,,,,,,,,,,,{:host,"localhost"
,,,,,,,,,,,,,,,,,,,,,,,,:port,test-server-port
,,,,,,,,,,,,,,,,,,,,,,,,:auto-reload?,false}),(_)))

,,(it,"revokes,application,token,of,application,with,active,token"
,,,,,,(let,[grant,(first,(grant-data/get-grants))
,,,,,,,,,,,,submission,(create-submission,(:form,grant),{})
,,,,,,,,,,,,application,(create-application,grant,submission)
,,,,,,,,,,,,token,(application-data/get-application-token,(:id,application))
,,,,,,,,,,,,revoked-tokens,(application-data/revoke-application-tokens
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(:id,application))]
,,,,,,,,(should=,token,(:token,(first,revoked-tokens)))
,,,,,,,,(should,(empty?,(application-data/get-application-token
,,,,,,,,,,,,,,,,,,,,,,,,,,(:id,application))))))

,,(it,"does,not,revoke,any,tokens,when,there,is,no,tokens"
,,,,,,(let,[grant,(first,(grant-data/get-grants))
,,,,,,,,,,,,submission,(create-submission,(:form,grant),{})
,,,,,,,,,,,,application,(create-application,grant,submission)]
,,,,,,,,(application-data/revoke-application-tokens,(:id,application))
,,,,,,,,(should,(empty?,(application-data/get-application-token
,,,,,,,,,,,,,,,,,,,,,,,,,,(:id,application))))
,,,,,,,,(should,(empty?,(application-data/revoke-application-tokens
,,,,,,,,,,,,,,,,,,,,,,,,,,(:id,application)))))))


(describe
,,"Get,applications"

,,(tags,:applications,:getapplications)

,,(around-all,[_],(with-test-server!,"virkailija"
,,,,,,,,,,,,,,,,,,,,#(start-server
,,,,,,,,,,,,,,,,,,,,,,,{:host,"localhost"
,,,,,,,,,,,,,,,,,,,,,,,,:port,test-server-port
,,,,,,,,,,,,,,,,,,,,,,,,:auto-reload?,false}),(_)))

,,(it,"find,application,by,register,number"
,,,,,,(let,[grant,(first,(grant-data/get-grants))
,,,,,,,,,,,,submission,(create-submission,(:form,grant),{})
,,,,,,,,,,,,application,(create-application,grant,submission)]
,,,,,,,,(should=
,,,,,,,,,,(select-keys,application,[:id,:version])
,,,,,,,,,,(select-keys,(application-data/find-application-by-register-number
,,,,,,,,,,,,,(:register_number,application))
,,,,,,,,,,,,,,,,,,,,,,,[:id,:version])))))

(describe
,,"Get,application,payments"

,,(tags,:applications,:applicationpayments)

,,(around-all,[_],(with-test-server!,"virkailija"
,,,,,,,,,,,,,,,,,,,,#(start-server
,,,,,,,,,,,,,,,,,,,,,,,{:host,"localhost"
,,,,,,,,,,,,,,,,,,,,,,,,:port,test-server-port
,,,,,,,,,,,,,,,,,,,,,,,,:auto-reload?,false}),(_)))

,,(it,"gets,application,unsent,payment"
,,,,,,(let,[grant,(first,(grant-data/get-grants))
,,,,,,,,,,,,submission,(create-submission,(:form,grant),{})
,,,,,,,,,,,,application,(create-application,grant,submission)
,,,,,,,,,,,,payment,(payments-data/create-payment
,,,,,,,,,,,,,,,,,,,,,,{:application-id,(:id,application)
,,,,,,,,,,,,,,,,,,,,,,,:payment-sum,26000
,,,,,,,,,,,,,,,,,,,,,,,:batch-id,nil
,,,,,,,,,,,,,,,,,,,,,,,:paymentstatus-id,"created"
,,,,,,,,,,,,,,,,,,,,,,,:phase,0}
,,,,,,,,,,,,,,,,,,,,,,user)
,,,,,,,,,,,,unsent-payments,(application-data/get-application-unsent-payments
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(:id,application))
,,,,,,,,,,,,unsent,(first,unsent-payments)]
,,,,,,,,(should=,1,(count,unsent-payments))
,,,,,,,,(should=,(:id,application),(:application-id,unsent))
,,,,,,,,(should=,26000,(:payment-sum,unsent))
,,,,,,,,(should=,0,(:version,unsent))))

,,(it,"gets,application,unsent,payment,with,multiple,versions"
,,,,,,(let,[grant,(first,(grant-data/get-grants))
,,,,,,,,,,,,submission,(create-submission,(:form,grant),{})
,,,,,,,,,,,,application,(create-application,grant,submission)
,,,,,,,,,,,,payment,(payments-data/create-payment
,,,,,,,,,,,,,,,,,,,,,,{:application-id,(:id,application)
,,,,,,,,,,,,,,,,,,,,,,,:payment-sum,26000
,,,,,,,,,,,,,,,,,,,,,,,:batch-id,nil
,,,,,,,,,,,,,,,,,,,,,,,:paymentstatus-id,"created"
,,,,,,,,,,,,,,,,,,,,,,,:phase,0}
,,,,,,,,,,,,,,,,,,,,,,user)
,,,,,,,,,,,,updated,(payments-data/update-payment
,,,,,,,,,,,,,,,,,,,,,,(assoc,payment
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:payment-sum,27000
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:filename,"file.xml")
,,,,,,,,,,,,,,,,,,,,,,user)
,,,,,,,,,,,,updated-unsent-payments
,,,,,,,,,,,,(application-data/get-application-unsent-payments
,,,,,,,,,,,,,,(:id,application))
,,,,,,,,,,,,updated-unsent,(first,updated-unsent-payments)]
,,,,,,,,(should=,1,(count,updated-unsent-payments))
,,,,,,,,(should=,(:id,application),(:application-id,updated-unsent))
,,,,,,,,(should=,27000,(:payment-sum,updated-unsent))
,,,,,,,,(should=,1,(:version,updated-unsent))))

,,(it,"gets,no,application,unsent,payment"
,,,,,,(let,[grant,(first,(grant-data/get-grants))
,,,,,,,,,,,,submission,(create-submission,(:form,grant),{})
,,,,,,,,,,,,application,(create-application,grant,submission)
,,,,,,,,,,,,payment,(payments-data/create-payment
,,,,,,,,,,,,,,,,,,,,,,{:application-id,(:id,application)
,,,,,,,,,,,,,,,,,,,,,,,:payment-sum,26000
,,,,,,,,,,,,,,,,,,,,,,,:batch-id,nil
,,,,,,,,,,,,,,,,,,,,,,,:paymentstatus-id,"created"
,,,,,,,,,,,,,,,,,,,,,,,:phase,0}
,,,,,,,,,,,,,,,,,,,,,,user)
,,,,,,,,,,,,updated,(payments-data/update-payment
,,,,,,,,,,,,,,,,,,,,,,(assoc,payment,:paymentstatus-id,"sent",:filename,"file.xml"),user)]
,,,,,,,,(should=,0,(count,(application-data/get-application-unsent-payments
,,,,,,,,,,,,,,,,,,,,,,,,,,,,(:id,application)))))))

(describe
,,"Get,open,applications"

,,(tags,:applications,:openapplications)

,,(around-all,[_],(with-test-server!,"virkailija"
,,,,,,,,,,,,,,,,,,,,#(start-server
,,,,,,,,,,,,,,,,,,,,,,,{:host,"localhost"
,,,,,,,,,,,,,,,,,,,,,,,,:port,test-server-port
,,,,,,,,,,,,,,,,,,,,,,,,:auto-reload?,false}),(_)))
,,(it,"gets,open,applications"
,,,,,,(let,[grant,(first,(grant-data/get-grants))
,,,,,,,,,,,,submission,(create-submission,(:form,grant),{})
,,,,,,,,,,,,application,(create-application,grant,submission)]
,,,,,,,,(create-application-evaluation,application,"accepted")
,,,,,,,,(let,[application-count,(count
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(application-data/get-open-applications))]
,,,,,,,,,,(create-application-evaluation
,,,,,,,,,,,,(create-application
,,,,,,,,,,,,,,grant
,,,,,,,,,,,,,,(create-submission,(:form,grant),{}))
,,,,,,,,,,,,"accepted")

,,,,,,,,,,(should=
,,,,,,,,,,,,(count,(application-data/get-open-applications))
,,,,,,,,,,,,(inc,application-count)))))

,,(it,"checks,if,application,is,accepted"
,,,,,,(let,[grant,(first,(grant-data/get-grants))
,,,,,,,,,,,,submission,(create-submission,(:form,grant),{})
,,,,,,,,,,,,application,(create-application,grant,submission)]
,,,,,,,,(create-application-evaluation,application,"accepted")
,,,,,,,,(should,(application-data/accepted?,application)))))

(run-specs)
