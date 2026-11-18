import PhotosUI
import SwiftUI

/// Who the member is, and who they hope to meet.
///
/// Every look the member picks under "wishes" is a firm wish: TheONE only
/// connects people who meet each other's wishes completely, so the form says
/// plainly that leaving a choice open means "either is fine".
struct MatchProfileForm: View {
    let existing: MatchProfile?
    let words: MatchWords
    let onSaved: (MatchProfile) -> Void
    let onDeleted: () -> Void

    @Environment(\.dismiss) private var dismiss
    @State private var draft: MatchProfile
    @State private var saving = false
    @State private var error: String?
    @State private var confirmDelete = false

    @State private var pickedPhoto: PhotosPickerItem?
    @State private var uploading = false

    init(
        existing: MatchProfile?,
        words: MatchWords,
        onSaved: @escaping (MatchProfile) -> Void,
        onDeleted: @escaping () -> Void
    ) {
        self.existing = existing
        self.words = words
        self.onSaved = onSaved
        self.onDeleted = onDeleted
        _draft = State(initialValue: existing ?? .blank())
    }

    private var thisYear: Int { Calendar.current.component(.year, from: Date()) }

    private var complete: Bool {
        draft.profession.trimmingCharacters(in: .whitespaces).count >= 2
            && draft.city.trimmingCharacters(in: .whitespaces).count >= 2
            && !draft.hobbies.isEmpty
    }

