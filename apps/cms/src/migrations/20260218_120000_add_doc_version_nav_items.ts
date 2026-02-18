import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "doc_versions"
    ADD COLUMN IF NOT EXISTS "nav_warnings" varchar;

    CREATE TABLE IF NOT EXISTS "doc_versions_blocks_page_item" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "page_id" integer NOT NULL,
      "published" boolean DEFAULT true,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "doc_versions_blocks_group_item" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "group_id" integer NOT NULL,
      "block_name" varchar
    );

    CREATE TABLE IF NOT EXISTS "doc_versions_blocks_group_item_pages" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "page_id" integer NOT NULL,
      "published" boolean DEFAULT true
    );

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'doc_versions_blocks_page_item_parent_id_fk'
      ) THEN
        ALTER TABLE "doc_versions_blocks_page_item"
          ADD CONSTRAINT "doc_versions_blocks_page_item_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."doc_versions"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'doc_versions_blocks_page_item_page_id_doc_pages_id_fk'
      ) THEN
        ALTER TABLE "doc_versions_blocks_page_item"
          ADD CONSTRAINT "doc_versions_blocks_page_item_page_id_doc_pages_id_fk"
          FOREIGN KEY ("page_id")
          REFERENCES "public"."doc_pages"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'doc_versions_blocks_group_item_parent_id_fk'
      ) THEN
        ALTER TABLE "doc_versions_blocks_group_item"
          ADD CONSTRAINT "doc_versions_blocks_group_item_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."doc_versions"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'doc_versions_blocks_group_item_group_id_doc_page_groups_id_fk'
      ) THEN
        ALTER TABLE "doc_versions_blocks_group_item"
          ADD CONSTRAINT "doc_versions_blocks_group_item_group_id_doc_page_groups_id_fk"
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
        WHERE conname = 'doc_versions_blocks_group_item_pages_parent_id_fk'
      ) THEN
        ALTER TABLE "doc_versions_blocks_group_item_pages"
          ADD CONSTRAINT "doc_versions_blocks_group_item_pages_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "public"."doc_versions_blocks_group_item"("id")
          ON DELETE cascade
          ON UPDATE no action;
      END IF;
    END $$;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'doc_versions_blocks_group_item_pages_page_id_doc_pages_id_fk'
      ) THEN
        ALTER TABLE "doc_versions_blocks_group_item_pages"
          ADD CONSTRAINT "doc_versions_blocks_group_item_pages_page_id_doc_pages_id_fk"
          FOREIGN KEY ("page_id")
          REFERENCES "public"."doc_pages"("id")
          ON DELETE set null
          ON UPDATE no action;
      END IF;
    END $$;

    CREATE INDEX IF NOT EXISTS "doc_versions_blocks_page_item_order_idx"
      ON "doc_versions_blocks_page_item" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "doc_versions_blocks_page_item_parent_id_idx"
      ON "doc_versions_blocks_page_item" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "doc_versions_blocks_page_item_path_idx"
      ON "doc_versions_blocks_page_item" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "doc_versions_blocks_page_item_page_idx"
      ON "doc_versions_blocks_page_item" USING btree ("page_id");

    CREATE INDEX IF NOT EXISTS "doc_versions_blocks_group_item_order_idx"
      ON "doc_versions_blocks_group_item" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "doc_versions_blocks_group_item_parent_id_idx"
      ON "doc_versions_blocks_group_item" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "doc_versions_blocks_group_item_path_idx"
      ON "doc_versions_blocks_group_item" USING btree ("_path");
    CREATE INDEX IF NOT EXISTS "doc_versions_blocks_group_item_group_idx"
      ON "doc_versions_blocks_group_item" USING btree ("group_id");

    CREATE INDEX IF NOT EXISTS "doc_versions_blocks_group_item_pages_order_idx"
      ON "doc_versions_blocks_group_item_pages" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "doc_versions_blocks_group_item_pages_parent_id_idx"
      ON "doc_versions_blocks_group_item_pages" USING btree ("_parent_id");
    CREATE INDEX IF NOT EXISTS "doc_versions_blocks_group_item_pages_page_idx"
      ON "doc_versions_blocks_group_item_pages" USING btree ("page_id");

    DO $$
    DECLARE
      has_legacy_columns boolean;
    BEGIN
      SELECT
        EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'doc_page_groups'
            AND column_name = 'version_id'
        )
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'doc_pages'
            AND column_name = 'version_id'
        )
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'doc_pages'
            AND column_name = 'group_id'
        )
        AND EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'doc_pages'
            AND column_name = 'status'
        )
      INTO has_legacy_columns;

      IF has_legacy_columns THEN
        DELETE FROM "doc_versions_blocks_group_item_pages";
        DELETE FROM "doc_versions_blocks_page_item";
        DELETE FROM "doc_versions_blocks_group_item";

        WITH group_items AS (
          SELECT
            g."version_id" AS "version_id",
            g."id" AS "group_id",
            COALESCE(g."order", 2147483647) AS "sort_order",
            COALESCE(g."created_at", now()) AS "sort_created_at",
            g."id" AS "sort_id",
            CONCAT('g-', g."version_id"::text, '-', g."id"::text) AS "item_id"
          FROM "doc_page_groups" g
        ),
        ungrouped_page_items AS (
          SELECT
            p."version_id" AS "version_id",
            p."id" AS "page_id",
            (p."status" = 'published') AS "published",
            COALESCE(p."order", 2147483647) AS "sort_order",
            COALESCE(p."created_at", now()) AS "sort_created_at",
            p."id" AS "sort_id",
            CONCAT('p-', p."version_id"::text, '-', p."id"::text) AS "item_id"
          FROM "doc_pages" p
          WHERE p."group_id" IS NULL
        ),
        combined_root_items AS (
          SELECT
            gi."version_id",
            'group'::text AS "item_type",
            gi."item_id",
            gi."group_id",
            NULL::integer AS "page_id",
            NULL::boolean AS "published",
            gi."sort_order",
            gi."sort_created_at",
            gi."sort_id"
          FROM group_items gi

          UNION ALL

          SELECT
            up."version_id",
            'page'::text AS "item_type",
            up."item_id",
            NULL::integer AS "group_id",
            up."page_id",
            up."published",
            up."sort_order",
            up."sort_created_at",
            up."sort_id"
          FROM ungrouped_page_items up
        ),
        ordered_root_items AS (
          SELECT
            c.*,
            ROW_NUMBER() OVER (
              PARTITION BY c."version_id"
              ORDER BY c."sort_order", c."sort_created_at", c."sort_id"
            ) - 1 AS "root_index"
          FROM combined_root_items c
        )
        INSERT INTO "doc_versions_blocks_page_item" (
          "_order",
          "_parent_id",
          "_path",
          "id",
          "page_id",
          "published",
          "block_name"
        )
        SELECT
          o."root_index",
          o."version_id",
          'navItems',
          o."item_id",
          o."page_id",
          COALESCE(o."published", true),
          NULL
        FROM ordered_root_items o
        WHERE o."item_type" = 'page';

        WITH group_items AS (
          SELECT
            g."version_id" AS "version_id",
            g."id" AS "group_id",
            COALESCE(g."order", 2147483647) AS "sort_order",
            COALESCE(g."created_at", now()) AS "sort_created_at",
            g."id" AS "sort_id",
            CONCAT('g-', g."version_id"::text, '-', g."id"::text) AS "item_id"
          FROM "doc_page_groups" g
        ),
        ungrouped_page_items AS (
          SELECT
            p."version_id" AS "version_id",
            p."id" AS "page_id",
            (p."status" = 'published') AS "published",
            COALESCE(p."order", 2147483647) AS "sort_order",
            COALESCE(p."created_at", now()) AS "sort_created_at",
            p."id" AS "sort_id",
            CONCAT('p-', p."version_id"::text, '-', p."id"::text) AS "item_id"
          FROM "doc_pages" p
          WHERE p."group_id" IS NULL
        ),
        combined_root_items AS (
          SELECT
            gi."version_id",
            'group'::text AS "item_type",
            gi."item_id",
            gi."group_id",
            NULL::integer AS "page_id",
            NULL::boolean AS "published",
            gi."sort_order",
            gi."sort_created_at",
            gi."sort_id"
          FROM group_items gi

          UNION ALL

          SELECT
            up."version_id",
            'page'::text AS "item_type",
            up."item_id",
            NULL::integer AS "group_id",
            up."page_id",
            up."published",
            up."sort_order",
            up."sort_created_at",
            up."sort_id"
          FROM ungrouped_page_items up
        ),
        ordered_root_items AS (
          SELECT
            c.*,
            ROW_NUMBER() OVER (
              PARTITION BY c."version_id"
              ORDER BY c."sort_order", c."sort_created_at", c."sort_id"
            ) - 1 AS "root_index"
          FROM combined_root_items c
        )
        INSERT INTO "doc_versions_blocks_group_item" (
          "_order",
          "_parent_id",
          "_path",
          "id",
          "group_id",
          "block_name"
        )
        SELECT
          o."root_index",
          o."version_id",
          'navItems',
          o."item_id",
          o."group_id",
          NULL
        FROM ordered_root_items o
        WHERE o."item_type" = 'group';

        WITH group_items AS (
          SELECT
            g."version_id" AS "version_id",
            g."id" AS "group_id",
            CONCAT('g-', g."version_id"::text, '-', g."id"::text) AS "group_item_id"
          FROM "doc_page_groups" g
        ),
        ordered_group_pages AS (
          SELECT
            gi."group_item_id" AS "parent_id",
            CONCAT('gp-', gi."group_item_id", '-', p."id"::text) AS "row_id",
            p."id" AS "page_id",
            (p."status" = 'published') AS "published",
            ROW_NUMBER() OVER (
              PARTITION BY gi."group_item_id"
              ORDER BY COALESCE(p."order", 2147483647), COALESCE(p."created_at", now()), p."id"
            ) - 1 AS "row_index"
          FROM group_items gi
          JOIN "doc_pages" p
            ON p."version_id" = gi."version_id"
           AND p."group_id" = gi."group_id"
        )
        INSERT INTO "doc_versions_blocks_group_item_pages" (
          "_order",
          "_parent_id",
          "id",
          "page_id",
          "published"
        )
        SELECT
          gp."row_index",
          gp."parent_id",
          gp."row_id",
          gp."page_id",
          gp."published"
        FROM ordered_group_pages gp;

        UPDATE "doc_versions" dv
        SET
          "status" = CASE
            WHEN EXISTS (
              SELECT 1
              FROM "doc_pages" p
              WHERE p."version_id" = dv."id"
                AND p."status" = 'published'
            ) THEN 'published'::"enum_doc_versions_status"
            ELSE 'draft'::"enum_doc_versions_status"
          END;
      END IF;
    END $$;

    UPDATE "doc_versions"
    SET "nav_warnings" = NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "doc_versions_blocks_group_item_pages" CASCADE;
    DROP TABLE IF EXISTS "doc_versions_blocks_group_item" CASCADE;
    DROP TABLE IF EXISTS "doc_versions_blocks_page_item" CASCADE;

    ALTER TABLE "doc_versions"
    DROP COLUMN IF EXISTS "nav_warnings";
  `)
}
