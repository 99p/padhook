# PadHook

iPhone操作を前提にした、Hookpad風の作曲スケッチアプリです。外部依存はなく、`index.html` をブラウザで開くだけで動きます。

## 実装した主な機能

- ローマ数字ベースのコード入力
- スケール度数ベースのメロディ入力
- コードトーンを強調する安定音ガイド
- 文脈に応じた簡易コード候補
- 4小節コード生成とメロディ補完
- Web Audioによる再生
- ローカル自動保存
- OS設定に追従するダークモードと手動切り替え
- JSONインポート/エクスポート
- Standard MIDIファイル書き出し
- iPhone向けの下部タップパレットと横スクロール譜面

## 調査メモ

Hookpad公式情報を確認し、次の要素をモバイル向けに再設計しました。

- Hookpadは「音楽理論付きの musical sketchpad」と説明され、コード進行、メロディ、歌詞、スコア/リードシート/タブ、MIDI書き出しを扱う。
- 公式ページでは、Hookpadは大きめの画面向けで、タブレット、ラップトップ、デスクトップで試すのがよいと案内されている。
- ユーザーガイドでは、1から7の入力でスケール内の音符やコードを追加し、長さ変更、分割、タイ、転回、非ダイアトニック、複数メロディ、テンポ、拍子、楽器、MIDI書き出しなどを扱う。
- Hookpadはコードに合う安定音をメロディ作成のガイドとして表示する。
- 現行HookpadにはAriaというAI作曲支援があり、周辺のコード/メロディ、キー、テンポ、拍子を文脈として提案を生成する。

参考:

- https://www.hooktheory.com/hookpad
- https://www.hooktheory.com/support/hookpad
- https://www.hooktheory.com/support/keyboard
- https://www.hooktheory.com/hookpad/aria

## 使い方

1. `index.html` をSafariやChromeで開く。
2. 譜面をタップして入力位置を選ぶ。
3. 下部の「コード」「メロディ」「提案」「書き出し」を切り替える。
4. 「再生」でWeb Audio再生する。

この実装はHookpadの独自UI、音源、AI、データベースを複製せず、調査した作曲ワークフローをPadHook用に再構成したプロトタイプです。
