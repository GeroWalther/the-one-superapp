import AVFoundation
import PhotosUI
import SwiftUI

/// TheONE skin analysis: consent, the face scan, the reading.
///
/// The photo goes to TheONE once, is analysed and discarded there. Only the
/// member decides whether a copy stays, and then only on this phone.
struct SkinScanView: View {
    /// Called with the finished scan when the member wants to talk it through.
    let onDiscuss: (SkinScan) -> Void

    @Environment(\.dismiss) private var dismiss

    private enum Step: Equatable {
        case consent, capture, analysing, result(SkinScan), failed(String)
    }

    @State private var step: Step = UserDefaults.standard.bool(forKey: "skin.consent.v1") ? .capture : .consent
    @State private var photo: UIImage?
    @State private var jpeg: Data?
    @State private var picked: PhotosPickerItem?
    @State private var camera = SkinCamera()

    var body: some View {
        NavigationStack {
            ZStack {
                HomeBackground()
                switch step {
                case .consent: consent
                case .capture: capture
                case .analysing: analysing
                case .result(let scan):
                    SkinResultView(scan: scan, freshPhoto: jpeg, onDiscuss: { onDiscuss(scan) })
                case .failed(let message): failed(message)
                }
            }
            // A name, so English in every language.
            .navigationTitle(Text(verbatim: "TheONE SKIN SCAN"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: { Image(systemName: "xmark") }
                        .accessibilityLabel(tr("Close"))
                }
            }
        }
        .tint(Theme.aqua)
        .onChange(of: picked) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self),
                   let image = UIImage(data: data) {
                    await analyse(image)
                }
                picked = nil
            }
        }
        .onDisappear { camera.stop() }
    }

    // MARK: - Steps

    private var consent: some View {
        ScrollView {
            VStack(spacing: 22) {
                // The woman in the white suit, framed like the scan itself.
                ZStack {
                    Image("SkinHero")
                        .resizable()
                        .scaledToFill()
                        .frame(width: 190, height: 240)
                        .clipShape(Ellipse())
                    Ellipse()
                        .stroke(Theme.aqua.opacity(0.7), style: StrokeStyle(lineWidth: 1.5, dash: [5, 5]))
                        .frame(width: 210, height: 260)
                }
                .accessibilityHidden(true)
                .padding(.top, 24)

                Text(tr("Your skin, scanned by POWER AI"))
                    .font(.system(size: 26, weight: .light, design: .serif))
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.ink)

                VStack(alignment: .leading, spacing: 16) {
                    point("sparkles", tr("A precise reading of seven skin qualities, your personal routine and the business partners who can help."))
                    point("lock", tr("Your photo is only used for the analysis and is not stored by TheONE. Only the results are kept."))
                    point("iphone", tr("If you like, you can keep your photos on this iPhone for a before and after."))
                    point("heart.text.square", tr("A cosmetic assessment, not a medical diagnosis."))
                }
                .padding(20)
                .background(
                    RoundedRectangle(cornerRadius: 22, style: .continuous)
                        .fill(Theme.panel.opacity(0.85))
                        .overlay(RoundedRectangle(cornerRadius: 22, style: .continuous).stroke(Theme.line, lineWidth: 1))
                )

                Button {
                    UserDefaults.standard.set(true, forKey: "skin.consent.v1")
                    step = .capture
                } label: {
                    Text(tr("Start TheONE SKIN SCAN"))
                        .font(.system(size: 16, weight: .medium))
                        .foregroundStyle(Theme.onAccent)
                        .padding(.horizontal, 30)
                        .padding(.vertical, 15)
                        .background(Capsule().fill(Theme.aqua))
                }
                .accessibilityIdentifier("skin.start")
                .padding(.bottom, 30)
            }
            .padding(.horizontal, 22)
        }
    }

    private var capture: some View {
        VStack(spacing: 18) {
            ZStack {
                if camera.isAvailable {
                    CameraPreview(session: camera.session)
                        .clipShape(Ellipse())
                } else {
                    Ellipse().fill(Theme.paperSoft)
                    Image(systemName: "person.crop.circle")
                        .font(.system(size: 60, weight: .ultraLight))
                        .foregroundStyle(Theme.inkFaint)
                }
                Ellipse().stroke(Theme.aqua, style: StrokeStyle(lineWidth: 2, dash: [6, 6]))
            }
            .frame(width: 260, height: 340)
            .padding(.top, 24)

            Text(tr("Face the camera in soft daylight, without make-up if you can, hair away from your face."))
                .font(.system(size: 14))
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.inkSoft)
                .padding(.horizontal, 34)

            if camera.isAvailable {
                Button {
                    Task {
                        if let image = await camera.capture() { await analyse(image) }
                    }
                } label: {
                    Circle()
                        .fill(Theme.aqua)
                        .frame(width: 72, height: 72)
                        .overlay(Circle().stroke(.white, lineWidth: 4).padding(5))
                }
                .accessibilityLabel(tr("Take photo"))
                .accessibilityIdentifier("skin.shutter")
            }

            PhotosPicker(selection: $picked, matching: .images) {
                Label(tr("Choose a photo"), systemImage: "photo.on.rectangle")
                    .font(.system(size: 15, weight: .medium))
                    .foregroundStyle(Theme.aqua)
            }
            .accessibilityIdentifier("skin.pick")

            Spacer()
        }
        .task { camera.start() }
    }

    private var analysing: some View {
        VStack(spacing: 24) {
            ZStack {
                if let photo {
                    Image(uiImage: photo)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 220, height: 290)
                        .clipShape(Ellipse())
                }
                ScanRing()
                    .frame(width: 244, height: 314)
            }
            .padding(.top, 40)

            Text(tr("POWER AI is scanning your skin…"))
                .font(.system(size: 20, weight: .light, design: .serif))
                .foregroundStyle(Theme.ink)
            Text(tr("This takes about twenty seconds."))
                .font(.system(size: 14))
                .foregroundStyle(Theme.inkSoft)
            Spacer()
        }
    }

    private func failed(_ message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: "camera.metering.unknown")
                .font(.system(size: 40, weight: .ultraLight))
                .foregroundStyle(Theme.aqua)
                .padding(.top, 60)
            Text(message)
                .font(.system(size: 16))
                .multilineTextAlignment(.center)
                .foregroundStyle(Theme.ink)
                .padding(.horizontal, 30)
            Button(tr("Try again")) { step = .capture }
                .font(.system(size: 16, weight: .medium))
            Spacer()
        }
    }

    private func point(_ symbol: String, _ text: String) -> some View {
        HStack(alignment: .top, spacing: 14) {
            Image(systemName: symbol)
                .font(.system(size: 17, weight: .light))
                .foregroundStyle(Theme.aqua)
                .frame(width: 24)
            Text(text)
                .font(.system(size: 14.5))
                .foregroundStyle(Theme.inkSoft)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    // MARK: - Analysis

    private struct Response: Decodable { let scan: SkinScan }

    private func analyse(_ image: UIImage) async {
        camera.stop()
        photo = image
        guard let data = image.scaledJPEG() else {
            step = .failed(tr("This photo cannot be used."))
            return
        }
        jpeg = data
        step = .analysing
        do {
            let response: Response = try await APIClient.shared.upload(
                "/skin/scans",
                jpeg: data,
                fields: ["language": MemberLanguage.tag],
                timeout: 180
            )
            step = .result(response.scan)
        } catch {
            step = .failed((error as? APIError)?.errorDescription ?? tr("Something went wrong. Please try again."))
        }
    }
}

// MARK: - Result

struct SkinResultView: View {
    let scan: SkinScan
    /// The photo just taken, offered to keep on this phone. Nil for past scans.
    let freshPhoto: Data?
    let onDiscuss: (() -> Void)?

    @State private var keepPhoto = false
    @State private var stored: UIImage?

    var body: some View {
        ScrollView {
            VStack(spacing: 22) {
                Text(scan.date.formatted(date: .long, time: .omitted))
                    .font(.system(size: 12, weight: .medium))
                    .tracking(MemberLanguage.spacing(2))
                    .foregroundStyle(Theme.inkFaint)
                    .padding(.top, 20)

                HStack(spacing: 18) {
                    if let image = stored ?? freshPhoto.flatMap(UIImage.init(data:)) {
                        Image(uiImage: image)
                            .resizable()
                            .scaledToFill()
                            .frame(width: 92, height: 120)
                            .clipShape(Ellipse())
                    }
                    ScoreRing(score: scan.overall, size: 120, label: tr("Skin score"))
                }

                Text(scan.summary)
                    .font(.system(size: 17, design: .serif))
                    .italic()
                    .lineSpacing(3)
                    .multilineTextAlignment(.center)
                    .foregroundStyle(Theme.ink)
                    .padding(.horizontal, 6)

                card(tr("Your skin")) {
                    VStack(spacing: 14) {
                        ForEach(scan.scores, id: \.key) { score in
                            VStack(alignment: .leading, spacing: 5) {
                                HStack {
                                    Text(SkinWords.label(score.key))
                                        .font(.system(size: 14.5, weight: .medium))
                                        .foregroundStyle(Theme.ink)
                                    Spacer()
                                    Text("\(score.score)")
                                        .font(.system(size: 14.5, weight: .semibold))
                                        .foregroundStyle(Theme.aqua)
                                }
                                ScoreBar(score: score.score)
                                Text(score.note)
                                    .font(.system(size: 13))
                                    .foregroundStyle(Theme.inkSoft)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                        }
                    }
                }

                if !scan.focus.isEmpty {
                    card(tr("What will make the biggest difference")) {
                        list(scan.focus, symbol: "sparkle")
                    }
                }

                card(tr("Your routine")) {
                    VStack(alignment: .leading, spacing: 16) {
                        Label(tr("Morning"), systemImage: "sun.max")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                        list(scan.morning, numbered: true)
                        Label(tr("Evening"), systemImage: "moon")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(Theme.ink)
                        list(scan.evening, numbered: true)
                    }
                }

                if let products = scan.products, !products.isEmpty {
                    VStack(alignment: .leading, spacing: 12) {
                        Text(verbatim: "TheONE SELECTION")
                            .font(.system(size: 11, weight: .medium))
                            .tracking(MemberLanguage.spacing(2.2))
                            .foregroundStyle(Theme.aqua)
                        Text(tr("Chosen for your skin"))
                            .font(.system(size: 20, weight: .light, design: .serif))
                            .foregroundStyle(Theme.ink)
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(products) { product in
                                    NavigationLink {
                                        OfferingDetailView(offering: product)
                                    } label: {
                                        OfferingCard(offering: product, width: 220, showReason: true)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }

                if !scan.partners.isEmpty {
                    card(tr("TheONE business partners for you")) {
                        VStack(spacing: 12) {
                            ForEach(scan.partners) { partner in
                                NavigationLink {
                                    PartnerDetailView(partnerId: partner.id)
                                } label: {
                                    HStack(alignment: .top, spacing: 12) {
                                        Image(systemName: icon(for: partner.category))
                                            .font(.system(size: 18, weight: .light))
                                            .foregroundStyle(Theme.aqua)
                                            .frame(width: 26)
                                        VStack(alignment: .leading, spacing: 3) {
                                            Text(partner.name)
                                                .font(.system(size: 15.5, weight: .medium))
                                                .foregroundStyle(Theme.ink)
                                            Text(partner.city)
                                                .font(.system(size: 12))
                                                .foregroundStyle(Theme.inkFaint)
                                            Text(partner.reason)
                                                .font(.system(size: 13))
                                                .foregroundStyle(Theme.inkSoft)
                                                .multilineTextAlignment(.leading)
                                                .fixedSize(horizontal: false, vertical: true)
                                        }
                                        Spacer(minLength: 0)
                                        Image(systemName: "chevron.right")
                                            .font(.system(size: 12, weight: .semibold))
                                            .foregroundStyle(Theme.inkFaint)
                                    }
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }
                }

                if scan.seeDoctor, !scan.doctorNote.isEmpty {
                    HStack(alignment: .top, spacing: 12) {
                        Image(systemName: "stethoscope")
                            .foregroundStyle(Theme.aqua)
                        Text(scan.doctorNote)
                            .font(.system(size: 14))
                            .foregroundStyle(Theme.ink)
                    }
                    .padding(16)
                    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Theme.aquaTint))
                }

                if freshPhoto != nil {
                    Toggle(tr("Keep this photo on this iPhone for a before and after"), isOn: $keepPhoto)
                        .font(.system(size: 14))
                        .tint(Theme.aqua)
                        .padding(.horizontal, 4)
                }

                if let onDiscuss {
                    Button(action: onDiscuss) {
                        Label(tr("Talk it through with POWER AI"), systemImage: "sparkles")
                            .font(.system(size: 16, weight: .medium))
                            .foregroundStyle(Theme.onAccent)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 15)
                            .background(Capsule().fill(Theme.aqua))
                    }
                    .accessibilityIdentifier("skin.discuss")
                }

                Text(tr("A cosmetic assessment, not a medical diagnosis."))
                    .font(.system(size: 11.5))
                    .foregroundStyle(Theme.inkFaint)
                    .padding(.bottom, 30)
            }
            .padding(.horizontal, 20)
        }
        .onAppear { stored = SkinPhotoStore.image(for: scan.id) }
        .onChange(of: keepPhoto) { _, keep in
            if keep, let freshPhoto {
                SkinPhotoStore.save(freshPhoto, for: scan.id)
            } else {
                SkinPhotoStore.delete(scan.id)
            }
        }
    }

    private func card<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 14) {
            // Capitals for the heading, but the name keeps its own spelling.
            Text(title.uppercased().replacingOccurrences(of: "THEONE", with: "TheONE"))
                .font(.system(size: 11, weight: .medium))
                .tracking(MemberLanguage.spacing(2.2))
                .foregroundStyle(Theme.aqua)
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(18)
        .background(
            RoundedRectangle(cornerRadius: 20, style: .continuous)
                .fill(Theme.panel.opacity(0.88))
                .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.line, lineWidth: 1))
        )
    }

    private func list(_ items: [String], symbol: String? = nil, numbered: Bool = false) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            ForEach(Array(items.enumerated()), id: \.offset) { index, item in
                HStack(alignment: .top, spacing: 10) {
                    if numbered {
                        Text("\(index + 1)")
                            .font(.system(size: 12, weight: .semibold))
                            .foregroundStyle(Theme.aqua)
                            .frame(width: 18)
                    } else if let symbol {
                        Image(systemName: symbol)
                            .font(.system(size: 11))
                            .foregroundStyle(Theme.aqua)
                            .frame(width: 18)
                            .padding(.top, 3)
                    }
                    Text(item)
                        .font(.system(size: 14))
                        .foregroundStyle(Theme.ink)
                        .fixedSize(horizontal: false, vertical: true)
                }
            }
        }
    }

    private func icon(for category: String) -> String {
        switch category {
        case "beauty": "drop"
        case "practice": "cross.case"
        case "clinic": "heart.text.square"
        default: "sparkles"
        }
    }
}

