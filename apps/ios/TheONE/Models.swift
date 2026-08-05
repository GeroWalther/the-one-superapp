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

/// A member's editable profile. Distinct from `Account`, which is identity and
/// billing state the member cannot change from the app.
struct MemberProfile: Codable, Sendable {
    var displayName: String
    var country: String
    var city: String
    var focusAreas: [String]
    var goal: String
    var context: String?

    /// False while these are still the answers given at enrolment.
    let edited: Bool?
}

struct MeResponse: Decodable, Sendable {
    let account: Account
    let profile: MemberProfile?
}

struct ProfileResponse: Decodable, Sendable {
    let profile: MemberProfile
}

/// The option lists the profile editor offers. Mirrors `FOCUS_AREAS` and
/// `GOALS` in the web app's domain module — the server validates against its
/// own copy, so a drift here shows up as a rejected save rather than bad data.
enum ProfileOptions {
    static let focusAreas = [
        "health", "hotels", "property", "lifestyle", "beauty", "wellness", "insurance",
    ]
    static let goals = ["clarity", "access", "longevity", "network"]

    static func label(_ raw: String) -> String {
        switch raw {
        case "health": return "Health & Longevity"
        case "hotels": return "Luxury Hotels"
        case "property": return "Real Estate"
        case "lifestyle": return "Lifestyle"
        case "beauty": return "Beauty & Skincare"
        case "wellness": return "Wellness Resorts"
        case "insurance": return "Insurance"
        case "clarity": return "Clarity before a decision"
        case "access": return "Access to vetted providers"
        case "longevity": return "Longevity and health span"
        case "network": return "Network and introductions"
        default: return raw.capitalized
        }
    }
}
