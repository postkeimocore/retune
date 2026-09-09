import SwiftUI

struct PracticeView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("練習")
                        .font(.largeTitle.bold())
                        .foregroundStyle(RETuneTheme.textPrimary)

                    Text("今は、歌より手前の基礎を鍛えます。")
                        .font(.subheadline)
                        .foregroundStyle(RETuneTheme.textSecondary)

                    sectionTitle("単音")

                    practiceLink(
                        title: "同じ音を思い出す",
                        detail: "見本 → 無音 → ねー",
                        symbol: "waveform",
                        exercise: .sameNote(referenceMidi: 60)
                    )

                    sectionTitle("音程間隔")

                    practiceLink(
                        title: "全音を頭で作る",
                        detail: "C4 → 上へ全音。答えは先に鳴りません。",
                        symbol: "arrow.up.right",
                        exercise: .referenceOnlyInterval(
                            referenceMidi: 60,
                            interval: .majorSecond,
                            direction: .ascending
                        )
                    )

                    practiceLink(
                        title: "長3度を頭で作る",
                        detail: "C4 → E4を、基準音だけから作る",
                        symbol: "arrow.up.forward",
                        exercise: .referenceOnlyInterval(
                            referenceMidi: 60,
                            interval: .majorThird,
                            direction: .ascending
                        )
                    )

                    practiceLink(
                        title: "長3度をまねる",
                        detail: "C4 → E4を先に聴いてから再現する",
                        symbol: "ear.and.waveform",
                        exercise: .intervalImitation(
                            referenceMidi: 60,
                            interval: .majorThird,
                            direction: .ascending
                        )
                    )

                    sectionTitle("下降")

                    practiceLink(
                        title: "半音下降",
                        detail: "C4 → B3。近距離下降を確認する",
                        symbol: "arrow.down.right",
                        exercise: .referenceOnlyInterval(
                            referenceMidi: 60,
                            interval: .minorSecond,
                            direction: .descending
                        )
                    )
                }
                .padding(.horizontal, RETuneTheme.horizontalPadding)
                .padding(.top, 24)
                .padding(.bottom, 32)
            }
            .background(RETuneTheme.background.ignoresSafeArea())
            .toolbarBackground(RETuneTheme.background, for: .navigationBar)
        }
    }

    private func sectionTitle(_ title: String) -> some View {
        Text(title)
            .font(.caption.bold())
            .tracking(1.4)
            .foregroundStyle(RETuneTheme.textSecondary)
            .padding(.top, 6)
    }

    private func practiceLink(
        title: String,
        detail: String,
        symbol: String,
        exercise: ExerciseDefinition
    ) -> some View {
        NavigationLink {
            ExerciseSessionView(exercise: exercise)
        } label: {
            GlassCard {
                HStack(spacing: 14) {
                    Image(systemName: symbol)
                        .font(.title2)
                        .foregroundStyle(RETuneTheme.accent)
                        .frame(width: 36)

                    VStack(alignment: .leading, spacing: 6) {
                        Text(title)
                            .font(.headline)
                            .foregroundStyle(RETuneTheme.textPrimary)
                        Text(detail)
                            .font(.subheadline)
                            .foregroundStyle(RETuneTheme.textSecondary)
                            .multilineTextAlignment(.leading)
                    }

                    Spacer(minLength: 4)
                    Image(systemName: "chevron.right")
                        .font(.caption.bold())
                        .foregroundStyle(RETuneTheme.textSecondary)
                }
            }
        }
        .buttonStyle(.plain)
    }
}
