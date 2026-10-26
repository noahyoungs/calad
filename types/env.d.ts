declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_URL: string;
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    GCP_PROJECT_ID: string;
    VERTEX_LOCATION: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    GCS_BUCKET_NAME: string;
    APP_SECRET: string;
    OPENAI_API_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    MAILGUN_API_KEY: string;
    MAILGUN_DOMAIN: string;
    MAILGUN_EMAIL: string;
    MAILGUN_WEBHOOK_SIGNING_KEY: string;
    GCP_CLIENT_EMAIL: string;
    GCP_PRIVATE_KEY: string;
    CLOUDFLARE_GATEWAY: string;
    CLOUDFLARE_GATEWAY_ID?: string | undefined;
    CLOUDFLARE_ACCOUNT_ID?: string | undefined;
    TURNSTILE_SECRET_KEY: string;
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: string;
    LEMON_SQUEEZY_SIGNING_SECRET: string;
    LEMON_SQUEEZY_PRODUCT_ID: string;
    LEMON_SQUEEZY_VARIANT_ID: string;
    LEMON_SQUEEZY_STORE_ID: string;
    LEMON_SQUEEZY_API_KEY: string;
    NEXT_PUBLIC_LS_PLUS_BUY_LINK: string;
    NEXT_PUBLIC_LS_CUSTOMER_PORTAL_LINK: string;
    KV_URL: string;
    KV_REST_API_READ_ONLY_TOKEN: string;
    REDIS_URL: string;
    KV_REST_API_TOKEN: string;
    KV_REST_API_URL: string;
  }
} 