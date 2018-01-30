(ns oph.va.decision-liitteet)

(def Liitteet
  [{:group "Ehdot"
    :attachments [{:id       "2a_ehdot_ja_rajoitukset_eritysavustus"
                   :langs    {:fi "Eritysavustukseen liittyvät ehdot ja rajoitukset"
                              :sv "Villkor och begränsningar för specialunderstöd"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}
                              {:id          "_2018-03"
                               :description "Voimassa 3/2018 alkaen"}
                              {:id          "_2020-01"
                               :description "Voimassa 1/2020 alkaen"}]}
                  {:id       "2b_ehdot_ja_rajoitukset_yleisavustus"
                   :langs    {:fi "Yleisavustukseen liittyvät ehdot ja rajoitukset"
                              :sv "Villkor och begränsningar för allmänt understöd"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}]}]}
   {:group "Oikaisuvaatimusosoitus"
    :attachments [{:id       "3a_oikaisuvaatimusosoitus_valtionavustuslaki"
                   :langs    {:fi "Oikaisuvaatimusosoitus"
                              :sv "Rättelseyrkande"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}]}
                  {:id       "3b_oikaisuvaatimusosoitus_laki_vapaasta_sivistystyosta"
                   :langs    {:fi "Oikaisuvaatimusosoitus"
                              :sv "Rättelseyrkande"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}
                              {:id          "_2018-06"
                               :description "Voimassa 6/2018 alkaen"}]}
                  {:id       "3c_oikaisuvaatimusosoitus_laki_opetus_ja_kulttuuritoimen_rahoituksesta"
                   :langs    {:fi "Oikaisuvaatimusosoitus"
                              :sv "Rättelseyrkande"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}]}]}
   {:group "Valtionavustusten yleisohje"
    :attachments [{:id       "va_yleisohje"
                   :langs    {:fi "Valtionavustusten yleisohje"
                              :sv "Allmänna anvisningar om statsunderstöd"}
                   :versions [{:id          ""
                               :description "Alkuperäinen"}]}]}])
