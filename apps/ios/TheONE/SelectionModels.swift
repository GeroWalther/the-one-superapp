import Foundation

/// TheONE MARKETPLACE wire types. Field names match the API exactly.

struct OfferingPartner: Codable, Sendable, Hashable {
    let id: String
    let name: String
    let category: String
    let city: String
}

struct Offering: Codable, Sendable, Hashable, Identifiable {
    let id: String
    let kind: String
    let title: String
    let description: String
    let priceCents: Int?
    let currency: String
    let priceNote: String?
    let imageUrl: String?
    /// The product page in the partner's own shop, when they have one.
    let url: String?
    let concerns: [String]
    let partner: OfferingPartner
    /// Why it was chosen for this member; only on "chosen for you" and skin picks.
    let reason: String?
    let basis: String?

    /// "CHF 145", "from CHF 650", "CHF 950 per night", or "On request".
    var priceText: String {
        guard let priceCents else { return tr("On request") }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        formatter.locale = Locale(identifier: MemberLanguage.tag)
        formatter.maximumFractionDigits = priceCents % 100 == 0 ? 0 : 2
        let amount = formatter.string(from: NSNumber(value: Double(priceCents) / 100)) ?? "\(priceCents / 100) \(currency)"
        switch priceNote {
        case "from": return tr("from %@", amount)
        case "per_night": return tr("%@ per night", amount)
        default: return amount
        }
    }

    /// The partner's shop page, marked as coming from TheONE so the partner
    /// sees in their analytics which sales TheONE brought them.
    var shopURL: URL? {
        guard let url, var parts = URLComponents(string: url) else { return nil }
        var items = parts.queryItems ?? []
        items += [URLQueryItem(name: "utm_source", value: "theone"), URLQueryItem(name: "utm_medium", value: "app")]
        parts.queryItems = items
        return parts.url
    }

    /// The TheONE area an offering belongs to, for its lettering card.
    var areaLabel: String {
        if kind == "property" { return "REAL ESTATE" }
        if kind == "flight" || (kind == "service" && partner.category == "other") { return "TRAVEL" }
        switch partner.category {
        case "clinic": return "LONGEVITY"
        case "practice", "wellness": return "HEALTH"
        case "hotel", "resort": return kind == "program" ? "HEALTH" : "HOTEL & RESORTS"
        case "realEstate": return "REAL ESTATE"
        default: return "MARKETPLACE"
        }
    }

    /// A product with the partner's own (square) photo.
    var ownProductPhoto: Bool { kind == "product" && imageUrl != nil }

    /// What the button asks the partner for.
    var actionTitle: String {
        switch kind {
        case "product": tr("Request to buy")
        case "treatment", "program": tr("Request an appointment")
        case "stay": tr("Request a stay")
        case "flight": tr("Request this flight")
        case "property": tr("Request a viewing")
        default: tr("Send a request")
        }
    }
}

struct SelectionPartner: Codable, Sendable, Hashable, Identifiable {
    /// Where the partner works and how to reach them, from their profile.
    struct Office: Codable, Sendable, Hashable {
        let street: String?
        let postalCode: String?
        let phone: String
        let email: String
        let website: String?
    }

    let id: String
    let name: String
    let category: String
    let city: String
    let country: String
    let description: String
    let images: [String]
    /// A line on the brand's section head, such as an award; English as given.
    let tagline: String?
    /// Seals on the brand's section head (award, quality).
    let badges: [String]?
    /// Words on the boutique window, German and English ("Wirkstoffpflege").
    let labels: [String]?
    let labelsEn: [String]?
    let office: Office?

    /// The boutique window's words in the member's language.
    var windowLabels: [String] {
        let german = labels ?? []
        let english = labelsEn ?? []
        if MemberLanguage.tag.hasPrefix("de") { return german.isEmpty ? english : german }
        return english.isEmpty ? german : english
    }
    let offerings: [Offering]
}

struct SelectionSection: Codable, Sendable, Hashable, Identifiable {
    let key: String
    let partners: [SelectionPartner]
    var id: String { key }

    var title: String {
        switch key {
        case "skincare": tr("Beauty and care")
        case "products": tr("Nutrition and wellbeing")
        case "aesthetics": tr("Aesthetic doctors")
        case "longevity": tr("Longevity clinics")
        case "prevention": tr("Trusted doctors")
        case "sanatoriums": tr("Five star sanatoriums")
        case "wellnessClinics": tr("Health and wellness clinics")
        case "hotels", "travel", "stays": tr("Hotels and resorts")
        case "flights": tr("Flights")
        case "concierge": tr("Private concierge")
        case "realestate", "property": tr("Homes and brokers")
        case "estates": tr("Exceptional estates worldwide")
        case "medicine": tr("Medicine")
        case "insurance": tr("Insurance")
        default: tr("Lifestyle")
        }
    }

