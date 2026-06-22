# Valtionavustus — email flows

```mermaid
sequenceDiagram
    actor Hakija as Hakija (applicant)
    actor Virkailija as Virkailija / Esittelijä
    actor Sched as Scheduled job
    participant VA as VA system
    participant App as Applicant + org email
    participant Pres as Valmistelija / esittelijä
    participant Partner as Yhteishanke partner orgs
    participant Pay as Payment officers
    participant Admin as Admin / report lists

    Note over Hakija,VA: APPLICATION PHASE

    Hakija->>VA: Create application
    VA-->>App: new-hakemus.plain.{fi,sv} (non-JOTPA grants)<br/>"Linkki organisaationne avustushakemukseen"
    VA-->>App: new-jotpa-hakemus.plain.{fi,sv} (JOTPA grants)<br/>"Linkki organisaationne avustushakemukseen"
    Note right of App: new-hakemus and new-jotpa-hakemus are mutually exclusive - only one fires per create

    Sched->>VA: Hakuaika ends tomorrow (scheduled, drafts only)
    VA-->>App: hakuaika-paattymassa.{fi,sv}<br/>"Hakuaika on päättymässä"

    Hakija->>VA: Submit application
    VA-->>App: hakemus-submitted.plain.{fi,sv}<br/>"...avustushakemus on kirjattu vastaanotetuksi"
    VA-->>Partner: yhteishanke-hakemus-submitted.plain.{fi,sv} (if flag)<br/>"...Yhteishankkeen avustushakemus %s on kirjattu vastaanotetuksi"

    Sched->>VA: Hakuaika ended yesterday (scheduled)
    VA-->>Pres: hakuaika-paattynyt.fi<br/>"Hakuaika on päättynyt"

    Note over Virkailija,VA: PROCESSING PHASE

    Virkailija->>VA: Set status = pending_change_request
    VA-->>App: taydennyspyynto.plain.{fi,sv} (cc + bcc to presenting officer)<br/>"Täydennyspyyntö avustushakemukseesi"

    Hakija->>VA: Respond to change request
    VA-->>Virkailija: hakemus-change-request-responded.plain.fi<br/>"...avustushakemusta on täydennetty"
    VA-->>App: hakemus-submitted.plain.{fi,sv} (after-change-request)<br/>"...avustushakemusta on täydennetty"

    Note over Virkailija,VA: DECISION PHASE

    Virkailija->>VA: Send all decisions
    VA-->>App: paatos.plain.{fi,sv} / paatos-refuse.plain.{fi,sv}<br/>"...avustushakemus on käsitelty - Linkki päätösasiakirjaan" (no attachment)
    VA-->>Partner: yhteishanke-paatos.plain.{fi,sv} / -refuse (if flag)<br/>"...Yhteishankkeen avustushakemus %s on käsitelty..."
    VA-->>Pres: paatokset-lahetetty.fi<br/>"Avustuspäätökset on lähetetty"

    Hakija->>VA: Refuse grant via refuse link
    VA-->>App: application-refused.plain.{fi,sv}<br/>"Ilmoitus avustuksenne vastaanottamatta jättämisestä on lähetetty"
    VA-->>Pres: application-refused-presenter.plain.fi<br/>"Automaattinen viesti: Avustuksen saajan ilmoitus"

    Note over Virkailija,VA: PAYMENT PHASE

    Virkailija->>VA: Mark payment batch sent
    VA-->>Pay: payments-info.fi<br/>"...Valtionavustuserän '%s' maksatus suoritettu"

    Note over Hakija,VA: MUUTOSHAKEMUS (change to approved grant)

    Hakija->>VA: Submit muutoshakemus
    VA-->>Pres: notify-valmistelija-of-new-muutoshakemus.plain.fi<br/>"Automaattinen viesti: saapunut muutoshakemus" (if talousarvio/jatkoaika/sisältö/osapuoli)

    Sched->>VA: Undecided muutoshakemus reminder (scheduled)
    VA-->>Pres: muutoshakemuksia-kasittelematta.fi

    Virkailija->>VA: Decide muutoshakemus
    VA-->>App: muutoshakemus-paatos.plain.{fi,sv}<br/>"...muutoshakemus on käsitelty - Linkki päätösasiakirjaan" (+oikaisuvaatimus PDF)
    VA-->>Partner: yhteishanke-muutoshakemus-paatos.plain.{fi,sv} (if flag)<br/>"...Yhteishankkeen %s muutoshakemus on käsitelty"

    Note over Virkailija,VA: SELVITYS PHASE

    Sched->>VA: Reminder to send selvitys requests (scheduled)
    VA-->>Pres: laheta-valiselvityspyynnot.fi
    VA-->>Pres: laheta-loppuselvityspyynnot.fi

    Virkailija->>VA: Send selvitys requests
    VA-->>App: valiselvitys-notification.plain.{fi,sv} (bcc to virkailija unless disabled)<br/>"Väliselvitys täytettävissä haulle"
    VA-->>App: loppuselvitys-notification.plain.{fi,sv} (bcc to virkailija unless disabled)<br/>"Loppuselvitys täytettävissä haulle"

    Sched->>VA: Selvitys not returned reminder (scheduled)
    VA-->>App: valiselvitys-palauttamatta.{fi,sv}<br/>"Muistutus väliselvityksen palauttamisesta"
    VA-->>App: loppuselvitys-palauttamatta.{fi,sv}<br/>"Muistutus loppuselvityksen palauttamisesta"

    Hakija->>VA: Submit väliselvitys / loppuselvitys
    VA-->>App: valiselvitys-submitted-notification.plain.{fi,sv}<br/>"Väliselvityksenne on vastaanotettu"
    VA-->>App: loppuselvitys-submitted-notification.plain.{fi,sv}<br/>"Loppuselvityksenne on vastaanotettu"
    VA-->>Partner: yhteishanke-vali-/loppuselvitys-submitted.plain.{fi,sv} (if flag)<br/>"...Yhteishankkeen %s väli-/loppuselvitys on vastaanotettu"

    Sched->>VA: Selvitys unreviewed reminder (scheduled)
    VA-->>Pres: valiselvitys-tarkastamatta.fi
    VA-->>Pres: loppuselvitys-asiatarkastamatta.fi
    VA-->>Admin: loppuselvitys-taloustarkastamatta.fi

    Virkailija->>VA: Mark selvitys processed
    VA-->>App: selvitys.plain.{fi,sv}<br/>subject entered by virkailija (default "Väliselvitys käsitelty")
    VA-->>Partner: yhteishanke-vali-/loppuselvitys-processed.plain.{fi,sv} (if flag)<br/>"...Yhteishankkeen %s väli-/loppuselvitys on käsitelty"

    Virkailija->>VA: Send loppuselvitys täydennyspyyntö (sets pending_change_request)
    VA-->>App: taydennyspyynto-asiatarkastus / taydennyspyynto-taloustarkastus<br/>subject + body entered by virkailija (reply-to = virkailija)

    Hakija->>VA: Respond to loppuselvitys change request
    VA-->>Virkailija: loppuselvitys-change-request-responded.plain.fi<br/>"...avustushakemuksen loppuselvitystä on täydennetty"
    VA-->>App: loppuselvitys-change-request-received.plain.{fi,sv}<br/>"Organisaationne loppuselvitystä on täydennetty:"

    Note over Sched,VA: REPORTING OBLIGATION (raportointivelvoite)

    Sched->>VA: MuistutusJob (every 60 min, deadline < 30 days)
    VA-->>Pres: raportointivelvoite-muistutus.fi<br/>"Muistutus valtionavustuksen raportoinnista"

    Note over Virkailija,Admin: NOT TIED TO A SINGLE HAKEMUS LIFECYCLE

    Sched->>VA: Monthly reconciliation
    VA-->>Admin: kuukausittainen-tasmaytysraportti.fi<br/>"Edellisen kuukauden VA-täsmäytysraportti" (+xlsx)

    Virkailija->>VA: Send free message / loppuselvitys reminder (POST /send-email, any time)
    VA-->>App: vapaa-viesti<br/>subject + body entered by virkailija (reply-to = virkailija)
    VA-->>App: loppuselvitys-muistutus<br/>subject + body entered by virkailija (reply-to = virkailija)
```
