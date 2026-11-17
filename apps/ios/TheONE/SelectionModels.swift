import Foundation

/// TheONE SELECTION wire types. Field names match the API exactly.

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
    let id: String
    let name: String
    let category: String
    let city: String
    let country: String
    let description: String
    let images: [String]
    let offerings: [Offering]
}

struct SelectionSection: Codable, Sendable, Hashable, Identifiable {
    let key: String
    let partners: [SelectionPartner]
    var id: String { key }

    var title: String {
        switch key {
        case "skincare": tr("Skincare")
        case "products": tr("Nutrition and wellbeing")
        case "aesthetics": tr("Aesthetic doctors")
        case "longevity": tr("Longevity clinics")
        case "prevention": tr("Prevention")
        case "wellnessClinics": tr("Health and wellness clinics")
        case "hotels", "travel", "stays": tr("Hotels and resorts")
        case "flights": tr("Flights")
        case "concierge": tr("Private concierge")
        case "realestate", "property": tr("Homes and brokers")
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
        case "skincare", "aesthetics", "products": "images/verticals/beauty-wellness.webp"
        case "longevity", "medicine", "prevention", "wellnessClinics": "images/verticals/health-longevity-v3.webp"
        case "hotels", "travel", "stays": "images/verticals/luxury-hotels-v2.webp"
        case "realestate", "property": "images/verticals/real-estate-v2.webp"
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
        case .selection: "TheONE SELECTION"
        case .longevity: "TheONE LONGEVITY"
        case .health: "TheONE HEALTH"
        case .hotels: "TheONE HOTEL & RESORTS"
        case .travel: "TheONE TRAVEL"
        case .realestate: "TheONE REAL ESTATE"
        }
    }

    var line: String {
        switch self {
        case .selection: tr("Hand-picked for you: only the best two or three in each area, with exactly what they offer.")
        case .longevity: tr("Stay young for longer: the best longevity clinics in your city, with check-ups and programmes.")
        case .health: tr("Stay healthy: prevention, health and wellness clinics, chosen for you.")
        case .hotels: tr("The finest hotels and resorts, chosen for you.")
        case .travel: tr("Flights with TheONE airline partners and your private travel concierge, chosen for you.")
        case .realestate: tr("Exceptional homes and the best brokers in your city, for buying or selling.")
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
