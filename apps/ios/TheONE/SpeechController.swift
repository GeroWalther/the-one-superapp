import AVFoundation
import Observation
import Speech

/// Voice in and out, entirely on-device.
///
/// `SFSpeechRecognizer` with `requiresOnDeviceRecognition` keeps audio off
/// Apple's servers, which matters for a platform where members describe medical
/// and financial situations out loud. It also means no per-minute vendor cost
/// and no extra key to manage.
@MainActor
@Observable
final class SpeechController: NSObject {
    var transcript = ""
    var isListening = false
    var isSpeaking = false
    var permissionDenied = false

    private let recogniser = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private let synthesiser = AVSpeechSynthesizer()

    override init() {
        super.init()
        synthesiser.delegate = self
    }

    private var hasAsked = false

    /// Asks once, the first time the member actually reaches for the mic.
    func requestPermissionsIfNeeded() async {
        guard !hasAsked else { return }
        hasAsked = true

        let speech = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { continuation.resume(returning: $0) }
        }
        let microphone = await AVAudioApplication.requestRecordPermission()

        permissionDenied = speech != .authorized || !microphone
    }

    func startListening() {
        guard !isListening, let recogniser, recogniser.isAvailable else { return }

        stopSpeaking()
        transcript = ""

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord, mode: .measurement, options: .duckOthers)
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            let request = SFSpeechAudioBufferRecognitionRequest()
            request.shouldReportPartialResults = true
            // Keeps the audio on the phone. Falls back automatically if the
            // device cannot do it, which is why this is a preference not a
            // guarantee.
            request.requiresOnDeviceRecognition = recogniser.supportsOnDeviceRecognition
            self.request = request

            let input = engine.inputNode
            let format = input.outputFormat(forBus: 0)
            input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
                request.append(buffer)
            }

            engine.prepare()
            try engine.start()
            isListening = true

            task = recogniser.recognitionTask(with: request) { [weak self] result, error in
                guard let self else { return }
                Task { @MainActor in
                    if let result {
                        self.transcript = result.bestTranscription.formattedString
                    }
                    if error != nil || result?.isFinal == true {
                        self.stopListening()
                    }
                }
            }
        } catch {
            stopListening()
        }
    }

    func stopListening() {
        guard isListening || engine.isRunning else { return }

        engine.stop()
        engine.inputNode.removeTap(onBus: 0)
        request?.endAudio()
        task?.cancel()
        request = nil
        task = nil
        isListening = false

        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    func speak(_ text: String, locale: String) {
        guard !text.isEmpty else { return }
        stopSpeaking()

        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio, options: .duckOthers)
            try session.setActive(true)
        } catch {
            return
        }

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(
            language: locale == "de" ? "de-DE" : "en-US"
        )
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.96

        isSpeaking = true
        synthesiser.speak(utterance)
    }

    func stopSpeaking() {
        if synthesiser.isSpeaking {
            synthesiser.stopSpeaking(at: .immediate)
        }
        isSpeaking = false
    }
}

extension SpeechController: AVSpeechSynthesizerDelegate {
    nonisolated func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer,
        didFinish utterance: AVSpeechUtterance
    ) {
        Task { @MainActor in self.isSpeaking = false }
    }

    nonisolated func speechSynthesizer(
        _ synthesizer: AVSpeechSynthesizer,
        didCancel utterance: AVSpeechUtterance
    ) {
        Task { @MainActor in self.isSpeaking = false }
    }
}
