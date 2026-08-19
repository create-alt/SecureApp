import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "メールアドレスを入力してください")
  .email("有効なメールアドレスを入力してください")
  .max(254);

export const passwordSchema = z
  .string()
  .min(8, "パスワードは8文字以上で入力してください")
  .max(128, "パスワードは128文字以内で入力してください")
  .regex(/[a-zA-Z]/, "パスワードには英字を1文字以上含めてください")
  .regex(/[0-9]/, "パスワードには数字を1文字以上含めてください");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "名前を入力してください")
  .max(50, "名前は50文字以内で入力してください");

export const signupSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    // 教材に無い追加機能: サインアップ時の確認用パスワード入力(誤入力防止)
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "パスワードを入力してください"),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;