// MARK: - Pieces

struct ScoreRing: View {
    let score: Int
    let size: CGFloat
    let label: String

    var body: some View {
        ZStack {
            Circle().stroke(Theme.aquaTint, lineWidth: size * 0.07)
            Circle()
                .trim(from: 0, to: CGFloat(score) / 100)
                .stroke(
                    AngularGradient(colors: [Theme.aquaSoft, Theme.aqua, Vortex.aqua700], center: .center),
                    style: StrokeStyle(lineWidth: size * 0.07, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))
            VStack(spacing: 2) {
                Text("\(score)")
                    .font(.system(size: size * 0.32, weight: .light, design: .serif))
                    .foregroundStyle(Theme.ink)
                Text(label)
                    .font(.system(size: size * 0.09))
                    .foregroundStyle(Theme.inkFaint)
            }
        }
        .frame(width: size, height: size)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(label): \(score)")
    }
}

private struct ScoreBar: View {
    let score: Int

    var body: some View {
        GeometryReader { proxy in
            ZStack(alignment: .leading) {
                Capsule().fill(Theme.aquaTint)
                Capsule()
                    .fill(LinearGradient(colors: [Theme.aquaSoft, Theme.aqua], startPoint: .leading, endPoint: .trailing))
                    .frame(width: proxy.size.width * CGFloat(score) / 100)
            }
        }
        .frame(height: 6)
    }
}

