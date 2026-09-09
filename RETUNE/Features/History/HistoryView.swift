import SwiftData
import SwiftUI

struct HistoryView: View {
    @Query(sort: \AttemptRecord.timestamp, order: .reverse)
    private var records: [AttemptRecord]

    var body: some View {
        NavigationStack {
            Group {
                if records.isEmpty {
                    emptyState
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(records) { record in
                                historyCard(record)
                            }
                        }
                        .padding(.horizontal, RETuneTheme.horizontalPadding)
                        .padding(.vertical, 20)
                    }
                }
            }
            .background(RETuneTheme.background.ignoresSafeArea())
            .navigationTitle("履歴")
            .toolbarBackground(RETuneTheme.background, for: .navigationBar)
        }
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "chart.xyaxis.line")
                .font(.system(size: 44, weight: .light))
                .foregroundStyle(RETuneTheme.accent)
            Text("まだ練習結果がありません")
                .font(.headline)
                .foregroundStyle(RETuneTheme.textPrimary)
            Text("最初の練習が終わると、音程のズレ方がここに残ります。")
                .font(.subheadline)
                .foregroundStyle(RETuneTheme.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(RETuneTheme.horizontalPadding)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private func historyCard(_ record: AttemptRecord) -> some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .firstTextBaseline) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(title(for: record))
                            .font(.headline)
                            .foregroundStyle(RETuneTheme.textPrimary)
                        Text(record.timestamp, format: .dateTime.month().day().hour().minute())
                            .font(.caption)
                            .foregroundStyle(RETuneTheme.textSecondary)
                    }
                    Spacer()
                    Text(primaryValue(for: record))
                        .font(.system(.title3, design: .monospaced).weight(.bold))
                        .foregroundStyle(RETuneTheme.accent)
                }

                HStack(spacing: 16) {
                    compactMetric("着地", record.directLanding ? "○" : "△")
                    compactMetric("中央値", String(format: "%+.0f¢", record.medianErrorCents))
                    compactMetric("安定", String(format: "%.0f%%", record.stability * 100))
                }
            }
        }
    }

    private func compactMetric(_ title: String, _ value: String) -> some View {
        VStack(alignment: .leading, spacing: 3) {
            Text(title)
                .font(.caption2)
                .foregroundStyle(RETuneTheme.textSecondary)
            Text(value)
                .font(.caption.monospaced().weight(.semibold))
                .foregroundStyle(RETuneTheme.textPrimary)
        }
    }

    private func title(for record: AttemptRecord) -> String {
        let root = NoteMath.noteName(midi: record.referenceMidi)
        guard let semitones = record.intervalSemitones,
              let directionRaw = record.directionRaw,
              let direction = IntervalDirection(rawValue: directionRaw),
              let interval = MusicalInterval(rawValue: semitones) else {
            return "同音再現 · \(root)"
        }
        let directionText = direction == .ascending ? "↑" : "↓"
        return "\(intervalName(interval))\(directionText) · \(root)"
    }

    private func primaryValue(for record: AttemptRecord) -> String {
        if let error = record.intervalErrorCents {
            return String(format: "%+.0f¢", error)
        }
        return String(format: "%+.0f¢", record.medianErrorCents)
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
