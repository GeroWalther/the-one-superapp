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

    func send(speech: SpeechController, locale: String) async {
        let message = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !message.isEmpty, !isStreaming else { return }

        draft = ""
        error = nil
        speech.stopSpeaking()

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
            threadId: threadId
        ) else {
            error = APIError.unauthorized.errorDescription
            return
        }

        do {
            let (bytes, response) = try await URLSession.shared.bytes(for: request)

            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                error = (response as? HTTPURLResponse)?.statusCode == 503
                    ? APIError.notConfigured.errorDescription
                    : APIError.server("The assistant is unavailable.").errorDescription
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

                case "done":
                    turns[replyIndex].runningTool = nil
                    if speakReplies {
                        speech.speak(turns[replyIndex].text, locale: locale)
                    }

                case "error":
                    let code = event["code"] as? String
                    error = code == "assistant_not_configured"
                        ? APIError.notConfigured.errorDescription
                        : code == "refused"
                            ? "I can't help with that one."
                            : "Something went wrong. Please try again."
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

    func reset() {
        turns = []
        threadId = nil
        error = nil
    }
}

struct AssistantView: View {
    @Environment(SessionStore.self) private var session
    @State private var model = AssistantModel()
    @State private var speech = SpeechController()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                transcript

                if let error = model.error {
                    Text(error)
                        .font(.system(size: 13))
                        .foregroundStyle(Color(red: 0.95, green: 0.45, blue: 0.45))
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 18)
                        .padding(.bottom, 6)
                }

                composer
            }
            .paperBackground()
            .navigationTitle("Assistant")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Menu {
                        Toggle("Speak replies", isOn: $model.speakReplies)
                        Button("New conversation") {
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
    }

    private var transcript: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 14) {
                    if model.turns.isEmpty { intro }

                    ForEach(model.turns) { turn in
                        TurnBubble(turn: turn)
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
                .font(.system(size: 26, weight: .light, design: .serif))
                .foregroundStyle(Theme.ink)

            Text("I know TheONE's verified partners and what you told us when you applied. Tell me what you need — or just describe the problem.")
                .font(.system(size: 14))
                .foregroundStyle(Theme.inkSoft)

            VStack(alignment: .leading, spacing: 8) {
                ForEach([
                    "My teeth have been hurting for a week.",
                    "Find me a longevity clinic near Zurich.",
                    "I need somewhere quiet to work for a month.",
                ], id: \.self) { example in
                    Button {
                        model.draft = example
                    } label: {
                        Text(example)
                            .font(.system(size: 13.5))
                            .foregroundStyle(Theme.aquaSoft)
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
                if speech.isListening {
                    speech.stopListening()
                } else {
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
            .accessibilityLabel(speech.isListening ? "Stop dictation" : "Dictate")

            TextField("Message", text: $model.draft, axis: .vertical)
                .lineLimit(1...5)
                .font(.system(size: 16))
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
                Task {
                    await model.send(
                        speech: speech,
                        locale: session.account?.locale ?? "en"
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
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
    }
}

private struct TurnBubble: View {
    let turn: AssistantTurn

    var body: some View {
        VStack(alignment: turn.role == .user ? .trailing : .leading, spacing: 6) {
            if let tool = turn.runningTool {
                HStack(spacing: 6) {
                    ProgressView().controlSize(.mini).tint(Theme.aqua)
                    Text(label(for: tool))
                        .font(.system(size: 12))
                        .foregroundStyle(Theme.aqua)
                }
            }

            if !turn.text.isEmpty {
                Text(turn.text)
                    .font(.system(size: 15.5))
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
        }
        .frame(maxWidth: .infinity, alignment: turn.role == .user ? .trailing : .leading)
    }

    private func label(for tool: String) -> String {
        switch tool {
        case "search_partners": "Searching partners…"
        case "get_partner_details": "Checking details…"
        case "get_member_profile": "Reading your profile…"
        case "request_appointment": "Sending your request…"
        case "save_partner": "Saving…"
        default: "Working…"
        }
    }
}
