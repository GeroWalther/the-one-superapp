import Foundation

/// The only thing that talks to TheONE's servers.
///
/// An actor so the token refresh cannot race: several views loading at once
/// would otherwise each notice the expired access token and refresh
/// independently, and rotation means all but one of those refreshes would be
/// rejected — signing the member out mid-session.
actor APIClient {
    static let shared = APIClient()

    /// Simulator talks to the dev server; a real build points at production.
    #if targetEnvironment(simulator)
    private let baseURL = URL(string: "http://localhost:5656/api/v1")!
    #else
    private let baseURL = URL(string: "https://theone-superapp.vercel.app/api/v1")!
    #endif

    private var accessToken: String?
    private var refreshTask: Task<Bool, Never>?

    private let decoder = JSONDecoder()

    // MARK: - Session

    func restoreSession() -> Bool {
        accessToken = KeychainStore.read("access")
        return KeychainStore.read("refresh") != nil
    }

    func login(identifier: String, password: String) async throws -> Account {
        let response: AuthResponse = try await send(
            "/auth/login",
            method: "POST",
            body: [
                "identifier": identifier,
                "password": password,
                "device": await UIDeviceName.current,
            ],
            authenticated: false
        )

        store(response)
        return response.account
    }

    func logout() async {
        if let refresh = KeychainStore.read("refresh") {
            _ = try? await sendRaw(
                "/auth/logout",
                method: "POST",
                body: ["refreshToken": refresh],
                authenticated: true
            )
        }
        clear()
    }

    private func store(_ response: AuthResponse) {
        accessToken = response.accessToken
        KeychainStore.save(response.accessToken, for: "access")
        KeychainStore.save(response.refreshToken, for: "refresh")
    }

    func clear() {
        accessToken = nil
        KeychainStore.delete("access")
        KeychainStore.delete("refresh")
    }

    /// Coalesced so concurrent 401s produce exactly one refresh.
    private func refresh() async -> Bool {
        if let existing = refreshTask { return await existing.value }

        let task = Task<Bool, Never> { [baseURL] in
            guard let refreshToken = KeychainStore.read("refresh") else { return false }

            var request = URLRequest(url: baseURL.appendingPathComponent("auth/refresh"))
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "content-type")
            request.httpBody = try? JSONSerialization.data(
                withJSONObject: ["refreshToken": refreshToken]
            )

            guard let (data, response) = try? await URLSession.shared.data(for: request),
                  (response as? HTTPURLResponse)?.statusCode == 200,
                  let decoded = try? JSONDecoder().decode(AuthResponse.self, from: data)
            else { return false }

            await self.store(decoded)
            return true
        }

        refreshTask = task
        let result = await task.value
        refreshTask = nil
        return result
    }

    // MARK: - Requests

    func send<T: Decodable>(
        _ path: String,
        method: String = "GET",
        body: [String: Any]? = nil,
        authenticated: Bool = true
    ) async throws -> T {
        let data = try await sendRaw(path, method: method, body: body, authenticated: authenticated)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.server("Unexpected response from TheONE.")
        }
    }

    @discardableResult
    func sendRaw(
        _ path: String,
        method: String = "GET",
        body: [String: Any]? = nil,
        authenticated: Bool = true,
        allowRetry: Bool = true
    ) async throws -> Data {
        var request = URLRequest(url: baseURL.appendingPathComponent(path.hasPrefix("/") ? String(path.dropFirst()) : path))
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "content-type")

        if authenticated, let accessToken {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "authorization")
        }
        if let body {
            request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.network
        }

        guard let http = response as? HTTPURLResponse else { throw APIError.network }

        if http.statusCode == 401, authenticated, allowRetry {
            // The access token expired. Refresh once, then replay.
            if await refresh() {
                return try await sendRaw(
                    path, method: method, body: body,
                    authenticated: authenticated, allowRetry: false
                )
            }
            clear()
            throw APIError.unauthorized
        }

        guard (200..<300).contains(http.statusCode) else {
            throw Self.mapError(status: http.statusCode, data: data)
        }

        return data
    }

    /// Builds a request the streaming assistant endpoint can consume.
    func assistantRequest(message: String, threadId: String?) -> URLRequest? {
        guard let accessToken else { return nil }

        var request = URLRequest(url: baseURL.appendingPathComponent("assistant"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "authorization")
        request.timeoutInterval = 180

        var payload: [String: Any] = ["message": message]
        if let threadId { payload["threadId"] = threadId }
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        return request
    }

    /// Refreshes before streaming, since an SSE response cannot be replayed
    /// halfway through the way a normal request can.
    func prepareForStreaming() async {
        _ = await refresh()
    }

    private static func mapError(status: Int, data: Data) -> APIError {
        let code = (try? JSONSerialization.jsonObject(with: data) as? [String: Any])?["code"] as? String

        switch code {
        case "payment_required": return .paymentRequired
        case "account_inactive": return .inactive
        case "invalid_credentials", "missing_token", "invalid_token": return .unauthorized
        case "assistant_not_configured": return .notConfigured
        default: break
        }

        if status == 401 { return .unauthorized }
        if status == 429 { return .server("Too many attempts. Please wait a moment.") }
        return .server("Something went wrong (\(status)).")
    }
}

/// Device name for the session list, without importing UIKit into the actor.
enum UIDeviceName {
    @MainActor static var current: String {
        #if canImport(UIKit)
        return UIDevice.current.name
        #else
        return "iOS"
        #endif
    }
}

#if canImport(UIKit)
import UIKit
#endif
