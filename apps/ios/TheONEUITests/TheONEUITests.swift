import XCTest

/// Drives the real app against the local API.
///
/// The point is to prove the screens work end-to-end — sign in, load partners
/// from the server, open a conversation — rather than that the code compiles.
final class TheONEUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() {
        continueAfterFailure = false

        app = XCUIApplication()
        // The app follows the phone's language. MATCH is checked as a German
        // phone, the Japanese walkthrough as a Japanese one, the rest as is.
        if name.contains("testMatchFlow") || name.contains("testSkinAnalysis") || name.contains("testSelection") || name.contains("testHomeFunctions") || name.contains("testLongevityCheck") || name.contains("testRealEstate") || name.contains("testBeauty5") || name.contains("testPersonalCare") || name.contains("testSelectionBrands") || name.contains("testPowerAIEmail") {
            app.launchArguments += ["-AppleLanguages", "(de)", "-AppleLocale", "de_DE"]
        } else if name.contains("testJapaneseMember") {
            app.launchArguments += ["-AppleLanguages", "(ja)", "-AppleLocale", "ja_JP"]
        } else if let tour = Self.tours.first(where: { name.contains($0.test) }) {
            app.launchArguments += ["-AppleLanguages", "(\(tour.language))", "-AppleLocale", tour.locale]
        } else {
            // Everything else checks the English labels it names.
            app.launchArguments += ["-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        }
        app.launch()
    }

    /// Sessions live in the Keychain and survive app launches — correct
    /// behaviour, and the reason each test is run against a freshly installed
    /// app (see the `simctl uninstall` between invocations) rather than trying
    /// to unwind state from inside the suite.
    ///
    /// The app opens on the start screen; its avatar brings up the sign-in.
    private func assertOnLoginScreen() {
        let avatar = app.buttons["home.avatar"]
        XCTAssertTrue(avatar.waitForExistence(timeout: 20), "the start screen did not appear")
        capture("00-start")
        avatar.tap()
        XCTAssertTrue(
            app.secureTextFields.firstMatch.waitForExistence(timeout: 20),
            "expected the login screen; the app appears to still be signed in"
        )
    }

    /// iOS offers to save the password after a sign-in. That is desirable
    /// behaviour for a real member, but the sheet belongs to Springboard and
    /// sits on top of the app, swallowing the next tap.
    ///
    /// On iOS 26 the "Save Password?" card is hosted in the app's own
    /// hierarchy rather than Springboard's, so both are searched.
    private func dismissSystemPrompts() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        let deadline = Date().addingTimeInterval(9)
        while Date() < deadline {
            for owner in [app!, springboard] {
                for label in ["Not Now", "Don't Allow", "Allow"] {
                    let button = owner.buttons[label]
                    if button.exists {
                        button.tap()
                        return
                    }
                }
            }
            usleep(300_000)
        }
    }

    /// Taps a tab and confirms the switch actually happened.
    ///
    /// iOS 26's floating tab bar exposes each tab under several queries and not
    /// all of them accept a tap, so this tries each candidate and verifies the
    /// navigation title changed before giving up.
    @discardableResult
    private func tapTab(_ label: String, symbol: String) -> Bool {
        let candidates: [XCUIElement] = [
            app.buttons[symbol],
            app.tabBars.buttons[label],
            app.buttons[label],
        ]

        for candidate in candidates where candidate.exists {
            if candidate.isHittable {
                candidate.tap()
            } else {
                candidate.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
            }

            if app.navigationBars[label].waitForExistence(timeout: 6) {
                return true
            }
        }

        return app.navigationBars[label].exists
    }

    /// Types into a field once it really has focus.
    ///
    /// The sign-in arrives as a sheet, and a tap that lands while it is still
    /// sliding in can miss the field; typing then fails with "no keyboard
    /// focus". Re-tapping until focus sticks takes the timing out of it.
    private func type(_ text: String, into field: XCUIElement) {
        let focused = NSPredicate(format: "hasKeyboardFocus == true")
        for _ in 0..<5 {
            field.tap()
            let wait = XCTNSPredicateExpectation(predicate: focused, object: field)
            if XCTWaiter().wait(for: [wait], timeout: 2) == .completed {
                field.typeText(text)
                return
            }
        }
        XCTFail("could not focus \(field)")
    }

