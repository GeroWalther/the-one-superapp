import SwiftUI

/// Drives one assistant conversation, consuming the server's SSE stream.
@MainActor
@Observable
final class AssistantModel {
    var turns: [AssistantTurn] = []
    var draft = ""
    var isStreaming = false
    var error: String?
    var speakReplies = true

    private var threadId: String?

    func send(speech: SpeechController, opening: String? = nil) async {
        let message = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !message.isEmpty, !isStreaming else { return }

        draft = ""
        error = nil
        speech.stopSpeaking()

        // The greeting stays at the top of the conversation it opened.
        if turns.isEmpty, threadId == nil, let opening {
            turns.append(AssistantTurn(role: .assistant, text: opening))
        }
        turns.append(AssistantTurn(role: .user, text: message))
        turns.append(AssistantTurn(role: .assistant, text: ""))
        let replyIndex = turns.count - 1
        isStreaming = true
        defer { isStreaming = false }

        // An SSE response cannot be replayed halfway through, so the token is
        // refreshed up front rather than relying on the usual 401 retry.
        await APIClient.shared.prepareForStreaming()

        guard let request = await APIClient.shared.assistantRequest(
            message: message,
            threadId: threadId,
            // Only a new conversation carries the greeting; an ongoing one
            // already has it on the server.
            opening: threadId == nil ? opening : nil
        ) else {
            error = APIError.unauthorized.errorDescription
            return
        }

        do {
            let (bytes, response) = try await URLSession.shared.bytes(for: request)

            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                error = (response as? HTTPURLResponse)?.statusCode == 503
                    ? APIError.notConfigured.errorDescription
                    : APIError.server(tr("The assistant is unavailable.")).errorDescription
                turns.removeSubrange(replyIndex...)
                return
            }

            for try await line in bytes.lines {
                guard line.hasPrefix("data: ") else { continue }
                let payload = String(line.dropFirst(6))

                guard let data = payload.data(using: .utf8),
                      let event = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                      let type = event["type"] as? String
                else { continue }

                switch type {
                case "thread":
                    threadId = event["threadId"] as? String

                case "text":
                    if let text = event["text"] as? String {
                        turns[replyIndex].runningTool = nil
                        turns[replyIndex].text += text
                    }

                case "tool":
                    // Naming the running tool is the difference between a long
                    // pause and visible progress.
                    turns[replyIndex].runningTool = event["name"] as? String

                case "email":
                    // The email arrives as a card; the reply text says it is ready.
                    if let payload = event["draft"] as? [String: Any],
                       let draft = EmailDraft(payload) {
                        turns[replyIndex].email = draft
                    }

                case "plan":
                    // One sentence, everything arranged: the plan as a card.
                    if let object = event["plan"], let plan = AssistantPlan.from(object) {
                        turns[replyIndex].plan = plan
                    }

                case "done":
                    turns[replyIndex].runningTool = nil
                    if speakReplies {
                        speech.speak(turns[replyIndex].text)
                    }

                case "error":
                    let code = event["code"] as? String
                    error = code == "assistant_not_configured"
                        ? APIError.notConfigured.errorDescription
                        : code == "refused"
                            ? tr("I can't help with that one.")
                            : tr("Something went wrong. Please try again.")
                    if turns[replyIndex].text.isEmpty {
                        turns.removeSubrange(replyIndex...)
                    }

                default:
                    break
                }
            }
        } catch {
            if turns.indices.contains(replyIndex), turns[replyIndex].text.isEmpty {
                turns.removeSubrange(replyIndex...)
            }
            self.error = APIError.network.errorDescription
        }
    }

    /// The member sent the email from the Mail sheet.
    func markSent(_ turnID: UUID) {
        guard let index = turns.firstIndex(where: { $0.id == turnID }),
              var email = turns[index].email
        else { return }
        email.sent = true
        turns[index].email = email
        let name = email.toName ?? email.toEmail ?? ""
        turns.append(AssistantTurn(
            role: .assistant,
            text: name.isEmpty
                ? tr("Your email is on its way.")
                : String(format: tr("Your email to %@ is on its way."), name)
        ))
    }

    /// The member's one tap: the plan goes to every partner at once.
    func confirmPlan(_ turnID: UUID) async {
        guard let index = turns.firstIndex(where: { $0.id == turnID }),
              let plan = turns[index].plan, !plan.isSent, !turns[index].planSending
        else { return }
        turns[index].planSending = true
        struct Response: Decodable { let plan: AssistantPlan }
        do {
            let response: Response = try await APIClient.shared.send("/plans/\(plan.id)/confirm", method: "POST")
            if let i = turns.firstIndex(where: { $0.id == turnID }) {
                turns[i].plan = response.plan
                turns[i].planSending = false
            }
        } catch {
            if let i = turns.firstIndex(where: { $0.id == turnID }) { turns[i].planSending = false }
            self.error = (error as? APIError)?.errorDescription ?? tr("Something went wrong. Please try again.")
        }
    }

    func reset() {
        turns = []
        threadId = nil
        error = nil
    }
}

