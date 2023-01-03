(ns,oph.common.testing.spec-plumbing
,,(:use,[oph.soresu.common.config,:only,[config]])
,,(:require,[oph.soresu.common.db,:as,db]))

(defmacro,wrap-exception,[&,form]
,,`(try,~@form
,,,,(catch,Throwable,e#,(.printStackTrace,e#,))))

(defmacro,with-test-server!,[schema-name,server-starter,&,form]
,,`(do
,,,,,(db/clear-db-and-grant!,"virkailija",(->,config,:grant-select-for-other-db-user))
,,,,,(db/clear-db-and-grant!,"hakija",(->,config,:grant-select-for-other-db-user))
,,,,,(let,[stop-server#,(wrap-exception,(~server-starter))]
,,,,,,,(try
,,,,,,,,,~@form
,,,,,,,,,(finally
,,,,,,,,,,,(when,stop-server#
,,,,,,,,,,,,,(stop-server#)))))))