    /// Taps the house until `screen` is gone.
    ///
    /// iOS can still be busy with its password card when the house is first
    /// tapped, and that tap is lost; a second one goes through.
    private func goHome(leaving screen: XCUIElement) {
        var home = false
        for _ in 0..<3 where !home {
            app.buttons["home.button"].tap()
            let gone = XCTNSPredicateExpectation(
                predicate: NSPredicate(format: "exists == false"),
                object: screen
            )
            home = XCTWaiter().wait(for: [gone], timeout: 5) == .completed
            if !home { dismissSystemPrompts() }
        }
        XCTAssertTrue(home, "the house did not return to the start screen")
    }

    private func capture(_ name: String) {
        let shot = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        shot.name = name
        shot.lifetime = .keepAlways
        add(shot)
    }

    func testSignInAndBrowse() throws {
        // --- login screen -------------------------------------------------
        assertOnLoginScreen()
        let username = app.textFields.firstMatch
        capture("01-login")

        type("testmember", into: username)

        let password = app.secureTextFields.firstMatch
        type("TestPassword2026!", into: password)

        app.buttons["Sign in"].tap()
        dismissSystemPrompts()

        // --- signing in from the start screen opens the account -----------
        XCTAssertTrue(
            app.navigationBars["Profile"].waitForExistence(timeout: 25),
            "signing in did not open the account"
        )
        capture("01b-account")
        // "Save password?" can arrive only after the account is up, and it
        // would swallow the tap on the house.
        dismissSystemPrompts()

        // the house goes back to the start screen, the avatar returns
        // The start screen stays in the tree under the account, so the avatar
        // "exists" all along; the account leaving is what proves the way back.
        goHome(leaving: app.navigationBars["Profile"])
        let avatar = app.buttons["home.avatar"]
        capture("01c-back-home")
        avatar.tap()
        XCTAssertTrue(
            app.navigationBars["Profile"].waitForExistence(timeout: 10),
            "the avatar did not open the account when signed in"
        )

        // --- assistant tab ------------------------------------------------
        XCTAssertTrue(tapTab("Assistant", symbol: "sparkles"), "could not open the assistant")
        dismissSystemPrompts()
        XCTAssertTrue(app.staticTexts["Ask me anything"].waitForExistence(timeout: 5))
        capture("02-assistant")

        // --- discover: partners come from the API -------------------------
        tapTab("Discover", symbol: "magnifyingglass")
        let partner = app.staticTexts["Alpine Longevity Clinic"]
        let loaded = partner.waitForExistence(timeout: 20)
        capture("03-discover")
        if !loaded {
            // Dump the tree so a failure here says what was on screen instead
            // of only that something was missing.
            let dump = XCTAttachment(string: app.debugDescription)
            dump.name = "discover-tree"
            dump.lifetime = .keepAlways
            add(dump)
        }
        XCTAssertTrue(loaded, "partner list did not load from the API")

        // filter by vertical
        app.buttons["Wellness"].tap()
        XCTAssertTrue(
            app.staticTexts["Lakeside Wellness Resort"].waitForExistence(timeout: 15),
            "focus filter returned nothing"
        )
        capture("04-discover-filtered")
        app.buttons["Wellness"].tap()

        // --- partner detail with contact details --------------------------
        XCTAssertTrue(partner.waitForExistence(timeout: 15))
        partner.tap()
        XCTAssertTrue(
            app.staticTexts["+41 44 111 22 33"].waitForExistence(timeout: 15),
            "contact details missing from the detail screen"
        )
        capture("05-partner-detail")

        app.navigationBars.buttons.element(boundBy: 0).tap()

        // --- messages -----------------------------------------------------
        tapTab("Messages", symbol: "bubble.left.and.bubble.right")
        let conversation = app.staticTexts["Zurich Dental Institute"]
        XCTAssertTrue(conversation.waitForExistence(timeout: 20), "conversation list did not load")
        capture("06-messages")

        conversation.tap()
        XCTAssertTrue(
            app.staticTexts["We can see you Thursday at 14:00."].waitForExistence(timeout: 15),
            "messages did not load"
        )
        capture("07-conversation")

        app.navigationBars.buttons.element(boundBy: 0).tap()

        // --- profile ------------------------------------------------------
        tapTab("Profile", symbol: "person")
        XCTAssertTrue(
            app.staticTexts["Alexandra Reinhardt"].waitForExistence(timeout: 20),
            "profile did not load"
        )
        XCTAssertTrue(app.staticTexts["@testmember · Member"].exists)
        capture("08-profile")
    }

