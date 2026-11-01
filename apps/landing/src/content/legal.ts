/**
 * Legal pages: imprint, privacy policy, giveaway terms, in German and English.
 *
 * Kept as structured data rather than in the message files: these are long
 * documents read top to bottom, and keeping each one whole in one place is what
 * lets a lawyer review it without hunting through translation keys.
 *
 * The privacy policy describes what this codebase actually does — the services
 * it calls, the cookies it sets, the cookieless analytics — so it has to be
 * revisited whenever one of those changes.
 */

export type LegalBlock =
  | string
  | { list: string[] }
  | { lines: string[] }
  | { link: { path: string; label: string } };

export type LegalDocument = {
  title: string;
  intro?: string;
  sections: { heading: string; blocks: LegalBlock[] }[];
  updated: string;
};

type Locale = "de" | "en";

const COMPANY = {
  name: "TheONE GLOBAL",
  street: "Joaquin Fuster 269",
  city: "07007 Palma de Mallorca",
  taxId: "ESX5155070B",
  email: "info@theone-superapp.com",
};

const UPDATED = { de: "Stand: November 2026", en: "Last updated: November 2026" };

/* ------------------------------------------------------------------------ */
/* Imprint                                                                   */
/* ------------------------------------------------------------------------ */

const imprint: Record<Locale, LegalDocument> = {
  de: {
    title: "Impressum",
    sections: [
      {
        heading: "Angaben zum Anbieter",
        blocks: [
          {
            lines: [
              COMPANY.name,
              COMPANY.street,
              COMPANY.city,
              "Spanien",
            ],
          },
          `Steuernummer (NIF): ${COMPANY.taxId}`,
          `E-Mail: ${COMPANY.email}`,
        ],
      },
      {
        heading: "Verbraucherstreitbeilegung",
        blocks: [
          "Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
        ],
      },
      {
        heading: "Haftung für Inhalte",
        blocks: [
          "Die Inhalte dieser Website wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Sobald uns eine Rechtsverletzung bekannt wird, entfernen wir die betreffenden Inhalte umgehend.",
        ],
      },
      {
        heading: "Haftung für Links",
        blocks: [
          "Diese Website kann Links zu externen Websites Dritter enthalten, auf deren Inhalte wir keinen Einfluss haben. Für diese Inhalte ist stets der jeweilige Anbieter verantwortlich.",
        ],
      },
      {
        heading: "Urheberrecht",
        blocks: [
          "Die Inhalte und Werke auf dieser Website, insbesondere Texte, Grafiken und Bilder, sind urheberrechtlich geschützt. Jede Verwertung außerhalb der Grenzen des Urheberrechts bedarf unserer vorherigen schriftlichen Zustimmung.",
        ],
      },
    ],
    updated: UPDATED.de,
  },
  en: {
    title: "Imprint",
    sections: [
      {
        heading: "Provider",
        blocks: [
          { lines: [COMPANY.name, COMPANY.street, COMPANY.city, "Spain"] },
          `Tax ID (NIF): ${COMPANY.taxId}`,
          `Email: ${COMPANY.email}`,
        ],
      },
      {
        heading: "Consumer dispute resolution",
        blocks: [
          "We are neither willing nor obliged to take part in dispute resolution proceedings before a consumer arbitration board.",
        ],
      },
      {
        heading: "Liability for content",
        blocks: [
          "The content of this website has been prepared with the greatest care. We cannot, however, guarantee that it is accurate, complete or up to date. As soon as we become aware of an infringement, we will remove the content concerned without delay.",
        ],
      },
      {
        heading: "Liability for links",
        blocks: [
          "This website may contain links to external third-party websites over whose content we have no control. The respective provider is always responsible for that content.",
        ],
      },
      {
        heading: "Copyright",
        blocks: [
          "The content and works on this website, in particular texts, graphics and images, are protected by copyright. Any use beyond the limits of copyright law requires our prior written consent.",
        ],
      },
    ],
    updated: UPDATED.en,
  },
};