struct AssistantView: View {
    @Environment(SessionStore.self) private var session
    @Environment(Greeter.self) private var greeter
    @State private var model = AssistantModel()
    @State private var speech = SpeechController()
    @State private var showSkin = false
    @State private var showSkinHistory = false
    @State private var mailRequest: MailRequest?
    @State private var mailFallback: MailRequest?
    @FocusState private var composerFocused: Bool

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                transcript

                if let error = model.error {
                    Text(error)
                        .font(.theone(13))
                        .foregroundStyle(Color(red: 0.95, green: 0.45, blue: 0.45))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 18)
                        .padding(.bottom, 6)
                }

                composer
            }
            .paperBackground()
            .navigationTitle("Assistant")
            .homeButton()
            .navigationBarTitleDisplayMode(.inline)
            .brandedNavigationBar()
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Button {
                            showSkin = true
                        } label: {
                            Label { Text(verbatim: "TheONE SKIN SCAN") } icon: { Image(systemName: "face.smiling") }
                        }
                        Button {
                            showSkinHistory = true
                        } label: {
                            Label(tr("TheONE SKIN SCAN: my results"), systemImage: "chart.line.uptrend.xyaxis")
                        }
                        Toggle("Speak replies", isOn: $model.speakReplies)
                        Button("Clear conversation") {
                            speech.stopSpeaking()
                            model.reset()
                        }
                    } label: {
                        Image(systemName: "ellipsis.circle")
                    }
                }
            }
        }
        .onChange(of: speech.transcript) { _, new in
            if speech.isListening { model.draft = new }
        }
        .task {
            if let message = greeter.pendingTalk {
                greeter.pendingTalk = nil
                discuss(message)
            }
        }
        .fullScreenCover(isPresented: $showSkin) {
            SkinScanView { _ in
                showSkin = false
                discuss(tr("I have just done my TheONE SKIN SCAN. What do you recommend for me?"))
            }
        }
        .sheet(item: $mailRequest) { request in
            MailComposer(request: request) { sent in
                mailRequest = nil
                if sent { model.markSent(request.turnID) }
            }
            .ignoresSafeArea()
        }
        .sheet(item: $mailFallback) { request in
            MailFallbackSheet(request: request)
        }
        .sheet(isPresented: $showSkinHistory) {
            SkinHistoryView {
                showSkinHistory = false
                Task {
                    try? await Task.sleep(for: .milliseconds(450))
                    showSkin = true
                }
            }
        }
    }

    /// The member asks for changes in their own words; the composer is
    /// prefilled so they only add what to change.
    private func changeEmail() {
        greeter.stop()
        speech.stopSpeaking()
        model.draft = tr("Please change the email: ")
        composerFocused = true
    }

    /// Opens the email in the Mail sheet. Without an address, the name is
    /// looked up in the member's contacts first; without a mail account, the
    /// default mail app or a copyable text takes over.
    private func openEmail(_ turn: AssistantTurn) {
        guard let email = turn.email else { return }
        speech.stopSpeaking()
        Task {
            var address = email.toEmail
            if address == nil, let name = email.toName {
                address = await ContactsLookup.email(for: name)
            }
            let request = MailRequest(
                turnID: turn.id,
                to: address.map { [$0] } ?? [],
                subject: email.subject,
                body: email.body
            )
            if MailComposer.isAvailable {
                mailRequest = request
            } else if let url = request.mailtoURL, await UIApplication.shared.open(url) {
                return
            } else {
                mailFallback = request
            }
        }
    }

    /// Back in the conversation after a scan: the member's own words open the
    /// talk, and the assistant reads the results with its skin tool.
    private func discuss(_ message: String) {
        Task {
            try? await Task.sleep(for: .milliseconds(500))
            speech.stopListening()
            greeter.stop()
            model.draft = message
            await model.send(speech: speech, opening: greeter.text)
        }
    }

    private var transcript: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 14) {
                    if model.turns.isEmpty { intro }

                    ForEach(model.turns) { turn in
                        TurnBubble(
                            turn: turn,
                            onChangeEmail: changeEmail,
                            onOpenEmail: { openEmail(turn) },
                            onConfirmPlan: { Task { await model.confirmPlan(turn.id) } }
                        )
                        .id(turn.id)
                    }
                }
                .padding(.horizontal, 18)
                .padding(.vertical, 18)
            }
            .scrollDismissesKeyboard(.interactively)
            .onChange(of: model.turns.last?.text) { _, _ in
                if let last = model.turns.last {
                    withAnimation(.easeOut(duration: 0.2)) {
                        proxy.scrollTo(last.id, anchor: .bottom)
                    }
                }
            }
        }
    }

    private var intro: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Ask me anything")
                .font(.theoneHeading(22))
                .foregroundStyle(Theme.heading)

            if let words = greeter.text {
                // The greeting from the start screen, as the assistant's
                // opening line: the member's answer continues from it.
                TurnBubble(turn: AssistantTurn(role: .assistant, text: words))
                    .accessibilityIdentifier("assistant.greeting")
            } else {
                Text("I know TheONE's verified business partners and what you told us when you applied. Tell me what you need, or just describe the problem.")
                    .font(.theone(14))
                    .foregroundStyle(Theme.inkSoft)
            }

            VStack(alignment: .leading, spacing: 8) {
                ForEach([
                    "My teeth have been hurting for a week.",
                    "Find me a longevity clinic near Zurich.",
                    "I need somewhere quiet to work for a month.",
                ], id: \.self) { example in
                    Button {
                        model.draft = tr(example)
                    } label: {
                        Text(tr(example))
                            .font(.theone(13.5))
                            .foregroundStyle(Theme.accentText)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 14)
                            .padding(.vertical, 11)
                            .background(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .fill(Theme.aqua.opacity(0.10))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14, style: .continuous)
                                            .stroke(Theme.aqua.opacity(0.25), lineWidth: 1)
                                    )
                            )
                    }
                }
            }
            .padding(.top, 6)
        }
        .padding(.bottom, 10)
    }

    private var composer: some View {
        HStack(alignment: .bottom, spacing: 10) {
            Button {
                speech.stopListening()
                showSkin = true
            } label: {
                Image(systemName: "face.smiling")
                    .font(.system(size: 21))
                    .foregroundStyle(Theme.inkSoft)
                    .frame(width: 42, height: 42)
                    .background(Circle().fill(Theme.paperSoft))
            }
            .accessibilityLabel(Text(verbatim: "TheONE SKIN SCAN"))
            .accessibilityIdentifier("assistant.skin")

            Button {
                if speech.isListening {
                    speech.stopListening()
                } else {
                    greeter.stop()
                    // Permission is requested here rather than when the tab
                    // opens: a microphone prompt before the member has shown
                    // any interest in talking reads as intrusive, and it lands
                    // on top of the screen they were trying to read.
                    Task {
                        await speech.requestPermissionsIfNeeded()
                        if !speech.permissionDenied { speech.startListening() }
                    }
                }
            } label: {
                Image(systemName: speech.isListening ? "waveform.circle.fill" : "mic")
                    .font(.system(size: 21))
                    .foregroundStyle(speech.isListening ? Theme.aqua : Theme.inkSoft)
                    .frame(width: 42, height: 42)
                    .background(Circle().fill(Theme.paperSoft))
            }
            .accessibilityLabel(tr(speech.isListening ? "Stop dictation" : "Dictate"))

            TextField("Message", text: $model.draft, axis: .vertical)
                .accessibilityIdentifier("assistant.input")
                .focused($composerFocused)
                .lineLimit(1...5)
                .font(.theone(16))
                .foregroundStyle(Theme.ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 11)
                .background(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(Theme.paperSoft)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20, style: .continuous)
                                .stroke(Theme.line, lineWidth: 1)
                        )
                )

            Button {
                speech.stopListening()
                greeter.stop()
                Task {
                    await model.send(
                        speech: speech,
                        opening: greeter.text
                    )
                }
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(Theme.onAccent)
                    .frame(width: 42, height: 42)
                    .background(Circle().fill(Theme.aqua))
            }
            .disabled(model.isStreaming || model.draft.trimmingCharacters(in: .whitespaces).isEmpty)
            .opacity(model.draft.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)
            .accessibilityLabel("Send")
            .accessibilityIdentifier("assistant.send")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
    }
}