    var body: some View {
        NavigationStack {
            Form {
                if existing != nil { photos }

                Section(words("Über dich", "About you")) {
                    Picker(words("Ich bin", "I am"), selection: $draft.gender) {
                        ForEach(MatchWords.genders, id: \.self) { Text(words.label($0)).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    Stepper(value: $draft.birthYear, in: (thisYear - 99)...(thisYear - 18)) {
                        labelled(words("Geburtsjahr", "Year of birth"), String(draft.birthYear))
                    }
                    Stepper(value: $draft.heightCm, in: 140...220) {
                        labelled(words("Größe", "Height"), "\(draft.heightCm) cm")
                    }
                    choice(words("Haarfarbe", "Hair"), $draft.hairColor, MatchWords.hairColors)
                    choice(words("Augenfarbe", "Eyes"), $draft.eyeColor, MatchWords.eyeColors)
                    choice(words("Figur", "Figure"), $draft.figure, MatchWords.figures)
                    TextField(words("Beruf", "Profession"), text: $draft.profession)
                        .accessibilityIdentifier("match.profession")
                    TextField(words("Stadt", "City"), text: $draft.city)
                        .accessibilityIdentifier("match.city")
                }

                Section {
                    chips(MatchWords.hobbies, selection: $draft.hobbies)
                } header: {
                    Text(words("Deine Freizeit", "Your pastimes"))
                } footer: {
                    Text(words("Wähle, was dir Freude macht.", "Choose what you enjoy."))
                }

                Section(words("Ein paar Worte über dich", "A few words about you")) {
                    TextField(
                        words("Was sollte dein Gegenüber über dich wissen?", "What should they know about you?"),
                        text: $draft.about,
                        axis: .vertical
                    )
                    .lineLimit(3...6)
                    .accessibilityIdentifier("match.about")
                }

                Section(words("Wen du suchst", "Who you hope to meet")) {
                    Picker(words("Ich suche", "I am looking for"), selection: $draft.seeking) {
                        ForEach(MatchWords.genders, id: \.self) { Text(words.label($0)).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    choice(words("Für", "For"), $draft.intention, MatchWords.intentions)

                    Stepper(value: $draft.wishes.ageMin, in: 18...draft.wishes.ageMax) {
                        labelled(words("Alter ab", "Age from"), "\(draft.wishes.ageMin)")
                    }
                    Stepper(value: $draft.wishes.ageMax, in: draft.wishes.ageMin...99) {
                        labelled(words("Alter bis", "Age to"), "\(draft.wishes.ageMax)")
                    }

                    optionalHeight(words("Mindestgröße", "Minimum height"), $draft.wishes.heightMin, fallback: 165)
                    optionalHeight(words("Höchstgröße", "Maximum height"), $draft.wishes.heightMax, fallback: 195)
                }

                Section {
                    Text(words("Haarfarbe", "Hair")).font(.theone(13)).foregroundStyle(Theme.inkFaint)
                    chips(MatchWords.hairColors, selection: $draft.wishes.hairColors)
                    Text(words("Augenfarbe", "Eyes")).font(.theone(13)).foregroundStyle(Theme.inkFaint)
                    chips(MatchWords.eyeColors, selection: $draft.wishes.eyeColors)
                    Text(words("Figur", "Figure")).font(.theone(13)).foregroundStyle(Theme.inkFaint)
                    chips(MatchWords.figures, selection: $draft.wishes.figures)
                } header: {
                    Text(words("Deine Wünsche an das Aussehen", "Your wishes for their looks"))
                } footer: {
                    Text(words(
                        "Jede Auswahl ist ein fester Wunsch: Wir verbinden dich nur mit jemandem, der ihn erfüllt. Nichts ausgewählt heißt: Das ist dir gleich.",
                        "Every choice is a firm wish: we only connect you with someone who meets it. Leaving it open means either is fine."
                    ))
                }

                if existing != nil {
                    Section {
                        Toggle(words("Profil sichtbar", "Profile visible"), isOn: $draft.visible)
                            .tint(Theme.aqua)
                    } footer: {
                        Text(words(
                            "Pausiert wird dein Profil niemandem vorgeschlagen. Deine Angaben bleiben erhalten.",
                            "While paused, nobody is shown your profile. Your details are kept."
                        ))
                    }

                    Section {
                        Button(words("TheONE MATCH Profil löschen", "Delete TheONE MATCH profile"), role: .destructive) {
                            confirmDelete = true
                        }
                    }
                }

                if let error {
                    Section { Text(error).foregroundStyle(.red) }
                }
            }
            .scrollContentBackground(.hidden)
            .scrollDismissesKeyboard(.immediately)
            .paperBackground()
            .navigationTitle(existing == nil ? words("Dein Profil", "Your profile") : words("Profil und Wünsche", "Profile and wishes"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button(words("Abbrechen", "Cancel")) { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    if saving {
                        ProgressView()
                    } else {
                        Button(words("Speichern", "Save")) { Task { await save() } }
                            .disabled(!complete)
                            .accessibilityIdentifier("match.save")
                    }
                }
            }
            .confirmationDialog(
                words("TheONE MATCH Profil löschen?", "Delete your TheONE MATCH profile?"),
                isPresented: $confirmDelete,
                titleVisibility: .visible
            ) {
                Button(words("Endgültig löschen", "Delete for good"), role: .destructive) {
                    Task { await delete() }
                }
            } message: {
                Text(words(
                    "Deine Angaben, Fotos und Verbindungen werden gelöscht.",
                    "Your details, photos and connections will be deleted."
                ))
            }
            .onChange(of: pickedPhoto) { _, item in
                guard let item else { return }
                Task { await upload(item) }
            }
        }
        .tint(Theme.aqua)
    }

    // MARK: - Pieces

    private var photos: some View {
        Section {
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 12) {
                    ForEach(draft.photos, id: \.self) { url in
                        AsyncImage(url: URL(string: url)) { image in
                            image.resizable().scaledToFill()
                        } placeholder: {
                            Theme.paperSoft
                        }
                        .frame(width: 92, height: 116)
                        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
                        .overlay(alignment: .topTrailing) {
                            Button {
                                Task { await removePhoto(url) }
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .symbolRenderingMode(.palette)
                                    .foregroundStyle(.white, Vortex.abyss.opacity(0.6))
                                    .font(.system(size: 20))
                            }
                            .padding(5)
                            .accessibilityLabel(words("Foto entfernen", "Remove photo"))
                        }
                    }

                    if draft.photos.count < 4 {
                        PhotosPicker(selection: $pickedPhoto, matching: .images) {
                            VStack(spacing: 6) {
                                if uploading {
                                    ProgressView()
                                } else {
                                    Image(systemName: "plus")
                                        .font(.system(size: 20, weight: .light))
                                    Text(words("Foto", "Photo")).font(.theone(12))
                                }
                            }
                            .foregroundStyle(Theme.accentText)
                            .frame(width: 92, height: 116)
                            .background(
                                RoundedRectangle(cornerRadius: 14, style: .continuous)
                                    .stroke(Theme.aqua.opacity(0.4), style: StrokeStyle(lineWidth: 1, dash: [4, 4]))
                            )
                        }
                        .disabled(uploading)
                    }
                }
                .padding(.vertical, 4)
            }
        } header: {
            Text(words("Fotos", "Photos"))
        } footer: {
            Text(words(
                "Deine Fotos sieht nur, wer vollkommen zu dir passt.",
                "Only someone who fits you completely sees your photos."
            ))
        }
    }

    private func labelled(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title)
            Spacer()
            Text(value).foregroundStyle(Theme.inkSoft)
        }
    }

    private func choice(_ title: String, _ value: Binding<String>, _ keys: [String]) -> some View {
        Picker(title, selection: value) {
            ForEach(keys, id: \.self) { Text(words.label($0)).tag($0) }
        }
    }

    private func optionalHeight(_ title: String, _ value: Binding<Int?>, fallback: Int) -> some View {
        Group {
            Toggle(title, isOn: Binding(
                get: { value.wrappedValue != nil },
                set: { value.wrappedValue = $0 ? fallback : nil }
            ))
            .tint(Theme.aqua)
            if let current = value.wrappedValue {
                Stepper(value: Binding(get: { current }, set: { value.wrappedValue = $0 }), in: 140...220) {
                    labelled("", "\(current) cm")
                }
            }
        }
    }

    private func chips(_ keys: [String], selection: Binding<[String]>) -> some View {
        FlowLayout(spacing: 8) {
            ForEach(keys, id: \.self) { key in
                let on = selection.wrappedValue.contains(key)
                Button {
                    if on {
                        selection.wrappedValue.removeAll { $0 == key }
                    } else {
                        selection.wrappedValue.append(key)
                    }
                } label: {
                    Text(words.label(key))
                        .font(.theone(14))
                        .foregroundStyle(on ? Theme.onAccent : Theme.inkSoft)
                        .padding(.horizontal, 13)
                        .padding(.vertical, 8)
                        .background(
                            Capsule()
                                .fill(on ? Theme.aqua : Theme.paperSoft)
                                .overlay(Capsule().stroke(on ? Theme.aqua : Theme.line, lineWidth: 1))
                        )
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
        .padding(.vertical, 4)
    }

    // MARK: - Saving

    private struct ProfileResponse: Decodable { let profile: MatchProfile }
    private struct PhotosResponse: Decodable { let photos: [String] }

    private func save() async {
        saving = true
        error = nil
        defer { saving = false }
        do {
            let response: ProfileResponse = try await APIClient.shared.send(
                "/match/profile", method: "PUT", body: draft.payload
            )
            onSaved(response.profile)
            dismiss()
        } catch {
            self.error = (error as? APIError)?.errorDescription
                ?? words("Speichern hat nicht geklappt.", "Saving did not work.")
        }
    }

    private func delete() async {
        do {
            try await APIClient.shared.sendRaw("/match/profile", method: "DELETE")
            onDeleted()
            dismiss()
        } catch {
            self.error = (error as? APIError)?.errorDescription
        }
    }

    private func upload(_ item: PhotosPickerItem) async {
        uploading = true
        defer { uploading = false; pickedPhoto = nil }
        guard let data = try? await item.loadTransferable(type: Data.self),
              let jpeg = Self.jpeg(from: data)
        else {
            error = words("Dieses Foto lässt sich nicht verwenden.", "This photo cannot be used.")
            return
        }
        do {
            let response: PhotosResponse = try await APIClient.shared.upload("/match/photos", jpeg: jpeg)
            draft.photos = response.photos
            if let existing {
                var updated = existing
                updated.photos = response.photos
                onSaved(updated)
            }
        } catch {
            self.error = (error as? APIError)?.errorDescription
        }
    }

    private func removePhoto(_ url: String) async {
        let encoded = url.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? url
        do {
            let data = try await APIClient.shared.sendRaw("/match/photos?url=\(encoded)", method: "DELETE")
            if let response = try? JSONDecoder().decode(PhotosResponse.self, from: data) {
                draft.photos = response.photos
            }
        } catch {
            self.error = (error as? APIError)?.errorDescription
        }
    }

    /// Scaled to at most 1600 px and saved as JPEG, well under the 4 MB limit.
    private static func jpeg(from data: Data) -> Data? {
        guard let image = UIImage(data: data) else { return nil }
        let longest = max(image.size.width, image.size.height)
        let scale = min(1, 1600 / longest)
        let size = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        let resized = UIGraphicsImageRenderer(size: size, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: size))
        }
        return resized.jpegData(compressionQuality: 0.82)
    }
}
