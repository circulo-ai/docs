import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "doc_versions"
    ADD COLUMN IF NOT EXISTS "admin_label" varchar;

    UPDATE "doc_versions" AS dv
    SET "admin_label" = CASE
      WHEN s."name" IS NULL OR btrim(s."name") = '' THEN btrim(dv."version")
      ELSE btrim(dv."version") || ' (' || btrim(s."name") || ')'
    END
    FROM "services" AS s
    WHERE dv."service_id" = s."id"
      AND (dv."admin_label" IS NULL OR btrim(dv."admin_label") = '');

    UPDATE "doc_versions"
    SET "admin_label" = btrim("version")
    WHERE ("admin_label" IS NULL OR btrim("admin_label") = '')
      AND "version" IS NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "doc_versions"
    DROP COLUMN IF EXISTS "admin_label";
  `)
}
