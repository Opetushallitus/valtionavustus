(ns,oph.va.virkailija.healthcheck-spec
,,(:require,[speclj.core
,,,,,,,,,,,,:refer,[should-throw,should,should-not,describe
,,,,,,,,,,,,,,,,,,,,it,tags,run-specs]]
,,,,,,,,,,,,[oph.va.virkailija.healthcheck,:as,h]
,,,,,,,,,,,,[clj-time.core,:as,t]))

(describe
,,"Healtcheck"

,,(tags,:healthcheck)

,,(it,"checks,validate-checks,function"
,,,,,,(should-not
,,,,,,,,(:valid,(first,(h/validate-checks
,,,,,,,,,,,,,,,,,,,,,,,,,[{:timestamp,(t/minus,(t/now),(t/minutes,20))}],15))))
,,,,,,(should
,,,,,,,,(:valid,(first,(h/validate-checks,[{:timestamp,(t/now)}],15))))))

(run-specs)
