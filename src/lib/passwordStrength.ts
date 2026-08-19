export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: "とても弱い" | "弱い" | "普通" | "強い" | "とても強い";
};

/**
 * パスワード強度の簡易スコアリング(クライアント/サーバー両方から使う純粋関数)。
 * 長さと文字種の多様性のみを見る単純なヒューリスティックで、
 * zxcvbn等の辞書照合は行わない(サインアップ時のUIフィードバック用)。
 */
export function scorePasswordStrength(password: string): PasswordStrength {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const clamped = Math.min(4, Math.max(0, score - 1)) as 0 | 1 | 2 | 3 | 4;
  const labels: PasswordStrength["label"][] = [
    "とても弱い",
    "弱い",
    "普通",
    "強い",
    "とても強い",
  ];

  return { score: clamped, label: labels[clamped] };
}
