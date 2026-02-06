CREATE TYPE "public"."email_direction" AS ENUM('incoming', 'outgoing');--> statement-breakpoint
CREATE TYPE "public"."email_participant_type" AS ENUM('from', 'to', 'cc', 'bcc', 'reply_to');--> statement-breakpoint
CREATE TABLE "domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "domains_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "email_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_id" uuid NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"file_url" text NOT NULL,
	"is_inline" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_id" uuid NOT NULL,
	"email_address" text NOT NULL,
	"display_name" text,
	"type" "email_participant_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mailbox_id" uuid NOT NULL,
	"message_id" text NOT NULL,
	"thread_id" text,
	"in_reply_to" text,
	"references" text,
	"subject" text NOT NULL,
	"body_text" text,
	"body_html" text,
	"raw_source" text NOT NULL,
	"direction" "email_direction" NOT NULL,
	"sent_at" timestamp with time zone,
	"received_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mailbox_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subscription_id" text NOT NULL,
	"mailbox_id" text NOT NULL,
	"resource" text NOT NULL,
	"notification_url" text NOT NULL,
	"change_type" text DEFAULT 'created,updated,deleted' NOT NULL,
	"client_state" text,
	"expiration_date_time" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mailbox_subscriptions_subscription_id_unique" UNIQUE("subscription_id")
);
--> statement-breakpoint
CREATE TABLE "mailboxes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" text NOT NULL,
	"name" text NOT NULL,
	"delta_link" text,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "mailboxes_address_unique" UNIQUE("address")
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipient_type" text NOT NULL,
	"recipient_id" text NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"data" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transportation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_number" text NOT NULL,
	"pickup_address" text NOT NULL,
	"dropoff_address" text NOT NULL,
	"thread_ids" text[],
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transportation_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
ALTER TABLE "email_attachments" ADD CONSTRAINT "email_attachments_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_participants" ADD CONSTRAINT "email_participants_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "emails" ADD CONSTRAINT "emails_mailbox_id_mailboxes_id_fk" FOREIGN KEY ("mailbox_id") REFERENCES "public"."mailboxes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_domains_domain" ON "domains" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "idx_email_attachments_email_id" ON "email_attachments" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "idx_email_attachments_file_url" ON "email_attachments" USING btree ("file_url");--> statement-breakpoint
CREATE INDEX "idx_email_participants_email_id" ON "email_participants" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX "idx_email_participants_email_address" ON "email_participants" USING btree ("email_address");--> statement-breakpoint
CREATE INDEX "idx_email_participants_type" ON "email_participants" USING btree ("type");--> statement-breakpoint
CREATE INDEX "idx_emails_mailbox_id" ON "emails" USING btree ("mailbox_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_emails_message_id" ON "emails" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_emails_thread_id" ON "emails" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX "idx_emails_in_reply_to" ON "emails" USING btree ("in_reply_to");--> statement-breakpoint
CREATE INDEX "idx_emails_direction" ON "emails" USING btree ("direction");--> statement-breakpoint
CREATE INDEX "idx_emails_sent_at" ON "emails" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_emails_received_at" ON "emails" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "idx_mailbox_subscriptions_subscription_id" ON "mailbox_subscriptions" USING btree ("subscription_id");--> statement-breakpoint
CREATE INDEX "idx_mailbox_subscriptions_mailbox_id" ON "mailbox_subscriptions" USING btree ("mailbox_id");--> statement-breakpoint
CREATE INDEX "idx_mailbox_subscriptions_expiration" ON "mailbox_subscriptions" USING btree ("expiration_date_time");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mailbox_subscriptions_mailbox_resource" ON "mailbox_subscriptions" USING btree ("mailbox_id","resource");--> statement-breakpoint
CREATE INDEX "idx_mailboxes_address" ON "mailboxes" USING btree ("address");--> statement-breakpoint
CREATE INDEX "idx_notifications_recipient" ON "notifications" USING btree ("recipient_type","recipient_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_created_at" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_transportation_requests_request_number" ON "transportation_requests" USING btree ("request_number");--> statement-breakpoint
CREATE INDEX "idx_transportation_requests_status" ON "transportation_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_transportation_requests_created_at" ON "transportation_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_transportation_requests_thread_id" ON "transportation_requests" USING btree ("thread_ids");