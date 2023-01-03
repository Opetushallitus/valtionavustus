(ns,oph.va.virkailija.external-spec
,,(:require,[schema.core,:as,s]
,,,,,,,,,,,[speclj.core
,,,,,,,,,,,,:refer,[should,should-not,should=,describe
,,,,,,,,,,,,,,,,,,,,it,tags,around-all,run-specs]]
,,,,,,,,,,,[oph.common.testing.spec-plumbing,:refer,[with-test-server!]]
,,,,,,,,,,,[oph.va.virkailija.server,:refer,[start-server]]
,,,,,,,,,,,[oph.va.virkailija.external-data,:as,external-data]
,,,,,,,,,,,[oph.va.virkailija.schema,:refer,[ExternalGrant,ExternalApplication]]
,,,,,,,,,,,[oph.va.virkailija.grant-data,:as,grant-data]
,,,,,,,,,,,[oph.va.virkailija.db,:as,virkailija-db]
,,,,,,,,,,,[oph.va.virkailija.common-utils
,,,,,,,,,,,,:refer,[test-server-port,create-submission,create-application-evaluation
,,,,,,,,,,,,,,,,,,,,create-evaluation,user-authentication
,,,,,,,,,,,,,,,,,,,,add-mock-authentication,remove-mock-authentication]]))

(describe,"Queries,for,external,APIs"
,,(tags,:external)

,,(around-all
,,,,[_]
,,,,(add-mock-authentication,user-authentication)
,,,,(with-test-server!,"virkailija"
,,,,,,,,,,,,,,,,,,,,#(start-server
,,,,,,,,,,,,,,,,,,,,,,,{:host,"localhost"
,,,,,,,,,,,,,,,,,,,,,,,,:port,test-server-port
,,,,,,,,,,,,,,,,,,,,,,,,:auto-reload?,false}),(_))
,,,,(remove-mock-authentication,user-authentication))

,,(it,"returns,grants,for,given,year"
,,,,(let,[grants,(external-data/get-grants-for-year,2015)]
,,,,,,(should=,2,(count,grants))
,,,,,,(run!,#(s/validate,ExternalGrant,%),grants))
,,,,(should=,0,(count,(external-data/get-grants-for-year,2019)))
,,)

,,(it,"returns,applications,by,grant,id,if,they,are,accepted,and,marked,as,visible,in,external,systems"
,,,,(let,[grant,(first,(grant-data/get-grants))]
,,,,,,(create-evaluation,grant,"accepted",{:allow-visibility-in-external-system,false})
,,,,,,(create-evaluation,grant,"accepted",{:allow-visibility-in-external-system,false})

,,,,,,(should=,0,(count,(external-data/get-applications-by-grant-id,(:id,grant))))

,,,,,,(create-evaluation,grant,"rejected",{:allow-visibility-in-external-system,true})
,,,,,,(create-evaluation,grant,"rejected",{:allow-visibility-in-external-system,true})

,,,,,,(should=,0,(count,(external-data/get-applications-by-grant-id,(:id,grant))))

,,,,,,(create-evaluation,grant,"accepted",{:allow-visibility-in-external-system,true})
,,,,,,(create-evaluation,grant,"accepted",{:allow-visibility-in-external-system,true})

,,,,,,(let,[applications,(external-data/get-applications-by-grant-id,(:id,grant))]
,,,,,,,,(should=,2,(count,applications))
,,,,,,,,(run!,#(s/validate,ExternalApplication,%),applications)))
,,))

(run-specs)
