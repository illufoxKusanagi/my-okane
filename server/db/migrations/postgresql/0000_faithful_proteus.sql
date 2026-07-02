CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"icon" text DEFAULT 'i-lucide-folder',
	"color" text DEFAULT 'blue'
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_name" text NOT NULL,
	"transaction_type" text NOT NULL,
	"amount" integer NOT NULL,
	"notes" text,
	"transaction_date" timestamp DEFAULT now(),
	"category_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;