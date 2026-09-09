import SwiftUI

struct PracticeView: View {
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("練習")
                    .font(.largeTitle.bold())
                    .foregroundStyle(RETuneTheme.textPrimary)

                Text("今は、歌より手前の基礎を鍛えます。")
                    .font(.subheadline)
                    .foregroundStyle(RETuneTheme.textSecondary)

                GlassCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("単音", systemImage: "waveform")
                            .font(.headline)
                            .foregroundStyle(RETuneTheme.textPrimary)
                        Text("聞いた音を、見本が消えた後に再現する")
                            .font(.subheadline)
                            .foregroundStyle(RETuneTheme.textSecondary)
                    }
                }

                GlassCard {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("音程間隔", systemImage: "arrow.up.right")
                            .font(.headline)
                            .foregroundStyle(RETuneTheme.textPrimary)
                        Text("基準音から、次の音を頭の中で作る")
                            .font(.subheadline)
                            .foregroundStyle(RETuneTheme.textSecondary)
                    }
                }
            }
            .padding(.horizontal, RETuneTheme.horizontalPadding)
            .padding(.top, 24)
        }
        .background(RETuneTheme.background.ignoresSafeArea())
    }
}
