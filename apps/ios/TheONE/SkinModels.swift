import Foundation
import UIKit

/// TheONE skin analysis wire types. Field names match the API exactly.

struct SkinScore: Codable, Sendable, Hashable {
    let key: String
    let score: Int
    let note: String
}

struct SkinPartner: Codable, Sendable, Hashable, Identifiable {
    let id: String
    let name: String
    let category: String
    let city: String
    let reason: String
}

struct SkinScan: Codable, Sendable, Hashable, Identifiable {
    let id: String
    let createdAt: String
    let overall: Int
    let scores: [SkinScore]
    let summary: String
    let focus: [String]
    let morning: [String]
    let evening: [String]
    let partners: [SkinPartner]
    /// The exact products and treatments from TheONE MARKETPLACE for this skin.
    let products: [Offering]?
    let seeDoctor: Bool
    let doctorNote: String

    var date: Date {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.date(from: createdAt) ?? Date()
    }
}

enum SkinWords {
    /// The seven readings, in the order they are shown.
    static func label(_ key: String) -> String {
        switch key {
        case "hydration": tr("Hydration")
        case "lines": tr("Fine lines")
        case "pigmentation": tr("Pigmentation")
        case "redness": tr("Redness")
        case "pores": tr("Pores")
        case "evenness": tr("Evenness")
        case "radiance": tr("Radiance")
        default: key
        }
    }
}

/// Photos the member chose to keep for a before and after. They stay on this
/// phone, in the app's own storage, and are never uploaded again.
enum SkinPhotoStore {
    private static var folder: URL {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        let url = base.appendingPathComponent("skin", isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    private static func file(_ scanId: String) -> URL {
        folder.appendingPathComponent("\(scanId).jpg")
    }

    static func save(_ jpeg: Data, for scanId: String) {
        var url = file(scanId)
        try? jpeg.write(to: url, options: [.atomic, .completeFileProtection])
        // Never copied into iCloud backups: a face photo stays on this device.
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        try? url.setResourceValues(values)
    }

    static func image(for scanId: String) -> UIImage? {
        UIImage(contentsOfFile: file(scanId).path)
    }

    static func delete(_ scanId: String) {
        try? FileManager.default.removeItem(at: file(scanId))
    }
}

extension UIImage {
    /// Scaled so the long side is at most `longest` pixels, as a JPEG: what the
    /// analysis needs, well under the upload limit.
    func scaledJPEG(longest: CGFloat = 1568, quality: CGFloat = 0.85) -> Data? {
        let scale = min(1, longest / max(size.width, size.height))
        let target = CGSize(width: size.width * scale, height: size.height * scale)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let resized = UIGraphicsImageRenderer(size: target, format: format).image { _ in
            draw(in: CGRect(origin: .zero, size: target))
        }
        return resized.jpegData(compressionQuality: quality)
    }
}