private struct TurnBubble: View {
    let turn: AssistantTurn
    var onChangeEmail: () -> Void = {}
    var onOpenEmail: () -> Void = {}
    var onConfirmPlan: () -> Void = {}

    var body: some View {
        VStack(alignment: turn.role == .user ? .trailing : .leading, spacing: 6) {
            if let tool = turn.runningTool {
                HStack(spacing: 6) {
                    ProgressView().controlSize(.mini).tint(Theme.aqua)
                    Text(tr(label(for: tool)))
                        .font(.theone(12))
                        .foregroundStyle(Theme.accentText)
                }
            }

            if !turn.text.isEmpty {
                // The assistant sometimes marks a name in **bold**; shown as
                // bold rather than as stars.
                Text(
                    (try? AttributedString(
                        markdown: turn.text,
                        options: .init(interpretedSyntax: .inlineOnlyPreservingWhitespace)
                    )) ?? AttributedString(turn.text)
                )
                    .font(.theone(15.5))
                    .foregroundStyle(turn.role == .user ? Theme.onAccent : Theme.ink)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 11)
                    .background(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .fill(turn.role == .user
                                  ? AnyShapeStyle(Theme.aquaSoft)
                                  : AnyShapeStyle(Theme.paperSoft))
                    )
                    .frame(maxWidth: 300, alignment: turn.role == .user ? .trailing : .leading)
            }

            if let email = turn.email {
                EmailDraftCard(draft: email, onChange: onChangeEmail, onOpen: onOpenEmail)
            }

            if let plan = turn.plan {
                PlanCard(plan: plan, sending: turn.planSending, onConfirm: onConfirmPlan)
            }
        }
        .frame(maxWidth: .infinity, alignment: turn.role == .user ? .trailing : .leading)
    }

    private func label(for tool: String) -> String {
        switch tool {
        case "search_partners": "Searching business partners…"
        case "get_partner_details": "Checking details…"
        case "get_member_profile": "Reading your profile…"
        case "request_appointment": "Sending your request…"
        case "save_partner": "Saving…"
        case "draft_email": "Writing your email…"
        case "search_selection": "Choosing the best for you…"
        case "propose_plan": "Putting your plan together…"
        case "confirm_plan": "Sending your plan…"
        default: "Working…"
        }
    }
}
