import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
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
    ADD COLUMN IF NOT EXISTS "order_mode" "enum_doc_pages_order_mode" DEFAULT 'manual' NOT NULL;

    ALTER TABLE "doc_page_groups"
    ADD COLUMN IF NOT EXISTS "order_mode" "enum_doc_page_groups_order_mode" DEFAULT 'manual' NOT NULL;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'doc_pages'
          AND column_name = 'order'
      ) THEN
        ALTER TABLE "doc_pages" ALTER COLUMN "order" SET DEFAULT 1;
        UPDATE "doc_pages" SET "order" = 1 WHERE "order" < 1;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'doc_page_groups'
          AND column_name = 'order'
      ) THEN
        ALTER TABLE "doc_page_groups" ALTER COLUMN "order" SET DEFAULT 1;
        UPDATE "doc_page_groups" SET "order" = 1 WHERE "order" < 1;
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'doc_pages'
          AND column_name = 'order'
      ) THEN
        ALTER TABLE "doc_pages" ALTER COLUMN "order" SET DEFAULT 0;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'doc_page_groups'
          AND column_name = 'order'
      ) THEN
        ALTER TABLE "doc_page_groups" ALTER COLUMN "order" SET DEFAULT 0;
      END IF;
    END $$;

    ALTER TABLE "doc_pages"
    DROP COLUMN IF EXISTS "order_mode";

    ALTER TABLE "doc_page_groups"
    DROP COLUMN IF EXISTS "order_mode";

    DROP TYPE IF EXISTS "public"."enum_doc_pages_order_mode";
    DROP TYPE IF EXISTS "public"."enum_doc_page_groups_order_mode";
  `)
}
