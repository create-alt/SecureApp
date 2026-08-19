"use client";

import { useId, useState } from "react";
import { scorePasswordStrength } from "@/lib/passwordStrength";

type PasswordFieldProps = {
  name: string;
  label: string;
  autoComplete?: string;
  showStrengthMeter?: boolean;
  error?: string[];
};

const BAR_COLORS = [
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-lime-500",
  "bg-green-500",
];

/**
 * 教材に無い追加機能:
 * - パスワードの表示・非表示切り替え
 * - (showStrengthMeter有効時)サインアップ時のパスワード強度表示
 */
export function PasswordField({
  name,
  label,
  autoComplete,
  showStrengthMeter = false,
  error,
}: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const strength = showStrengthMeter ? scorePasswordStrength(value) : null;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="block w-full rounded-md border border-zinc-300 px-3 py-2 pr-16 text-sm focus:border-zinc-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-zinc-500 hover:text-zinc-800"
          aria-label={visible ? "パスワードを非表示にする" : "パスワードを表示する"}
        >
          {visible ? "隠す" : "表示"}
        </button>
      </div>

      {showStrengthMeter && value.length > 0 && strength && (
        <div className="mt-2">
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${
                  i <= strength.score ? BAR_COLORS[strength.score] : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-zinc-500">強度: {strength.label}</p>
        </div>
      )}

      {error && (
        <ul className="mt-1 space-y-0.5">
          {error.map((message) => (
            <li key={message} className="text-xs text-red-600">
              {message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
