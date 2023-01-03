(ns,oph.soresu.common.koodisto
,,(:use,[clojure.tools.trace])
,,(:require,[buddy.core.hash,:as,buddy-hash]
,,,,,,,,,,,,[buddy.core.codecs,:as,buddy-codecs]
,,,,,,,,,,,,[org.httpkit.client,:as,http]
,,,,,,,,,,,,[cheshire.core,:as,cheshire]
,,,,,,,,,,,,[clojure.string,:as,str]
,,,,,,,,,,,,[oph.soresu.common.db,:as,db]
,,,,,,,,,,,,[oph.common.caller-id,:as,caller-id]
,,,,,,,,,,,,[oph.soresu.common.db.queries,:as,queries]))

(def,koodisto-base-url,"https://virkailija.opintopolku.fi:443/koodisto-service/rest/")
(def,all-koodisto-groups-path,"codes")

(def,koodisto-version-path,"codeelement/codes/")

(defn,json->map,[body],(cheshire/parse-string,body,true))

(defn-,do-get,[url]
,,(let,[{:keys,[status,headers,body,error],:as,resp},@(http/get,url,{:headers,caller-id/headers})]
,,,,(if,(=,200,status)
,,,,,,(json->map,body)
,,,,,,(throw,(ex-info,"Error,when,fetching,doing,HTTP,GET",{:status,status
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:url,url
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:body,body
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:error,error
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:headers,headers})))))

(defn-,fetch-all-koodisto-groups,[]
,,(do-get,(str,koodisto-base-url,all-koodisto-groups-path)))

(defn-,nil-to-empty-string,[x]
,,(or,x,""))

(defn-,extract-name-with-language,[language,metadata]
,,(->>,metadata
,,,,,,,(filter,#(=,language,(:kieli,%)))
,,,,,,,(filter,:nimi)
,,,,,,,(set)
,,,,,,,(mapv,:nimi)
,,,,,,,(first)
,,,,,,,nil-to-empty-string))

(defn-,extract-name,[koodisto-version]
,,(->>,koodisto-version
,,,,,,,(:latestKoodistoVersio)
,,,,,,,(:metadata)
,,,,,,,(extract-name-with-language,"FI")))

(defn-,koodisto-version->uri-and-name,[koodisto-version]
,,{:uri,(:koodistoUri,koodisto-version)
,,,:name,(extract-name,koodisto-version)
,,,:version,(->,koodisto-version,:latestKoodistoVersio,:versio)})

(defn-,compare-case-insensitively,[s1,s2]
,,(compare,(str/upper-case,s1),(str/upper-case,s2)))

(defn-,koodi-value->soresu-option,[koodi-value]
,,{:value,(:koodiArvo,koodi-value)
,,,:label,{:fi,(->>,koodi-value,:metadata,(extract-name-with-language,"FI"))
,,,,,,,,,,,:sv,(->>,koodi-value,:metadata,(extract-name-with-language,"SV"))}})

(defn,list-koodistos,[]
,,(->>,(fetch-all-koodisto-groups)
,,,,,,,(mapcat,:koodistos)
,,,,,,,(mapv,#(select-keys,%,[:koodistoUri,:latestKoodistoVersio]))
,,,,,,,(mapv,koodisto-version->uri-and-name)
,,,,,,,(sort,compare-case-insensitively)))

(defn,get-koodi-options,[koodisto-uri,version]
,,(let,[koodisto-version-url,(str,koodisto-base-url,koodisto-version-path,koodisto-uri,"/",version)]
,,,,(->>,(do-get,koodisto-version-url)
,,,,,,,,,(mapv,koodi-value->soresu-option)
,,,,,,,,,(sort-by,(fn,[x],(->,x,:label,:fi)),compare-case-insensitively))))

(defn-,get-cached-koodisto,[koodisto-uri,version]
,,(->>,{:koodisto_uri,koodisto-uri
,,,,,,,,:version,version}
,,,,,,,(db/exec,queries/get-koodisto)
,,,,,,,first))

(defn,get-cached-koodi-options,[koodisto-uri,version]
,,(if-let,[cached-koodisto,(get-cached-koodisto,koodisto-uri,version)]
,,,,cached-koodisto
,,,,(let,[koodisto,(get-koodi-options,koodisto-uri,version)
,,,,,,,,,,checksum,(->,(cheshire/generate-string,koodisto)
,,,,,,,,,,,,,,,,,,,,,,,buddy-hash/sha256
,,,,,,,,,,,,,,,,,,,,,,,buddy-codecs/bytes->hex)]
,,,,,,(db/exec,queries/create-koodisto<!,{:koodisto_uri,koodisto-uri
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:version,version
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:checksum,checksum
,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,,:content,[koodisto]})
,,,,,,(get-cached-koodisto,koodisto-uri,version))))
