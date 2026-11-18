import SwiftUI

/// The website's colours for the storm (`apps/landing/src/components/preview/Vortex.tsx`).
enum Vortex {
    static let aqua100 = Color(hex: 0xE6F3F5)
    static let aqua200 = Color(hex: 0xC2E2E7)
    static let aqua400 = Color(hex: 0x4FB3BF)
    static let aqua600 = Color(hex: 0x227E89)
    static let aqua700 = Color(hex: 0x1A626B)
    static let petrol900 = Color(hex: 0x004444)
    static let petrol500 = Color(hex: 0x005252)
    static let abyss = Color(hex: 0x00252A)
    static let abyssDeep = Color(hex: 0x001416)
    static let goldBright = Color(hex: 0xE6B849)
    static let goldLight = Color(hex: 0xFFE9A8)
}

/// The POWER AI storm: a hurricane seen from above with the figure standing at
/// its lower left, a port of the web's `Vortex`.
///
/// Bands turn at different speeds (9 s at the eye, 120 s at the rim), and the
/// shear between them is what makes it read as one fluid. Everything is drawn
/// from one clock, so a frame costs a handful of gradients rather than a timer
/// per layer.
struct VortexView<Label: View>: View {
    @ViewBuilder var label: Label

    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        TimelineView(.animation(paused: reduceMotion)) { timeline in
            let t = timeline.date.timeIntervalSinceReferenceDate
            GeometryReader { proxy in
                let d = proxy.size.width
                ZStack {
                    ground
                    ForEach(Array(Self.bands.enumerated()), id: \.offset) { i, band in
                        bandLayer(i, band, diameter: d, time: t)
                    }
                    arms(diameter: d)
                        .rotationEffect(spin(t, period: 44))
                    haze(diameter: d, time: t)
                    eye(diameter: d, time: t)
                    wall(diameter: d)
                    Circle()
                        .strokeBorder(Vortex.abyssDeep.opacity(0.7), lineWidth: 2)
                        .padding(d * 0.01)
                    Circle()
                        .strokeBorder(Vortex.aqua700.opacity(0.3), lineWidth: 1)
                        .padding(d * 0.03)
                    figure(diameter: d)
                    label
                }
                .frame(width: d, height: d)
            }
            .aspectRatio(1, contentMode: .fit)
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: Layers

    /// Dark from the eye outward, holding near-black at the wall.
    private var ground: some View {
        // Elliptical rather than radial: its radius is a fraction of the
        // frame, so the stops land at the same place at any size.
        Circle().fill(
            EllipticalGradient(
                stops: [
                    .init(color: .clear, location: 0.24),
                    .init(color: Vortex.petrol900.opacity(0.4), location: 0.42),
                    .init(color: Vortex.abyss.opacity(0.85), location: 0.62),
                    .init(color: Vortex.abyssDeep.opacity(0.95), location: 0.80),
                    .init(color: Vortex.abyssDeep.opacity(0.9), location: 0.92),
                    .init(color: .clear, location: 0.96),
                ],
                center: .center,
                startRadiusFraction: 0,
                endRadiusFraction: 0.5
            )
        )
    }

    private struct Band {
        let inset: CGFloat
        let period: Double
        let blur: CGFloat
        let opacity: Double
    }

    /// Outermost first; blur is relative to the diameter.
    private static var bands: [Band] {
        [
            Band(inset: 0.00, period: 120, blur: 0.075, opacity: 0.55),
            Band(inset: 0.07, period: 72, blur: 0.075, opacity: 0.65),
            Band(inset: 0.15, period: 44, blur: 0.050, opacity: 0.70),
            Band(inset: 0.24, period: 26, blur: 0.050, opacity: 0.80),
            Band(inset: 0.33, period: 16, blur: 0.040, opacity: 0.85),
            Band(inset: 0.41, period: 9, blur: 0.030, opacity: 0.90),
        ]
    }

    private func bandLayer(_ i: Int, _ band: Band, diameter d: CGFloat, time t: Double) -> some View {
        let c1 = i > 3 ? Vortex.aqua200 : i > 1 ? Vortex.aqua600 : Vortex.abyss
        let c2 = i > 3 ? Vortex.goldLight : i > 1 ? Vortex.petrol500 : Vortex.abyssDeep
        let c3 = i > 1 ? Vortex.aqua400 : Vortex.petrol900
        let c4 = i > 2 ? Vortex.goldBright : i > 1 ? Vortex.aqua700 : Vortex.abyss
        let size = d * (1 - band.inset * 2)
        // The web swells each band on a 6.4 s breath, offset per band.
        let swell = 1 + 0.03 * sin((t + Double(i) * 1.9) / 6.4 * 2 * .pi)

        return Circle()
            .fill(
                AngularGradient(
                    stops: [
                        .init(color: .clear, location: 0 / 360),
                        .init(color: c1.opacity(0.8), location: 26 / 360),
                        .init(color: .clear, location: 68 / 360),
                        .init(color: c2.opacity(0.7), location: 122 / 360),
                        .init(color: .clear, location: 168 / 360),
                        .init(color: c3.opacity(0.6), location: 214 / 360),
                        .init(color: .clear, location: 262 / 360),
                        .init(color: c4.opacity(0.5), location: 308 / 360),
                        .init(color: .clear, location: 356 / 360),
                    ],
                    center: .center,
                    angle: .degrees(Double(i) * 47 - 90)
                )
            )
            // Feathered to a ring, so the sweep never reaches the eye as spokes.
            .mask(
                Circle().fill(
                    RadialGradient(
                        stops: [
                            .init(color: .clear, location: 0.30),
                            .init(color: .black, location: 0.52),
                            .init(color: .black, location: 0.88),
                            .init(color: .clear, location: 0.97),
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: size / 2
                    )
                )
            )
            .blur(radius: d * band.blur)
            .opacity(band.opacity)
            .scaleEffect(swell)
            .frame(width: size, height: size)
            .rotationEffect(spin(t, period: band.period))
    }

    /// Four logarithmic arms, a quarter turn apart.
    private func arms(diameter d: CGFloat) -> some View {
        Canvas { context, size in
            let scale = size.width / 200
            var arm = Path()
            for step in 0...56 {
                let f = Double(step) / 56
                let angle = f * .pi * 1.75
                let radius = 26 + f * 68
                let point = CGPoint(
                    x: (100 + cos(angle) * radius) * scale,
                    y: (100 + sin(angle) * radius) * scale
                )
                if step == 0 { arm.move(to: point) } else { arm.addLine(to: point) }
            }
            let shading = GraphicsContext.Shading.linearGradient(
                Gradient(stops: [
                    .init(color: Vortex.goldLight.opacity(0.9), location: 0),
                    .init(color: Vortex.aqua200.opacity(0.5), location: 0.45),
                    .init(color: Vortex.petrol900.opacity(0), location: 1),
                ]),
                startPoint: .zero,
                endPoint: CGPoint(x: size.width, y: size.height)
            )
            let centre = CGPoint(x: size.width / 2, y: size.height / 2)
            for quarter in 0..<4 {
                let turn = CGAffineTransform(translationX: centre.x, y: centre.y)
                    .rotated(by: Double(quarter) * .pi / 2)
                    .translatedBy(x: -centre.x, y: -centre.y)
                context.stroke(
                    arm.applying(turn),
                    with: shading,
                    style: StrokeStyle(lineWidth: 6 * scale, lineCap: .round)
                )
            }
        }
        .padding(d * 0.04)
    }

    /// Sand haze drifting across the face.
    private func haze(diameter d: CGFloat, time t: Double) -> some View {
        let drift = sin(t / 17 * 2 * .pi)
        return ZStack {
            Ellipse()
                .fill(Vortex.goldLight.opacity(0.35))
                .frame(width: d * 0.6, height: d * 0.42)
                .offset(x: d * (-0.12 + 0.04 * drift), y: d * -0.08)
            Ellipse()
                .fill(Vortex.aqua200.opacity(0.3))
                .frame(width: d * 0.46, height: d * 0.58)
                .offset(x: d * (0.16 - 0.04 * drift), y: d * 0.1)
        }
        .blur(radius: d * 0.08)
        .clipShape(Circle())
    }

    /// The bright eye where the bands stop.
    private func eye(diameter d: CGFloat, time t: Double) -> some View {
        let pulse = 1 + 0.04 * sin(t / 5 * 2 * .pi)
        return ZStack {
            Circle()
                .fill(Vortex.aqua200.opacity(0.4))
                .frame(width: d * 0.42, height: d * 0.42)
                .blur(radius: d * 0.08)
            Circle()
                .fill(Vortex.goldLight.opacity(0.5))
                .frame(width: d * 0.3, height: d * 0.3)
                .blur(radius: d * 0.05)
            Circle()
                .fill(
                    RadialGradient(
                        stops: [
                            .init(color: .white, location: 0),
                            .init(color: Vortex.goldLight.opacity(0.8), location: 0.42),
                            .init(color: Vortex.aqua100.opacity(0.5), location: 0.70),
                            .init(color: .clear, location: 0.84),
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: d * 0.1
                    )
                )
                .frame(width: d * 0.2, height: d * 0.2)
                .blur(radius: d * 0.012)
        }
        .scaleEffect(pulse)
    }

    /// The dark wall biting in from the rim, so the storm ends in an edge.
    private func wall(diameter d: CGFloat) -> some View {
        Circle()
            .strokeBorder(Vortex.abyssDeep.opacity(0.8), lineWidth: d * 0.09)
            .blur(radius: d * 0.05)
            .clipShape(Circle())
    }

    /// The figure at the lower left, looking in. Stands in front of the storm.
    private func figure(diameter d: CGFloat) -> some View {
        Image("VortexFigure")
            .resizable()
            .interpolation(.high)
            .scaledToFit()
            .frame(width: d * 0.34, height: d * 0.58, alignment: .bottom)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .bottomLeading)
            .offset(x: d * -0.04, y: -d * 0.01)
            .accessibilityHidden(true)
    }

    private func spin(_ t: Double, period: Double) -> Angle {
        .degrees(t.truncatingRemainder(dividingBy: period) / period * 360)
    }
}

extension Color {
    init(hex: UInt32) {
        self.init(
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}
