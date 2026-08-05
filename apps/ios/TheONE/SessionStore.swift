import Foundation
import Observation

/// Who is signed in, and the one place the app decides that.
@MainActor
@Observable
final class SessionStore {
    enum State: Equatable {
        case loading
        case signedOut
        case signedIn(Account)

        static func == (lhs: State, rhs: State) -> Bool {
            switch (lhs, rhs) {
            case (.loading, .loading), (.signedOut, .signedOut): true
            case let (.signedIn(a), .signedIn(b)): a.id == b.id
            default: false
            }
        }
    }

    var state: State = .loading
    var signInError: String?
    var isWorking = false

    var account: Account? {
        if case let .signedIn(account) = state { return account }
        return nil
    }

    /// Restores a session on launch so a returning member is not asked to sign
    /// in again every time they open the app.
    func restore() async {
        guard await APIClient.shared.restoreSession() else {
            state = .signedOut
            return
        }

        do {
            let response: MeResponse = try await APIClient.shared.send("/me")
            state = .signedIn(response.account)
        } catch {
            // A stored token that no longer works is the same as no token.
            await APIClient.shared.clear()
            state = .signedOut
        }
    }

    func signIn(identifier: String, password: String) async {
        signInError = nil
        isWorking = true
        defer { isWorking = false }

        do {
            let account = try await APIClient.shared.login(
                identifier: identifier,
                password: password
            )
            state = .signedIn(account)
        } catch {
            signInError = (error as? APIError)?.errorDescription
                ?? error.localizedDescription
        }
    }

    /// Re-reads the account after something changes it elsewhere in the app —
    /// a profile edit renames the member, and the header would otherwise keep
    /// showing the old name until the next launch.
    func refreshAccount() async {
        guard case .signedIn = state else { return }
        if let response: MeResponse = try? await APIClient.shared.send("/me") {
            state = .signedIn(response.account)
        }
    }

    func signOut() async {
        await APIClient.shared.logout()
        state = .signedOut
    }

}
