(ns,oph.va.hakija.server
,,(:use,[oph.va.hakija.routes,:only,[all-routes,restricted-routes]])
,,(:require,[ring.middleware.reload,:refer,[wrap-reload]]
,,,,,,,,,,,,[ring.middleware.not-modified,:refer,[wrap-not-modified]]
,,,,,,,,,,,,[ring.middleware.defaults,:refer,:all]
,,,,,,,,,,,,[buddy.auth.middleware,:refer,[wrap-authentication]]
,,,,,,,,,,,,[clojure.tools.logging,:as,log]
,,,,,,,,,,,,[oph.common.background-job-supervisor,:as,job-supervisor]
,,,,,,,,,,,,[oph.common.server,:as,server]
,,,,,,,,,,,,[oph.soresu.common.config,:refer,[config]]
,,,,,,,,,,,,[oph.soresu.common.db,:as,db]
,,,,,,,,,,,,[oph.va.hakija.db.migrations,:as,dbmigrations]
,,,,,,,,,,,,[oph.va.virkailija.db.migrations,:as,virkailija-dbmigrations]
,,,,,,,,,,,,[oph.va.hakija.email,:as,email]
,,,,,,,,,,,,[oph.va.hakija.officer-edit-auth,:refer,[officer-edit-auth-backend]]))

(defn-,startup,[config]
,,(log/info,"Startup,,with,configuration:",config)
,,(dbmigrations/migrate,"db.migration.hakija"
,,,,,,,,,,,,,,,,,,,,,,,,"oph.va.hakija.db.migrations")
,,(virkailija-dbmigrations/migrate,"db.migration.virkailija"
,,,,,,,,,,,,,,,,,,,,,,,,"oph.va.virkailija.db.migrations")
,,(email/start-background-job-send-mails))

(defn-,shutdown,[]
,,(log/info,"Shutting,down...")
,,(email/stop-background-job-send-mails)
,,(job-supervisor/await-jobs!)
,,(db/close-datasource!))

(defn-,create-restricted-routes,[],#'restricted-routes)
(defn-,create-all-routes,[],#'all-routes)

(defn-,create-routes,[]
,,(if,(->,config,:api,:restricted-routes?)
,,,,(create-restricted-routes)
,,,,(do
,,,,,,(log/warn,"Enabling,all,routes.,This,setting,should,be,used,only,in,development!")
,,,,,,(create-all-routes))))

(defn-,drop-last-char,[s]
,,(clojure.string/join,"",(drop-last,s)))

(defn,start-server,[host,port,auto-reload?]
,,(let,[defaults,(assoc-in,site-defaults,[:security,:anti-forgery],false)
,,,,,,,,csp-url,(str,(drop-last-char,(->,config,:server,:url,:fi)),",",(drop-last-char,(->,config,:server,:url,:sv)))
,,,,,,,,handler,(as->,(create-routes),h
,,,,,,,,,,,,,,,,,,(wrap-defaults,h,defaults)
,,,,,,,,,,,,,,,,,,(server/wrap-logger,h)
,,,,,,,,,,,,,,,,,,(server/wrap-cache-control,h)
,,,,,,,,,,,,,,,,,,(server/wrap-csp-when-enabled,h,csp-url,nil)
,,,,,,,,,,,,,,,,,,(server/wrap-hsts-when-enabled,h)
,,,,,,,,,,,,,,,,,,(wrap-authentication,h,officer-edit-auth-backend)
,,,,,,,,,,,,,,,,,,(wrap-not-modified,h)
,,,,,,,,,,,,,,,,,,(if,auto-reload?
,,,,,,,,,,,,,,,,,,,,(wrap-reload,h,{:dirs,["va-hakija/src","soresu-form/src"]})
,,,,,,,,,,,,,,,,,,,,h))
,,,,,,,,threads,(or,(->,config,:server,:threads),16)
,,,,,,,,attachment-max-size,(or,(->,config,:server,:attachment-max-size),50)]
,,,,(server/start-server,{:host,host
,,,,,,,,,,,,,,,,,,,,,,,,,,:port,port
,,,,,,,,,,,,,,,,,,,,,,,,,,:auto-reload?,auto-reload?
,,,,,,,,,,,,,,,,,,,,,,,,,,:routes,handler
,,,,,,,,,,,,,,,,,,,,,,,,,,:on-startup,(partial,startup,config)
,,,,,,,,,,,,,,,,,,,,,,,,,,:on-shutdown,shutdown
,,,,,,,,,,,,,,,,,,,,,,,,,,:threads,threads
,,,,,,,,,,,,,,,,,,,,,,,,,,:attachment-max-size,attachment-max-size})))
