import SwiftUI

struct ExerciseResultView: View {
    let result: ExerciseResult?
    let errorMessage: String?
    let retry: () -> Void
    let close: () -> Void

    @AppStorage("developerModeEnabled") private var developerModeEnabled = false

    var body: some View {
        VStack(spacing: 18) {
            if let result {
                Text("CHECK")
                    .font(.caption.bold())
                    .tracking(2)
                    .foregroundStyle(RETuneTheme.accent)

                Text(result.primaryValueText)
                    .font(.system(size: 60, weight: .bold, design: .rounded))
                    .foregroundStyle(RETuneTheme.textPrimary)

                Text(result.observation)
                    .font(.title3.weight(.semibold))
                    .foregroundStyle(RETuneTheme.textPrimary)

                GlassCard {
                    VStack(spacing: 12) {
                        metricRow("一発着地", result.metrics.directLanding ? "○" : "△")
                        metricRow("中央値", String(format: "%+.0f¢", result.metrics.medianErrorCents))
                        metricRow("安定", String(format: "%.0f%%", result.metrics.stability * 100))
                        metricRow("ドリフト", String(format: "%+.1f¢/s", result.metrics.driftCentsPerSecond))
                    }
                }

                if developerModeEnabled {
                    developerCard(result)
                }
            } else {
                Image(systemName: "waveform.badge.exclamationmark")
                    .font(.system(size: 42))
                    .foregroundStyle(RETuneTheme.accent)
                Text(errorMessage ?? "判定できませんでした")
                    .font(.headline)
                    .foregroundStyle(RETuneTheme.textPrimary)
                    .multilineTextAlignment(.center)
            }

            PrimaryButton(title: "もう一度") {
                retry()
            }

            Button("練習一覧へ戻る") {
                close()
            }
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(RETuneTheme.textSecondary)
        }
    }

    private func developerCard(_ result: ExerciseResult) -> some View {
        let debug = result.debugSnapshot
        return GlassCard {
            VStack(alignment: .leading, spacing: 10) {
                Text("DEVELOPER")
                    .font(.caption2.bold())
                    .tracking(1.8)
                    .foregroundStyle(RETuneTheme.accent)

                metricRow("Target", String(format: "%.2f Hz", result.definition.targetHz))
                metricRow("Median F0", optionalHz(debug.medianDetectedHz))
                metricRow("Initial", String(format: "%+.1f¢", result.metrics.initialErrorCents))
                metricRow("Settling", optionalMilliseconds(result.metrics.settlingTimeMs))
                metricRow("First frame", optionalMilliseconds(debug.firstAcceptedFrameMs))
                metricRow("Frames", "\(debug.acceptedFrameCount)")
                metricRow("Confidence", optionalDecimal(debug.meanConfidence))
                metricRow("Input RMS", optionalDBFS(debug.meanRMS))
            }
        }
    }

    private func metricRow(_ title: String, _ value: String) -> some View {
        HStack {
            Text(title)
                .foregroundStyle(RETuneTheme.textSecondary)
            Spacer()
            Text(value)
                .font(.system(.body, design: .monospaced).weight(.semibold))
                .foregroundStyle(RETuneTheme.textPrimary)
        }
    }

    private func optionalHz(_ value: Double?) -> String {
        value.map { String(format: "%.2f Hz", $0) } ?? "—"
    }

    private func optionalMilliseconds(_ value: Double?) -> String {
        value.map { String(format: "%.0f ms", $0) } ?? "—"
    }

    private func optionalDecimal(_ value: Double?) -> String {
        value.map { String(format: "%.3f", $0) } ?? "—"
    }

    private func optionalDBFS(_ rms: Double?) -> String {
        guard let rms, rms > 0 else { return "—" }
        return String(format: "%.1f dBFS", 20 * log10(rms))
    }
}