/* ------------------------------------------------------------------------ */
/* Privacy policy                                                            */
/* ------------------------------------------------------------------------ */

const privacy: Record<Locale, LegalDocument> = {
  de: {
    title: "Datenschutzerklärung",
    intro:
      "Der Schutz Ihrer persönlichen Daten ist uns wichtig. Hier erfahren Sie, welche Daten wir erheben, wofür wir sie verwenden und welche Rechte Sie haben.",
    sections: [
      {
        heading: "1. Verantwortlicher",
        blocks: [
          "Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:",
          { lines: [COMPANY.name, COMPANY.street, COMPANY.city, "Spanien"] },
          `Steuernummer (NIF): ${COMPANY.taxId}`,
          `E-Mail: ${COMPANY.email}`,
        ],
      },
      {
        heading: "2. Hosting",
        blocks: [
          "Diese Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA, betrieben. Beim Aufruf der Website verarbeitet Vercel technisch notwendige Daten wie IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite und Browsertyp, um die Website auszuliefern und vor Missbrauch zu schützen.",
          "Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und zuverlässigen Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Die Übermittlung in die USA erfolgt auf Grundlage des EU-US Data Privacy Framework bzw. der EU-Standardvertragsklauseln.",
        ],
      },
      {
        heading: "3. Cookies",
        blocks: [
          "Wir verwenden ausschließlich technisch notwendige Cookies und keine Cookies zu Werbe- oder Analysezwecken:",
          {
            list: [
              "Sitzungs-Cookie: hält Sie nach der Anmeldung in Ihrem Konto angemeldet. Es ist verschlüsselt und wird nach spätestens 7 Tagen oder beim Abmelden gelöscht.",
              "Sprach-Cookie: merkt sich, ob Sie die Website auf Deutsch oder Englisch nutzen.",
            ],
          },
          "Für diese Cookies ist keine Einwilligung erforderlich, da sie für die Funktion der Website notwendig sind.",
        ],
      },
      {
        heading: "4. Besucherstatistik ohne Cookies",
        blocks: [
          "Um zu verstehen, wie unsere Website genutzt wird, erfassen wir eine eigene, cookielose Statistik. Dabei werden die aufgerufene Seite, die verweisende Website, Kampagnenparameter (z. B. utm_source), Gerätetyp sowie Land und Stadt erfasst, die unser Hosting-Anbieter aus der IP-Adresse ableitet.",
          "Ihre IP-Adresse wird dabei nicht gespeichert. Zur Zählung eindeutiger Besuche bilden wir aus IP-Adresse und Browserkennung einen verschlüsselten, täglich wechselnden Wert, aus dem sich Ihre Person nicht ermitteln lässt. Auf Ihrem Gerät wird nichts gespeichert.",
          "Rechtsgrundlage ist unser berechtigtes Interesse an der Verbesserung unseres Angebots (Art. 6 Abs. 1 lit. f DSGVO).",
        ],
      },
      {
        heading: "5. Bewerbung als Mitglied oder Geschäftspartner",
        blocks: [
          "Wenn Sie sich bei TheONE bewerben, verarbeiten wir die Angaben aus dem Bewerbungsformular, insbesondere:",
          {
            list: [
              "als Mitglied: Name, E-Mail-Adresse, Telefonnummer, Geburtsdatum, Land und Stadt sowie Ihre Angaben zu Interessen, Zielen und weiteren Wünschen",
              "als Geschäftspartner: Firmen- und Markenname, Branche, Teamgröße, Adresse, Website, Name von Inhaber und Ansprechperson, E-Mail-Adresse, Telefonnummer, Beschreibung der Leistungen und Zielgruppe sowie hochgeladene Bilder",
            ],
          },
          "Wir verwenden diese Daten, um Ihre Bewerbung zu prüfen, Sie zu kontaktieren und im Fall einer Zusage Ihr Konto einzurichten. Rechtsgrundlage ist die Durchführung vorvertraglicher Maßnahmen (Art. 6 Abs. 1 lit. b DSGVO).",
          "Wird eine Bewerbung abgelehnt, speichern wir E-Mail-Adresse und Telefonnummer ausschließlich in verschlüsselter (gehashter) Form, um wiederholte Bewerbungen zu erkennen.",
        ],
      },
      {
        heading: "6. Kundenkonto",
        blocks: [
          "Nach einer Zusage legen Sie ein Konto mit Benutzername und Passwort an. Das Passwort wird nur verschlüsselt gespeichert. Wir verarbeiten Ihre Kontodaten, um Ihnen den Zugang zu TheONE und die vereinbarten Leistungen bereitzustellen (Art. 6 Abs. 1 lit. b DSGVO).",
        ],
      },
      {
        heading: "7. Datenbank",
        blocks: [
          "Bewerbungs- und Kontodaten werden in einer Datenbank des Anbieters MongoDB, Inc., 1633 Broadway, New York, NY 10019, USA, gespeichert. Hochgeladene Bilder von Geschäftspartnern speichern wir bei Vercel (Vercel Blob). Für Übermittlungen in die USA gelten das EU-US Data Privacy Framework bzw. die EU-Standardvertragsklauseln.",
        ],
      },
      {
        heading: "8. E-Mail-Versand",
        blocks: [
          "Für den Versand von E-Mails, etwa Eingangsbestätigungen, Zusagen, Aktivierungslinks und Benachrichtigungen, nutzen wir den Dienst Resend (Resend, Inc., USA). Dabei werden Ihre E-Mail-Adresse und der Inhalt der Nachricht verarbeitet (Art. 6 Abs. 1 lit. b DSGVO).",
        ],
      },
      {
        heading: "9. Zahlungsabwicklung",
        blocks: [
          "Zahlungen für Mitgliedschaften und Partnerschaften wickeln wir über Stripe ab (Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin 2, Irland). Ihre Zahlungsdaten, etwa Kartendaten, gibt Stripe nicht an uns weiter; wir erhalten nur die Informationen, die zur Zuordnung der Zahlung nötig sind. Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Weitere Informationen finden Sie in der Datenschutzerklärung von Stripe.",
        ],
      },
      {
        heading: "10. TheONE POWER AI",
        blocks: [
          "Wenn Sie den KI-Assistenten TheONE POWER AI nutzen, werden Ihre Nachrichten zur Beantwortung an den Anbieter Anthropic, PBC, 548 Market St, San Francisco, CA 94104, USA, übermittelt und dort verarbeitet. Nach Angaben von Anthropic werden über die Schnittstelle übermittelte Daten nicht zum Training von KI-Modellen verwendet. Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Bitte geben Sie im Chat keine besonders sensiblen Daten ein, die für Ihre Anfrage nicht nötig sind.",
        ],
      },
      {
        heading: "11. Weihnachtsverlosung",
        blocks: [
          "Für die Teilnahme an der Weihnachtsverlosung verwenden wir die Daten Ihrer Bewerbung, um die Verlosung durchzuführen und die Gewinner per E-Mail zu benachrichtigen. Eine Weitergabe an Dritte zu Werbezwecken erfolgt nicht.",
          { link: { path: "giveaway-terms", label: "Teilnahmebedingungen der Weihnachtsverlosung" } },
        ],
      },
      {
        heading: "12. Speicherdauer",
        blocks: [
          "Wir speichern personenbezogene Daten nur so lange, wie es für den jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen, etwa steuerrechtliche Pflichten für Rechnungsdaten. Danach werden die Daten gelöscht.",
        ],
      },
      {
        heading: "13. Ihre Rechte",
        blocks: [
          "Sie haben jederzeit das Recht auf:",
          {
            list: [
              "Auskunft über Ihre gespeicherten Daten (Art. 15 DSGVO)",
              "Berichtigung unrichtiger Daten (Art. 16 DSGVO)",
              "Löschung Ihrer Daten (Art. 17 DSGVO)",
              "Einschränkung der Verarbeitung (Art. 18 DSGVO)",
              "Datenübertragbarkeit (Art. 20 DSGVO)",
              "Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21 DSGVO)",
            ],
          },
          `Wenden Sie sich dazu bitte an ${COMPANY.email}.`,
          "Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren, in Spanien bei der Agencia Española de Protección de Datos (www.aepd.es).",
        ],
      },
      {
        heading: "14. Änderungen",
        blocks: [
          "Wir passen diese Datenschutzerklärung an, wenn sich unser Angebot oder die rechtlichen Anforderungen ändern. Es gilt die jeweils auf dieser Seite veröffentlichte Fassung.",
        ],
      },
    ],
    updated: UPDATED.de,
  },
  en: {
    title: "Privacy Policy",
    intro:
      "Protecting your personal data matters to us. This page explains what data we collect, what we use it for and what rights you have.",
    sections: [
      {
        heading: "1. Controller",
        blocks: [
          "The controller responsible for data processing on this website within the meaning of the General Data Protection Regulation (GDPR) is:",
          { lines: [COMPANY.name, COMPANY.street, COMPANY.city, "Spain"] },
          `Tax ID (NIF): ${COMPANY.taxId}`,
          `Email: ${COMPANY.email}`,
        ],
      },
      {
        heading: "2. Hosting",
        blocks: [
          "This website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. When you visit the website, Vercel processes technically necessary data such as your IP address, the date and time of access, the page requested and your browser type, in order to deliver the website and protect it against misuse.",
          "The legal basis is our legitimate interest in secure and reliable operation (Art. 6(1)(f) GDPR). Transfers to the USA are based on the EU-US Data Privacy Framework or the EU Standard Contractual Clauses.",
        ],
      },
      {
        heading: "3. Cookies",
        blocks: [
          "We only use technically necessary cookies and no cookies for advertising or analytics:",
          {
            list: [
              "Session cookie: keeps you signed in to your account. It is encrypted and deleted after 7 days at the latest or when you sign out.",
              "Language cookie: remembers whether you use the website in German or English.",
            ],
          },
          "No consent is required for these cookies, as they are necessary for the website to function.",
        ],
      },
      {
        heading: "4. Cookieless visitor statistics",
        blocks: [
          "To understand how our website is used, we keep our own cookieless statistics. These record the page visited, the referring website, campaign parameters (e.g. utm_source), device type, and the country and city that our hosting provider derives from the IP address.",
          "Your IP address is not stored. To count unique visits, we derive an encrypted value from your IP address and browser identifier that changes daily and cannot be used to identify you. Nothing is stored on your device.",
          "The legal basis is our legitimate interest in improving our service (Art. 6(1)(f) GDPR).",
        ],
      },
      {
        heading: "5. Applying as a member or business partner",
        blocks: [
          "When you apply to TheONE, we process the information from the application form, in particular:",
          {
            list: [
              "as a member: name, email address, phone number, date of birth, country and city, and the details you give about your interests, goals and other wishes",
              "as a business partner: company and brand name, sector, team size, address, website, names of the owner and contact person, email address, phone number, description of services and target clientele, and uploaded images",
            ],
          },
          "We use this data to review your application, contact you and, if approved, set up your account. The legal basis is the performance of pre-contractual measures (Art. 6(1)(b) GDPR).",
          "If an application is declined, we keep the email address and phone number only in encrypted (hashed) form, to recognise repeat applications.",
        ],
      },
      {
        heading: "6. Customer account",
        blocks: [
          "After approval you create an account with a username and password. The password is only stored in encrypted form. We process your account data to give you access to TheONE and the agreed services (Art. 6(1)(b) GDPR).",
        ],
      },
      {
        heading: "7. Database",
        blocks: [
          "Application and account data are stored in a database provided by MongoDB, Inc., 1633 Broadway, New York, NY 10019, USA. Images uploaded by business partners are stored with Vercel (Vercel Blob). Transfers to the USA are covered by the EU-US Data Privacy Framework or the EU Standard Contractual Clauses.",
        ],
      },
      {
        heading: "8. Email delivery",
        blocks: [
          "To send emails such as confirmations of receipt, approvals, activation links and notifications, we use the service Resend (Resend, Inc., USA). Your email address and the content of the message are processed for this purpose (Art. 6(1)(b) GDPR).",
        ],
      },
      {
        heading: "9. Payment processing",
        blocks: [
          "Payments for memberships and partnerships are processed by Stripe (Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Dublin 2, Ireland). Stripe does not pass your payment details, such as card data, on to us; we only receive the information needed to match the payment. The legal basis is the performance of a contract (Art. 6(1)(b) GDPR). For more information, see Stripe's privacy policy.",
        ],
      },
      {
        heading: "10. TheONE POWER AI",
        blocks: [
          "When you use the AI assistant TheONE POWER AI, your messages are sent to and processed by Anthropic, PBC, 548 Market St, San Francisco, CA 94104, USA, in order to answer them. According to Anthropic, data sent through its API is not used to train AI models. The legal basis is the performance of a contract (Art. 6(1)(b) GDPR). Please do not enter particularly sensitive data in the chat that is not needed for your request.",
        ],
      },
      {
        heading: "11. Christmas lottery",
        blocks: [
          "For the Christmas lottery we use the data from your application to run the draw and to notify winners by email. It is not passed to third parties for marketing.",
          { link: { path: "giveaway-terms", label: "Terms and conditions of the Christmas lottery" } },
        ],
      },
      {
        heading: "12. Retention",
        blocks: [
          "We keep personal data only for as long as it is needed for the purpose concerned or as long as statutory retention obligations apply, for example tax obligations for invoice data. After that, the data is deleted.",
        ],
      },
      {
        heading: "13. Your rights",
        blocks: [
          "You have the right at any time to:",
          {
            list: [
              "access the data we hold about you (Art. 15 GDPR)",
              "have inaccurate data corrected (Art. 16 GDPR)",
              "have your data deleted (Art. 17 GDPR)",
              "restrict processing (Art. 18 GDPR)",
              "data portability (Art. 20 GDPR)",
              "object to processing based on legitimate interests (Art. 21 GDPR)",
            ],
          },
          `To exercise these rights, please contact ${COMPANY.email}.`,
          "You also have the right to lodge a complaint with a data protection supervisory authority; in Spain this is the Agencia Española de Protección de Datos (www.aepd.es).",
        ],
      },
      {
        heading: "14. Changes",
        blocks: [
          "We update this privacy policy when our service or the legal requirements change. The version published on this page applies.",
        ],
      },
    ],
    updated: UPDATED.en,
  },
};

