import SwiftUI

struct LoginView: View {
    @Environment(SessionStore.self) private var session

    @State private var identifier = ""
    @State private var password = ""
    @State private var showPassword = false

    private let enrolURL = URL(string: "https://theone-superapp.vercel.app/en/enroll")!

    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                Wordmark(size: 30)
                    .padding(.top, 60)

                Text("MEMBERS & PARTNERS")
                    .font(.system(size: 10, weight: .semibold))
                    .tracking(3)
                    .foregroundStyle(Theme.aqua)
                    .padding(.top, 34)

                Text("Sign in")
                    .font(.system(size: 32, weight: .light, design: .serif))
                    .foregroundStyle(Theme.ink)
                    .padding(.top, 8)

                Text("Only live accounts can use the app.")
                    .font(.system(size: 14))
                    .foregroundStyle(Theme.inkSoft)
                    .padding(.top, 6)

                VStack(spacing: 16) {
                    field("Username or email") {
                        TextField("", text: $identifier)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .textContentType(.username)
                    }

                    field("Password") {
                        HStack {
                            Group {
                                if showPassword {
                                    TextField("", text: $password)
                                } else {
                                    SecureField("", text: $password)
                                }
                            }
                            .textContentType(.password)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()

                            Button {
                                showPassword.toggle()
                            } label: {
                                Image(systemName: showPassword ? "eye.slash" : "eye")
                                    .foregroundStyle(Theme.inkFaint)
                            }
                            .accessibilityLabel(showPassword ? "Hide password" : "Show password")
                        }
                    }

                    if let error = session.signInError {
                        Text(error)
                            .font(.system(size: 13))
                            .foregroundStyle(Color(red: 0.95, green: 0.45, blue: 0.45))
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal, 2)
                    }

                    Button {
                        Task { await session.signIn(identifier: identifier, password: password) }
                    } label: {
                        Text(session.isWorking ? "Signing in…" : "Sign in")
                    }
                    .buttonStyle(PrimaryButtonStyle())
                    .disabled(session.isWorking || identifier.isEmpty || password.isEmpty)
                    .opacity(identifier.isEmpty || password.isEmpty ? 0.6 : 1)
                }
                .glassCard(padding: 22)
                .padding(.top, 28)

                VStack(spacing: 10) {
                    Text("Not a member yet?")
                        .font(.system(size: 13))
                        .foregroundStyle(Theme.inkFaint)

                    // Enrolment is a long, reviewed form with payment at the
                    // end, so it lives on the web rather than being rebuilt
                    // here where it would immediately drift.
                    Link("Apply for access", destination: enrolURL)
                        .font(.system(size: 14, weight: .medium))
                        .foregroundStyle(Theme.aqua)
                }
                .padding(.top, 26)

                Spacer(minLength: 40)
            }
            .padding(.horizontal, 24)
            .frame(maxWidth: .infinity)
        }
        .paperBackground()
        .scrollDismissesKeyboard(.interactively)
    }

    private func field<Content: View>(
        _ label: String,
        @ViewBuilder content: () -> Content
    ) -> some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(label)
                .font(.system(size: 13, weight: .medium))
                .foregroundStyle(Theme.ink)
            content()
                .font(.system(size: 16))
                .foregroundStyle(Theme.ink)
                .padding(.horizontal, 14)
                .padding(.vertical, 12)
                .background(
                    RoundedRectangle(cornerRadius: 12, style: .continuous)
                        .fill(Theme.paperSoft)
                        .overlay(
                            RoundedRectangle(cornerRadius: 12, style: .continuous)
                                .stroke(Theme.line, lineWidth: 1)
                        )
                )
        }
    }
}
