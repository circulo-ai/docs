import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_docs_settings_extra_nav_links_variant" AS ENUM('default', 'outline', 'secondary', 'ghost', 'destructive', 'link');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_docs_settings_extra_nav_links_target" AS ENUM('_self', '_blank', '_parent', '_top');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    CREATE TABLE IF NOT EXISTS "docs_settings_extra_nav_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "href" varchar NOT NULL,
      "icon" varchar,
      "variant" "enum_docs_settings_extra_nav_links_variant" DEFAULT 'outline',
      "target" "enum_docs_settings_extra_nav_links_target"
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'docs_settings_extra_nav_links_parent_id_fk'
      ) THEN
        ALTER TABLE "docs_settings_extra_nav_links"
          ADD CONSTRAINT "docs_settings_extra_nav_links_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."docs_settings"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "docs_settings_extra_nav_links_order_idx"
      ON "docs_settings_extra_nav_links" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "docs_settings_extra_nav_links_parent_id_idx"
      ON "docs_settings_extra_nav_links" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'docs_settings_extra_nav_links'
      ) THEN
        ALTER TABLE "docs_settings_extra_nav_links" DISABLE ROW LEVEL SECURITY;
      END IF;
    END $$;

    DROP TABLE IF EXISTS "docs_settings_extra_nav_links" CASCADE;
    DROP TYPE IF EXISTS "public"."enum_docs_settings_extra_nav_links_variant";
    DROP TYPE IF EXISTS "public"."enum_docs_settings_extra_nav_links_target";
  `)
}
