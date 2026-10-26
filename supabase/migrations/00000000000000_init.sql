

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'Reverting the email verification trigger from migration 20240320000001_add_email_verification_trigger.sql';



CREATE EXTENSION IF NOT EXISTS "plv8" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."add_free_subscription"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."add_free_subscription"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_email_event_limit"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  is_plus BOOLEAN;
  event_count INTEGER;
BEGIN
  -- Check if user is on plus plan
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = p_user_id 
    AND plan_type = 'plus' 
    AND is_active = true
  ) INTO is_plus;
  
  -- Plus users have unlimited email events
  IF is_plus THEN
    RETURN true;
  END IF;
  
  -- Count email events in the last 30 days for free users
  SELECT COUNT(*) INTO event_count
  FROM public.email_event_usage
  WHERE user_id = p_user_id
  AND created_at > NOW() - INTERVAL '30 days';
  
  -- Free users are limited to 10 email events per 30 days
  RETURN event_count < 10;
END;
$$;


ALTER FUNCTION "public"."check_email_event_limit"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_processed_emails"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Delete emails older than 90 days
  DELETE FROM public.processed_emails
  WHERE processed_at < NOW() - INTERVAL '90 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_processed_emails"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_verification_attempts"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Delete attempts older than 30 days
  DELETE FROM public.email_verification_attempts
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;


ALTER FUNCTION "public"."cleanup_old_verification_attempts"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cuid"() RETURNS "text"
    LANGUAGE "plv8" STRICT
    AS $$
const { base, blockSize, safeCounter, fingerprint, randomBlock, pad } = plv8.global;

const letter = 'c';
const timestamp = (new Date().getTime()).toString(base);
const counter = pad(safeCounter().toString(base), blockSize);
const print = fingerprint();
const random = randomBlock() + randomBlock();

return letter + timestamp + counter + print + random;
$$;


ALTER FUNCTION "public"."cuid"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_user_data"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Delete from user-related tables
  DELETE FROM conversations WHERE user_id = OLD.id;
  DELETE FROM user_calendars WHERE user_id = OLD.id;
  DELETE FROM user_emails WHERE user_id = OLD.id;
  DELETE FROM user_sessions WHERE user_id = OLD.id;
  
  -- Return the old record to complete the trigger function
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."delete_user_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_single_primary_email"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If the new/updated record is being set as primary
  IF NEW.is_primary THEN
    -- Update any existing primary emails for this user to not be primary
    UPDATE public.user_emails
    SET is_primary = false
    WHERE user_id = NEW.user_id AND id != NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."ensure_single_primary_email"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_plus_user"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  is_plus BOOLEAN;
BEGIN
  -- Check if user is on plus plan
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions 
    WHERE user_id = p_user_id 
    AND plan_type = 'plus' 
    AND is_active = true
  ) INTO is_plus;
  
  RETURN is_plus;
END;
$$;


