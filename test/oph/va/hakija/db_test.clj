(ns oph.va.hakija.db-test
  (:require [clojure.test :refer [deftest is testing]]
            [oph.va.hakija.db :as hakija-db]))

(defn- row [index name contactperson email role]
  (let [prefix (str "other-organizations.other-organizations-" index)]
    {:key (str "other-organizations-" index)
     :value (cond-> [{:key (str prefix ".name") :value name}
                     {:key (str prefix ".contactperson") :value contactperson}
                     {:key (str prefix ".email") :value email}]
              role (conj {:key (str prefix ".role") :value role}))}))

(defn- answers-with [& rows]
  {:value [{:key "other-organizations" :value (vec rows)}]})

(def answers
  (answers-with (row 1 "Eka Oy" "Eka Henkilö" "eka@eka.fi" "Ekan rooli")
                (row 2 "Toka Oy" "Toka Henkilö" "toka@toka.fi" "Tokan rooli")
                (row 3 "" "" "" "")))

(deftest extract-yhteishanke-organizations-test
  (testing "extracts role alongside the base fields and drops blank rows"
    (let [organizations (hakija-db/extract-yhteishanke-organizations answers)]
      (is (= 2 (count organizations)))
      (is (= {:organization-name "Eka Oy"
              :contact-person "Eka Henkilö"
              :email "eka@eka.fi"
              :role "Ekan rooli"}
             (first organizations)))))

  (testing "role is nil when the form has no role field"
    (let [organizations (hakija-db/extract-yhteishanke-organizations
                         (answers-with (row 1 "Eka Oy" "Eka Henkilö" "eka@eka.fi" nil)))]
      (is (nil? (:role (first organizations)))))))

(deftest answers-have-yhteishanke-role-test
  (is (true? (hakija-db/answers-have-yhteishanke-role? answers)))
  (is (false? (hakija-db/answers-have-yhteishanke-role?
               (answers-with (row 1 "Eka Oy" "Eka Henkilö" "eka@eka.fi" nil)))))
  (is (false? (hakija-db/answers-have-yhteishanke-role? {:value []}))))

(deftest merge-legacy-roles-test
  (let [legacy [{:organization-name "Eka Oy" :contact-person "Eka Henkilö" :email "eka@eka.fi" :role nil}
                {:organization-name "Toka Oy" :contact-person "Toka Henkilö" :email "toka@toka.fi" :role nil}]]
    (testing "fills nil roles from answers by organization name"
      (is (= ["Ekan rooli" "Tokan rooli"]
             (map :role (hakija-db/merge-legacy-roles legacy answers)))))

    (testing "an organization missing from the answers keeps a nil role"
      (let [answers (answers-with (row 1 "Toka Oy" "Toka Henkilö" "toka@toka.fi" "Tokan rooli"))]
        (is (= [nil "Tokan rooli"]
               (map :role (hakija-db/merge-legacy-roles legacy answers))))))

    (testing "an already stored role is left alone"
      (let [stored (assoc-in legacy [0 :role] "Oma rooli")]
        (is (= "Oma rooli" (:role (first (hakija-db/merge-legacy-roles stored answers)))))))

    (testing "nil answers leave organizations unchanged"
      (is (= legacy (hakija-db/merge-legacy-roles legacy nil))))))
