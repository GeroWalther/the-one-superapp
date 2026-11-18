import SwiftUI

/// TheONE REAL ESTATE, both ways, each to the two or three best brokers for
/// the place, each in a chat of its own:
/// selling, the member describes their property once (TheONE never values it,
/// the brokers do); finding, the member describes their wishes, and the
/// brokers answer from their portfolio, off market properties too.
struct PropertyRequestView: View {
    enum Mode { case sell, find }
    let mode: Mode

    @Environment(\.dismiss) private var dismiss

    @State private var type = "villa"
    @State private var types: [String] = []
    @State private var city = ""
    @State private var country = ""
    @State private var rooms = ""
    @State private var livingArea = ""
    @State private var plotArea = ""
    @State private var price = ""
    @State private var currency = "CHF"
    @State private var about = ""
    @State private var timing = "now"
    @State private var offMarket = true

    /// Return moves on to the next field, so the keyboard never hides it.
    private enum Field: Hashable { case city, country, rooms, living, plot, price, about }
    @FocusState private var focus: Field?

    @State private var sending = false
    @State private var error: String?
    @State private var sale: PropertySale?
    private var selling: Bool { mode == .sell }
    @State private var chat: PropertySale.Broker?

    private static let types: [(String, String)] = [
        ("villa", tr("Villa")), ("house", tr("House")), ("apartment", tr("Apartment")),
        ("penthouse", tr("Penthouse")), ("chalet", tr("Chalet")), ("estate", tr("Estate")), ("plot", tr("Plot")),
    ]
    private var timings: [(String, String)] {
        [("now", tr("Now")), ("months", tr("In the coming months")),
         ("exploring", selling ? tr("First the value") : tr("Just looking"))]
    }
    private static let currencies = ["CHF", "EUR", "GBP", "USD", "AED"]

