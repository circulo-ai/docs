import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "service_themes" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "light_background" varchar DEFAULT 'oklch(1 0 0)' NOT NULL,
      "light_foreground" varchar DEFAULT 'oklch(0.147 0.004 49.25)' NOT NULL,
      "light_card" varchar DEFAULT 'oklch(1 0 0)' NOT NULL,
      "light_card_foreground" varchar DEFAULT 'oklch(0.147 0.004 49.25)' NOT NULL,
      "light_popover" varchar DEFAULT 'oklch(1 0 0)' NOT NULL,
      "light_popover_foreground" varchar DEFAULT 'oklch(0.147 0.004 49.25)' NOT NULL,
      "light_primary" varchar DEFAULT 'oklch(0.216 0.006 56.043)' NOT NULL,
      "light_primary_foreground" varchar DEFAULT 'oklch(0.985 0.001 106.423)' NOT NULL,
      "light_secondary" varchar DEFAULT 'oklch(0.97 0.001 106.424)' NOT NULL,
      "light_secondary_foreground" varchar DEFAULT 'oklch(0.216 0.006 56.043)' NOT NULL,
      "light_muted" varchar DEFAULT 'oklch(0.97 0.001 106.424)' NOT NULL,
      "light_muted_foreground" varchar DEFAULT 'oklch(0.553 0.013 58.071)' NOT NULL,
      "light_accent" varchar DEFAULT 'oklch(0.97 0.001 106.424)' NOT NULL,
      "light_accent_foreground" varchar DEFAULT 'oklch(0.216 0.006 56.043)' NOT NULL,
      "light_destructive" varchar DEFAULT 'oklch(0.577 0.245 27.325)' NOT NULL,
      "light_border" varchar DEFAULT 'oklch(0.923 0.003 48.717)' NOT NULL,
      "light_input" varchar DEFAULT 'oklch(0.923 0.003 48.717)' NOT NULL,
      "light_ring" varchar DEFAULT 'oklch(0.709 0.01 56.259)' NOT NULL,
      "light_chart1" varchar DEFAULT 'oklch(0.646 0.222 41.116)' NOT NULL,
      "light_chart2" varchar DEFAULT 'oklch(0.6 0.118 184.704)' NOT NULL,
      "light_chart3" varchar DEFAULT 'oklch(0.398 0.07 227.392)' NOT NULL,
      "light_chart4" varchar DEFAULT 'oklch(0.828 0.189 84.429)' NOT NULL,
      "light_chart5" varchar DEFAULT 'oklch(0.769 0.188 70.08)' NOT NULL,
      "light_radius" varchar DEFAULT '0.875rem' NOT NULL,
      "light_sidebar" varchar DEFAULT 'oklch(0.985 0.001 106.423)' NOT NULL,
      "light_sidebar_foreground" varchar DEFAULT 'oklch(0.147 0.004 49.25)' NOT NULL,
      "light_sidebar_primary" varchar DEFAULT 'oklch(0.216 0.006 56.043)' NOT NULL,
      "light_sidebar_primary_foreground" varchar DEFAULT 'oklch(0.985 0.001 106.423)' NOT NULL,
      "light_sidebar_accent" varchar DEFAULT 'oklch(0.97 0.001 106.424)' NOT NULL,
      "light_sidebar_accent_foreground" varchar DEFAULT 'oklch(0.216 0.006 56.043)' NOT NULL,
      "light_sidebar_border" varchar DEFAULT 'oklch(0.923 0.003 48.717)' NOT NULL,
      "light_sidebar_ring" varchar DEFAULT 'oklch(0.709 0.01 56.259)' NOT NULL,
      "dark_background" varchar DEFAULT 'oklch(0.147 0.004 49.25)' NOT NULL,
      "dark_foreground" varchar DEFAULT 'oklch(0.985 0.001 106.423)' NOT NULL,
      "dark_card" varchar DEFAULT 'oklch(0.216 0.006 56.043)' NOT NULL,
      "dark_card_foreground" varchar DEFAULT 'oklch(0.985 0.001 106.423)' NOT NULL,
      "dark_popover" varchar DEFAULT 'oklch(0.216 0.006 56.043)' NOT NULL,
      "dark_popover_foreground" varchar DEFAULT 'oklch(0.985 0.001 106.423)' NOT NULL,
      "dark_primary" varchar DEFAULT 'oklch(0.923 0.003 48.717)' NOT NULL,
      "dark_primary_foreground" varchar DEFAULT 'oklch(0.216 0.006 56.043)' NOT NULL,
      "dark_secondary" varchar DEFAULT 'oklch(0.268 0.007 34.298)' NOT NULL,
      "dark_secondary_foreground" varchar DEFAULT 'oklch(0.985 0.001 106.423)' NOT NULL,
      "dark_muted" varchar DEFAULT 'oklch(0.268 0.007 34.298)' NOT NULL,
      "dark_muted_foreground" varchar DEFAULT 'oklch(0.709 0.01 56.259)' NOT NULL,
      "dark_accent" varchar DEFAULT 'oklch(0.268 0.007 34.298)' NOT NULL,
      "dark_accent_foreground" varchar DEFAULT 'oklch(0.985 0.001 106.423)' NOT NULL,
      "dark_destructive" varchar DEFAULT 'oklch(0.704 0.191 22.216)' NOT NULL,
      "dark_border" varchar DEFAULT 'oklch(1 0 0 / 10%)' NOT NULL,
      "dark_input" varchar DEFAULT 'oklch(1 0 0 / 15%)' NOT NULL,
      "dark_ring" varchar DEFAULT 'oklch(0.553 0.013 58.071)' NOT NULL,
      "dark_chart1" varchar DEFAULT 'oklch(0.488 0.243 264.376)' NOT NULL,
      "dark_chart2" varchar DEFAULT 'oklch(0.696 0.17 162.48)' NOT NULL,
      "dark_chart3" varchar DEFAULT 'oklch(0.769 0.188 70.08)' NOT NULL,
      "dark_chart4" varchar DEFAULT 'oklch(0.627 0.265 303.9)' NOT NULL,
      "dark_chart5" varchar DEFAULT 'oklch(0.645 0.246 16.439)' NOT NULL,
      "dark_sidebar" varchar DEFAULT 'oklch(0.216 0.006 56.043)' NOT NULL,
      "dark_sidebar_foreground" varchar DEFAULT 'oklch(0.985 0.001 106.423)' NOT NULL,
      "dark_sidebar_primary" varchar DEFAULT 'oklch(0.488 0.243 264.376)' NOT NULL,
      "dark_sidebar_primary_foreground" varchar DEFAULT 'oklch(0.985 0.001 106.423)' NOT NULL,
      "dark_sidebar_accent" varchar DEFAULT 'oklch(0.268 0.007 34.298)' NOT NULL,
      "dark_sidebar_accent_foreground" varchar DEFAULT 'oklch(0.985 0.001 106.423)' NOT NULL,
      "dark_sidebar_border" varchar DEFAULT 'oklch(1 0 0 / 10%)' NOT NULL,
      "dark_sidebar_ring" varchar DEFAULT 'oklch(0.553 0.013 58.071)' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "service_themes_name_idx"
      ON "service_themes" USING btree ("name");
    CREATE INDEX IF NOT EXISTS "service_themes_updated_at_idx"
      ON "service_themes" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "service_themes_created_at_idx"
      ON "service_themes" USING btree ("created_at");

    ALTER TABLE "services"
      ADD COLUMN IF NOT EXISTS "theme_id" integer;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'services_theme_id_service_themes_id_fk'
      ) THEN
        ALTER TABLE "services"
          ADD CONSTRAINT "services_theme_id_service_themes_id_fk"
          FOREIGN KEY ("theme_id")
          REFERENCES "public"."service_themes"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "services_theme_idx"
      ON "services" USING btree ("theme_id");

    INSERT INTO "service_themes" (
      "name",
      "light_primary",
      "light_secondary",
      "light_accent"
    )
    SELECT
      'Migrated ' || s."slug" || ' Theme',
      COALESCE(NULLIF(BTRIM(s."theme_primary_color"), ''), 'oklch(0.216 0.006 56.043)'),
      COALESCE(NULLIF(BTRIM(s."theme_secondary_color"), ''), 'oklch(0.97 0.001 106.424)'),
      COALESCE(NULLIF(BTRIM(s."theme_accent_color"), ''), 'oklch(0.97 0.001 106.424)')
    FROM "services" AS s
    ON CONFLICT ("name") DO NOTHING;

    UPDATE "services" AS s
    SET "theme_id" = st."id"
    FROM "service_themes" AS st
    WHERE s."theme_id" IS NULL
      AND st."name" = 'Migrated ' || s."slug" || ' Theme';

    ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "services_theme_logo_id_media_id_fk";
    DROP INDEX IF EXISTS "services_theme_theme_logo_idx";

    ALTER TABLE "services" DROP COLUMN IF EXISTS "theme_primary_color";
    ALTER TABLE "services" DROP COLUMN IF EXISTS "theme_secondary_color";
    ALTER TABLE "services" DROP COLUMN IF EXISTS "theme_accent_color";
    ALTER TABLE "services" DROP COLUMN IF EXISTS "theme_logo_id";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "theme_primary_color" varchar;
    ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "theme_secondary_color" varchar;
    ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "theme_accent_color" varchar;
    ALTER TABLE "services" ADD COLUMN IF NOT EXISTS "theme_logo_id" integer;

    UPDATE "services" AS s
    SET
      "theme_primary_color" = st."light_primary",
      "theme_secondary_color" = st."light_secondary",
      "theme_accent_color" = st."light_accent"
    FROM "service_themes" AS st
    WHERE s."theme_id" = st."id";

    ALTER TABLE "services" DROP CONSTRAINT IF EXISTS "services_theme_id_service_themes_id_fk";
    DROP INDEX IF EXISTS "services_theme_idx";
    ALTER TABLE "services" DROP COLUMN IF EXISTS "theme_id";

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'services_theme_logo_id_media_id_fk'
      ) THEN
        ALTER TABLE "services"
          ADD CONSTRAINT "services_theme_logo_id_media_id_fk"
          FOREIGN KEY ("theme_logo_id")
          REFERENCES "public"."media"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "services_theme_theme_logo_idx"
      ON "services" USING btree ("theme_logo_id");

    DROP TABLE IF EXISTS "service_themes" CASCADE;
  `)
}
