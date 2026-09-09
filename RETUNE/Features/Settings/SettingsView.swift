import SwiftUI

struct SettingsView: View {
    @AppStorage("developerModeEnabled") private var developerModeEnabled = false

    var body: some View {
        NavigationStack {
            List {
                Section("表示") {
                    Toggle("開発・検証モード", isOn: $developerModeEnabled)
                    Text("結果画面に検出Hz、confidence、RMS、採用フレーム数などの内部値を表示します。通常練習ではOFF推奨です。")
                        .font(.footnote)
                        .foregroundStyle(RETuneTheme.textSecondary)
                }

                Section("基準") {
                    HStack {
                        Text("基準ピッチ")
                        Spacer()
                        Text("A4 = 440 Hz")
                            .foregroundStyle(RETuneTheme.textSecondary)
                    }
                }
            }
            .scrollContentBackground(.hidden)
            .background(RETuneTheme.background)
            .navigationTitle("設定")
        }
    }
}
