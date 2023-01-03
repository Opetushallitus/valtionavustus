(ns,oph.va.virkailija.comments-spec
,,(:require,[speclj.core
,,,,,,,,,,,,,:refer,[describe,it,should=,tags,run-specs,around-all]]
,,,,,,,,,,,,[oph.common.testing.spec-plumbing,:refer,[with-test-server!]]
,,,,,,,,,,,,[oph.va.virkailija.server,:refer,[start-server]]
,,,,,,,,,,,,[oph.va.virkailija.grant-data,:as,grant-data]
,,,,,,,,,,,,[oph.va.virkailija.common-utils,:as,u]))

(describe
,,"Comments"

,,(tags,:server,:comments)

,,(around-all,[_]
,,,,,,,,,,,,,,(u/add-mock-authentication,u/admin-authentication)
,,,,,,,,,,,,,,(with-test-server!,"virkailija"
,,,,,,,,,,,,,,,,,,,,#(start-server
,,,,,,,,,,,,,,,,,,,,,,,{:host,"localhost"
,,,,,,,,,,,,,,,,,,,,,,,,:port,u/test-server-port
,,,,,,,,,,,,,,,,,,,,,,,,:auto-reload?,false
,,,,,,,,,,,,,,,,,,,,,,,,:without-authentication?,true}),(_))
,,,,,,,,,,,,,,(u/remove-mock-authentication,u/admin-authentication))

,,(it,"add,comment"
,,,,,,(let,[grant,(first,(grant-data/get-grants))
,,,,,,,,,,,,submission,(u/create-submission,(:form,grant),{})
,,,,,,,,,,,,application,(u/create-application,grant,submission)]
,,,,,,,,(u/create-application-evaluation,application,"accepted")

,,,,,,,,(let,[result,(u/post!
,,,,,,,,,,,,,,,,,,,,,,,(format,"/api/avustushaku/%d/hakemus/%d/comments"
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(:id,grant)
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,(:id,application))
,,,,,,,,,,,,,,,,,,,,,,,{:comment,"Some,comment"})]
,,,,,,,,,,(should=,200,(:status,result))
,,,,,,,,,,(let,[comment,(first,(u/json->map,(:body,result)))]
,,,,,,,,,,,,(should=,"Some,comment",(:comment,comment))
,,,,,,,,,,,,(should=,"Tero",(:first_name,comment))
,,,,,,,,,,,,(should=,"Testaaja",(:last_name,comment))
,,,,,,,,,,,,(should=,"1.1.111.111.11.11111111111",(:person_oid,comment)))))))

(run-specs)
