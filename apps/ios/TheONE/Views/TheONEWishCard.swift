import SwiftUI

/// TheONE WISH on the start screen: the member says one sentence and POWER AI
/// arranges everything, flight, stay, treatment and products, as one plan.
struct TheONEWishCard: View {
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(verbatim: "TheONE WISH")
                        .font(.theone(12, weight: .semibold))
                        .tracking(MemberLanguage.spacing(2))
                        .foregroundStyle(Theme.accentText)
                    Text(tr("One sentence. Everything arranged."))
                        .font(.theoneHeading(16, medium: true))
                        .foregroundStyle(Theme.heading)
                        .fixedSize(horizontal: false, vertical: true)
                    Text(tr("Tell POWER AI your wish"))
                        .font(.theone(12.5))
                        .foregroundStyle(Theme.inkSoft)
                }
                Spacer(minLength: 0)
                ZStack {
                    Circle().fill(
                        LinearGradient(colors: [Vortex.aqua700, Vortex.abyss], startPoint: .topLeading, endPoint: .bottomTrailing)
                    )
                    Image(systemName: "wand.and.stars")
                        .font(.system(size: 24, weight: .light))
                        .foregroundStyle(.white)
                }
                .frame(width: 66, height: 66)
            }
            .padding(.horizontal, 18)
            .padding(.vertical, 14)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(
                RoundedRectangle(cornerRadius: 20, style: .continuous)
                    .fill(.white.opacity(0.86))
                    .overlay(RoundedRectangle(cornerRadius: 20, style: .continuous).stroke(Vortex.aqua700.opacity(0.15), lineWidth: 1))
            )
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("home.wish")
    }

    /// What POWER AI asks when TheONE WISH opens, and says aloud.
    static var question: String {
        tr("What is your wish? Tell me in one sentence, and I will arrange everything for you.")
    }
}
