import SwiftUI

struct HomeView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 22) {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("RETUNE")
                            .font(.system(size: 12, weight: .semibold, design: .rounded))
                            .tracking(2.2)
                            .foregroundStyle(RETuneTheme.accent)
                        Text("歌う前の、音程基礎。")
                            .font(.system(size: 30, weight: .bold, design: .rounded))
                            .foregroundStyle(RETuneTheme.textPrimary)
                        Text("聞く → 頭で鳴らす → 声で再現する")
                            .font(.subheadline)
                            .foregroundStyle(RETuneTheme.textSecondary)
                    }

                    NavigationLink {
                        DailyPracticeView()
                    } label: {
                        GlassCard {
                            VStack(alignment: .leading, spacing: 14) {
                                HStack {
                                    Text("今日の3分")
                                        .font(.title2.bold())
                                        .foregroundStyle(RETuneTheme.textPrimary)
                                    Spacer()
                                    Image(systemName: "arrow.right.circle.fill")
                                        .font(.title2)
                                        .foregroundStyle(RETuneTheme.accent)
                                }
                                Text("校正 → 矯正 → 転移")
                                    .font(.subheadline)
                                    .foregroundStyle(RETuneTheme.textSecondary)
                                HStack(spacing: 8) {
                                    ForEach(["同音", "音程", "転移"], id: \.self) { item in
                                        Text(item)
                                            .font(.caption.weight(.semibold))
                                            .foregroundStyle(RETuneTheme.accent)
                                            .padding(.horizontal, 10)
                                            .padding(.vertical, 7)
                                            .background(Capsule().fill(RETuneTheme.accentSoft))
                                    }
                                }
                            }
                        }
                    }
                    .buttonStyle(.plain)

                    GlassCard {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("5分診断")
                                    .font(.headline)
                                    .foregroundStyle(RETuneTheme.textPrimary)
                                Spacer()
                                Text("次の実装")
                                    .font(.caption.bold())
                                    .foregroundStyle(RETuneTheme.textSecondary)
                            }
                            Text("どの段階で音程が崩れるかを切り分けます。")
                                .font(.subheadline)
                                .foregroundStyle(RETuneTheme.textSecondary)
                        }
                    }

                    Spacer(minLength: 24)
                }
                .padding(.horizontal, RETuneTheme.horizontalPadding)
                .padding(.top, 24)
            }
            .background(RETuneTheme.background.ignoresSafeArea())
            .toolbarBackground(RETuneTheme.background, for: .navigationBar)
        }
    }
}
