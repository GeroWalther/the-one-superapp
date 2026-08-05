import Foundation

/// Wire types for TheONE's API. Field names match the JSON exactly, so there is
/// no mapping layer to fall out of sync with the server.

struct Account: Codable, Identifiable, Sendable {
    let id: String
    let role: String
    let username: String
    let email: String
    let displayName: String
    let firstName: String
    let locale: String
    let status: String
    let successfulReferrals: Int
    let freeMonthsGranted: Int
}

struct AuthResponse: Codable, Sendable {
    let accessToken: String
    let refreshToken: String
    let account: Account
}

struct PartnerSummary: Codable, Identifiable, Sendable, Hashable {
    let id: String
    let name: String
    let category: String
    let focusArea: String
    let city: String
    let country: String
    let description: String
    let images: [String]
    let saved: Bool
}

struct PartnerDetail: Codable, Identifiable, Sendable {
    let id: String
    let name: String
    let category: String
    let focusArea: String
    let city: String
    let country: String
    let description: String
    let images: [String]
    let saved: Bool
    let targetClientele: String?
    let street: String?
    let postalCode: String?
    let website: String?
    let contactEmail: String
    let contactPhone: String
    let accountId: String
}

struct ConversationSummary: Codable, Identifiable, Sendable, Hashable {
    let id: String
    let counterpartId: String
    let counterpartName: String
    let lastMessagePreview: String
    let lastMessageAt: String
    let unread: Bool
}

struct ChatMessage: Codable, Identifiable, Sendable, Hashable {
    let id: String
    let senderId: String
    let body: String
    let mine: Bool
    let createdAt: String
}

/// One turn in the assistant transcript. Not a wire type — the streaming
/// endpoint sends deltas, and this is what the view accumulates them into.
struct AssistantTurn: Identifiable, Sendable, Hashable {
    let id = UUID()
    var role: Role
    var text: String
    /// The tool currently running, shown while the model works.
    var runningTool: String?

    enum Role: Sendable, Hashable { case user, assistant }
}

/// A failure worth showing the member, separated from noise worth logging.
enum APIError: LocalizedError, Sendable {
    case unauthorized
    case paymentRequired
    case inactive
    case notConfigured
    case server(String)
    case network

    var errorDescription: String? {
        switch self {
        case .unauthorized:
            "Those details do not match an account."
        case .paymentRequired:
            "Your access is approved but not yet paid for. Finish checkout on theone-superapp.vercel.app to sign in."
        case .inactive:
            "This account is not active. Please contact us."
        case .notConfigured:
            "The assistant is not available right now."
        case .server(let message):
            message
        case .network:
            "Could not reach TheONE. Check your connection."
        }
    }
}
