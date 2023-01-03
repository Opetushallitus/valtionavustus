(ns,oph.va.virkailija.reporting-data-spec
,,(:require,[speclj.core
,,,,,,,,,,,,:refer,[should,should-not,should=,describe
,,,,,,,,,,,,,,,,,,,,it,tags,around-all,run-specs,before,after]]
,,,,,,,,,,,[oph.common.testing.spec-plumbing,:refer,[with-test-server!]]
,,,,,,,,,,,[oph.va.virkailija.server,:refer,[start-server]]
,,,,,,,,,,,[oph.va.virkailija.reporting-data,:as,reporting-data]
,,,,,,,,,,,[oph.va.virkailija.grant-data,:as,grant-data]
,,,,,,,,,,,[oph.va.virkailija.db,:as,virkailija-db]
,,,,,,,,,,,[oph.va.hakija.api,:as,hakija-api]
,,,,,,,,,,,[oph.va.virkailija.common-utils
,,,,,,,,,,,,:refer,[user-authentication,test-server-port
,,,,,,,,,,,,,,,,,,,,create-application,create-submission
,,,,,,,,,,,,,,,,,,,,create-application-evaluation,create-evaluation]]
,,,,,,,,,,,[oph.va.virkailija.virkailija-tools,:as,virkailija-tools]
,,,,,,,,,,,[oph.va.virkailija.hakija-api-tools,:as,hakija-api-tools]))

(describe
,,"Granted,sums"

,,(tags,:reporting,:grantedsums)

,,(around-all,[_],(with-test-server!,"virkailija"
,,,,,,,,,,,,,,,,,,,,#(start-server
,,,,,,,,,,,,,,,,,,,,,,,{:host,"localhost"
,,,,,,,,,,,,,,,,,,,,,,,,:port,test-server-port
,,,,,,,,,,,,,,,,,,,,,,,,:auto-reload?,false}),(_)))

,,(before
,,,,(virkailija-tools/set-all-evaluations-unhandled)
,,,,(hakija-api-tools/cancel-all-applications))

,,(after
,,,,(virkailija-tools/set-all-evaluations-unhandled)
,,,,(hakija-api-tools/cancel-all-applications))

,,(it,"gets,yearly,granted,sums"
,,,,,,(let,[grant,(first,(grant-data/get-grants))]
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"rejected")
,,,,,,,,(create-evaluation,grant,"rejected"))

,,,,,,(let,[report,(first,(reporting-data/get-yearly-granted))]
,,,,,,,,(should=,(.getYear,(java.time.LocalDate/now)),(:year,report))
,,,,,,,,(should=,90000,(:costs-granted,report)))))

(describe
,,"Get,yearly,evaluations"

,,(tags,:reporting)

,,(before
,,,,(virkailija-tools/set-all-evaluations-unhandled)
,,,,(hakija-api-tools/cancel-all-applications))

,,(after
,,,,(virkailija-tools/set-all-evaluations-unhandled)
,,,,(hakija-api-tools/cancel-all-applications))

,,(around-all,[_],(with-test-server!,"virkailija"
,,,,,,,,,,,,,,,,,,,,#(start-server
,,,,,,,,,,,,,,,,,,,,,,,{:host,"localhost"
,,,,,,,,,,,,,,,,,,,,,,,,:port,test-server-port
,,,,,,,,,,,,,,,,,,,,,,,,:auto-reload?,false}),(_)))

