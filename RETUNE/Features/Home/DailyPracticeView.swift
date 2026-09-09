import SwiftData
import SwiftUI

struct DailyPracticeView: View {
    @Query(sort: \AttemptRecord.timestamp, order: .reverse)
    private var records: [AttemptRecord]

    private var plan: [ExerciseDefinition] {
        BasicPrescription.next(from: Array(records.prefix(20)).map(\.snapshot))
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("今日の3分")
                    .font(.largeTitle.bold())
                    .foregroundStyle(RETuneTheme.textPrimary)

                Text("考えずに、上から3つ進めればOKです。結果に応じて次回の内容が変わります。")
                    .font(.subheadline)
                    .foregroundStyle(RETuneTheme.textSecondary)

                ForEach(Array(plan.enumerated()), id: \.offset) { index, exercise in
                    NavigationLink {
                        ExerciseSessionView(exercise: exercise)
                    } label: {
                        GlassCard {
                            HStack(spacing: 14) {
                                Text("\(index + 1)")
                                    .font(.system(size: 18, weight: .bold, design: .rounded))
                                    .foregroundStyle(Color.black)
                                    .frame(width: 34, height: 34)
                                    .background(Circle().fill(RETuneTheme.accent))

                                VStack(alignment: .leading, spacing: 5) {
                                    Text(stepTitle(index: index))
                                        .font(.caption.bold())
                                        .tracking(1.2)
                                        .foregroundStyle(RETuneTheme.accent)
                                    Text(exerciseTitle(exercise))
                                        .font(.headline)
                                        .foregroundStyle(RETuneTheme.textPrimary)
                                    Text(exerciseDetail(exercise))
                                        .font(.subheadline)
                                        .foregroundStyle(RETuneTheme.textSecondary)
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
            .padding(.horizontal, RETuneTheme.horizontalPadding)
            .padding(.top, 24)
            .padding(.bottom, 32)
        }
        .background(RETuneTheme.background.ignoresSafeArea())
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
    }

    private func stepTitle(index: Int) -> String {
        switch index {
        case 0: return "校正"
        case 1: return "矯正"
        default: return "転移"
        }
    }

    private func exerciseTitle(_ exercise: ExerciseDefinition) -> String {
        switch exercise.type {
        case .sameNoteRecall:
            return "同じ音を思い出す"
        case .intervalImitation:
            return "音程を聴いてまねる"
        case .referenceOnlyInterval:
            return "基準音から次の音を作る"
        }
    }

    private func exerciseDetail(_ exercise: ExerciseDefinition) -> String {
        guard let interval = exercise.interval, let direction = exercise.direction else {
            return NoteMath.noteName(midi: exercise.referenceMidi)
        }
        let directionText = direction == .ascending ? "上へ" : "下へ"
        return "\(NoteMath.noteName(midi: exercise.referenceMidi)) から \(directionText)\(intervalName(interval))"
    }

    private func intervalName(_ interval: MusicalInterval) -> String {
        switch interval {
        case .minorSecond: return "半音"
        case .majorSecond: return "全音"
        case .minorThird: return "短3度"
        case .majorThird: return "長3度"
        case .perfectFourth: return "完全4度"
        case .perfectFifth: return "完全5度"
        }
    }
}
