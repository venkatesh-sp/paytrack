ALTER TABLE "monthly_payable" DROP CONSTRAINT "monthly_payable_tracking_item_id_tracking_item_id_fk";
--> statement-breakpoint
ALTER TABLE "monthly_payable" ADD CONSTRAINT "monthly_payable_tracking_item_id_tracking_item_id_fk" FOREIGN KEY ("tracking_item_id") REFERENCES "public"."tracking_item"("id") ON DELETE cascade ON UPDATE no action;