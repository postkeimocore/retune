import SwiftUI

struct AppShellView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("ホーム", systemImage: "house.fill") }

            PracticeView()
                .tabItem { Label("練習", systemImage: "waveform.path.ecg") }

            HistoryView()
                .tabItem { Label("履歴", systemImage: "chart.xyaxis.line") }

            PlaceholderTabView(title: "設定", message: "マイク・音域・表示設定をここにまとめます。")
                .tabItem { Label("設定", systemImage: "gearshape.fill") }
        }
        .tint(RETuneTheme.accent)
        .preferredColorScheme(.dark)
    }
}

private struct PlaceholderTabView: View {
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 10) {
            Text(title)
                .font(.largeTitle.bold())
                .foregroundStyle(RETuneTheme.textPrimary)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(RETuneTheme.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(RETuneTheme.horizontalPadding)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(RETuneTheme.background.ignoresSafeArea())
    }
}
