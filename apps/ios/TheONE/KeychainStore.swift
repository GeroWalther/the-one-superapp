import Foundation
import Security

/// Token storage in the Keychain.
///
/// Not `UserDefaults`: that is a plain plist inside the app container, readable
/// from a backup or a jailbroken device. A refresh token is a long-lived
/// credential and belongs behind the Secure Enclave-backed store.
enum KeychainStore {
    private static let service = "com.theone.superapp.tokens"

    static func save(_ value: String, for key: String) {
        let data = Data(value.utf8)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]

        // Delete-then-add rather than update: SecItemUpdate fails when nothing
        // is there yet, and this path runs on both first login and refresh.
        SecItemDelete(query as CFDictionary)

        var insert = query
        insert[kSecValueData as String] = data
        // Tokens are useless before first unlock and must never leave the
        // device in an iCloud backup.
        insert[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly

        SecItemAdd(insert as CFDictionary, nil)
    }

    static func read(_ key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]

        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data,
              let value = String(data: data, encoding: .utf8)
        else { return nil }

        return value
    }

    static func delete(_ key: String) {
        SecItemDelete([
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ] as CFDictionary)
    }
}
