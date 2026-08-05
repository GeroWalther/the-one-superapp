import SwiftUI

struct MessagesView: View {
    @State private var conversations: [ConversationSummary] = []
    @State private var isLoading = true
    @State private var error: String?

    var body: some View {
        NavigationStack {
            Group {
                if isLoading && conversations.isEmpty {
                    ProgressView().tint(Theme.aqua)
                } else if conversations.isEmpty {
                    VStack(spacing: 10) {
                        Text("No conversations yet")
                            .font(.system(size: 20, weight: .light, design: .serif))
                            .foregroundStyle(Theme.ink)
                        Text("Message a partner from their page, or let the assistant put you in touch.")
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.inkSoft)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 40)
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 8) {
                            ForEach(conversations) { conversation in
                                NavigationLink(value: conversation) {
                                    row(conversation)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 12)
                    }
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .paperBackground()
            .navigationTitle("Messages")
            .navigationDestination(for: ConversationSummary.self) { conversation in
                ConversationView(
                    conversationId: conversation.id,
                    title: conversation.counterpartName
                )
            }
            .refreshable { await load() }
        }
        .task { await load() }
    }

    private func row(_ conversation: ConversationSummary) -> some View {
        HStack(spacing: 12) {
            Circle()
                .fill(Theme.aqua.opacity(0.18))
                .frame(width: 40, height: 40)
                .overlay(
                    Text(String(conversation.counterpartName.prefix(1)))
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(Theme.aqua)
                )

            VStack(alignment: .leading, spacing: 3) {
                Text(conversation.counterpartName)
                    .font(.system(size: 15.5, weight: .medium))
                    .foregroundStyle(Theme.ink)
                Text(conversation.lastMessagePreview.isEmpty
                     ? "No messages yet"
                     : conversation.lastMessagePreview)
                    .font(.system(size: 13))
                    .foregroundStyle(Theme.inkFaint)
                    .lineLimit(1)
            }

            Spacer()

            if conversation.unread {
                Circle().fill(Theme.aqua).frame(width: 8, height: 8)
            }
        }
        .glassCard(padding: 14)
    }

    private func load() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let response: ConversationsResponse = try await APIClient.shared.send("/conversations")
            conversations = response.conversations
        } catch {
            self.error = (error as? APIError)?.errorDescription
        }
    }

    private struct ConversationsResponse: Decodable {
        let conversations: [ConversationSummary]
    }
}

struct ConversationView: View {
    let conversationId: String
    let title: String

    @State private var messages: [ChatMessage] = []
    @State private var draft = ""
    @State private var isSending = false

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 8) {
                        ForEach(messages) { message in
                            bubble(message).id(message.id)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 14)
                }
                .onChange(of: messages.count) { _, _ in
                    if let last = messages.last {
                        withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                    }
                }
            }

            HStack(spacing: 10) {
                TextField("Message", text: $draft, axis: .vertical)
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
                    Task { await send() }
                } label: {
                    Image(systemName: "arrow.up")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(Theme.onAccent)
                        .frame(width: 42, height: 42)
                        .background(Circle().fill(Theme.aqua))
                }
                .disabled(isSending || draft.trimmingCharacters(in: .whitespaces).isEmpty)
                .opacity(draft.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)
                .accessibilityLabel("Send")
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .background(.ultraThinMaterial)
        }
        .paperBackground()
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
    }

    private func bubble(_ message: ChatMessage) -> some View {
        HStack {
            if message.mine { Spacer(minLength: 50) }
            Text(message.body)
                .font(.system(size: 15.5))
                .foregroundStyle(message.mine ? Theme.onAccent : Theme.ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 18, style: .continuous)
                        .fill(message.mine
                              ? AnyShapeStyle(Theme.aquaSoft)
                              : AnyShapeStyle(Theme.paperSoft))
                )
            if !message.mine { Spacer(minLength: 50) }
        }
    }

    private func load() async {
        do {
            let response: MessagesResponse = try await APIClient.shared.send(
                "/conversations/\(conversationId)/messages"
            )
            messages = response.messages
        } catch {
            // A failed load leaves the thread empty rather than showing a
            // half-state; the send box still works.
        }
    }

    private func send() async {
        let body = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !body.isEmpty else { return }

        isSending = true
        defer { isSending = false }
        draft = ""

        do {
            let response: SendResponse = try await APIClient.shared.send(
                "/conversations/\(conversationId)/messages",
                method: "POST",
                body: ["body": body]
            )
            messages.append(response.message)
        } catch {
            draft = body // hand the text back rather than losing it
        }
    }

    private struct MessagesResponse: Decodable { let messages: [ChatMessage] }
    private struct SendResponse: Decodable { let message: ChatMessage }
}
