CREATE TYPE "public"."notification_channel" AS ENUM('email', 'browser', 'push', 'whatsapp', 'sms');--> statement-breakpoint
CREATE TYPE "public"."payable_category" AS ENUM('emi', 'credit_card_bill', 'borrowed_amount', 'friend_loan', 'electricity_bill', 'internet_bill', 'water_bill', 'insurance', 'rent', 'miscellaneous');--> statement-breakpoint
CREATE TYPE "public"."payable_source" AS ENUM('tracking_item', 'manual');--> statement-breakpoint
CREATE TYPE "public"."payable_status" AS ENUM('pending', 'paid', 'overdue');--> statement-breakpoint
CREATE TYPE "public"."reminder_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."reminder_type" AS ENUM('seven_days_before', 'three_days_before', 'one_day_before', 'due_date');--> statement-breakpoint
CREATE TYPE "public"."tracking_item_status" AS ENUM('active', 'completed', 'closed');--> statement-breakpoint
CREATE TYPE "public"."tracking_item_type" AS ENUM('home_loan', 'personal_loan', 'car_loan', 'bike_loan', 'credit_card_emi');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"phone" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracking_item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "tracking_item_type" NOT NULL,
	"status" "tracking_item_status" DEFAULT 'active' NOT NULL,
	"lender_name" text,
	"account_number_last4" text,
	"principal_amount" numeric(14, 2) NOT NULL,
	"interest_rate" numeric(6, 3),
	"monthly_emi_amount" numeric(14, 2) NOT NULL,
	"outstanding_amount" numeric(14, 2) NOT NULL,
	"tenure_months" integer NOT NULL,
	"emi_day" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monthly_payable" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"tracking_item_id" uuid,
	"source" "payable_source" NOT NULL,
	"category" "payable_category" NOT NULL,
	"title" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"due_date" date NOT NULL,
	"billing_period" text NOT NULL,
	"status" "payable_status" DEFAULT 'pending' NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"paid_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"monthly_payable_id" uuid NOT NULL,
	"tracking_item_id" uuid,
	"amount" numeric(14, 2) NOT NULL,
	"principal_component" numeric(14, 2),
	"interest_component" numeric(14, 2),
	"outstanding_after" numeric(14, 2),
	"payment_date" date NOT NULL,
	"payment_method" text,
	"notes" text,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"browser_enabled" boolean DEFAULT false NOT NULL,
	"push_enabled" boolean DEFAULT false NOT NULL,
	"whatsapp_enabled" boolean DEFAULT false NOT NULL,
	"sms_enabled" boolean DEFAULT false NOT NULL,
	"remind_seven_days_before" boolean DEFAULT true NOT NULL,
	"remind_three_days_before" boolean DEFAULT true NOT NULL,
	"remind_one_day_before" boolean DEFAULT true NOT NULL,
	"remind_on_due_date" boolean DEFAULT true NOT NULL,
	"timezone" text DEFAULT 'Asia/Kolkata' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_preference_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "reminder_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"monthly_payable_id" uuid NOT NULL,
	"reminder_type" "reminder_type" NOT NULL,
	"channel" "notification_channel" DEFAULT 'email' NOT NULL,
	"status" "reminder_status" DEFAULT 'sent' NOT NULL,
	"error_message" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracking_item" ADD CONSTRAINT "tracking_item_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_payable" ADD CONSTRAINT "monthly_payable_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_payable" ADD CONSTRAINT "monthly_payable_tracking_item_id_tracking_item_id_fk" FOREIGN KEY ("tracking_item_id") REFERENCES "public"."tracking_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_monthly_payable_id_monthly_payable_id_fk" FOREIGN KEY ("monthly_payable_id") REFERENCES "public"."monthly_payable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_tracking_item_id_tracking_item_id_fk" FOREIGN KEY ("tracking_item_id") REFERENCES "public"."tracking_item"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reminder_log" ADD CONSTRAINT "reminder_log_monthly_payable_id_monthly_payable_id_fk" FOREIGN KEY ("monthly_payable_id") REFERENCES "public"."monthly_payable"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "tracking_item_user_idx" ON "tracking_item" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tracking_item_user_status_idx" ON "tracking_item" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "tracking_item_user_type_idx" ON "tracking_item" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "monthly_payable_user_due_date_idx" ON "monthly_payable" USING btree ("user_id","due_date");--> statement-breakpoint
CREATE INDEX "monthly_payable_user_status_idx" ON "monthly_payable" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "monthly_payable_tracking_item_idx" ON "monthly_payable" USING btree ("tracking_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "monthly_payable_tracking_item_period_uidx" ON "monthly_payable" USING btree ("tracking_item_id","billing_period") WHERE "monthly_payable"."tracking_item_id" is not null;--> statement-breakpoint
CREATE INDEX "payment_history_user_date_idx" ON "payment_history" USING btree ("user_id","payment_date");--> statement-breakpoint
CREATE INDEX "payment_history_payable_idx" ON "payment_history" USING btree ("monthly_payable_id");--> statement-breakpoint
CREATE INDEX "payment_history_tracking_item_idx" ON "payment_history" USING btree ("tracking_item_id");--> statement-breakpoint
CREATE INDEX "notification_preference_user_idx" ON "notification_preference" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reminder_log_user_idx" ON "reminder_log" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reminder_log_dedupe_uidx" ON "reminder_log" USING btree ("monthly_payable_id","reminder_type","channel");