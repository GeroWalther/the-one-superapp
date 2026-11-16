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
        case "aesthetics": tr("Aesthetic doctors")
        // A TheONE name, so English and the same in every language.
        case "longevity": "TheONE LONGEVITY"
        case "stays": tr("Hotels and resorts")
        case "medicine": tr("Medicine")
        case "property": tr("Real Estate")
        case "insurance": tr("Insurance")
        default: tr("Lifestyle")
        }
    }

    /// The website's picture for the area, shown until partners add their own.
    var imagePath: String { SelectionSection.image(for: key) }

    static func image(for key: String) -> String {
        switch key {
        case "skincare", "aesthetics": "images/verticals/beauty-wellness.webp"
        case "longevity", "medicine": "images/verticals/health-longevity-v3.webp"
        case "stays": "images/verticals/luxury-hotels-v2.webp"
        case "property": "images/verticals/real-estate-v2.webp"
        case "insurance": "images/verticals/business-wealth.webp"
        default: "images/verticals/lifestyle.webp"
        }
    }

    /// Which area an offering belongs to, for its fallback picture.
    static func key(for offering: Offering) -> String {
        switch offering.partner.category {
        case "beauty": "skincare"
        case "practice": offering.concerns.isEmpty ? "medicine" : "aesthetics"
        case "clinic": "longevity"
        case "hotel", "resort", "wellness": "stays"
        case "realEstate": "property"
        case "insurance": "insurance"
        default: "lifestyle"
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
