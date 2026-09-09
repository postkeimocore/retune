# RETUNE

歌の音程基礎を鍛えるiOSアプリ。

RETUNE v0.4は、単に歌った音をチューナーで測るのではなく、次の流れを練習する。

> 聴く → 頭の中で鳴らす → 声で再現する → 音程間隔へ転移する

## 現在のαでできること

- 同音再現 / 遅延再現
- 全音・半音・長3度の音程練習
- 見本を先に聴く課題と、基準音だけから目的音を作る課題の比較
- Initial Error / Median Error / Stability / Drift / Direct Landing
- Interval Error（音程幅を何cent広く・狭く取ったか）
- 練習結果の端末内保存
- 最小版「今日の3分」自動処方

## 必要環境

- macOS
- Xcode 16+
- iPhone（iOS 17+）
- XcodeGen

## 初回セットアップ

```bash
brew install xcodegen
git clone https://github.com/postkeimocore/retune.git
cd retune
git switch feat/retune-v0.4-ios-alpha-core
xcodegen generate
open RETUNE.xcodeproj
```

Xcodeで以下を行う。

1. `RETUNE` targetを選ぶ
2. Signing & Capabilitiesで自分のApple Account / Teamを選ぶ
3. USBまたは同一ネットワークで自分のiPhoneを選ぶ
4. Runする
5. 初回起動時にマイク利用を許可する

App Storeへの公開は不要。開発中はXcodeから自分のiPhoneへ直接インストールする。

## テスト

```bash
xcodegen generate
xcodebuild test \
  -project RETUNE.xcodeproj \
  -scheme RETUNE \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=latest' \
  CODE_SIGNING_ALLOWED=NO
```

GitHub Actionsでも同じiOSテストを実行する。

## 現行設計

- `docs/superpowers/specs/2026-09-09-retune-v0.4-ios-design.md`
- `docs/superpowers/plans/2026-09-10-retune-v0.4-ios-alpha-core.md`

旧PWA仕様は履歴として残しているが、新規実装の基準はv0.4 iOS仕様。