    /// The website's picture for the area, shown until partners add their own.
    var imagePath: String? { SelectionSection.image(for: key) }

    /// No borrowed picture where none fits (flights, concierge): those show a
    /// plain petrol surface with a symbol until the partner adds a photo.
    static func symbol(for key: String) -> String? {
        switch key {
        case "flights": "airplane"
        case "concierge": "person.crop.circle.badge.checkmark"
        default: nil
        }
    }

    static func image(for key: String) -> String? {
        if symbol(for: key) != nil { return nil }
        return switch key {
        // Each area shows a picture once: two sections of one area never
        // share the same picture.
        case "skincare", "aesthetics", "wellnessClinics": "images/verticals/beauty-wellness.webp"
        case "products": "images/verticals/lifestyle.webp"
        case "longevity", "medicine", "prevention": "images/verticals/health-longevity-v3.webp"
        case "hotels", "travel", "stays", "sanatoriums": "images/verticals/luxury-hotels-v2.webp"
        case "realestate", "property", "estates": "images/verticals/real-estate-v2.webp"
        case "insurance": "images/verticals/business-wealth.webp"
        default: "images/verticals/lifestyle.webp"
        }
    }

    /// Which area an offering belongs to, for its fallback picture.
    static func key(for offering: Offering) -> String {
        if offering.kind == "flight" { return "flights" }
        if offering.kind == "service", offering.partner.category == "other" { return "concierge" }
        return switch offering.partner.category {
        case "beauty": "skincare"
        case "practice": offering.concerns.isEmpty ? "prevention" : "aesthetics"
        case "clinic": "longevity"
        case "wellness": "wellnessClinics"
        case "hotel", "resort": "hotels"
        case "realEstate": "realestate"
        case "insurance": "insurance"
        default: "products"
        }
    }
}

/// Each TheONE function with its own area. The names are TheONE names:
/// English, with TheONE in front, in every language.
enum Area: String, Identifiable, CaseIterable, Sendable {
    case selection, longevity, health, hotels, travel, realestate
    var id: Self { self }

    var name: String {
        switch self {
        case .selection: "TheONE MARKETPLACE"
        case .longevity: "TheONE LONGEVITY"
        case .health: "TheONE HEALTH"
        case .hotels: "TheONE HOTEL & RESORTS"
        case .travel: "TheONE TRAVEL"
        case .realestate: "TheONE REAL ESTATE"
        }
    }

    var line: String {
        switch self {
        case .selection: tr("Curated brands, chosen by TheONE. Discover and buy directly in the brand's shop.")
        case .longevity: tr("Stay young for longer: the best longevity clinics in your city, with check-ups and programmes.")
        case .health: tr("Stay healthy: prevention, health and wellness clinics, chosen for you.")
        case .hotels: tr("The finest hotels and resorts, chosen for you.")
        case .travel: tr("Flights with TheONE airline partners and your private travel concierge, chosen for you.")
        case .realestate: tr("The best brokers in the world with their exceptional estates, and your own property sold with them.")
        }
    }

    /// What POWER AI says after "how are you", as the area opens.
    var opener: String {
        switch self {
        case .selection: tr("Tell me what you are looking for, and I will find the products that truly suit you.")
        case .longevity: tr("Tell me how you live, and I will show you how to stay young and healthy for longer.")
        case .health: tr("Tell me how you feel. I am listening, and I will find the right help for you.")
        case .hotels: tr("Tell me where you would like to rest, and I will find the perfect place for you.")
        case .travel: tr("Tell me where you would like to go, and I will take care of your flight and everything around it.")
        case .realestate: tr("Are you looking for a home, or would you like to sell your property? I will connect you with the best brokers in the world.")
        }
    }

    var symbol: String {
        switch self {
        case .selection: "sparkle"
        case .longevity: "hourglass"
        case .health: "heart.text.square"
        case .hotels: "bed.double"
        case .travel: "airplane"
        case .realestate: "house"
        }
    }
}

struct SelectionFeed: Codable, Sendable {
    let forYou: [Offering]
    let sections: [SelectionSection]
}

/// The public website, where the area pictures live.
enum Site {
    #if targetEnvironment(simulator)
    static let base = URL(string: "http://localhost:5656/")!
    #else
    static let base = URL(string: "https://www.theone-superapp.com/")!
    #endif

    static func url(_ path: String) -> URL { base.appendingPathComponent(path) }
}
