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
    private let baseURL = URL(string: "https://www.theone-superapp.com/api/v1")!
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
            throw APIError.server(tr("Unexpected response from TheONE."))
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
        var request = URLRequest(url: url(for: path))
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

    /// `appendingPathComponent` escapes a `?`, so a query is attached separately.
    private func url(for path: String) -> URL {
        let trimmed = path.hasPrefix("/") ? String(path.dropFirst()) : path
        let parts = trimmed.split(separator: "?", maxSplits: 1).map(String.init)
        let base = baseURL.appendingPathComponent(parts[0])
        guard parts.count == 2,
              var components = URLComponents(url: base, resolvingAgainstBaseURL: false)
        else { return base }
        components.percentEncodedQuery = parts[1]
        return components.url ?? base
    }

    /// Uploads one JPEG as multipart form field `image`, and decodes the answer.
    func upload<T: Decodable>(
        _ path: String,
        jpeg: Data,
        fields: [String: String] = [:],
        timeout: TimeInterval = 120,
        allowRetry: Bool = true
    ) async throws -> T {
        let boundary = "TheONE-\(UUID().uuidString)"
        var request = URLRequest(url: url(for: path))
        request.httpMethod = "POST"
        request.timeoutInterval = timeout
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "content-type")
        if let accessToken {
            request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "authorization")
        }

        var body = Data()
        for (name, value) in fields {
            body.append(Data("--\(boundary)\r\nContent-Disposition: form-data; name=\"\(name)\"\r\n\r\n\(value)\r\n".utf8))
        }
        body.append(Data("--\(boundary)\r\n".utf8))
        body.append(Data("Content-Disposition: form-data; name=\"image\"; filename=\"photo.jpg\"\r\n".utf8))
        body.append(Data("Content-Type: image/jpeg\r\n\r\n".utf8))
        body.append(jpeg)
        body.append(Data("\r\n--\(boundary)--\r\n".utf8))
        request.httpBody = body

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.network
        }
        guard let http = response as? HTTPURLResponse else { throw APIError.network }

        if http.statusCode == 401, allowRetry {
            if await refresh() {
                return try await upload(path, jpeg: jpeg, fields: fields, timeout: timeout, allowRetry: false)
            }
            clear()
            throw APIError.unauthorized
        }
        guard (200..<300).contains(http.statusCode) else {
            throw Self.mapError(status: http.statusCode, data: data)
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.server(tr("Unexpected response from TheONE."))
        }
    }

    /// Builds a request the streaming assistant endpoint can consume.
    func assistantRequest(message: String, threadId: String?, opening: String? = nil) -> URLRequest? {
        guard let accessToken else { return nil }

        var request = URLRequest(url: baseURL.appendingPathComponent("assistant"))
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "content-type")
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "authorization")
        request.timeoutInterval = 180

        // Replies follow the member's language, starting from the phone's.
        var payload: [String: Any] = ["message": message, "language": MemberLanguage.tag]
        if let threadId { payload["threadId"] = threadId }
        if let opening { payload["opening"] = opening }
        request.httpBody = try? JSONSerialization.data(withJSONObject: payload)

        return request
    }

    /// Refreshes before streaming, since an SSE response cannot be replayed
    /// halfway through the way a normal request can.
    func prepareForStreaming() async {
        _ = await refresh()
    }

    private static func mapError(status: Int, data: Data) -> APIError {
        let json = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
        let code = json?["code"] as? String

        // A reason written for the member (e.g. how to retake a skin photo).
        if let message = json?["message"] as? String, !message.isEmpty {
            return .server(message)
        }

        switch code {
        case "too_many": return .server(tr("You have done TheONE SKIN SCAN several times today. Please try again tomorrow."))
        case "unusable": return .server(tr("Your face could not be seen clearly. Please try again in good light, facing the camera."))
        case "payment_required": return .paymentRequired
        case "account_inactive": return .inactive
        case "invalid_credentials", "missing_token", "invalid_token": return .unauthorized
        case "assistant_not_configured": return .notConfigured
        default: break
        }

        if status == 401 { return .unauthorized }
        if status == 429 { return .server(tr("Too many attempts. Please wait a moment.")) }
        return .server(tr("Something went wrong (%lld).", status))
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
