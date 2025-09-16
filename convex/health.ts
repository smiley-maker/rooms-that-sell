import { action } from "./_generated/server";

export const checkEnv = action({
  args: {},
  handler: async () => {
    const required = [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET_OG",
      "R2_BUCKET_STAGED",
      "GEMINI_API_KEY",
    ];
    const missing = required.filter((k) => !process.env[k]);
    return {
      ok: missing.length === 0,
      missing,
    };
  },
});


