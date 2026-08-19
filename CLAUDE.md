# SecureApp — 実装課題2（認証・認可機能付きWebアプリ）

このファイルは、本リポジトリで実装する課題の仕様・設計方針をまとめたものです。
開発に着手する前に、ユーザー（作者）が内容を確認・承認します。

## 課題の出典

- 教材: https://takeshiwada1980.github.io/Eii2-2026/security01b.html
- 教材: https://takeshiwada1980.github.io/Eii2-2026/security02b.html （「9 実装課題2」セクションが本課題の要件）
- 参考ベースリポジトリ（任意）: web-sec-playground-2（今回は**流用せず新規スクラッチ実装**する。理由は下部「web-sec-playground-2をベースにしない理由」を参照）

## 提出情報

- 提出物: GitHubリポジトリ（Public）のURL
- 提出期限: **2026年8月20日（木） 23:00**（以降は確認・評価対象。再提出しても再評価なし）
- 評価対象ブランチ: `main`
- 評価配分: README.md 6点 + 実装 4点 = 10点満点（標準7.6点）
- README.md には**最低5枚の画像**または**1本以上の動画**を含めること
- 評価はREADME.mdを読んでから関連ソースコードを確認する方式 → **実装した工夫点は必ずREADME.mdに書く**
- アプリを起動させて評価する予定はない（＝環境変数の共有は不要）。ただし `.env.example` は用意する
- ガチガチにセキュアな設計にすること（パスワードはbcryptでハッシュ化、Cookieは適切な属性設定、CSPも適切に設定）

## 実装する認証方式

**セッションベース認証**を採用する（DBにセッションを保存し、`httpOnly` + `secure` + `sameSite` 属性付きCookieでセッションIDを配布する方式）。

理由:
- 「現在アクティブなセッションの一覧表示と個別ログアウト」「Remember me」など、教材に無い追加機能をセッションベースの仕組みと自然に組み合わせて実装できる
- トークン（JWT）をlocalStorageに保存する方式に比べ、XSS耐性の面でセキュアな設計を主張しやすい
- 課題は「いずれかを用いた認証・認可機能」を要求しており、両方を実装する必要はない

## 教材に無い追加機能（2つ以上の要件 → 4つ実装する）

1. **ログイン試行のレート制限／アカウントロックアウト**
   同一メールアドレス（＋IPアドレス）への短時間の連続ログイン失敗を検知し、一定回数を超えたら一時的にログインを拒否する。ブルートフォース対策。
2. **現在アクティブなセッションの一覧表示 と 個別ログアウト機能**
   マイページから、自分がログイン中の全セッション（デバイス/UA・IPアドレス・最終アクティブ日時）を確認し、任意のセッションだけを強制ログアウトできる。
3. **サインアップ時のパスワード強度表示**
   パスワード入力欄にリアルタイムでスコア・強度バーを表示する（長さ・文字種の組み合わせを評価）。
4. **ログイン履歴の表示**
   マイページから過去のログイン試行履歴（成功/失敗、日時、IPアドレス、UA）を確認できる。

→ 1・2・4は「セッションのセキュリティ監査」というテーマで一貫させ、README上でもストーリーとして説明する。

## 認可（Authorization）の実装

- `/mypage`, `/mypage/sessions`, `/mypage/history` などはログイン必須ページとし、未ログイン時はミドルウェアで `/login` にリダイレクト
- セッション検証はDBに保存された有効なセッションレコードの存在確認（期限切れ・失効済みは無効）で行う
- 他人のセッションを操作できないよう、セッション個別ログアウトAPIは「操作対象セッションのuserId === ログイン中userId」を必ずチェックする

## セキュリティ要件チェックリスト