    /// The POWER AI storm is the second way in: signed out it asks for the
    /// sign-in, then carries on to the assistant rather than the account.
    func testStormOpensAssistant() throws {
        let storm = app.buttons["home.storm"]
        XCTAssertTrue(storm.waitForExistence(timeout: 20), "the storm is not on the start screen")
        // Tapped at once, while the stored session is still being checked:
        // the tap must not be lost.
        storm.tap()
        XCTAssertTrue(
            app.secureTextFields.firstMatch.waitForExistence(timeout: 20),
            "the storm did not open the sign-in"
        )

        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["Sign in"].tap()
        dismissSystemPrompts()

        XCTAssertTrue(
            app.staticTexts["Ask me anything"].waitForExistence(timeout: 25),
            "signing in from the storm did not open the assistant"
        )
        capture("10-storm-assistant")
        dismissSystemPrompts()

        // Back home, the storm now goes straight to the assistant.
        goHome(leaving: app.staticTexts["Ask me anything"])
        storm.tap()
        XCTAssertTrue(
            app.staticTexts["Ask me anything"].waitForExistence(timeout: 10),
            "the storm did not open the assistant when signed in"
        )
    }

    /// An account that has not paid must be told why, not handed a generic
    /// credential error.
    func testUnpaidAccountIsExplained() throws {
        assertOnLoginScreen()
        let username = app.textFields.firstMatch

        type("testmember", into: username)

        let password = app.secureTextFields.firstMatch
        type("WrongPassword2026", into: password)

        app.buttons["Sign in"].tap()
        dismissSystemPrompts()

        let error = app.staticTexts["Those details do not match an account."]
        XCTAssertTrue(error.waitForExistence(timeout: 20), "no error shown for a bad password")
        capture("09-login-error")
    }

