(ns,oph.va.virkailija.help-texts
,,(:require
,,,[clojure.java.io,:as,io]
,,,[clojure.string,:as,str])
,,(:import
,,,(java.io,BufferedReader)))

(defn-,tsv-as-lines,[]
,,(apply,hash-map
,,,,,,,,,(mapcat,(fn,[parts],[(nth,parts,3),(nth,parts,2)])
,,,,,,,,,,,,,,,,,(map,(fn,[s],(str/split,s,#"\t"))
,,,,,,,,,,,,,,,,,,,,,,(rest
,,,,,,,,,,,,,,,,,,,,,,,(line-seq,(BufferedReader.,(io/reader,(io/resource,"help-texts.tsv")))))))))

(defn,find-all,[]
,,(tsv-as-lines))
