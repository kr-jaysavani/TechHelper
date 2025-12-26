DO $$ BEGIN
 CREATE TYPE "public"."file_status" AS ENUM('pending', 'success');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "UserFile" (
	"id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"fileUrl" text NOT NULL,
	"collectionName" varchar(100) NOT NULL,
	"createdAt" timestamp NOT NULL,
	"status" "file_status" DEFAULT 'pending' NOT NULL,
	CONSTRAINT "UserFile_id_pk" PRIMARY KEY("id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserFile" ADD CONSTRAINT "UserFile_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
