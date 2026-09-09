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

            SettingsView()
                .tabItem { Label("設定", systemImage: "gearshape.fill") }
        }
        .tint(RETuneTheme.accent)
        .preferredColorScheme(.dark)
    }
}
