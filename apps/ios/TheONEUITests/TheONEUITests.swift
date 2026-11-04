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
        app.buttons["Start"].tap()
        let gone = XCTNSPredicateExpectation(
            predicate: NSPredicate(format: "exists == false"),
            object: app.navigationBars["Profile"]
        )
        XCTAssertEqual(XCTWaiter().wait(for: [gone], timeout: 10), .completed, "the house did not return to the start screen")
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
}
