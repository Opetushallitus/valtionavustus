(ns oph.va.virkailija.scoring-spec
  (use [clojure.tools.trace :only [trace]]
       [clojure.pprint :only [pprint]])
  (:require
    [speclj.core :refer :all]
    [oph.va.virkailija.scoring :refer :all]))

(def completely-scored-arvio-id 4)

(def partially-scored-arvio-id 5)

(def all-scores-of-avustushaku
  [{:email "robots.email@example.com",
        :last-name "Tester",
        :modified-at #inst "2015-10-09T11:56:14.820546000-00:00",
        :first-name "Robot",
        :score 0,
        :person-oid "1.person.oid.of.robot",
        :arvio-id completely-scored-arvio-id,
        :selection-criteria-index 0,
        :created-at #inst "2015-10-09T11:56:14.820546000-00:00"}
       {:email "robots.email@example.com",
        :last-name "Tester",
        :modified-at #inst "2015-10-09T11:56:16.176953000-00:00",
        :first-name "Robot",
        :score 1,
        :person-oid "1.person.oid.of.robot",
        :arvio-id completely-scored-arvio-id,
        :selection-criteria-index 1,
        :created-at #inst "2015-10-09T11:56:16.176953000-00:00"}
       {:email "timos.email@example.com",
        :last-name "Rantalaiho",
        :modified-at #inst "2015-10-09T11:59:24.301557000-00:00",
        :first-name "Timo",
        :score 2,
        :person-oid "1.person.oid.of.timo",
        :arvio-id completely-scored-arvio-id,
        :selection-criteria-index 5,
        :created-at #inst "2015-10-09T11:59:24.301557000-00:00"}
       {:email "timos.email@example.com",
        :last-name "Rantalaiho",
        :modified-at #inst "2015-10-09T12:20:52.240844000-00:00",
        :first-name "Timo",
        :score 0,
        :person-oid "1.person.oid.of.timo",
        :arvio-id partially-scored-arvio-id,
        :selection-criteria-index 0,
        :created-at #inst "2015-10-09T12:20:52.240844000-00:00"}
       {:email "timos.email@example.com",
        :last-name "Rantalaiho",
        :modified-at #inst "2015-10-09T12:20:53.965737000-00:00",
        :first-name "Timo",
        :score 0,
        :person-oid "1.person.oid.of.timo",
        :arvio-id partially-scored-arvio-id,
        :selection-criteria-index 1,
        :created-at #inst "2015-10-09T12:20:53.965737000-00:00"}
       {:email "timos.email@example.com",
        :last-name "Rantalaiho",
        :modified-at #inst "2015-10-12T07:23:04.484532000-00:00",
        :first-name "Timo",
        :score 0,
        :person-oid "1.person.oid.of.timo",
        :arvio-id completely-scored-arvio-id,
        :selection-criteria-index 0,
        :created-at #inst "2015-10-09T11:06:24.725895000-00:00"}
       {:email "timos.email@example.com",
        :last-name "Rantalaiho",
        :modified-at #inst "2015-10-12T07:23:07.066924000-00:00",
        :first-name "Timo",
        :score 0,
        :person-oid "1.person.oid.of.timo",
        :arvio-id completely-scored-arvio-id,
        :selection-criteria-index 1,
        :created-at #inst "2015-10-09T11:06:16.459785000-00:00"}
       {:email "timos.email@example.com",
        :last-name "Rantalaiho",
        :modified-at #inst "2015-10-12T07:23:07.546777000-00:00",
        :first-name "Timo",
        :score 0,
        :person-oid "1.person.oid.of.timo",
        :arvio-id completely-scored-arvio-id,
        :selection-criteria-index 2,
        :created-at #inst "2015-10-09T11:06:17.930794000-00:00"}
       {:email "timos.email@example.com",
        :last-name "Rantalaiho",
        :modified-at #inst "2015-10-12T07:23:08.184798000-00:00",
        :first-name "Timo",
        :score 0,
        :person-oid "1.person.oid.of.timo",
        :arvio-id completely-scored-arvio-id,
        :selection-criteria-index 3,
        :created-at #inst "2015-10-09T11:06:20.239248000-00:00"}
       {:email "timos.email@example.com",
        :last-name "Rantalaiho",
        :modified-at #inst "2015-10-12T07:23:08.936374000-00:00",
        :first-name "Timo",
        :score 0,
        :person-oid "1.person.oid.of.timo",
        :arvio-id completely-scored-arvio-id,
        :selection-criteria-index 4,
        :created-at #inst "2015-10-09T11:34:26.767332000-00:00"}])

(defn- find-by-arvio-id [scoring arvio-id]
  (-> (filter #(= arvio-id (:arvio-id %)) scoring)
      first))

(describe "Scoring calculation"

          (tags :server)

          (it "Calculates totals from only complete scorings"
            (let [scoring (aggregate-full-scores-by-arvio-and-user all-scores-of-avustushaku 6)]
              (should= 2 (count scoring))
              (let [aggregate-of-completely-scored-arvio (find-by-arvio-id scoring completely-scored-arvio-id)
                    user-averages (:score-averages-by-user aggregate-of-completely-scored-arvio)
                    first-user-average (first user-averages)]
                (should= completely-scored-arvio-id (:arvio-id aggregate-of-completely-scored-arvio))
                (should= 1/3 (:score-total-average aggregate-of-completely-scored-arvio))
                (should= 1 (count user-averages))
                (should= "1.person.oid.of.timo" (:person-oid first-user-average))
                (should= 1/3 (:score-average first-user-average)))))

          (it "Gives zero average and empty per-user average list for avustushaku with no complete per-user scorings"
              (let [scoring (aggregate-full-scores-by-arvio-and-user all-scores-of-avustushaku 6)]
                (should= 2 (count scoring))
                (let [aggregate-of-arvio-without-complete-scores (find-by-arvio-id scoring partially-scored-arvio-id)
                      user-averages (:score-averages-by-user aggregate-of-arvio-without-complete-scores)]
                  (should= partially-scored-arvio-id (:arvio-id aggregate-of-arvio-without-complete-scores))
                  (should= 0 (:score-total-average aggregate-of-arvio-without-complete-scores))
                  (should= 0 (count user-averages))))))

(run-specs)
