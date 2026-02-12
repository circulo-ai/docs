import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_doc_pages_order_mode" AS ENUM('manual', 'auto');
    CREATE TYPE "public"."enum_doc_page_groups_order_mode" AS ENUM('manual', 'auto');
    ALTER TABLE "doc_pages"
    ADD COLUMN "order_mode" "enum_doc_pages_order_mode" DEFAULT 'manual' NOT NULL;
    ALTER TABLE "doc_page_groups"
    ADD COLUMN "order_mode" "enum_doc_page_groups_order_mode" DEFAULT 'manual' NOT NULL;
    ALTER TABLE "doc_pages"
    ALTER COLUMN "order" SET DEFAULT 1;
    ALTER TABLE "doc_page_groups"
    ALTER COLUMN "order" SET DEFAULT 1;
    UPDATE "doc_pages" SET "order" = 1 WHERE "order" < 1;
    UPDATE "doc_page_groups" SET "order" = 1 WHERE "order" < 1;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "doc_pages"
    ALTER COLUMN "order" SET DEFAULT 0;
    ALTER TABLE "doc_page_groups"
    ALTER COLUMN "order" SET DEFAULT 0;
    ALTER TABLE "doc_pages"
    DROP COLUMN "order_mode";
    ALTER TABLE "doc_page_groups"
    DROP COLUMN "order_mode";
    DROP TYPE "public"."enum_doc_pages_order_mode";
    DROP TYPE "public"."enum_doc_page_groups_order_mode";
  `)
}
