import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "service_version_slug_1_idx";
    DROP INDEX IF EXISTS "service_version_slug_idx";
    DROP INDEX IF EXISTS "doc_pages_version_idx";
    DROP INDEX IF EXISTS "doc_pages_group_idx";
    DROP INDEX IF EXISTS "doc_page_groups_version_idx";
    DROP INDEX IF EXISTS "doc_pages_service_slug_idx";
    DROP INDEX IF EXISTS "doc_page_groups_service_slug_idx";
    DROP INDEX IF EXISTS "service_slug_1_idx";
    DROP INDEX IF EXISTS "service_slug_idx";

    ALTER TABLE "doc_pages" DROP CONSTRAINT IF EXISTS "doc_pages_version_id_doc_versions_id_fk";
    ALTER TABLE "doc_pages" DROP CONSTRAINT IF EXISTS "doc_pages_group_id_doc_page_groups_id_fk";
    ALTER TABLE "doc_page_groups" DROP CONSTRAINT IF EXISTS "doc_page_groups_version_id_doc_versions_id_fk";

    ALTER TABLE "doc_pages" DROP COLUMN IF EXISTS "version_id";
    ALTER TABLE "doc_pages" DROP COLUMN IF EXISTS "group_id";
    ALTER TABLE "doc_pages" DROP COLUMN IF EXISTS "order_mode";
    ALTER TABLE "doc_pages" DROP COLUMN IF EXISTS "order";
    ALTER TABLE "doc_pages" DROP COLUMN IF EXISTS "status";

    ALTER TABLE "doc_page_groups" DROP COLUMN IF EXISTS "version_id";
    ALTER TABLE "doc_page_groups" DROP COLUMN IF EXISTS "order_mode";
    ALTER TABLE "doc_page_groups" DROP COLUMN IF EXISTS "order";

    CREATE INDEX IF NOT EXISTS "service_slug_1_idx"
      ON "doc_pages" USING btree ("service_id", "slug");
    CREATE INDEX IF NOT EXISTS "service_slug_idx"
      ON "doc_page_groups" USING btree ("service_id", "slug");

    DROP TYPE IF EXISTS "public"."enum_doc_pages_status";
    DROP TYPE IF EXISTS "public"."enum_doc_pages_order_mode";
    DROP TYPE IF EXISTS "public"."enum_doc_page_groups_order_mode";
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      CREATE TYPE "public"."enum_doc_pages_status" AS ENUM('draft', 'published');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_doc_pages_order_mode" AS ENUM('manual', 'auto');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    DO $$
    BEGIN
      CREATE TYPE "public"."enum_doc_page_groups_order_mode" AS ENUM('manual', 'auto');
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;

    ALTER TABLE "doc_pages"
      ADD COLUMN IF NOT EXISTS "version_id" integer,
      ADD COLUMN IF NOT EXISTS "group_id" integer,
      ADD COLUMN IF NOT EXISTS "order_mode" "enum_doc_pages_order_mode" DEFAULT 'manual',
      ADD COLUMN IF NOT EXISTS "order" numeric DEFAULT 1,
      ADD COLUMN IF NOT EXISTS "status" "enum_doc_pages_status" DEFAULT 'draft';

    ALTER TABLE "doc_page_groups"
      ADD COLUMN IF NOT EXISTS "version_id" integer,
      ADD COLUMN IF NOT EXISTS "order_mode" "enum_doc_page_groups_order_mode" DEFAULT 'manual',
      ADD COLUMN IF NOT EXISTS "order" numeric DEFAULT 1;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'doc_pages_version_id_doc_versions_id_fk'
      ) THEN
        ALTER TABLE "doc_pages"
          ADD CONSTRAINT "doc_pages_version_id_doc_versions_id_fk"
          FOREIGN KEY ("version_id")
          REFERENCES "public"."doc_versions"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'doc_pages_group_id_doc_page_groups_id_fk'
      ) THEN
        ALTER TABLE "doc_pages"
          ADD CONSTRAINT "doc_pages_group_id_doc_page_groups_id_fk"
          FOREIGN KEY ("group_id")
          REFERENCES "public"."doc_page_groups"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'doc_page_groups_version_id_doc_versions_id_fk'
      ) THEN
        ALTER TABLE "doc_page_groups"
          ADD CONSTRAINT "doc_page_groups_version_id_doc_versions_id_fk"
          FOREIGN KEY ("version_id")
          REFERENCES "public"."doc_versions"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "doc_pages_version_idx" ON "doc_pages" USING btree ("version_id");
    CREATE INDEX IF NOT EXISTS "doc_pages_group_idx" ON "doc_pages" USING btree ("group_id");
    CREATE INDEX IF NOT EXISTS "doc_page_groups_version_idx" ON "doc_page_groups" USING btree ("version_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "service_version_slug_1_idx"
      ON "doc_pages" USING btree ("service_id", "version_id", "slug");
    CREATE UNIQUE INDEX IF NOT EXISTS "service_version_slug_idx"
      ON "doc_page_groups" USING btree ("service_id", "version_id", "slug");
  `)
}
