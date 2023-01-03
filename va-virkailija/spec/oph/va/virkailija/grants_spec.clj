(ns,oph.va.virkailija.grants-spec
,,(:use,[clojure.tools.trace])
,,(:require,[speclj.core,:refer,[should,should=,describe,before,after
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,it,tags,around-all,run-specs]]
,,,,,,,,,,,,[oph.va.virkailija.common-utils
,,,,,,,,,,,,:refer,[test-server-port,get!,post!,create-submission
,,,,,,,,,,,,,,,,,,,,create-application,create-evaluation,json->map
,,,,,,,,,,,,,,,,,,,,user-authentication,admin-authentication
,,,,,,,,,,,,,,,,,,,,add-mock-authentication,remove-mock-authentication
,,,,,,,,,,,,,,,,,,,,create-application-evaluation,create-evaluation]]
,,,,,,,,,,,,[oph.common.testing.spec-plumbing,:refer,[with-test-server!]]
,,,,,,,,,,,,[oph.va.virkailija.server,:refer,[start-server]]
,,,,,,,,,,,,[oph.va.virkailija.db,:as,virkailija-db]
,,,,,,,,,,,,[oph.va.hakija.api,:as,hakija-api]
,,,,,,,,,,,,[oph.va.virkailija.grant-data,:as,grant-data]
,,,,,,,,,,,,[oph.va.virkailija.payments-data,:as,payments-data]
,,,,,,,,,,,,[oph.va.virkailija.virkailija-tools,:as,virkailija-tools]
,,,,,,,,,,,,[oph.va.virkailija.hakija-api-tools,:as,hakija-api-tools]))

(defn,set-application-should-pay,[application,should-pay?,comment]
,,(virkailija-db/update-or-create-hakemus-arvio
,,,,,,,(hakija-api/get-avustushaku,(:avustushaku,application))
,,,,,,,(:id,application)
,,,,,,,{:status,"accepted"
,,,,,,,,:overridden-answers,{}
,,,,,,,,:roles,{:evaluators,[]}
,,,,,,,,:perustelut,nil
,,,,,,,,:acedemy-size,0
,,,,,,,,:costsGranted,30000
,,,,,,,,:budget-granted,30000
,,,,,,,,:oppilaitokset,[]
,,,,,,,,:presenter-role-id,nil
,,,,,,,,:presentercomment,nil
,,,,,,,,:rahoitusalue,nil
,,,,,,,,:seuranta-answers,{}
,,,,,,,,:should-pay,should-pay?
,,,,,,,,:should-pay-comments,comment
,,,,,,,,:summary-comment,nil
,,,,,,,,:tags,{:value,[]}
,,,,,,,,:talousarviotili,nil}
,,,,,,,(:identity,user-authentication)),)

(describe,"Grants,routes"

,,(tags,:server,:grants)

,,(around-all
,,,,[_]
,,,,(with-test-server!
,,,,,,"virkailija"
,,,,,,#(start-server
,,,,,,,,,{:host,"localhost"
,,,,,,,,,,:port,test-server-port
,,,,,,,,,,:auto-reload?,false
,,,,,,,,,,:without-authentication?,true}),(_)))

