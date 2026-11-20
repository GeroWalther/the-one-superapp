import SwiftUI
import MessageUI
import Contacts

/// The email POWER AI wrote, shown under its reply: who it goes to, the
/// subject and the full text, with a button to change it by asking again and
/// one to open it in Mail, where the member sends it themselves.
struct EmailDraftCard: View {
    let draft: EmailDraft
    var onChange: () -> Void
    var onOpen: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: draft.sent ? "checkmark.circle" : "envelope")
                    .font(.system(size: 15))
                    .foregroundStyle(Theme.accentText)
                Text(draft.sent ? tr("Email sent") : tr("Your email"))
                    .font(.theone(13, weight: .medium))
                    .foregroundStyle(Theme.accentText)
            }

            if !draft.recipientLine.isEmpty {
                field(tr("To"), draft.recipientLine)
            }
            field(tr("Subject"), draft.subject)

            Text(draft.body)
                .font(.theone(14.5))
                .foregroundStyle(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
                .textSelection(.enabled)
                .accessibilityIdentifier("email.body")

            if !draft.sent {
                HStack(spacing: 8) {
                    Spacer()
                    Button(action: onChange) {
                        Text(tr("Change"))
                            .font(.theone(13.5, weight: .medium))
                            .foregroundStyle(Theme.accentText)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .overlay(Capsule().stroke(Theme.accentText.opacity(0.6), lineWidth: 1))
                    }
                    .accessibilityIdentifier("email.change")

                    Button(action: onOpen) {
                        Text(tr("Open in Mail"))
                            .font(.theone(13.5, weight: .medium))
                            .foregroundStyle(Theme.onAccent)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 8)
                            .background(Capsule().fill(Theme.heading))
                    }
                    .accessibilityIdentifier("email.open")
                }
                .padding(.top, 2)
            }
        }
        .padding(14)
        .frame(maxWidth: 320, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 16, style: .continuous)
                .fill(Theme.panel)
                .overlay(
                    RoundedRectangle(cornerRadius: 16, style: .continuous)
                        .stroke(Theme.line, lineWidth: 1)
                )
        )
        // Keeps the buttons reachable on their own: an identifier on a plain
        // container would be handed down and replace theirs.
        .accessibilityElement(children: .contain)
        .accessibilityIdentifier("email.card")
    }

    private func field(_ label: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label)
                .font(.theone(11.5))
                .foregroundStyle(Theme.inkFaint)
            Text(value)
                .font(.theone(14, weight: .medium))
                .foregroundStyle(Theme.ink)
        }
    }
}

/// What the Mail sheet is opened with.
struct MailRequest: Identifiable {
    let id = UUID()
    let turnID: UUID
    let to: [String]
    let subject: String
    let body: String

    /// The whole email as plain text, for copying when no mail account exists.
    var plainText: String {
        (to.isEmpty ? "" : "\(tr("To")): \(to.joined(separator: ", "))\n")
            + "\(tr("Subject")): \(subject)\n\n\(body)"
    }

    /// Opens the default mail app (Mail, Gmail, Outlook) when the system Mail
    /// sheet is unavailable.
    var mailtoURL: URL? {
        var parts = URLComponents()
        parts.scheme = "mailto"
        parts.path = to.joined(separator: ",")
        parts.queryItems = [
            URLQueryItem(name: "subject", value: subject),
            URLQueryItem(name: "body", value: body),
        ]
        return parts.url
    }
}

/// The system Mail sheet, filled in. It sends from the member's own account,
/// and only when they tap send.
struct MailComposer: UIViewControllerRepresentable {
    let request: MailRequest
    let onFinish: (Bool) -> Void

    static var isAvailable: Bool { MFMailComposeViewController.canSendMail() }

    func makeCoordinator() -> Coordinator { Coordinator(onFinish: onFinish) }

    func makeUIViewController(context: Context) -> MFMailComposeViewController {
        let controller = MFMailComposeViewController()
        controller.mailComposeDelegate = context.coordinator
        controller.setToRecipients(request.to)
        controller.setSubject(request.subject)
        controller.setMessageBody(request.body, isHTML: false)
        return controller
    }

    func updateUIViewController(_ controller: MFMailComposeViewController, context: Context) {}

    final class Coordinator: NSObject, MFMailComposeViewControllerDelegate {
        let onFinish: (Bool) -> Void
        init(onFinish: @escaping (Bool) -> Void) { self.onFinish = onFinish }

        func mailComposeController(
            _ controller: MFMailComposeViewController,
            didFinishWith result: MFMailComposeResult,
            error: Error?
        ) {
            onFinish(result == .sent)
        }
    }
}

/// Shown when the phone has no mail account: the email to copy, so it can be
/// pasted into whatever the member writes email with.
struct MailFallbackSheet: View {
    let request: MailRequest
    @Environment(\.dismiss) private var dismiss
    @State private var copied = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Text(tr("No email account is set up in Mail on this iPhone. Copy the email and paste it into your email app."))
                        .font(.theone(14))
                        .foregroundStyle(Theme.inkSoft)

                    Text(request.plainText)
                        .font(.theone(14.5))
                        .foregroundStyle(Theme.ink)
                        .textSelection(.enabled)
                        .padding(14)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(RoundedRectangle(cornerRadius: 14).fill(Theme.paperSoft))

                    Button {
                        UIPasteboard.general.string = request.plainText
                        copied = true
                    } label: {
                        Label(copied ? tr("Copied") : tr("Copy email"),
                              systemImage: copied ? "checkmark" : "doc.on.doc")
                            .font(.theone(15, weight: .medium))
                            .foregroundStyle(Theme.onAccent)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 13)
                            .background(Capsule().fill(Theme.heading))
                    }
                    .accessibilityIdentifier("email.copy")
                }
                .padding(20)
            }
            .paperBackground()
            .navigationTitle(tr("Your email"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(tr("Done")) { dismiss() }
                }
            }
        }
    }
}

/// Finds a recipient's address in the member's contacts. Asked only when they
/// tap "Open in Mail" without an address, and only the name they said is read.
enum ContactsLookup {
    private static let titles: Set<String> = [
        "dr", "dr.", "prof", "prof.", "herr", "frau", "mr", "mr.", "mrs", "mrs.", "ms", "ms.",
        "monsieur", "madame", "signor", "signora", "señor", "señora",
    ]

    static func email(for name: String) async -> String? {
        let words = name.split(separator: " ").map(String.init)
            .filter { !titles.contains($0.lowercased()) }
        let query = words.joined(separator: " ")
        guard !query.isEmpty else { return nil }

        let status = CNContactStore.authorizationStatus(for: .contacts)
        if status == .denied || status == .restricted { return nil }
        if status == .notDetermined {
            let granted = (try? await CNContactStore().requestAccess(for: .contacts)) ?? false
            guard granted else { return nil }
        }

        return await Task.detached(priority: .userInitiated) {
            let store = CNContactStore()
            let keys = [CNContactEmailAddressesKey as CNKeyDescriptor]
            let matches = (try? store.unifiedContacts(
                matching: CNContact.predicateForContacts(matchingName: query),
                keysToFetch: keys
            )) ?? []
            return matches.lazy.compactMap { $0.emailAddresses.first?.value as String? }.first
        }.value
    }
}
