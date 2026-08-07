CREATE TYPE "public"."lending_transaction_type" AS ENUM('you_gave', 'you_got');--> statement-breakpoint
CREATE TABLE "lending_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"notes" text,
	"balance" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lending_transaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"contact_id" uuid NOT NULL,
	"type" "lending_transaction_type" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"transaction_date" date NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lending_contact" ADD CONSTRAINT "lending_contact_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lending_transaction" ADD CONSTRAINT "lending_transaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lending_transaction" ADD CONSTRAINT "lending_transaction_contact_id_lending_contact_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."lending_contact"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lending_contact_user_idx" ON "lending_contact" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lending_transaction_user_idx" ON "lending_transaction" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "lending_transaction_contact_idx" ON "lending_transaction" USING btree ("contact_id");