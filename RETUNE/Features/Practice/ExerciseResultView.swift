import SwiftUI

struct ExerciseResultView: View {
    let result: ExerciseResult?
    let errorMessage: String?
    let retry: () -> Void
    let close: () -> Void

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
}
