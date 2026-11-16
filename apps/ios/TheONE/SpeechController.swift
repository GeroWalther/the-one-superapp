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

    /// The member's language, `"de"` or `"en"`; listening follows it, so a
    /// German member is understood in German.
    var locale = "en"

    private var recogniser: SFSpeechRecognizer?
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
        guard !isListening else { return }
        let recogniser = SFSpeechRecognizer(
            locale: Locale(identifier: locale == "de" ? "de-DE" : "en-US")
        )
        guard let recogniser, recogniser.isAvailable else { return }
        self.recogniser = recogniser

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

    /// Speaks `text` in the warmest voice installed for the member's language.
    ///
    /// `respectSilentSwitch` is for speech the member did not ask for, such as
    /// the greeting at launch: with the phone on silent it stays quiet, so the
    /// app never talks out loud in a meeting.
    func speak(_ text: String, locale: String, respectSilentSwitch: Bool = false) {
        guard !text.isEmpty else { return }
        stopSpeaking()

        do {
            let session = AVAudioSession.sharedInstance()
            if respectSilentSwitch {
                try session.setCategory(.ambient, mode: .spokenAudio, options: .duckOthers)
            } else {
                try session.setCategory(.playback, mode: .spokenAudio, options: .duckOthers)
            }
            try session.setActive(true)
        } catch {
            return
        }

        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = Self.bestVoice(for: locale)
        // A touch slower than the default reads as calm rather than hurried.
        utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.92

        isSpeaking = true
        synthesiser.speak(utterance)
    }

    /// The best voice on this phone for the language: Premium over Enhanced
    /// over the compact default, the member's own region first. Premium voices
    /// are a free download in Settings > Accessibility > Spoken Content.
    static func bestVoice(for locale: String) -> AVSpeechSynthesisVoice? {
        let language = locale == "de" ? "de" : "en"
        let home = locale == "de" ? "de-DE" : "en-US"

        func score(_ voice: AVSpeechSynthesisVoice) -> Int {
            voice.quality.rawValue * 10 + (voice.language == home ? 1 : 0)
        }

        let candidates = AVSpeechSynthesisVoice.speechVoices().filter {
            $0.language.hasPrefix(language)
                && !$0.voiceTraits.contains(.isNoveltyVoice)
                && !$0.voiceTraits.contains(.isPersonalVoice)
        }
        return candidates.max { score($0) < score($1) }
            ?? AVSpeechSynthesisVoice(language: home)
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
