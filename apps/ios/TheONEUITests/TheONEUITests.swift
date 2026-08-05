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
    private func assertOnLoginScreen() {
        XCTAssertTrue(
            app.secureTextFields.firstMatch.waitForExistence(timeout: 20),
            "expected the login screen; the app appears to still be signed in"
        )
    }

    /// iOS offers to save the password after a sign-in. That is desirable
    /// behaviour for a real member, but the sheet belongs to Springboard and
    /// sits on top of the app, swallowing the next tap.
    private func dismissSystemPrompts() {
        let springboard = XCUIApplication(bundleIdentifier: "com.apple.springboard")
        for label in ["Not Now", "Don't Allow", "Allow"] {
            let button = springboard.buttons[label]
            if button.waitForExistence(timeout: 3) {
                button.tap()
                return
            }
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

        username.tap()
        username.typeText("iostester")

        let password = app.secureTextFields.firstMatch
        password.tap()
        password.typeText("IosTestPassword2026")

        app.buttons["Sign in"].tap()
        dismissSystemPrompts()

        // --- assistant tab ------------------------------------------------
        let assistantTab = app.tabBars.buttons["Assistant"]
        XCTAssertTrue(assistantTab.waitForExistence(timeout: 25), "did not reach the signed-in app")
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
            app.staticTexts["Bürgenstock Resort"].waitForExistence(timeout: 15),
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
        XCTAssertTrue(app.staticTexts["@iostester · Member"].exists)
        capture("08-profile")
    }

    /// An account that has not paid must be told why, not handed a generic
    /// credential error.
    func testUnpaidAccountIsExplained() throws {
        assertOnLoginScreen()
        let username = app.textFields.firstMatch

        username.tap()
        username.typeText("iostester")

        let password = app.secureTextFields.firstMatch
        password.tap()
        password.typeText("WrongPassword2026")

        app.buttons["Sign in"].tap()
        dismissSystemPrompts()

        let error = app.staticTexts["Those details do not match an account."]
        XCTAssertTrue(error.waitForExistence(timeout: 20), "no error shown for a bad password")
        capture("09-login-error")
    }
}
