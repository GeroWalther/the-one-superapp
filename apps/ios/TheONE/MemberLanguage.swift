import Foundation
import NaturalLanguage

/// The language of whoever is holding the phone.
///
/// TheONE speaks the member's language, whatever it is: a Japanese member
/// travelling in Europe who speaks no English asks in Japanese and is answered
/// in Japanese. The phone's own language is the starting point; what the
/// member actually says or writes overrides it, reply by reply.
enum MemberLanguage {
    /// The phone's first preferred language, e.g. "ja-JP" or "de-CH".
    static var tag: String { Locale.preferredLanguages.first ?? "en-US" }

    /// Just the language, e.g. "ja".
    static var code: String {
        Locale(identifier: tag).language.languageCode?.identifier ?? "en"
    }

    static var isGerman: Bool { code == "de" }

    /// The language `text` is written in, so the right voice reads it aloud;
    /// the phone's language when the text is too short to tell.
    static func of(_ text: String) -> String {
        let recogniser = NLLanguageRecognizer()
        recogniser.processString(text)
        return recogniser.dominantLanguage?.rawValue ?? code
    }

    /// "You have a match" for the moment both have said yes, in the phone's
    /// language. Languages without a line here hear English.
    static func matchAnnouncement(_ name: String) -> String {
        switch code {
        case "de": "Du hast ein Match. \(name) möchte dich auch kennenlernen."
        case "fr": "Tu as un match. \(name) aimerait aussi faire ta connaissance."
        case "it": "Hai un match. Anche \(name) vorrebbe conoscerti."
        case "es": "Tienes un match. \(name) también quiere conocerte."
        case "pt": "Você tem um match. \(name) também quer conhecer você."
        case "ru": "У тебя есть совпадение. \(name) тоже хочет с тобой познакомиться."
        case "ja": "マッチしました。\(name)さんもあなたに会いたいと思っています。"
        case "zh": "你有一个配对。\(name)也想认识你。"
        case "ar": "لديك تطابق. \(name) يرغب أيضًا في التعرف عليك."
        default: "You have a match. \(name) would like to meet you too."
        }
    }
}
