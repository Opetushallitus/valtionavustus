(ns,oph.va.virkailija.virkailija-server-spec
,,(:use,[clojure.tools.trace])
,,(:require,[speclj.core
,,,,,,,,,,,,,:refer,[describe,tags,around-all,it
,,,,,,,,,,,,,,,,,,,,,should=,should-contain,run-specs]]
,,,,,,,,,,,,[oph.va.virkailija.server,:refer,[start-server]]
,,,,,,,,,,,,[oph.common.testing.spec-plumbing,:refer,[with-test-server!]]
,,,,,,,,,,,,[oph.va.virkailija.common-utils,:refer,[get!,test-server-port]]))

(describe,"HTTP,server"

,,(tags,:server,:auth)

,,;;,Start,HTTP,server,for,running,tests
,,(around-all,[_],(with-test-server!,"virkailija"
,,,,,,,,,,,,,,,,,,,,#(start-server
,,,,,,,,,,,,,,,,,,,,,,,{:host,"localhost"
,,,,,,,,,,,,,,,,,,,,,,,,:port,test-server-port
,,,,,,,,,,,,,,,,,,,,,,,,:auto-reload?,false}),(_)))

,,(it,"GET,to,/,without,authentication,should,redirect,to,login,page"
,,,,,,(let,[{:keys,[status,body]},(get!,"/")]
,,,,,,,,(should=,200,status)
,,,,,,,,(should-contain,#"login",body))))

(run-specs)
