import SwiftUI
import CoreLocation

/// The forecast as the server sends it (MET Norway), with POWER AI's word on
/// what to wear.
struct WeatherReport: Decodable, Sendable {
    struct Now: Decodable, Sendable { let temperature: Double; let symbol: String; let windMs: Double }
    struct Day: Decodable, Sendable, Identifiable {
        let date: String
        let min: Double
        let max: Double
        let symbol: String
        let rainMm: Double
        var id: String { date }
    }
    let now: Now
    let today: Day
    let days: [Day]
    let outfit: String?
}

/// Loads the forecast for where the member is: their current location once
/// they have allowed it, otherwise the city in their profile. Works anywhere
/// in the world.
@MainActor
@Observable
final class WeatherModel: NSObject, CLLocationManagerDelegate {
    var report: WeatherReport?
    var place: String?
    var loading = false

    private let manager = CLLocationManager()
    private var lastLoad: Date?
    @ObservationIgnored private var locationContinuation: CheckedContinuation<CLLocation?, Never>?

    /// The member chose to see the weather where they are.
    var usesCurrentLocation: Bool {
        get { UserDefaults.standard.bool(forKey: "weather.currentLocation") }
        set { UserDefaults.standard.set(newValue, forKey: "weather.currentLocation") }
    }

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    func load(force: Bool = false) async {
        if !force, let lastLoad, Date().timeIntervalSince(lastLoad) < 20 * 60, report != nil { return }
        loading = true
        defer { loading = false }

        var coordinate: CLLocationCoordinate2D?
        var name: String?

        if usesCurrentLocation, let location = await currentLocation() {
            coordinate = location.coordinate
            name = try? await CLGeocoder().reverseGeocodeLocation(location).first?.locality
        }
        if coordinate == nil {
            // The city the member gave in their profile.
            guard let me: MeResponse = try? await APIClient.shared.send("/me"),
                  let profile = me.profile, !profile.city.isEmpty
            else { return }
            let query = [profile.city, profile.country].filter { !$0.isEmpty }.joined(separator: ", ")
            guard let mark = try? await CLGeocoder().geocodeAddressString(query).first,
                  let location = mark.location
            else { return }
            coordinate = location.coordinate
            name = mark.locality ?? profile.city
        }
        guard let coordinate else { return }

        var parts = URLComponents()
        parts.queryItems = [
            URLQueryItem(name: "lat", value: String(format: "%.2f", coordinate.latitude)),
            URLQueryItem(name: "lon", value: String(format: "%.2f", coordinate.longitude)),
            URLQueryItem(name: "tz", value: TimeZone.current.identifier),
            URLQueryItem(name: "place", value: name ?? ""),
            URLQueryItem(name: "language", value: MemberLanguage.tag),
        ]
        if let report: WeatherReport = try? await APIClient.shared.send("/weather?\(parts.percentEncodedQuery ?? "")") {
            self.report = report
            self.place = name
            lastLoad = Date()
        }
    }

    /// Asks for the location once the member taps "Use my location".
    func useCurrentLocation() async {
        usesCurrentLocation = true
        await load(force: true)
    }

    private func currentLocation() async -> CLLocation? {
        if manager.authorizationStatus == .denied || manager.authorizationStatus == .restricted { return nil }
        return await withCheckedContinuation { continuation in
            locationContinuation = continuation
            if manager.authorizationStatus == .notDetermined {
                manager.requestWhenInUseAuthorization()
            } else {
                manager.requestLocation()
            }
        }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            switch manager.authorizationStatus {
            case .authorizedWhenInUse, .authorizedAlways: manager.requestLocation()
            case .denied, .restricted: self.finish(nil)
            default: break
            }
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let last = locations.last
        Task { @MainActor in self.finish(last) }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in self.finish(nil) }
    }

    private func finish(_ location: CLLocation?) {
        locationContinuation?.resume(returning: location)
        locationContinuation = nil
    }
}

/// MET Norway's weather symbols as SF Symbols and words.
enum WeatherSymbol {
    static func image(_ code: String, night: Bool = false) -> String {
        // Filled symbols, so they show in their colours (sun yellow, rain blue).
        switch code {
        case let c where c.contains("thunder"): "cloud.bolt.rain.fill"
        case let c where c.contains("snow"): "cloud.snow.fill"
        case let c where c.contains("sleet"): "cloud.sleet.fill"
        case let c where c.contains("rainshowers"): night ? "cloud.moon.rain.fill" : "cloud.sun.rain.fill"
        case let c where c.contains("heavyrain"): "cloud.heavyrain.fill"
        case let c where c.contains("rain"): "cloud.rain.fill"
        case "fog": "cloud.fog.fill"
        case "cloudy": "cloud.fill"
        case "partlycloudy": night ? "cloud.moon.fill" : "cloud.sun.fill"
        case "fair": night ? "moon.stars.fill" : "sun.max.fill"
        default: night ? "moon.stars.fill" : "sun.max.fill"
        }
    }

    static func name(_ code: String) -> String {
        switch code {
        case let c where c.contains("thunder"): tr("Thunderstorms")
        case let c where c.contains("snow"): tr("Snow")
        case let c where c.contains("sleet"): tr("Sleet")
        case let c where c.contains("rainshowers"): tr("Showers")
        case let c where c.contains("rain"): tr("Rain")
        case "fog": tr("Fog")
        case "cloudy": tr("Cloudy")
        case "partlycloudy": tr("Partly cloudy")
        case "fair": tr("Mostly sunny")
        default: tr("Sunny")
        }
    }
}