private struct ScanRing: View {
    @State private var turning = false

    var body: some View {
        Ellipse()
            .trim(from: 0, to: 0.3)
            .stroke(Theme.aqua, style: StrokeStyle(lineWidth: 3, lineCap: .round))
            .rotationEffect(.degrees(turning ? 360 : 0))
            .animation(.linear(duration: 1.6).repeatForever(autoreverses: false), value: turning)
            .onAppear { turning = true }
    }
}

// MARK: - Camera

@MainActor
@Observable
final class SkinCamera: NSObject, AVCapturePhotoCaptureDelegate {
    let session = AVCaptureSession()
    private let output = AVCapturePhotoOutput()
    private var configured = false
    private var pending: CheckedContinuation<UIImage?, Never>?

    /// No front camera in the simulator; the member can still choose a photo.
    var isAvailable: Bool {
        AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front) != nil
    }

    func start() {
        guard isAvailable else { return }
        Task {
            guard await AVCaptureDevice.requestAccess(for: .video) else { return }
            if !configured { configure() }
            let session = session
            Task.detached { session.startRunning() }
        }
    }

    func stop() {
        let session = session
        Task.detached { if session.isRunning { session.stopRunning() } }
    }

    private func configure() {
        guard let device = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front),
              let input = try? AVCaptureDeviceInput(device: device)
        else { return }
        session.beginConfiguration()
        session.sessionPreset = .photo
        if session.canAddInput(input) { session.addInput(input) }
        if session.canAddOutput(output) { session.addOutput(output) }
        session.commitConfiguration()
        configured = true
    }

    func capture() async -> UIImage? {
        guard configured else { return nil }
        return await withCheckedContinuation { continuation in
            pending = continuation
            output.capturePhoto(with: AVCapturePhotoSettings(), delegate: self)
        }
    }

    nonisolated func photoOutput(_ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?) {
        let image = photo.fileDataRepresentation().flatMap(UIImage.init(data:))
        Task { @MainActor in
            pending?.resume(returning: image)
            pending = nil
        }
    }
}

private struct CameraPreview: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> PreviewView {
        let view = PreviewView()
        view.previewLayer.session = session
        view.previewLayer.videoGravity = .resizeAspectFill
        return view
    }

    func updateUIView(_ uiView: PreviewView, context: Context) {}

    final class PreviewView: UIView {
        override class var layerClass: AnyClass { AVCaptureVideoPreviewLayer.self }
        var previewLayer: AVCaptureVideoPreviewLayer { layer as! AVCaptureVideoPreviewLayer }
    }
}
