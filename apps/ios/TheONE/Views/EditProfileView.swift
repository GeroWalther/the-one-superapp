import SwiftUI

/// Lets a member edit the profile the assistant reads before advising them.
///
/// Partners are sent to the web instead: their listing carries photographs and
/// an address, and building a second upload surface here would duplicate the
/// one that already works rather than adding anything.
struct EditProfileView: View {
    @Environment(\.dismiss) private var dismiss

    let initial: MemberProfile
    var onSaved: (MemberProfile) -> Void

    @State private var displayName = ""
    @State private var city = ""
    @State private var country = ""
    @State private var focusAreas: Set<String> = []
    @State private var goal = "clarity"
    @State private var context = ""

    @State private var saving = false
    @State private var error: String?

    private var canSave: Bool {
        !saving
            && displayName.trimmingCharacters(in: .whitespaces).count >= 2
            && city.trimmingCharacters(in: .whitespaces).count >= 2
            && country.trimmingCharacters(in: .whitespaces).count >= 2
            && !focusAreas.isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("About you") {
                    TextField("Display name", text: $displayName)
                    TextField("City", text: $city)
                    TextField("Country", text: $country)
                }

                Section {
                    ForEach(ProfileOptions.focusAreas, id: \.self) { area in
                        Button {
                            if focusAreas.contains(area) {
                                focusAreas.remove(area)
                            } else {
                                focusAreas.insert(area)
                            }
                        } label: {
                            HStack {
                                Text(ProfileOptions.label(area))
                                    .foregroundStyle(Theme.ink)
                                Spacer()
                                if focusAreas.contains(area) {
                                    Image(systemName: "checkmark")
                                        .foregroundStyle(Theme.aqua)
                                }
                            }
                        }
                    }
                } header: {
                    Text("What matters to you")
                } footer: {
                    Text("Pick at least one. The assistant uses these to decide what to suggest.")
                }

                Section("What brings you to TheONE") {
                    Picker("Goal", selection: $goal) {
                        ForEach(ProfileOptions.goals, id: \.self) { value in
                            Text(ProfileOptions.label(value)).tag(value)
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }

                Section {
                    TextField("Anything else worth knowing", text: $context, axis: .vertical)
                        .lineLimit(3...8)
                } footer: {
                    Text("Conditions, preferences, constraints — the assistant reads this before advising you.")
                }

                if let error {
                    Section {
                        Text(error)
                            .font(.system(size: 13))
                            .foregroundStyle(.red)
                    }
                }
            }
            .navigationTitle("Edit profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button(saving ? "Saving…" : "Save") {
                        Task { await save() }
                    }
                    .disabled(!canSave)
                }
            }
        }
        .task {
            displayName = initial.displayName
            city = initial.city
            country = initial.country
            focusAreas = Set(initial.focusAreas)
            goal = initial.goal
            context = initial.context ?? ""
        }
    }

    private func save() async {
        saving = true
        defer { saving = false }
        error = nil

        do {
            let response: ProfileResponse = try await APIClient.shared.send(
                "/me",
                method: "PATCH",
                body: [
                    "displayName": displayName.trimmingCharacters(in: .whitespaces),
                    "city": city.trimmingCharacters(in: .whitespaces),
                    "country": country.trimmingCharacters(in: .whitespaces),
                    // Sorted so the payload is stable between saves; the server
                    // does not care, but a diff in a log is easier to read.
                    "focusAreas": focusAreas.sorted(),
                    "goal": goal,
                    "context": context.trimmingCharacters(in: .whitespaces),
                ]
            )
            onSaved(response.profile)
            dismiss()
        } catch let apiError as APIError {
            error = apiError.errorDescription
        } catch {
            self.error = "Could not save your profile. Please try again."
        }
    }
}
