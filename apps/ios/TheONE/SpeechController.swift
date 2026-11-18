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


    private var recogniser: SFSpeechRecognizer?
    private let engine = AVAudioEngine()
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    nonisolated(unsafe) private let synthesiser = AVSpeechSynthesizer()

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
        // Listening follows the phone's language, so a Japanese member is
        // understood in Japanese; English where the phone's is not supported.
        let recogniser = SFSpeechRecognizer(locale: Locale(identifier: MemberLanguage.tag))
            ?? SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
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
    /// Reads `text` aloud in the voice of the language it is written in, so a
    /// reply in Japanese is spoken by a Japanese voice.
    func speak(_ text: String, respectSilentSwitch: Bool = false) {
        guard !text.isEmpty else { return }
        stopSpeaking()
        isSpeaking = true

        // POWER AI's own voice first (the owner's voice, from the server);
        // the phone's voice when it cannot come in time, so POWER AI is never
        // silent. A newer `speak` or a `stop` makes an older one give way.
        let turn = UUID()
        currentTurn = turn
        Task { @MainActor in
            if let audio = await Self.cloudVoice(for: text), self.currentTurn == turn {
                self.play(audio, respectSilentSwitch: respectSilentSwitch)
                return
            }
            guard self.currentTurn == turn else { return }
            self.speakOnPhone(text, respectSilentSwitch: respectSilentSwitch)
        }
    }

    /// Which `speak` is current; an older one finishing late stays quiet.
    private var currentTurn: UUID?
    private var player: AVAudioPlayer?

    /// POWER AI's voice from the server, or nil after a few seconds without it.
    private static func cloudVoice(for text: String) async -> Data? {
        guard await APIClient.shared.hasSession else { return nil }
        return await withTaskGroup(of: Data?.self) { group in
            group.addTask { try? await APIClient.shared.sendRaw("/voice/speak", method: "POST", body: ["text": text]) }
            group.addTask { try? await Task.sleep(for: .seconds(8)); return nil }
            let first = await group.next() ?? nil
            group.cancelAll()
            return first
        }
    }

    nonisolated private static func activateSession(respectSilentSwitch: Bool) throws {
        let session = AVAudioSession.sharedInstance()
        if respectSilentSwitch {
            try session.setCategory(.ambient, mode: .spokenAudio, options: .duckOthers)
        } else {
            try session.setCategory(.playback, mode: .spokenAudio, options: .duckOthers)
        }
        try session.setActive(true)
    }

    /// Plays POWER AI's voice; on any trouble the phone speaks instead.
    private func play(_ audio: Data, respectSilentSwitch: Bool) {
        do {
            try Self.activateSession(respectSilentSwitch: respectSilentSwitch)
            let player = try AVAudioPlayer(data: audio)
            player.delegate = self
            self.player = player
            if !player.play() { isSpeaking = false }
        } catch {
            isSpeaking = false
        }
    }

    /// The phone's own voice, in the language the words are written in.
    private func speakOnPhone(_ text: String, respectSilentSwitch: Bool) {
        // Waking the audio session and choosing a voice can take a moment;
        // done off the main thread, the screen stays answerable to the touch
        // while POWER AI speaks.
        let synthesiser = synthesiser
        Self.audio.async {
            do {
                try Self.activateSession(respectSilentSwitch: respectSilentSwitch)
            } catch {
                Task { @MainActor in self.isSpeaking = false }
                return
            }

            // Markdown stars are for the eye; the voice should not trip over them.
            let utterance = AVSpeechUtterance(string: text.replacingOccurrences(of: "**", with: ""))
            utterance.voice = Self.bestVoice(for: MemberLanguage.of(text))
            // A touch slower than the default reads as calm rather than hurried.
            utterance.rate = AVSpeechUtteranceDefaultSpeechRate * 0.92
            synthesiser.speak(utterance)
        }
    }

    /// One line for everything audio, so speaking and stopping keep their order.
    private nonisolated static let audio = DispatchQueue(label: "theone.speech", qos: .userInitiated)

    /// The best voice on this phone for the language: Premium over Enhanced
    /// over the compact default, the member's own region first. Premium voices
    /// are a free download in Settings > Accessibility > Spoken Content.
    nonisolated static func bestVoice(for languageTag: String) -> AVSpeechSynthesisVoice? {
        // "zh-Hans" or "ja": only the language part decides which voices fit.
        let language = String(languageTag.split(separator: "-").first ?? "en").lowercased()
        // A tie goes to the phone's own region, so a Swiss phone hears Swiss
        // German rather than any German voice.
        let phone = MemberLanguage.tag
        let home = phone.lowercased().hasPrefix(language) ? phone : languageTag

        func score(_ voice: AVSpeechSynthesisVoice) -> Int {
            voice.quality.rawValue * 10 + (voice.language == home ? 1 : 0)
        }

        let candidates = AVSpeechSynthesisVoice.speechVoices().filter {
            $0.language.lowercased().hasPrefix(language)
                && !$0.voiceTraits.contains(.isNoveltyVoice)
                && !$0.voiceTraits.contains(.isPersonalVoice)
        }
        return candidates.max { score($0) < score($1) }
            ?? AVSpeechSynthesisVoice(language: languageTag)
    }

    func stopSpeaking() {
        currentTurn = nil
        player?.stop()
        player = nil
        let synthesiser = synthesiser
        Self.audio.async {
            if synthesiser.isSpeaking { synthesiser.stopSpeaking(at: .immediate) }
        }
        isSpeaking = false
    }
}

extension SpeechController: AVAudioPlayerDelegate {
    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task { @MainActor in
            if self.player === player {
                self.player = nil
                self.isSpeaking = false
            }
        }
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