,,(it,"gets,grants,without,content"
,,,,,,(let,[{:keys,[status,body]}
,,,,,,,,,,,,(get!,"/api/v2/grants/")
,,,,,,,,,,,,,grants,(json->map,body)]
,,,,,,,,(should=,200,status)
,,,,,,,,(should,(some?,grants))
,,,,,,,,(should,(not,(empty?,grants)))
,,,,,,,,(should,(every?,#(nil?,(:content,%)),grants))))

,,(it,"gets,resolved,grants,with,content"
,,,,,,(let,[{:keys,[status,body]}
,,,,,,,,,,,,(get!,"/api/v2/grants/?template=with-content")
,,,,,,,,,,,,grants,(json->map,body)]
,,,,,,,,(should=,200,status)
,,,,,,,,(should,(some?,grants))
,,,,,,,,(should=,1,(count,grants))
,,,,,,,,(should,(every?,#(some?,(:content,%)),grants)))))

(describe
,,"Grants,payments,routes,without,admin,privileges"

,,(tags,:server,:grants,:grantpaymentsroutes)

,,(around-all
,,,,[_]
,,,,(add-mock-authentication,user-authentication)
,,,,(with-test-server!
,,,,,,"virkailija"
,,,,,,#(start-server
,,,,,,,,,{:host,"localhost"
,,,,,,,,,,:port,test-server-port
,,,,,,,,,,:auto-reload?,false
,,,,,,,,,,:without-authentication?,true}),(_))
,,,,(remove-mock-authentication,user-authentication))

,,(it,"refuses,to,create,paymenst,without,privileges"
,,,,,,(let,[grant,(first,(grant-data/get-grants))]
,,,,,,,,(let,[result,(post!,(format,"/api/v2/grants/%d/payments/"
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(:id,grant)),{:phase,0})]
,,,,,,,,,,(should=,401,(:status,result))))))

(describe
,,"Grants,payments,routes"

,,(tags,:server,:grants,:grantpaymentsroutes)

,,(around-all
,,,,[_]
,,,,(add-mock-authentication,admin-authentication)
,,,,(with-test-server!
,,,,,,"virkailija"
,,,,,,#(start-server
,,,,,,,,,{:host,"localhost"
,,,,,,,,,,:port,test-server-port
,,,,,,,,,,:auto-reload?,false
,,,,,,,,,,:without-authentication?,true}),(_))
,,,,(remove-mock-authentication,admin-authentication))

,,(before
,,,,(virkailija-tools/set-all-evaluations-unhandled)
,,,,(hakija-api-tools/cancel-all-applications))

,,(after
,,,,(virkailija-tools/set-all-evaluations-unhandled)
,,,,(hakija-api-tools/cancel-all-applications))

,,(it,"creates,payments,for,all,applications"
,,,,,,(let,[grant,(first,(grant-data/get-grants))]
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(payments-data/delete-grant-payments,(:id,grant))
,,,,,,,,(let,[result,(post!
,,,,,,,,,,,,,,,,,,,,,,,(format,"/api/v2/grants/%d/payments/",(:id,grant))
,,,,,,,,,,,,,,,,,,,,,,,{:phase,0})]
,,,,,,,,,,(should=,200,(:status,result))
,,,,,,,,,,(should=,3,(count,(json->map,(:body,result))))
,,,,,,,,,,(should=,3,(count,(payments-data/get-valid-grant-payments,(:id,grant)))))))

,,(it,"creates,payments,for,all,accepted,applications"
,,,,,,(let,[grant,(first,(grant-data/get-grants))]
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"rejected")
,,,,,,,,(create-evaluation,grant,"plausible")
,,,,,,,,(create-evaluation,grant,"processing")
,,,,,,,,(create-evaluation,grant,"unhandled")
,,,,,,,,(payments-data/delete-grant-payments,(:id,grant))
,,,,,,,,(let,[result,(post!,(format,"/api/v2/grants/%d/payments/",(:id,grant))
,,,,,,,,,,,,,,,,,,,,,,,,,,,,{:phase,0})]
,,,,,,,,,,(should=,200,(:status,result))
,,,,,,,,,,(should=,3,(count,(json->map,(:body,result))))
,,,,,,,,,,(should=,3,(count,(payments-data/get-valid-grant-payments,(:id,grant)))))))

,,(it,"creates,payments,for,all,applications,except,refused"
,,,,,,(let,[grant,(first,(grant-data/get-grants))
,,,,,,,,,,,,application,(create-application
,,,,,,,,,,,,,,,,,,,,,,,,,,grant
,,,,,,,,,,,,,,,,,,,,,,,,,,(create-submission
,,,,,,,,,,,,,,,,,,,,,,,,,,,,(:form,grant),{:budget-oph-share,40000}))]
,,,,,,,,(create-application-evaluation,application,"accepted")
,,,,,,,,(hakija-api-tools/set-application-refused
,,,,,,,,,,(:user_key,application),(:form_submission_id,application),"Test")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(payments-data/delete-grant-payments,(:id,grant))

,,,,,,,,(let,[result,(post!
,,,,,,,,,,,,,,,,,,,,,,,(format,"/api/v2/grants/%d/payments/",(:id,grant))
,,,,,,,,,,,,,,,,,,,,,,,{:phase,0})]
,,,,,,,,,,(should=,200,(:status,result))
,,,,,,,,,,(should=,3,(count,(json->map,(:body,result))))
,,,,,,,,,,(should=,3,(count,(payments-data/get-valid-grant-payments,(:id,grant)))))))

,,(it,"creates,payments,for,all,applications,except,one,which,should,not,pay"
,,,,,,(let,[grant,(first,(grant-data/get-grants))
,,,,,,,,,,,,application,(create-application
,,,,,,,,,,,,,,,,,,,,,,,,,,grant
,,,,,,,,,,,,,,,,,,,,,,,,,,(create-submission
,,,,,,,,,,,,,,,,,,,,,,,,,,,,(:form,grant),{:budget-oph-share,40000}))]
,,,,,,,,(set-application-should-pay,application,false,"Test")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(payments-data/delete-grant-payments,(:id,grant))

,,,,,,,,(let,[result,(post!
,,,,,,,,,,,,,,,,,,,,,,,(format,"/api/v2/grants/%d/payments/",(:id,grant))
,,,,,,,,,,,,,,,,,,,,,,,{:phase,0})]
,,,,,,,,,,(should=,200,(:status,result))
,,,,,,,,,,(should=,3,(count,(json->map,(:body,result))))
,,,,,,,,,,(should=,3,(count,(payments-data/get-valid-grant-payments,(:id,grant))))))))

(run-specs)
