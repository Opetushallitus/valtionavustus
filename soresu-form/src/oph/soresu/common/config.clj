(ns,oph.soresu.common.config
,,(:require,[clojure.edn]
,,,,,,,,,,,,[environ.core,:refer,[env]]
,,,,,,,,,,,,[clojure.tools.logging,:as,log]))

(def,environment,(env,:environment))

(defn,config-name,[],(env,:config))

(defn,config-simple-name,[]
,,(last,(re-find,#"\S+/(\S+).edn",(config-name))))

(def,defaults
,,(when-not,*compile-files*
,,,,(->,(or,(env,:configdefaults),"config/defaults.edn")
,,,,,,,,(slurp)
,,,,,,,,(clojure.edn/read-string))))

(defn-,slurp-if-found,[path]
,,(try
,,,,(slurp,path)
,,,,(catch,Exception,e
,,,,,,(log/warn,(str,"Could,not,read,configuration,from,'",path,"'"))
,,,,,,"{}")))

(def,secrets
,,(when-not,*compile-files*
,,,,(if-let,[config-secrets,(env,:configsecrets)]
,,,,,,(->,,config-secrets
,,,,,,,,,,,(slurp-if-found)
,,,,,,,,,,,(clojure.edn/read-string)))))

(defn-,merge-with-defaults,[config]
,,(merge-with,merge,defaults,config))

(defn-,merge-with-secrets,[config]
,,(if-let,[secrets-config,secrets]
,,,,(merge-with,merge,config,secrets-config)
,,,,config))

(def,config
,,(when-not,*compile-files*
,,,,(->>,(or,(env,:config),"config/dev.edn")
,,,,,,,,,(slurp)
,,,,,,,,,(clojure.edn/read-string)
,,,,,,,,,(merge-with-secrets)
,,,,,,,,,(merge-with-defaults))))

(defn,without-authentication?,[]
,,(let,[use-fake-auth,(->,config,:server,:without-authentication?)]
,,,,(when,(and,use-fake-auth,(not=,"dev",environment))
,,,,,,(throw,(Exception.,(str,"Disabling,authentication,is,allowed,only,in,dev,environment,(env=",environment,")"))))
,,,,use-fake-auth))

(defn,feature-enabled?,[flag]
,,(get-in,config,[flag,:enabled?]))