UPDATE "profiles"
SET "theme_mode" = 'auto', "locked_theme_id" = NULL
WHERE "theme_mode" NOT IN ('auto', 'locked')
   OR ("theme_mode" = 'locked' AND "locked_theme_id" IS NULL)
   OR ("theme_mode" = 'auto' AND "locked_theme_id" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_theme_mode_chk" CHECK ("profiles"."theme_mode" IN ('auto', 'locked'));--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_locked_theme_chk" CHECK (("profiles"."theme_mode" = 'locked' AND "profiles"."locked_theme_id" IS NOT NULL)
          OR ("profiles"."theme_mode" = 'auto' AND "profiles"."locked_theme_id" IS NULL));