    /// TheONE MATCH from the empty state to a match: profile, one
    /// introduction, a yes that the other side already gave, and the chat.
    ///
    /// Needs `scripts/seed-match-profiles.mjs` and no MATCH profile yet for
    /// `testmember`; the screenshots are the walkthrough shown to the owner.
    func testMatchFlow() throws {
        assertOnLoginScreen()
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()

        // --- the MATCH tab ------------------------------------------------
        var opened = false
        for candidate in [app.tabBars.buttons["Match"], app.buttons["Match"], app.tabBars.buttons.element(boundBy: 2)] where !opened && candidate.exists {
            candidate.tap()
            opened = app.buttons["match.create"].waitForExistence(timeout: 15)
        }
        XCTAssertTrue(opened, "the MATCH welcome did not appear")
        capture("m01-welcome")
        app.swipeUp()
        capture("m02-welcome-lower")

        // --- the profile --------------------------------------------------
        app.buttons["match.create"].tap()
        let profession = app.textFields["match.profession"]
        XCTAssertTrue(profession.waitForExistence(timeout: 10))
        capture("m03-form-top")
        type("Unternehmerin", into: profession)
        type("Zurich", into: app.textFields["match.city"])
        // Return closes the keyboard; left up, it hides what comes next and
        // the search below scrolls straight past it.
        app.typeText("\n")

        /// Scrolls a short way at a time, so a lazy list never skips the row.
        func reveal(_ element: XCUIElement) {
            for _ in 0..<14 where !(element.exists && element.isHittable) {
                let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.55))
                let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.40))
                start.press(forDuration: 0.05, thenDragTo: end)
            }
        }
        for hobby in ["Reisen", "Golf", "Kunst", "Wein"] {
            let chip = app.buttons[hobby]
            reveal(chip)
            chip.tap()
        }
        capture("m04-form-pastimes")

        let about = app.descendants(matching: .any)["match.about"].firstMatch
        reveal(about)
        type("Ich liebe das Meer, gute Gespräche und Abende mit Freunden.", into: about)
        // A short pull down closes the keyboard (the form dismisses it on scroll).
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.25))
            .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.32)))

        let athletic = app.buttons["Sportlich"]
        reveal(athletic)
        athletic.tap()
        capture("m05-form-wishes")
        app.swipeUp()
        capture("m06-form-wishes-lower")

        app.buttons["match.save"].tap()

        // --- one introduction ---------------------------------------------
        let name = app.staticTexts["match.name"]
        XCTAssertTrue(name.waitForExistence(timeout: 20), "no introduction after saving")
        capture("m07-introduction")
        app.swipeUp()
        capture("m08-introduction-lower")

        // --- yes, and they had already said yes ---------------------------
        let yes = app.buttons["match.yes"]
        reveal(yes)
        yes.tap()
        let moment = app.staticTexts["Ihr beide sagt Ja."]
        XCTAssertTrue(moment.waitForExistence(timeout: 15), "the match moment did not appear")
        capture("m09-match")

        app.buttons["Nachricht schreiben"].tap()
        sleep(3)
        capture("m10-chat")
    }

    /// A Japanese member who speaks no English: the greeting, the question
    /// and the answer are all in Japanese. Screenshots for the owner.
    func testJapaneseMember() throws {
        assertOnLoginScreen()
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()
        goHome(leaving: app.tabBars.firstMatch)

        let greeting = app.staticTexts["home.greeting"]
        XCTAssertTrue(greeting.waitForExistence(timeout: 20), "no greeting under the storm")
        capture("j01-greeting")

        app.buttons["home.storm"].tap()
        let field = app.descendants(matching: .any)["assistant.input"].firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 15))
        type("チューリッヒでおすすめのウェルネスリゾートはありますか？", into: field)
        app.buttons["assistant.send"].tap()
        sleep(40)
        capture("j02-answer")
    }

    /// POWER AI writes an email on request: the card shows recipient, subject
    /// and text, "Mail öffnen" opens it for the member to send. The simulator
    /// has no mail account, so the copy sheet stands in for the Mail sheet.
    func testPowerAIEmail() throws {
        assertOnLoginScreen()
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()
        goHome(leaving: app.tabBars.firstMatch)

        app.buttons["home.storm"].tap()
        let field = app.descendants(matching: .any)["assistant.input"].firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 15))
        type("Schreib bitte Anna, dass ich am Freitag erst um 20 Uhr zum Essen komme. Ihre Adresse ist anna.berger@example.com", into: field)
        app.buttons["assistant.send"].tap()

        let card = app.descendants(matching: .any)["email.card"].firstMatch
        XCTAssertTrue(card.waitForExistence(timeout: 90), "no email card appeared")
        sleep(6)
        capture("m01-card")

        let open = app.buttons["email.open"]
        XCTAssertTrue(open.waitForExistence(timeout: 10))
        open.tap()
        sleep(4)
        capture("m02-open")
    }

    // MARK: - Language tours

    private static let tours: [(test: String, language: String, locale: String, question: String)] = [
        ("testTourFrench", "fr", "fr_FR", "Je cherche une clinique de longévité près de Zurich."),
        ("testTourItalian", "it", "it_IT", "Cerco una clinica della longevità vicino a Zurigo."),
        ("testTourArabic", "ar", "ar_AE", "أبحث عن عيادة لطول العمر بالقرب من زيورخ."),
        ("testTourChinese", "zh-Hans", "zh_CN", "我在找苏黎世附近的长寿诊所。"),
        ("testTourSpanish", "es", "es_ES", "Busco una clínica de longevidad cerca de Zúrich."),
        ("testTourCroatian", "hr", "hr_HR", "Tražim kliniku za dugovječnost blizu Züricha."),
        ("testTourRussian", "ru", "ru_RU", "Я ищу клинику долголетия рядом с Цюрихом."),
        ("testTourTurkish", "tr", "tr_TR", "Zürih yakınlarında bir uzun ömür kliniği arıyorum."),
    ]

    func testTourFrench() throws { try tour("fr") }
    func testTourItalian() throws { try tour("it") }
    func testTourArabic() throws { try tour("ar") }
    func testTourChinese() throws { try tour("zh-Hans") }
    func testTourSpanish() throws { try tour("es") }
    func testTourCroatian() throws { try tour("hr") }
    func testTourRussian() throws { try tour("ru") }
    func testTourTurkish() throws { try tour("tr") }

    /// One pass through the app in a language: sign-in, MATCH, the greeting
    /// and an answer from the assistant. The screenshots are the proof.
    private func tour(_ language: String) throws {
        let question = Self.tours.first { $0.language == language }!.question
        let tag = language.prefix(2)

        app.buttons["home.avatar"].tap()
        XCTAssertTrue(app.secureTextFields.firstMatch.waitForExistence(timeout: 20))
        capture("\(tag)-1-login")
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()
        capture("\(tag)-2-profile")

        app.tabBars.buttons.element(boundBy: 2).tap()
        sleep(6)
        capture("\(tag)-3-match")
        app.swipeUp()
        capture("\(tag)-4-match-lower")

        goHome(leaving: app.tabBars.firstMatch)
        _ = app.staticTexts["home.greeting"].waitForExistence(timeout: 20)
        capture("\(tag)-5-greeting")

        app.buttons["home.storm"].tap()
        let field = app.descendants(matching: .any)["assistant.input"].firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 15))
        type(question, into: field)
        app.buttons["assistant.send"].tap()
        sleep(40)
        capture("\(tag)-6-answer")
    }

    /// The skin analysis from the assistant: consent, a photo from the
    /// library (the simulator has no camera), the reading, and the talk with
    /// POWER AI about it. Needs a face photo added with `simctl addmedia`.
    func testSkinAnalysis() throws {
        assertOnLoginScreen()
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()
        let scan = app.buttons["assistant.skin"]
        for _ in 0..<4 where !scan.exists {
            dismissSystemPrompts()
            app.tabBars.buttons.element(boundBy: 0).tap()
            _ = scan.waitForExistence(timeout: 6)
        }
        XCTAssertTrue(scan.exists, "the assistant's scan button did not appear")
        scan.tap()

        let start = app.buttons["skin.start"]
        if start.waitForExistence(timeout: 5) {
            capture("s1-consent")
            start.tap()
        }
        let pick = app.buttons["skin.pick"]
        XCTAssertTrue(pick.waitForExistence(timeout: 10))
        capture("s2-capture")
        pick.tap()
        sleep(12)
        capture("s3-picker")
        let dump = XCTAttachment(string: app.debugDescription)
        dump.name = "picker-tree"
        dump.lifetime = .keepAlways
        add(dump)

        // The system photo picker: the newest photo is first in the grid.
        // It runs in its own process, outside the app's element tree, so the
        // first cell is tapped by position.
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.15, dy: 0.43)).tap()
        sleep(2)
        capture("s4-analysing")

        let discuss = app.buttons["skin.discuss"]
        XCTAssertTrue(discuss.waitForExistence(timeout: 90), "no result after the scan")
        capture("s5-result")
        for step in 6...9 {
            app.swipeUp()
            capture("s\(step)-result-lower")
        }
        discuss.tap()
        sleep(45)
        capture("s10-assistant")
    }

    /// TheONE SELECTION: chosen for you, the areas, one offering in full, and
    /// the request that opens a chat with the partner.
    func testSelection() throws {
        assertOnLoginScreen()
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()

        let header = app.staticTexts["TheONE SELECTION"]
        for _ in 0..<4 where !header.exists {
            dismissSystemPrompts()
            app.tabBars.buttons.element(boundBy: 1).tap()
            _ = header.waitForExistence(timeout: 8)
        }
        XCTAssertTrue(header.exists, "SELECTION did not open")
        sleep(3)
        capture("x1-selection")
        for step in 2...5 {
            app.swipeUp()
            sleep(1)
            capture("x\(step)-selection-lower")
        }

        // Back to the top, then the first card under "chosen for you".
        for _ in 0..<8 { app.swipeDown() }
        sleep(1)
        let card = app.buttons["offering.card"].firstMatch
        XCTAssertTrue(card.waitForExistence(timeout: 10))
        if !card.isHittable { app.swipeUp(); sleep(1) }
        card.tap()
        let request = app.buttons["offering.request"]
        XCTAssertTrue(request.waitForExistence(timeout: 10))
        capture("x6-offering")
        request.tap()
        sleep(5)
        capture("x7-chat")
    }

    /// The start screen's TheONE functions, and two of the areas they open.
    func testHomeFunctions() throws {
        assertOnLoginScreen()
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()
        goHome(leaving: app.tabBars.firstMatch)
        sleep(3)
        app.swipeUp()
        sleep(1)
        capture("h1-home-functions")

        for (index, name) in ["TheONE HEALTH"].enumerated() {
            let entry = app.buttons["home.fn.\(name)"]
            XCTAssertTrue(entry.waitForExistence(timeout: 10), "\(name) missing on the start screen")
            entry.tap()
            sleep(5)
            capture("h\(index + 2)-area")
            if name == "TheONE HEALTH" {
                // POWER AI asks aloud as the area opens; the member answers.
                let answer = app.buttons["opener.answer"]
                XCTAssertTrue(answer.waitForExistence(timeout: 10))
                answer.tap()
                XCTAssertTrue(app.staticTexts["assistant.greeting"].waitForExistence(timeout: 10), "Answer did not open POWER AI")
                capture("h9-health-answer")
                return
            }
            app.swipeUp()
            sleep(1)
            capture("h\(index + 2)b-area-lower")
            app.buttons["home.button"].firstMatch.tap()
            sleep(2)
        }
    }

    /// BEAUTY5 in TheONE SELECTION: its products, one product, its profile.
    func testBeauty5() throws {
        assertOnLoginScreen()
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()
        goHome(leaving: app.tabBars.firstMatch)
        sleep(2)
        app.swipeUp()
        let entry = app.buttons["home.fn.TheONE SELECTION"]
        XCTAssertTrue(entry.waitForExistence(timeout: 10))
        entry.tap()
        XCTAssertTrue(app.buttons["opener.answer"].waitForExistence(timeout: 10))
        sleep(3)
        let brand = app.staticTexts["BEAUTY5"].firstMatch
        // Small drags, so the brand stops in view instead of flying past.
        func nudge() {
            let from = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.75))
            from.press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.45)))
            sleep(1)
        }
        for _ in 0..<20 where !(brand.exists && brand.frame.minY > 0 && brand.frame.minY < app.frame.height * 0.35) { nudge() }
        XCTAssertTrue(brand.exists, "BEAUTY5 is not in TheONE SELECTION")
        capture("b1-beauty5-products")
        // The whole range, then one product from it.
        let range = app.buttons.matching(identifier: "partner.range").firstMatch
        XCTAssertTrue(range.waitForExistence(timeout: 5))
        range.tap()
        sleep(3)
        capture("b1b-beauty5-range")
        // The first card of the grid, top left.
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.3, dy: 0.38)).tap()
        // A shop link is a link, not a button, to accessibility.
        XCTAssertTrue(app.descendants(matching: .any)["offering.shop"].waitForExistence(timeout: 10), "BEAUTY5 product has no shop link")
        sleep(2)
        capture("b2-product")
        app.swipeUp()
        sleep(1)
        capture("b3-product-lower")
        app.swipeDown()
        app.swipeDown()
        sleep(1)
        let partnerLink = app.buttons.matching(NSPredicate(format: "label BEGINSWITH 'BEAUTY5'")).firstMatch
        if partnerLink.exists {
            partnerLink.tap()
            sleep(3)
            capture("b4-profile")
        }
    }

    /// TheONE personalcare in TheONE SELECTION: its products and one of them.
    func testPersonalCare() throws {
        assertOnLoginScreen()
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()
        goHome(leaving: app.tabBars.firstMatch)
        sleep(2)
        app.swipeUp()
        let entry = app.buttons["home.fn.TheONE SELECTION"]
        XCTAssertTrue(entry.waitForExistence(timeout: 10))
        entry.tap()
        XCTAssertTrue(app.buttons["opener.answer"].waitForExistence(timeout: 10))
        sleep(3)
        let brand = app.staticTexts["TheONE personalcare"].firstMatch
        // Short drags until the brand sits near the top of the screen.
        func nudge() {
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.62))
                .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.45)))
            sleep(1)
        }
        let h = app.frame.height
        for _ in 0..<60 where !(brand.exists && brand.frame.minY > h * 0.1 && brand.frame.minY < h * 0.3) { nudge() }
        XCTAssertTrue(brand.exists, "TheONE personalcare is not in TheONE SELECTION")
        capture("p1-personalcare")
        // "See all 3" right under the brand's name.
        let ranges = app.buttons.matching(identifier: "partner.range").allElementsBoundByIndex
        let range = ranges.filter { $0.frame.minY > brand.frame.minY }.min { $0.frame.minY < $1.frame.minY }
        XCTAssertNotNil(range)
        range?.tap()
        sleep(3)
        capture("p2-range")
        app.coordinate(withNormalizedOffset: CGVector(dx: 0.3, dy: 0.38)).tap()
        sleep(3)
        capture("p3-product")
        app.swipeUp()
        sleep(1)
        capture("p4-product-lower")
    }

    /// TheONE SELECTION brand by brand: each brand's own section, upright.
    func testSelectionBrands() throws {
        assertOnLoginScreen()
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()
        goHome(leaving: app.tabBars.firstMatch)
        sleep(2)
        app.swipeUp()
        let entry = app.buttons["home.fn.TheONE SELECTION"]
        XCTAssertTrue(entry.waitForExistence(timeout: 10))
        entry.tap()
        XCTAssertTrue(app.buttons["opener.answer"].waitForExistence(timeout: 10))
        sleep(4)
        func nudge() {
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.62))
                .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.45)))
            sleep(1)
        }
        let h = app.frame.height
        // Back up a little when the head has gone past the top.
        func nudgeBack() {
            app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.45))
                .press(forDuration: 0.05, thenDragTo: app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.55)))
            sleep(1)
        }
        for (index, name) in ["NATURA VERVAE"].enumerated() {
            let head = app.buttons["brand.\(name)"]
            for _ in 0..<80 {
                let y = head.exists ? head.frame.minY : h
                if y > h * 0.1 && y < h * 0.24 { break }
                if y <= h * 0.1 { nudgeBack() } else { nudge() }
            }
            XCTAssertTrue(head.exists, "\(name) has no section")
            sleep(2)
            capture("s\(index + 1)-\(name)")
        }
    }

    /// TheONE REAL ESTATE: POWER AI's greeting, the estates of the best
    /// brokers worldwide, and a home sent to the brokers for its place.
    func testRealEstate() throws {
        assertOnLoginScreen()
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()
        goHome(leaving: app.tabBars.firstMatch)
        sleep(2)
        app.swipeUp()
        let entry = app.buttons["home.fn.TheONE REAL ESTATE"]
        XCTAssertTrue(entry.waitForExistence(timeout: 10))
        entry.tap()
        XCTAssertTrue(app.buttons["opener.answer"].waitForExistence(timeout: 10))
        sleep(4)
        capture("r1-realestate")
        app.swipeUp()
        sleep(2)
        capture("r2-estates")
        app.swipeUp()
        sleep(1)
        capture("r2b-estates-more")
        app.swipeDown()
        app.swipeDown()
        sleep(1)
        let form = app.buttons["realestate.sell.form"]
        XCTAssertTrue(form.waitForExistence(timeout: 5))
        form.tap()
        XCTAssertTrue(app.buttons["sell.villa"].waitForExistence(timeout: 5))
        // Return goes on to the next field, as a member would type it.
        type("Küsnacht\n", into: app.textFields["sell.city"])
        app.typeText("Switzerland\n")
        app.typeText("7\n")
        app.typeText("320\n")
        capture("r3-sell-form")
        app.typeText("1800\n")
        app.typeText("6500000\n")
        app.typeText("Seeblick, ruhiger Garten, Bootsplatz")
        sleep(1)
        capture("r4-sell-form-lower")
        let send = app.buttons["sell.send"]
        if !send.isHittable { app.swipeUp() }
        send.tap()
        XCTAssertTrue(app.buttons["sell.broker"].firstMatch.waitForExistence(timeout: 20), "The sale did not reach a broker")
        capture("r5-sell-sent")

        // Buying: the wishes go to the brokers, who answer from their portfolio.
        app.buttons["request.close"].tap()
        sleep(2)
        let find = app.buttons["realestate.find.form"]
        XCTAssertTrue(find.waitForExistence(timeout: 5))
        find.tap()
        XCTAssertTrue(app.buttons["find.villa"].waitForExistence(timeout: 5))
        app.buttons["find.villa"].tap()
        app.buttons["find.estate"].tap()
        type("Palma\n", into: app.textFields["sell.city"])
        app.typeText("Spain\n")
        app.typeText("5\n")
        app.typeText("400\n")
        app.typeText("9000000\n")
        app.typeText("Meerblick, ruhig, nah an einer guten Schule")
        capture("r6-find-form")
        let findSend = app.buttons["sell.send"]
        if !findSend.isHittable { app.swipeUp() }
        findSend.tap()
        XCTAssertTrue(app.buttons["sell.broker"].firstMatch.waitForExistence(timeout: 20), "The wishes did not reach a broker")
        capture("r7-find-sent")
    }

    /// TheONE LONGEVITY CHECK from the start screen: thirteen answers, the
    /// reading, and the talk with POWER AI about it.
    func testLongevityCheck() throws {
        assertOnLoginScreen()
        type("testmember", into: app.textFields.firstMatch)
        type("TestPassword2026!", into: app.secureTextFields.firstMatch)
        app.buttons["login.submit"].tap()
        dismissSystemPrompts()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        dismissSystemPrompts()
        goHome(leaving: app.tabBars.firstMatch)

        sleep(2)
        app.swipeUp()
        let entry = app.buttons["home.fn.TheONE LONGEVITY"]
        XCTAssertTrue(entry.waitForExistence(timeout: 10))
        entry.tap()
        let open = app.buttons["longevity.open"]
        XCTAssertTrue(open.waitForExistence(timeout: 15))
        capture("l1-area")
        open.tap()
        let start = app.buttons["longevity.start"]
        XCTAssertTrue(start.waitForExistence(timeout: 10))
        capture("l2-intro")
        start.tap()

        let answers = [
            ("age", "45to54"), ("sleepHours", "6to7"), ("rested", "sometimes"), ("stress", "high"),
            ("activeDays", "2to3"), ("strength", "no"), ("food", "mixed"), ("alcohol", "4to7"),
            ("smoking", "never"), ("connection", "some"), ("checkup", "longer"), ("energy", "moderate"),
            ("goal", "energy"),
        ]
        for (index, answer) in answers.enumerated() {
            let option = app.buttons["longevity.\(answer.0).\(answer.1)"]
            XCTAssertTrue(option.waitForExistence(timeout: 10), "no option for \(answer.0)")
            if index == 1 { capture("l3-question") }
            option.tap()
        }
        let submit = app.buttons["longevity.submit"]
        XCTAssertTrue(submit.waitForExistence(timeout: 10))
        submit.tap()

        let discuss = app.buttons["longevity.discuss"]
        XCTAssertTrue(discuss.waitForExistence(timeout: 90), "no result after the check")
        capture("l4-result")
        for step in 5...8 {
            app.swipeUp()
            capture("l\(step)-result-lower")
        }
        discuss.tap()
        sleep(45)
        capture("l9-assistant")
    }
}
