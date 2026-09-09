import SwiftUI

struct ExerciseSessionView: View {
    let exercise: ExerciseDefinition

    @Environment(\.dismiss) private var dismiss
    @StateObject private var controller = ExerciseSessionController()

    var body: some View {
        ZStack {
            RETuneTheme.background.ignoresSafeArea()

            VStack(spacing: 24) {
                header
                Spacer(minLength: 8)
                phaseContent
                Spacer(minLength: 8)
            }
            .padding(.horizontal, RETuneTheme.horizontalPadding)
            .padding(.vertical, 20)
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .tabBar)
        .onDisappear {
            controller.cancel()
        }
    }

    private var header: some View {
        VStack(spacing: 8) {
            Text(exerciseTitle)
                .font(.headline)
                .foregroundStyle(RETuneTheme.textPrimary)
            Text(targetSummary)
                .font(.caption.monospaced())
                .foregroundStyle(RETuneTheme.textSecondary)
        }
        .frame(maxWidth: .infinity)
    }

    @ViewBuilder
    private var phaseContent: some View {
        switch controller.phase {
        case .prepare:
            VStack(spacing: 20) {
                phaseBadge("READY")
                Text(prepareMessage)
                    .font(.title2.bold())
                    .foregroundStyle(RETuneTheme.textPrimary)
                    .multilineTextAlignment(.center)
                Text("参考音が止まってから『ねー』で歌います")
                    .font(.subheadline)
                    .foregroundStyle(RETuneTheme.textSecondary)
                    .multilineTextAlignment(.center)
                PrimaryButton(title: "開始") {
                    controller.start(exercise)
                }
            }

        case .referencePlaying:
            simplePhase(
                badge: "LISTEN",
                title: "聴く",
                symbol: "waveform",
                detail: referenceMessage
            )

        case .recallSilence:
            simplePhase(
                badge: "RECALL",
                title: "頭の中で鳴らす",
                symbol: "ear.and.waveform",
                detail: recallMessage
            )

        case .recording:
            VStack(spacing: 20) {
                phaseBadge("SING")
                ZStack {
                    Circle()
                        .fill(RETuneTheme.accentSoft)
                        .frame(width: 160, height: 160)
                    Circle()
                        .stroke(RETuneTheme.accent.opacity(0.65), lineWidth: 1)
                        .frame(width: 130, height: 130)
                    Text("ねー")
                        .font(.system(size: 44, weight: .bold, design: .rounded))
                        .foregroundStyle(RETuneTheme.textPrimary)
                }
                Text("画面を見て音程を探さず、頭の中の音をそのまま出す")
                    .font(.subheadline)
                    .foregroundStyle(RETuneTheme.textSecondary)
                    .multilineTextAlignment(.center)
            }

        case .evaluating:
            VStack(spacing: 18) {
                phaseBadge("CHECK")
                ProgressView()
                    .tint(RETuneTheme.accent)
                    .scaleEffect(1.25)
                Text("判定中")
                    .font(.headline)
                    .foregroundStyle(RETuneTheme.textPrimary)
            }

        case .result:
            ExerciseResultView(
                result: controller.result,
                errorMessage: controller.errorMessage,
                retry: { controller.retry() },
                close: { dismiss() }
            )
        }
    }

    private func simplePhase(
        badge: String,
        title: String,
        symbol: String,
        detail: String
    ) -> some View {
        VStack(spacing: 20) {
            phaseBadge(badge)
            Image(systemName: symbol)
                .font(.system(size: 58, weight: .light))
                .foregroundStyle(RETuneTheme.accent)
                .shadow(color: RETuneTheme.accent.opacity(0.25), radius: 18)
            Text(title)
                .font(.system(size: 30, weight: .bold, design: .rounded))
                .foregroundStyle(RETuneTheme.textPrimary)
            Text(detail)
                .font(.subheadline)
                .foregroundStyle(RETuneTheme.textSecondary)
                .multilineTextAlignment(.center)
        }
    }

    private func phaseBadge(_ text: String) -> some View {
        Text(text)
            .font(.caption2.bold())
            .tracking(2)
            .foregroundStyle(RETuneTheme.accent)
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(Capsule().fill(RETuneTheme.accentSoft))
    }

    private var exerciseTitle: String {
        switch exercise.type {
        case .sameNoteRecall:
            return "同音再現"
        case .intervalImitation:
            return "音程をまねる"
        case .referenceOnlyInterval:
            return "音程を頭で作る"
        }
    }

    private var targetSummary: String {
        if let interval = exercise.interval, let direction = exercise.direction {
            return "\(NoteMath.noteName(midi: exercise.referenceMidi))  →  \(directionText(direction))\(intervalText(interval))"
        }
        return NoteMath.noteName(midi: exercise.referenceMidi)
    }

    private var prepareMessage: String {
        exercise.type == .referenceOnlyInterval
            ? "基準音だけを聴いて、次の音を作ります"
            : "見本を覚えて、その音を再現します"
    }

    private var referenceMessage: String {
        exercise.type == .referenceOnlyInterval
            ? "この基準音だけを覚える"
            : "音の高さをそのまま覚える"
    }

    private var recallMessage: String {
        if let interval = exercise.interval, let direction = exercise.direction {
            return "基準音から\(directionText(direction))\(intervalText(interval))を、声を出さずに先に鳴らす"
        }
        return "さっきの音を、声を出す前に頭の中で再生する"
    }

    private func intervalText(_ interval: MusicalInterval) -> String {
        switch interval {
        case .minorSecond: return "半音"
        case .majorSecond: return "全音"
        case .minorThird: return "短3度"
        case .majorThird: return "長3度"
        case .perfectFourth: return "完全4度"
        case .perfectFifth: return "完全5度"
        }
    }

    private func directionText(_ direction: IntervalDirection) -> String {
        direction == .ascending ? "上へ" : "下へ"
    }
}
