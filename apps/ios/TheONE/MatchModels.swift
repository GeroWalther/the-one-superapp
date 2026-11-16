import Foundation

/// TheONE MATCH wire types. Field names match the API exactly.

struct MatchWishes: Codable, Sendable, Equatable {
    var ageMin: Int
    var ageMax: Int
    var heightMin: Int?
    var heightMax: Int?
    /// Empty means "no preference".
    var hairColors: [String]
    var eyeColors: [String]
    var figures: [String]
}

struct MatchProfile: Codable, Sendable, Equatable {
    var gender: String
    var seeking: String
    var birthYear: Int
    var heightCm: Int
    var hairColor: String
    var eyeColor: String
    var figure: String
    var profession: String
    var city: String
    var hobbies: [String]
    var intention: String
    var about: String
    var wishes: MatchWishes
    var visible: Bool
    var photos: [String]

    /// A starting point for someone filling the form in for the first time.
    static func blank(city: String = "") -> MatchProfile {
        let year = Calendar.current.component(.year, from: Date())
        return MatchProfile(
            gender: "woman", seeking: "man", birthYear: year - 40, heightCm: 170,
            hairColor: "brown", eyeColor: "brown", figure: "slim",
            profession: "", city: city, hobbies: [], intention: "relationship", about: "",
            wishes: MatchWishes(
                ageMin: 35, ageMax: 55, heightMin: nil, heightMax: nil,
                hairColors: [], eyeColors: [], figures: []
            ),
            visible: true, photos: []
        )
    }

    /// The body the API accepts; photos travel separately.
    var payload: [String: Any] {
        var wishes: [String: Any] = [
            "ageMin": wishes.ageMin, "ageMax": wishes.ageMax,
            "hairColors": wishes.hairColors, "eyeColors": wishes.eyeColors,
            "figures": wishes.figures,
        ]
        wishes["heightMin"] = self.wishes.heightMin ?? NSNull()
        wishes["heightMax"] = self.wishes.heightMax ?? NSNull()
        return [
            "gender": gender, "seeking": seeking, "birthYear": birthYear,
            "heightCm": heightCm, "hairColor": hairColor, "eyeColor": eyeColor,
            "figure": figure, "profession": profession, "city": city,
            "hobbies": hobbies, "intention": intention, "about": about,
            "wishes": wishes, "visible": visible,
        ]
    }
}

struct MatchCard: Codable, Identifiable, Sendable, Hashable {
    let id: String
    let firstName: String
    let age: Int
    let city: String
    let profession: String
    let heightCm: Int
    let hairColor: String
    let eyeColor: String
    let figure: String
    let hobbies: [String]
    let intention: String
    let about: String
    let photos: [String]
    let score: Int
    let sharedHobbies: [String]
    let fitsWishes: [String]
}

struct MatchSummary: Codable, Identifiable, Sendable, Hashable {
    let id: String
    let firstName: String
    let age: Int
    let city: String
    let photo: String?
    let conversationId: String?
    let matchedAt: String
}

// MARK: - Words

/// German or English, following the member's account language.
struct MatchWords {
    let german: Bool

    /// Follows the phone's language: German there, English everywhere else.
    init() { german = MemberLanguage.isGerman }

    func callAsFunction(_ de: String, _ en: String) -> String { german ? de : en }

    static let genders = ["woman", "man"]
    static let hairColors = ["blonde", "brown", "black", "red", "grey", "other"]
    static let eyeColors = ["blue", "green", "brown", "grey", "hazel"]
    static let figures = ["slim", "athletic", "average", "curvy", "strong"]
    static let intentions = ["relationship", "dating", "friendship"]
    static let hobbies = [
        "travel", "golf", "tennis", "sailing", "riding", "skiing", "fitness", "yoga",
        "wellness", "art", "music", "culture", "fashion", "cooking", "wine", "reading",
        "nature", "dancing",
    ]

    func label(_ key: String) -> String {
        let pair: (String, String) = switch key {
        case "woman": ("Frau", "Woman")
        case "man": ("Mann", "Man")
        case "blonde": ("Blond", "Blonde")
        case "brown": ("Braun", "Brown")
        case "black": ("Schwarz", "Black")
        case "red": ("Rot", "Red")
        case "grey": ("Grau", "Grey")
        case "other": ("Andere", "Other")
        case "blue": ("Blau", "Blue")
        case "green": ("Grün", "Green")
        case "hazel": ("Haselnuss", "Hazel")
        case "slim": ("Schlank", "Slim")
        case "athletic": ("Sportlich", "Athletic")
        case "average": ("Normal", "Average")
        case "curvy": ("Kurvig", "Curvy")
        case "strong": ("Kräftig", "Strong")
        case "relationship": ("Feste Beziehung", "A relationship")
        case "dating": ("Dates", "Dating")
        case "friendship": ("Freundschaft", "Friendship")
        case "travel": ("Reisen", "Travel")
        case "golf": ("Golf", "Golf")
        case "tennis": ("Tennis", "Tennis")
        case "sailing": ("Segeln", "Sailing")
        case "riding": ("Reiten", "Riding")
        case "skiing": ("Ski", "Skiing")
        case "fitness": ("Fitness", "Fitness")
        case "yoga": ("Yoga", "Yoga")
        case "wellness": ("Wellness", "Wellness")
        case "art": ("Kunst", "Art")
        case "music": ("Musik", "Music")
        case "culture": ("Kultur", "Culture")
        case "fashion": ("Mode", "Fashion")
        case "cooking": ("Kochen", "Cooking")
        case "wine": ("Wein", "Wine")
        case "reading": ("Lesen", "Reading")
        case "nature": ("Natur", "Nature")
        case "dancing": ("Tanzen", "Dancing")
        case "hair": ("Haarfarbe", "Hair")
        case "eyes": ("Augen", "Eyes")
        case "figure": ("Figur", "Figure")
        case "height": ("Größe", "Height")
        default: (key, key)
        }
        return german ? pair.0 : pair.1
    }

    func labels(_ keys: [String]) -> String {
        keys.map(label).joined(separator: ", ")
    }

    /// "Reisen, Golf und Wein": a list the way it is said aloud.
    func spokenList(_ keys: [String]) -> String {
        let names = keys.map(label)
        guard names.count > 1 else { return names.first ?? "" }
        return names.dropLast().joined(separator: ", ") + (german ? " und " : " and ") + names[names.count - 1]
    }
}