/// The weather under POWER AI's greeting on the start screen: now, today's
/// range, and what to wear. A tap opens the week.
struct WeatherCard: View {
    let model: WeatherModel
    @State private var showWeek = false

    var body: some View {
        if let report = model.report {
            Button { showWeek = true } label: {
                VStack(alignment: .leading, spacing: 10) {
                    HStack(alignment: .center, spacing: 12) {
                        WeatherIcon(symbol: WeatherSymbol.image(report.now.symbol, night: isNight), size: 46)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("\(Int(report.now.temperature.rounded()))°")
                                .font(.theoneHeading(28))
                                .foregroundStyle(Theme.heading)
                            Text(WeatherSymbol.name(report.now.symbol))
                                .font(.theone(13))
                                .foregroundStyle(Theme.inkSoft)
                        }
                        Spacer()
                        VStack(alignment: .trailing, spacing: 2) {
                            if let place = model.place {
                                Text(place)
                                    .font(.theone(13.5, weight: .medium))
                                    .foregroundStyle(Theme.ink)
                                    .lineLimit(1)
                            }
                            Text("↑ \(Int(report.today.max.rounded()))°  ↓ \(Int(report.today.min.rounded()))°")
                                .font(.theone(13))
                                .foregroundStyle(Theme.inkSoft)
                        }
                    }
                    if let outfit = report.outfit, !outfit.isEmpty {
                        HStack(alignment: .top, spacing: 8) {
                            Image(systemName: "sparkles")
                                .font(.system(size: 13))
                                .foregroundStyle(Theme.accentText)
                                .padding(.top, 2)
                            Text(outfit)
                                .font(.theone(14))
                                .foregroundStyle(Theme.ink)
                                .multilineTextAlignment(.leading)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                        .accessibilityIdentifier("weather.outfit")
                    }
                }
                .padding(16)
                .background(
                    RoundedRectangle(cornerRadius: 20, style: .continuous)
                        .fill(Theme.panel.opacity(0.9))
                        .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Theme.line, lineWidth: 1))
                )
            }
            .buttonStyle(.plain)
            .accessibilityIdentifier("weather.card")
            .sheet(isPresented: $showWeek) { WeatherWeekView(model: model) }
        }
    }

    private var isNight: Bool {
        let hour = Calendar.current.component(.hour, from: Date())
        return hour < 6 || hour >= 20
    }
}

/// The seven days ahead, with POWER AI's word for today and the switch to the
/// member's current location.
struct WeatherWeekView: View {
    let model: WeatherModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    if let report = model.report {
                        if let outfit = report.outfit, !outfit.isEmpty {
                            VStack(alignment: .leading, spacing: 6) {
                                Text(verbatim: "POWER AI")
                                    .font(.theone(11, weight: .medium))
                                    .tracking(MemberLanguage.spacing(1.8))
                                    .foregroundStyle(Theme.accentText)
                                Text(outfit)
                                    .font(.theone(15))
                                    .foregroundStyle(Theme.ink)
                                    .fixedSize(horizontal: false, vertical: true)
                            }
                            .padding(14)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Theme.aquaTint))
                        }

                        VStack(spacing: 0) {
                            ForEach(report.days) { day in
                                HStack(spacing: 12) {
                                    Text(weekday(day.date))
                                        .font(.theone(15, weight: .medium))
                                        .foregroundStyle(Theme.ink)
                                        .frame(width: 92, alignment: .leading)
                                    WeatherIcon(symbol: WeatherSymbol.image(day.symbol), size: 34)
                                    if day.rainMm >= 0.3 {
                                        Text(String(format: "%.0f mm", day.rainMm))
                                            .font(.theone(12))
                                            .foregroundStyle(Theme.accentText)
                                    }
                                    Spacer()
                                    Text("↑ \(Int(day.max.rounded()))°  ↓ \(Int(day.min.rounded()))°")
                                        .font(.theone(15))
                                        .foregroundStyle(Theme.ink)
                                }
                                .padding(.vertical, 12)
                                Divider().overlay(Theme.line)
                            }
                        }
                    }

                    if !model.usesCurrentLocation {
                        Button {
                            Task { await model.useCurrentLocation() }
                        } label: {
                            Label(tr("Use my location"), systemImage: "location")
                                .font(.theone(14.5, weight: .medium))
                                .foregroundStyle(Theme.accentText)
                        }
                        .padding(.top, 4)
                        .accessibilityIdentifier("weather.location")
                    }

                    Text(tr("Weather data: MET Norway"))
                        .font(.theone(11.5))
                        .foregroundStyle(Theme.inkFaint)
                        .padding(.top, 8)
                }
                .padding(20)
            }
            .paperBackground()
            .navigationTitle(model.place ?? tr("Weather"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) { Button(tr("Done")) { dismiss() } }
            }
        }
    }

    private func weekday(_ iso: String) -> String {
        let parser = DateFormatter()
        parser.calendar = Calendar(identifier: .gregorian)
        parser.dateFormat = "yyyy-MM-dd"
        guard let date = parser.date(from: iso) else { return iso }
        if Calendar.current.isDateInToday(date) { return tr("Today") }
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: MemberLanguage.tag)
        formatter.setLocalizedDateFormatFromTemplate("EEEE")
        return formatter.string(from: date)
    }
}

/// A weather symbol in its own colours on a small petrol disc, so white clouds
/// show as clearly as the sun and the rain.
struct WeatherIcon: View {
    let symbol: String
    let size: CGFloat

    var body: some View {
        Image(systemName: symbol)
            .symbolRenderingMode(.multicolor)
            .font(.system(size: size * 0.5))
            .frame(width: size, height: size)
            .background(Circle().fill(Theme.heading.opacity(0.88)))
    }
}
