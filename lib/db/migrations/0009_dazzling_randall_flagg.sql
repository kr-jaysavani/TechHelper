ALTER TYPE "file_status" ADD VALUE 'failed';--> statement-breakpoint
ALTER TABLE "UserFile" ALTER COLUMN "status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "UserFile" ADD COLUMN "errorMessage" text;