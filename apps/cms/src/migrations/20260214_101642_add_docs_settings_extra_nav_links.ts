import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_docs_settings_extra_nav_links_variant" AS ENUM('default', 'outline', 'secondary', 'ghost', 'destructive', 'link');
    CREATE TYPE "public"."enum_docs_settings_extra_nav_links_target" AS ENUM('_self', '_blank', '_parent', '_top');
    CREATE TABLE "docs_settings_extra_nav_links" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar NOT NULL,
      "href" varchar NOT NULL,
      "icon" varchar,
      "variant" "enum_docs_settings_extra_nav_links_variant" DEFAULT 'outline',
      "target" "enum_docs_settings_extra_nav_links_target"
    );

    ALTER TABLE "docs_settings_extra_nav_links"
      ADD CONSTRAINT "docs_settings_extra_nav_links_parent_id_fk"
      FOREIGN KEY ("_parent_id")
      REFERENCES "public"."docs_settings"("id")
      ON DELETE cascade
      ON UPDATE no action;

    CREATE INDEX "docs_settings_extra_nav_links_order_idx"
      ON "docs_settings_extra_nav_links" USING btree ("_order");
    CREATE INDEX "docs_settings_extra_nav_links_parent_id_idx"
      ON "docs_settings_extra_nav_links" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "docs_settings_extra_nav_links" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "docs_settings_extra_nav_links" CASCADE;
    DROP TYPE "public"."enum_docs_settings_extra_nav_links_variant";
    DROP TYPE "public"."enum_docs_settings_extra_nav_links_target";
  `)
}