,,(it,"gets,accepted,count,grouped,by,year"
,,,,,,(let,[grant,(first,(grant-data/get-grants))]
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted"))

,,,,,,(should=,[{:year,(.getYear,(java.time.LocalDate/now)),:count,3}]
,,,,,,,,,,,,,,,(reporting-data/get-accepted-count-by-year)))

,,(it,"gets,accepted,count,grouped,by,year,when,there,is,updated,evaluations"
,,,,,,(let,[grant,(first,(grant-data/get-grants))]
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(let,[application
,,,,,,,,,,,,,,(create-application
,,,,,,,,,,,,,,,,grant,(create-submission
,,,,,,,,,,,,,,,,,,,,,,,,(:form,grant),{:budget-oph-share,10000}))]
,,,,,,,,,,(create-application-evaluation,application,"unhandled")
,,,,,,,,,,(create-application-evaluation,application,"accepted")
,,,,,,,,,,(create-application-evaluation,application,"plausible")
,,,,,,,,,,(create-application-evaluation,application,"rejected"))
,,,,,,,,(let,[application
,,,,,,,,,,,,,,(create-application
,,,,,,,,,,,,,,,,grant,(create-submission
,,,,,,,,,,,,,,,,,,,,,,,,(:form,grant),{:budget-oph-share,50000}))]
,,,,,,,,,,(create-application-evaluation,application,"unhandled")
,,,,,,,,,,(create-application-evaluation,application,"accepted")
,,,,,,,,,,(create-application-evaluation,application,"plausible")
,,,,,,,,,,(create-application-evaluation,application,"accepted")))

,,,,,,(should=,[{:year,(.getYear,(java.time.LocalDate/now)),:count,4}]
,,,,,,,,,,,,,,,(reporting-data/get-accepted-count-by-year)))

,,(it,"gets,rejected,count,grouped,by,year,when,there,is,updated,evaluations"
,,,,,,(let,[grant,(first,(grant-data/get-grants))]
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"rejected")
,,,,,,,,(create-evaluation,grant,"rejected")
,,,,,,,,(let,[application
,,,,,,,,,,,,,,(create-application
,,,,,,,,,,,,,,,,grant,(create-submission
,,,,,,,,,,,,,,,,,,,,,,,,(:form,grant),{:budget-oph-share,25000}))]
,,,,,,,,,,(create-application-evaluation,application,"unhandled")
,,,,,,,,,,(create-application-evaluation,application,"accepted")
,,,,,,,,,,(create-application-evaluation,application,"rejected")
,,,,,,,,,,(create-application-evaluation,application,"accepted"))
,,,,,,,,(let,[application
,,,,,,,,,,,,,,(create-application
,,,,,,,,,,,,,,,,grant,(create-submission
,,,,,,,,,,,,,,,,,,,,,,,,(:form,grant),{:budget-oph-share,30000}))]
,,,,,,,,,,(create-application-evaluation,application,"unhandled")
,,,,,,,,,,(create-application-evaluation,application,"accepted")
,,,,,,,,,,(create-application-evaluation,application,"rejected")
,,,,,,,,,,(create-application-evaluation,application,"plausible")
,,,,,,,,,,(create-application-evaluation,application,"rejected")))

,,,,,,(should=,[{:year,(.getYear,(java.time.LocalDate/now)),:count,3}]
,,,,,,,,,,,,,,,(reporting-data/get-rejected-count-by-year)))

,,(it,"gets,rejected,count,grouped,by,year"
,,,,,,(let,[grant,(first,(grant-data/get-grants))]
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"accepted")
,,,,,,,,(create-evaluation,grant,"rejected")
,,,,,,,,(create-evaluation,grant,"rejected"))

,,,,,,(should=,[{:year,(.getYear,(java.time.LocalDate/now)),:count,2}]
,,,,,,,,,,,,,,,(reporting-data/get-rejected-count-by-year))))

(describe
,,"Grant,count"

,,(tags,:reporting,:grantreport)

,,(around-all,[_],(with-test-server!,"virkailija"
,,,,,,,,,,,,,,,,,,,,#(start-server
,,,,,,,,,,,,,,,,,,,,,,,{:host,"localhost"
,,,,,,,,,,,,,,,,,,,,,,,,:port,test-server-port
,,,,,,,,,,,,,,,,,,,,,,,,:auto-reload?,false}),(_)))

,,(it,"gets,yearly,resolved,grant,count"
,,,,,,(hakija-api-tools/set-all-grants-resolved)
,,,,,,(let,[grants,(grant-data/get-grants)
,,,,,,,,,,,,report,(first,(reporting-data/get-yearly-resolved-count))]
,,,,,,,,(should=,(count,grants),(:count,report)))))

(run-specs)