ALTER FUNCTION "public"."is_plus_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_pro_user"("p_user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  -- Redirect to the new function
  RETURN is_plus_user(p_user_id);
END;
$$;


ALTER FUNCTION "public"."is_pro_user"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."plv8_init"() RETURNS "void"
    LANGUAGE "plv8" STRICT
    AS $_$
const blockSize = 4;
const base = 36;
const discreteValues = Math.pow(base, blockSize);
let c = 0;

function pad(num, size) {
  const s = '000000000' + num;
  return s.substring(s.length - size);
}

function fingerprint() {
  const padding = 2;
  const pid = plv8.execute(`select pg_backend_pid() as pid`)[0].pid;
  const pidWithPadding = pad(pid.toString(36, padding));
  const hostname = plv8.execute(`select inet_server_addr() as hostname`)[0].hostname;
  const length = hostname.length;
  const hostId =
    pad(
      hostname
        .split('')
        .reduce((prev, char) => +prev + char.charCodeAt(0), +length + 36)
        .toString(36)
    , padding);
  return pid + hostId;
}

function getRandomValue() {
  const lim = Math.pow(2, 32) - 1;
  const len = 4;
  // Remove schema qualification, keep integer cast
  const num = plv8.execute(`select ('x' || right(gen_random_bytes($1::integer)::text, 8))::bit(32)::int as num`, [len])[0].num;
  return Math.abs(num / lim);
}

function randomBlock() {
  return pad((getRandomValue() * discreteValues << 0).toString(base), blockSize);
}

function safeCounter() {
  c = c < discreteValues ? c : 0;
  c++;
  return c - 1;
}

// Re-assign the global object with the corrected functions
plv8.global = {
  c,
  blockSize,
  base,
  discreteValues,
  pad,
  fingerprint,
  getRandomValue,
  randomBlock,
  safeCounter
};
$_$;


ALTER FUNCTION "public"."plv8_init"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_single_selected_calendar"("p_user_id" "uuid", "p_calendar_id" "text", "p_provider" "text") RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Deselect all calendars for the user and provider
  UPDATE public.user_calendars
  SET selected = false, updated_at = now()
  WHERE user_id = p_user_id AND provider = p_provider;

  -- Select the specified calendar
  UPDATE public.user_calendars
  SET selected = true, updated_at = now()
  WHERE user_id = p_user_id AND id = p_calendar_id AND provider = p_provider;
END;
$$;


ALTER FUNCTION "public"."update_single_selected_calendar"("p_user_id" "uuid", "p_calendar_id" "text", "p_provider" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "text" DEFAULT "public"."cuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'New Conversation'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "messages" "jsonb"
);

ALTER TABLE ONLY "public"."conversations" REPLICA IDENTITY FULL;


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."email_event_usage" (
    "id" "text" DEFAULT "public"."cuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email_id" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."email_event_usage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."processed_emails" (
    "message_id" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subject" "text",
    "sender" "text" NOT NULL,
    "processed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."processed_emails" OWNER TO "postgres";


COMMENT ON TABLE "public"."processed_emails" IS 'Tracks processed emails to prevent duplicate processing';



CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "text" DEFAULT "public"."cuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "plan_type" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "lemon_squeezy_customer_id" "text",
    "lemon_squeezy_subscription_id" "text",
    "lemon_squeezy_order_id" "text",
    "subscription_start_date" timestamp with time zone,
    "subscription_end_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "customer_portal_url" "text",
    "product_id" "text",
    "variant_id" "text",
    CONSTRAINT "subscriptions_plan_type_check" CHECK (("plan_type" = ANY (ARRAY['free'::"text", 'plus'::"text"])))
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_calendars" (
    "id" "text" DEFAULT "public"."cuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "name" "text" NOT NULL,
    "selected" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "user_calendars_provider_check" CHECK (("provider" = ANY (ARRAY['google'::"text", 'outlook'::"text"])))
);


ALTER TABLE "public"."user_calendars" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_emails" (
    "id" "text" DEFAULT "public"."cuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "default_calendar" "text",
    "is_verified" boolean DEFAULT false,
    "is_primary" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_emails" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "text" DEFAULT "public"."cuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "provider" "text" NOT NULL,
    "provider_token" "text",
    "provider_refresh_token" "text",
    "expires_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "name" "text",
    "timezone" "text" DEFAULT 'America/Los_Angeles'::"text",
    "custom_instructions" "text",
    "onboarding_completed" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."email_event_usage"
    ADD CONSTRAINT "email_event_usage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."processed_emails"
    ADD CONSTRAINT "processed_emails_pkey" PRIMARY KEY ("message_id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_emails"
    ADD CONSTRAINT "unique_email" UNIQUE ("email");



COMMENT ON CONSTRAINT "unique_email" ON "public"."user_emails" IS 'Ensures email addresses are globally unique across all users';



ALTER TABLE ONLY "public"."user_emails"
    ADD CONSTRAINT "unique_user_email" UNIQUE ("user_id", "email");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "unique_user_subscription" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_calendars"
    ADD CONSTRAINT "user_calendars_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_emails"
    ADD CONSTRAINT "user_emails_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_conversations_updated_at" ON "public"."conversations" USING "btree" ("updated_at");



CREATE INDEX "idx_conversations_user_id" ON "public"."conversations" USING "btree" ("user_id");



CREATE INDEX "idx_user_calendars_user_id" ON "public"."user_calendars" USING "btree" ("user_id");



CREATE INDEX "idx_user_emails_user_id" ON "public"."user_emails" USING "btree" ("user_id");



CREATE INDEX "idx_user_sessions_user_id" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "add_free_subscription_trigger" AFTER INSERT ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."add_free_subscription"();



CREATE OR REPLACE TRIGGER "ensure_single_primary_email_trigger" BEFORE INSERT OR UPDATE ON "public"."user_emails" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_single_primary_email"();



CREATE OR REPLACE TRIGGER "on_user_delete" BEFORE DELETE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."delete_user_data"();



CREATE OR REPLACE TRIGGER "update_conversations_updated_at" BEFORE UPDATE ON "public"."conversations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_subscriptions_updated_at" BEFORE UPDATE ON "public"."subscriptions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_calendars_updated_at" BEFORE UPDATE ON "public"."user_calendars" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_emails_updated_at" BEFORE UPDATE ON "public"."user_emails" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_sessions_updated_at" BEFORE UPDATE ON "public"."user_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_users_updated_at" BEFORE UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_event_usage"
    ADD CONSTRAINT "email_event_usage_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "public"."processed_emails"("message_id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."email_event_usage"
    ADD CONSTRAINT "email_event_usage_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."processed_emails"
    ADD CONSTRAINT "processed_emails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_calendars"
    ADD CONSTRAINT "user_calendars_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_emails"
    ADD CONSTRAINT "user_emails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Service role can insert processed emails" ON "public"."processed_emails" FOR INSERT WITH CHECK ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage email event usage" ON "public"."email_event_usage" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can manage subscriptions" ON "public"."subscriptions" USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Service role can select processed emails" ON "public"."processed_emails" FOR SELECT USING ((("auth"."jwt"() ->> 'role'::"text") = 'service_role'::"text"));



CREATE POLICY "Users can delete their own calendars" ON "public"."user_calendars" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own conversations" ON "public"."conversations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own emails" ON "public"."user_emails" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own sessions" ON "public"."user_sessions" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own calendars" ON "public"."user_calendars" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own conversations" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own emails" ON "public"."user_emails" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own sessions" ON "public"."user_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own user data" ON "public"."users" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update their own calendars" ON "public"."user_calendars" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own conversations" ON "public"."conversations" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own emails" ON "public"."user_emails" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own sessions" ON "public"."user_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own user data" ON "public"."users" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view their own calendars" ON "public"."user_calendars" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own conversations" ON "public"."conversations" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own email event usage" ON "public"."email_event_usage" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own emails" ON "public"."user_emails" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own sessions" ON "public"."user_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own user data" ON "public"."users" FOR SELECT USING (("auth"."uid"() = "id"));



ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_policy" ON "public"."conversations" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."email_event_usage" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."processed_emails" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_calendars" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_calendars_policy" ON "public"."user_calendars" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_emails" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_emails_policy" ON "public"."user_emails" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_sessions_policy" ON "public"."user_sessions" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_policy" ON "public"."users" USING (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversations";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";




















































































































































































GRANT ALL ON FUNCTION "public"."add_free_subscription"() TO "anon";
GRANT ALL ON FUNCTION "public"."add_free_subscription"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_free_subscription"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_email_event_limit"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_email_event_limit"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_email_event_limit"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_processed_emails"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_processed_emails"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_processed_emails"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_old_verification_attempts"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_old_verification_attempts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_old_verification_attempts"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cuid"() TO "anon";
GRANT ALL ON FUNCTION "public"."cuid"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cuid"() TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_user_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."delete_user_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_user_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_single_primary_email"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_single_primary_email"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_single_primary_email"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_plus_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_plus_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_plus_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_pro_user"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_pro_user"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_pro_user"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."plv8_init"() TO "anon";
GRANT ALL ON FUNCTION "public"."plv8_init"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."plv8_init"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_single_selected_calendar"("p_user_id" "uuid", "p_calendar_id" "text", "p_provider" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_single_selected_calendar"("p_user_id" "uuid", "p_calendar_id" "text", "p_provider" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_single_selected_calendar"("p_user_id" "uuid", "p_calendar_id" "text", "p_provider" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."email_event_usage" TO "anon";
GRANT ALL ON TABLE "public"."email_event_usage" TO "authenticated";
GRANT ALL ON TABLE "public"."email_event_usage" TO "service_role";



GRANT ALL ON TABLE "public"."processed_emails" TO "anon";
GRANT ALL ON TABLE "public"."processed_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."processed_emails" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."user_calendars" TO "anon";
GRANT ALL ON TABLE "public"."user_calendars" TO "authenticated";
GRANT ALL ON TABLE "public"."user_calendars" TO "service_role";



GRANT ALL ON TABLE "public"."user_emails" TO "anon";
GRANT ALL ON TABLE "public"."user_emails" TO "authenticated";
GRANT ALL ON TABLE "public"."user_emails" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