- [x] パスワードは `bcryptjs`（純JS実装。ネイティブ`bcrypt`はWindows評価環境でのビルド依存を避けるため不採用。ハッシュ形式は`$2a$`/`$2b$`互換）でハッシュ化して保存。コストファクターは10以上
- [x] セッションCookieは `httpOnly`, `secure`（本番/HTTPS時）, `sameSite=lax`, `path=/` を設定
- [x] セッションIDは十分なエントロピーを持つランダム値（`crypto.randomBytes`）を使用し、DBには生のIDではなくハッシュ化して保存（漏洩時の悪用防止）
- [x] CSPを `next.config` もしくは `middleware.ts` のレスポンスヘッダーで設定（`default-src 'self'` を基本に、必要な最小限のみ許可）
- [x] 全ての認証系入力は Zod でバリデーション
- [x] ログイン失敗時のエラーメッセージはメール存在有無を推測させない文言に統一
- [x] パスワード再設定・変更等の機微操作は再認証 or 現在のセッション確認を要求
- [x] レート制限によりブルートフォースを緩和

## 技術スタック

- Next.js（App Router） + TypeScript
- Prisma + SQLite（`prisma/dev.db`、環境構築を評価者に強いない）
- bcryptjs（パスワードハッシュ）
- Zod（入力検証）
- Tailwind CSS（UI）
- 自前のセッション管理（NextAuth等の認証ライブラリは使わず、教材同様スクラッチで実装し、認証の仕組み自体を理解していることを示す）

## ディレクトリ構成（予定）

```
src/
  app/
    (auth)/
      login/page.tsx
      signup/page.tsx
    mypage/
      page.tsx              # プロフィール・ログイン中セッション概要
      sessions/page.tsx     # アクティブセッション一覧・個別ログアウト
      history/page.tsx      # ログイン履歴
    api/
      auth/
        login/route.ts
        logout/route.ts
        signup/route.ts
        check-email/route.ts   # サインアップ時のメール重複チェック(将来拡張の余地。今回は必須4機能に含めない場合は削除)
      sessions/
        route.ts                # 一覧取得
        [id]/route.ts            # 個別ログアウト(DELETE)
    middleware.ts (もしくはルート直下 middleware.ts) # 認可チェック + CSPヘッダー付与
  lib/
    prisma.ts
    session.ts       # セッション生成/検証/失効
    password.ts       # bcryptラッパー、強度スコアリング
    rateLimit.ts       # ログイン試行のレート制限
    validation.ts      # Zodスキーマ
  components/
    ...
prisma/
  schema.prisma
```

## データモデル（Prisma、予定）

- `User`: id, email(unique), passwordHash, name, createdAt
- `Session`: id, userId, hashedSessionId(unique), userAgent, ipAddress, createdAt, lastActiveAt, expiresAt, revokedAt
- `LoginAttempt`: id, email, ipAddress, success(boolean), userAgent, createdAt （レート制限とログイン履歴の両方に使う）

## web-sec-playground-2をベースにしない理由

課題要件では「web-sec-playground-2をベースに開発する場合、使用しない認証方式のコードやニュース・ショップ機能を全て削除しないと減点」とされている。今回は該当機能（ニュース/ショップ、JWT方式）を一切含まない**新規スクラッチ実装**とすることで、この減点リスクを構造的に回避する。教材で示されているセキュリティのベストプラクティス（bcrypt, Cookie属性, CSP, Zod, Prismaなど）は踏襲する。

## 進め方

1. このCLAUDE.mdをユーザーが確認・承認する
2. Next.jsプロジェクトの初期化（TypeScript, Tailwind, App Router）
3. Prismaスキーマ作成・マイグレーション
4. 認証コア機能（signup/login/logout, セッション管理, ミドルウェア認可, CSP）
5. 追加機能4つの実装（レート制限、セッション一覧/個別ログアウト、パスワード強度表示、ログイン履歴）
6. UI調整（パスワード表示/非表示切替なども含め細部を整える）
7. 動作確認（ブラウザで一通りのフローをテスト、スクリーンショット取得）
8. README.md執筆（スクリーンショット5枚以上、実装内容・工夫点を詳細に記載）