/* ------------------------------------------------------------------------ */
/* Giveaway terms                                                            */
/* ------------------------------------------------------------------------ */

const giveawayTerms: Record<Locale, LegalDocument> = {
  de: {
    title: "Teilnahmebedingungen: TheONE Weihnachtsverlosung 2026",
    sections: [
      {
        heading: "1. Veranstalter",
        blocks: [
          `Veranstalter der Verlosung ist ${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, Spanien, Steuernummer ${COMPANY.taxId}, E-Mail: ${COMPANY.email} („TheONE“).`,
        ],
      },
      {
        heading: "2. Teilnahme",
        blocks: [
          "Die Teilnahme ist kostenlos und an keinen Kauf gebunden. Teilnehmen kann, wer sich über die Website theone-superapp.com bei TheONE bewirbt:",
          { list: ["als Unternehmen (Geschäftspartner) oder", "als Privatperson (Mitglied)."] },
          "Jede vollständige Bewerbung, die bis zum 12. Dezember 2026, 23:59 Uhr (MEZ) eingeht, nimmt automatisch und einmalig an der Verlosung teil. Mehrfache Bewerbungen derselben Person oder desselben Unternehmens erhöhen die Gewinnchance nicht.",
        ],
      },
      {
        heading: "3. Teilnahmeberechtigung",
        blocks: [
          "Teilnahmeberechtigt sind natürliche Personen ab 18 Jahren sowie Unternehmen, vertreten durch eine bevollmächtigte Person. Ausgeschlossen sind Mitarbeitende von TheONE sowie alle an der Durchführung der Verlosung beteiligten Personen. Bei falschen Angaben oder Manipulationsversuchen kann TheONE Teilnehmende ausschließen.",
        ],
      },
      {
        heading: "4. Gewinne",
        blocks: [
          "Verlost werden 12 kostenlose Aufnahmen bei TheONE, als Mitgliedschaft für Privatpersonen oder als Partnerschaft für Unternehmen. Die kostenlose Aufnahme wird ausschließlich im Rahmen der Weihnachtsverlosung 2026 vergeben. Sie gilt für 12 Monate ab Aktivierung. Die Mitgliedsbeiträge bzw. die Jahresgebühr der Partnerschaft entfallen für diesen Zeitraum.",
          "Nach Ablauf der 12 Monate endet die kostenlose Aufnahme automatisch, ohne dass eine Kündigung erforderlich ist. Es entstehen keine Kosten und keine automatische Verlängerung. Wer TheONE danach weiter nutzen möchte, kann jederzeit eine kostenpflichtige Mitgliedschaft bzw. Partnerschaft zu den dann gültigen Konditionen abschließen.",
          "Die Gewinne sind nicht übertragbar und können nicht in bar ausgezahlt werden.",
        ],
      },
      {
        heading: "5. Ziehung und Benachrichtigung",
        blocks: [
          "Die Gewinner werden am 15. Dezember 2026 unter allen teilnahmeberechtigten Bewerbungen nach dem Zufallsprinzip gezogen. Da jede Bewerbung einzeln geprüft wird, setzt der Gewinn voraus, dass die Bewerbung die Aufnahmekriterien von TheONE erfüllt. Andernfalls wird ein Ersatzgewinner gezogen.",
          "Die Gewinner werden per E-Mail an die bei der Bewerbung angegebene Adresse benachrichtigt. Bestätigt ein Gewinner den Gewinn nicht innerhalb von 14 Tagen, verfällt er, und TheONE kann einen Ersatzgewinner ziehen.",
        ],
      },
      {
        heading: "6. Datenschutz",
        blocks: [
          `Die bei der Bewerbung angegebenen Daten verwendet TheONE zur Prüfung der Bewerbung, zur Durchführung der Verlosung und zur Benachrichtigung der Gewinner. Eine Weitergabe an Dritte zu Werbezwecken erfolgt nicht. Anfragen richten Sie bitte an ${COMPANY.email}. Weitere Informationen, auch zu Ihren Rechten, finden Sie in unserer Datenschutzerklärung:`,
          { link: { path: "privacy", label: "Datenschutzerklärung" } },
        ],
      },
      {
        heading: "7. Vorzeitige Beendigung",
        blocks: [
          "TheONE behält sich vor, die Verlosung aus wichtigem Grund ganz oder teilweise abzubrechen oder zu ändern, insbesondere wenn eine ordnungsgemäße Durchführung aus technischen oder rechtlichen Gründen nicht möglich ist.",
        ],
      },
      {
        heading: "8. Haftung",
        blocks: [
          "TheONE haftet nur für Vorsatz und grobe Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Die Haftung nach zwingenden gesetzlichen Vorschriften bleibt unberührt.",
        ],
      },
      {
        heading: "9. Schlussbestimmungen",
        blocks: [
          "Es gilt spanisches Recht. Sollte eine Bestimmung unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.",
        ],
      },
      {
        heading: "10. Hinweis zu Apple",
        blocks: [
          "Apple Inc. ist kein Sponsor dieser Verlosung und in keiner Weise an ihr beteiligt. Apple steht nicht in Verbindung mit der Verlosung, unterstützt sie nicht und ist nicht für ihre Durchführung verantwortlich.",
        ],
      },
    ],
    updated: UPDATED.de,
  },
  en: {
    title: "Terms and Conditions: TheONE Christmas Lottery 2026",
    sections: [
      {
        heading: "1. Organiser",
        blocks: [
          `The lottery is organised by ${COMPANY.name}, ${COMPANY.street}, ${COMPANY.city}, Spain, tax ID ${COMPANY.taxId}, email: ${COMPANY.email} ("TheONE").`,
        ],
      },
      {
        heading: "2. Participation",
        blocks: [
          "Participation is free of charge and requires no purchase. To take part, apply to TheONE via theone-superapp.com:",
          { list: ["as a business (business partner), or", "as a private individual (member)."] },
          "Every complete application received by 12 December 2026, 23:59 (CET) automatically enters the draw once. Multiple applications from the same person or business do not increase the chance of winning.",
        ],
      },
      {
        heading: "3. Eligibility",
        blocks: [
          "Open to individuals aged 18 or over and to businesses represented by an authorised person. Employees of TheONE and anyone involved in running the draw are excluded. TheONE may exclude participants who give false information or attempt manipulation.",
        ],
      },
      {
        heading: "4. Prizes",
        blocks: [
          "12 free admissions to TheONE are being given away, as a membership for private individuals or a partnership for businesses. The free admission is granted exclusively as part of the Christmas Lottery 2026. It is valid for 12 months from activation. Membership fees or the annual partnership fee are waived for this period.",
          "After 12 months the free admission ends automatically, with no need to cancel. There are no costs and no automatic renewal. Anyone who wishes to continue using TheONE can take out a paid membership or partnership at the terms valid at that time.",
          "Prizes are non-transferable and cannot be exchanged for cash.",
        ],
      },
      {
        heading: "5. Draw and notification",
        blocks: [
          "Winners are drawn at random on 15 December 2026 from all eligible applications. As every application is reviewed individually, a prize requires the application to meet TheONE's admission criteria. Otherwise a replacement winner is drawn.",
          "Winners are notified by email at the address given in their application. If a winner does not confirm within 14 days, the prize lapses and TheONE may draw a replacement winner.",
        ],
      },
      {
        heading: "6. Data protection",
        blocks: [
          `Application data is used to review the application, run the draw and notify winners. It is not passed to third parties for marketing. Please send any requests to ${COMPANY.email}. For details, including your rights, see our privacy policy:`,
          { link: { path: "privacy", label: "Privacy Policy" } },
        ],
      },
      {
        heading: "7. Early termination",
        blocks: [
          "TheONE may cancel or change the lottery in whole or in part for good cause, in particular if it cannot be run properly for technical or legal reasons.",
        ],
      },
      {
        heading: "8. Liability",
        blocks: [
          "TheONE is liable only for intent and gross negligence and for injury to life, body or health. Mandatory statutory liability is unaffected.",
        ],
      },
      {
        heading: "9. Final provisions",
        blocks: [
          "Spanish law applies. If any provision is invalid, the remaining provisions remain in effect.",
        ],
      },
      {
        heading: "10. Note on Apple",
        blocks: [
          "Apple Inc. is not a sponsor of this lottery and is not involved in it in any way. Apple is not affiliated with the lottery, does not endorse it and is not responsible for running it.",
        ],
      },
    ],
    updated: UPDATED.en,
  },
};

export const LEGAL = { imprint, privacy, giveawayTerms };

export function legalDoc(kind: keyof typeof LEGAL, locale: string): LegalDocument {
  return LEGAL[kind][locale === "en" ? "en" : "de"];
}
