declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    NOTE_RATE_SALT: string;
    NOTE_OWNER_SALT: string;
    NOTE_ADMIN_TOKEN_HASH: string;
  }
}