    var body: some View {
        NavigationStack {
            ScrollView {
                if let sale { sent(sale) } else { form }
            }
            .scrollDismissesKeyboard(.interactively)
            .background(HomeBackground())
            .navigationTitle(Text(verbatim: "TheONE REAL ESTATE"))
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button { dismiss() } label: { Image(systemName: "xmark") }
                        .accessibilityLabel(tr("Close"))
                        .accessibilityIdentifier("request.close")
                }
            }
            .navigationDestination(isPresented: Binding(get: { chat != nil }, set: { if !$0 { chat = nil } })) {
                if let chat { ConversationView(conversationId: chat.conversationId, title: chat.name) }
            }
        }
        .tint(Theme.aqua)
    }

    private var form: some View {
        VStack(alignment: .leading, spacing: 22) {
            VStack(alignment: .leading, spacing: 8) {
                Text(selling ? tr("Sell your property with TheONE") : tr("Find your property with TheONE"))
                    .font(.theoneHeading(24))
                    .foregroundStyle(Theme.heading)
                Text(selling ? tr("Tell TheONE about your property once. It goes to the two or three best brokers for its place, discreetly if you wish, and they reply to you directly in your messages.") : tr("Tell TheONE what you are looking for. The two or three best brokers for that place send you the right properties from their portfolio, including those never publicly listed."))
                    .font(.theone(15))
                    .foregroundStyle(Theme.inkSoft)
            }

            group(selling ? tr("What would you like to sell?") : tr("What are you looking for?")) {
                if selling {
                    chips(Self.types, selection: $type)
                } else {
                    multiChips(Self.types, selection: $types)
                }
            }
            group(selling ? tr("Where is it?") : tr("Where would you like to live?")) {
                field(tr("City"), text: $city, id: "sell.city", focus: .city, next: .country)
                field(tr("Country"), text: $country, id: "sell.country", focus: .country, next: .rooms)
            }
            group(selling ? tr("The property") : tr("At least")) {
                HStack(spacing: 10) {
                    field(tr("Rooms"), text: $rooms, id: "sell.rooms", numbers: true, focus: .rooms, next: .living)
                    field(tr("Living area m²"), text: $livingArea, id: "sell.living", numbers: true, focus: .living, next: hasPlot ? .plot : .price)
                }
                if hasPlot && selling {
                    field(tr("Plot m²"), text: $plotArea, id: "sell.plot", numbers: true, focus: .plot, next: .price)
                }
            }
            group(selling ? tr("Your price idea, if you have one") : tr("Your budget, up to")) {
                HStack(spacing: 10) {
                    field(selling ? tr("Price") : tr("Budget"), text: $price, id: "sell.price", numbers: true, focus: .price, next: .about)
                    Picker(tr("Currency"), selection: $currency) {
                        ForEach(Self.currencies, id: \.self) { Text(verbatim: $0).tag($0) }
                    }
                    .pickerStyle(.menu)
                    .tint(Theme.accentText)
                    .frame(width: 100)
                }
            }
            group(selling ? tr("What makes it special?") : tr("What matters to you?")) {
                TextField(selling ? tr("The view, the light, the garden …") : tr("Sea view, quiet, close to a good school …"), text: $about, axis: .vertical)
                    .lineLimit(3...6)
                    .font(.theone(16))
                    .padding(14)
                    .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Theme.panel))
                    .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.line, lineWidth: 1))
                    .focused($focus, equals: .about)
                    .accessibilityIdentifier("sell.about")
            }
            group(selling ? tr("When would you like to sell?") : tr("When would you like to buy?")) {
                chips(timings, selection: $timing)
            }
            if selling {
            Toggle(isOn: $offMarket) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(tr("Discreetly, off market"))
                        .font(.theone(16, weight: .medium))
                        .foregroundStyle(Theme.ink)
                    Text(tr("Only qualified buyers hear of it, never a public listing."))
                        .font(.theone(13))
                        .foregroundStyle(Theme.inkFaint)
                }
            }
            .tint(Theme.aqua)
            } else {
                Label(tr("The brokers also send you properties that are never publicly listed."), systemImage: "lock")
                    .font(.theone(13))
                    .foregroundStyle(Theme.inkSoft)
            }

            if let error {
                Text(error)
                    .font(.theone(14))
                    .foregroundStyle(.red)
            }

            Button { Task { await send() } } label: {
                Group {
                    if sending { ProgressView().tint(.white) } else { Text(tr("Send to the best brokers")) }
                }
                .font(.theone(16, weight: .medium))
                .foregroundStyle(Theme.onAccent)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 15)
                .background(Capsule().fill(canSend ? Theme.aqua : Theme.aqua.opacity(0.4)))
            }
            .disabled(!canSend || sending)
            .accessibilityIdentifier("sell.send")
        }
        .padding(20)
    }

    private func sent(_ sale: PropertySale) -> some View {
        VStack(alignment: .leading, spacing: 18) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 40, weight: .ultraLight))
                .foregroundStyle(Theme.aqua)
            Text(selling ? tr("Your property is with the best brokers") : tr("Your wishes are with the best brokers"))
                .font(.theoneHeading(24))
                .foregroundStyle(Theme.heading)
            Text(selling ? tr("Each of them has your property in a chat of their own and will reply to you there with a first assessment and a date for a viewing.") : tr("Each of them has your wishes in a chat of their own and will send you the right properties from their portfolio there."))
                .font(.theone(15))
                .foregroundStyle(Theme.inkSoft)
            ForEach(sale.brokers) { broker in
                Button { chat = broker } label: {
                    HStack {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(broker.name)
                                .font(.theone(17, weight: .medium))
                                .foregroundStyle(Theme.ink)
                            Text(broker.city)
                                .font(.theone(13))
                                .foregroundStyle(Theme.inkFaint)
                        }
                        Spacer()
                        Image(systemName: "bubble.left.and.bubble.right")
                            .foregroundStyle(Theme.aqua)
                    }
                    .padding(16)
                    .background(RoundedRectangle(cornerRadius: 16, style: .continuous).fill(Theme.panel))
                    .overlay(RoundedRectangle(cornerRadius: 16, style: .continuous).stroke(Theme.line, lineWidth: 1))
                }
                .buttonStyle(.plain)
                .accessibilityIdentifier("sell.broker")
            }
        }
        .padding(20)
    }

    private var hasPlot: Bool { selling && type != "apartment" && type != "penthouse" }

    private var canSend: Bool {
        !city.trimmingCharacters(in: .whitespaces).isEmpty && !country.trimmingCharacters(in: .whitespaces).isEmpty
    }

    private func number(_ text: String) -> Double? {
        Double(text.filter { $0.isNumber || $0 == "." || $0 == "," }.replacingOccurrences(of: ",", with: "."))
    }

    private func send() async {
        sending = true
        error = nil
        defer { sending = false }
        // Prices are typed with or without thousands marks: only the digits count.
        let amount = Double(price.filter(\.isNumber))
        var body: [String: Any] = [
            "city": city, "country": country, "currency": currency,
            "description": about, "timing": timing,
        ]
        if selling {
            body["propertyType"] = type
            body["offMarket"] = offMarket
            if let v = number(rooms) { body["rooms"] = v }
            if let v = number(livingArea) { body["livingArea"] = v }
            if let v = number(plotArea), hasPlot { body["plotArea"] = v }
            if let amount { body["priceIdea"] = amount }
        } else {
            body["propertyTypes"] = types
            if let v = number(rooms) { body["minRooms"] = v }
            if let v = number(livingArea) { body["minLivingArea"] = v }
            if let amount { body["budget"] = amount }
        }
        struct Sale: Decodable { let sale: PropertySale }
        struct Search: Decodable { let search: PropertySale }
        do {
            if selling {
                let response: Sale = try await APIClient.shared.send("/realestate/sales", method: "POST", body: body)
                sale = response.sale
            } else {
                let response: Search = try await APIClient.shared.send("/realestate/searches", method: "POST", body: body)
                sale = response.search
            }
        } catch {
            self.error = (error as? APIError)?.errorDescription ?? tr("Something went wrong. Please try again.")
        }
    }

    // MARK: - Pieces

    private func group<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title.uppercased())
                .font(.theone(12, weight: .medium))
                .tracking(MemberLanguage.spacing(2))
                .foregroundStyle(Theme.accentText)
            content()
        }
    }

    private func field(_ title: String, text: Binding<String>, id: String, numbers: Bool = false, focus field: Field, next: Field) -> some View {
        // The label stays above the field, so a filled in "7" still says what it is.
        VStack(alignment: .leading, spacing: 5) {
            Text(title)
                .font(.theone(12))
                .foregroundStyle(Theme.inkFaint)
            TextField(title, text: text)
                // Numbers with a return key, so the member can go on to the next field.
                .keyboardType(numbers ? .numbersAndPunctuation : .default)
                .focused($focus, equals: field)
                .submitLabel(.next)
                .onSubmit { focus = next }
                .textInputAutocapitalization(numbers ? .never : .words)
                .font(.theone(16))
                .padding(14)
                .background(RoundedRectangle(cornerRadius: 14, style: .continuous).fill(Theme.panel))
                .overlay(RoundedRectangle(cornerRadius: 14, style: .continuous).stroke(Theme.line, lineWidth: 1))
                .accessibilityIdentifier(id)
        }
    }

    /// Finding: any of several types may do.
    private func multiChips(_ items: [(String, String)], selection: Binding<[String]>) -> some View {
        FlowLayout(spacing: 8) {
            ForEach(items, id: \.0) { item in
                let on = selection.wrappedValue.contains(item.0)
                Button {
                    if on { selection.wrappedValue.removeAll { $0 == item.0 } } else { selection.wrappedValue.append(item.0) }
                } label: {
                    Text(item.1)
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
                .accessibilityIdentifier("find.\(item.0)")
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
    }

    private func chips(_ items: [(String, String)], selection: Binding<String>) -> some View {
        FlowLayout(spacing: 8) {
            ForEach(items, id: \.0) { item in
                let on = selection.wrappedValue == item.0
                Button { selection.wrappedValue = item.0 } label: {
                    Text(item.1)
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
                .accessibilityIdentifier("sell.\(item.0)")
                .accessibilityAddTraits(on ? .isSelected : [])
            }
        }
    }
}

/// A property for sale, or a search, through TheONE REAL ESTATE: what the
/// app shows afterwards is the same, the brokers it went to.
struct PropertySale: Decodable, Identifiable {
    struct Broker: Decodable, Identifiable, Hashable {
        let id: String
        let name: String
        let city: String
        let conversationId: String
    }
    let id: String
    let city: String
    let country: String
    let brokers: [Broker]
}
