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
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'doc_versions'
          AND column_name = 'nav_items'
      ) THEN
        DELETE FROM "doc_versions_blocks_group_item_pages";
        DELETE FROM "doc_versions_blocks_page_item";
        DELETE FROM "doc_versions_blocks_group_item";

        INSERT INTO "doc_versions_blocks_page_item" (
          "_order",
          "_parent_id",
          "_path",
          "id",
          "page_id",
          "published",
          "block_name"
        )
        WITH root_items AS (
          SELECT
            dv."id" AS "version_id",
            elem."value" AS "item",
            (elem."ordinality" - 1)::integer AS "root_index"
          FROM "doc_versions" dv
          CROSS JOIN LATERAL jsonb_array_elements(COALESCE(dv."nav_items", '[]'::jsonb))
            WITH ORDINALITY AS elem("value", "ordinality")
        ),
        page_items AS (
          SELECT
            ri."version_id",
            ri."root_index",
            COALESCE(
              NULLIF(ri."item"->>'id', ''),
              CONCAT('p-', ri."version_id"::text, '-', ri."root_index"::text)
            ) AS "item_id",
            NULLIF(regexp_replace(COALESCE(ri."item"->>'page', ''), '\D', '', 'g'), '')::integer AS "page_id",
            COALESCE((ri."item"->>'published')::boolean, true) AS "published"
          FROM root_items ri
          WHERE LOWER(COALESCE(ri."item"->>'blockType', ri."item"->>'kind', ri."item"->>'type', ''))
            IN ('pageitem', 'page')
        )
        SELECT
          pi."root_index",
          pi."version_id",
          'navItems',
          pi."item_id",
          pi."page_id",
          pi."published",
          NULL
        FROM page_items pi
        WHERE pi."page_id" IS NOT NULL;

        INSERT INTO "doc_versions_blocks_group_item" (
          "_order",
          "_parent_id",
          "_path",
          "id",
          "group_id",
          "block_name"
        )
        WITH root_items AS (
          SELECT
            dv."id" AS "version_id",
            elem."value" AS "item",
            (elem."ordinality" - 1)::integer AS "root_index"
          FROM "doc_versions" dv
          CROSS JOIN LATERAL jsonb_array_elements(COALESCE(dv."nav_items", '[]'::jsonb))
            WITH ORDINALITY AS elem("value", "ordinality")
        ),
        group_items AS (
          SELECT
            ri."version_id",
            ri."root_index",
            ri."item",
            COALESCE(
              NULLIF(ri."item"->>'id', ''),
              CONCAT('g-', ri."version_id"::text, '-', ri."root_index"::text)
            ) AS "item_id",
            NULLIF(regexp_replace(COALESCE(ri."item"->>'group', ''), '\D', '', 'g'), '')::integer AS "group_id"
          FROM root_items ri
          WHERE LOWER(COALESCE(ri."item"->>'blockType', ri."item"->>'kind', ri."item"->>'type', ''))
            IN ('groupitem', 'group')
        )
        SELECT
          gi."root_index",
          gi."version_id",
          'navItems',
          gi."item_id",
          gi."group_id",
          NULL
        FROM group_items gi
        WHERE gi."group_id" IS NOT NULL;

        INSERT INTO "doc_versions_blocks_group_item_pages" (
          "_order",
          "_parent_id",
          "id",
          "page_id",
          "published"
        )
        WITH root_items AS (
          SELECT
            dv."id" AS "version_id",
            elem."value" AS "item",
            (elem."ordinality" - 1)::integer AS "root_index"
          FROM "doc_versions" dv
          CROSS JOIN LATERAL jsonb_array_elements(COALESCE(dv."nav_items", '[]'::jsonb))
            WITH ORDINALITY AS elem("value", "ordinality")
        ),
        group_items AS (
          SELECT
            ri."version_id",
            ri."item",
            COALESCE(
              NULLIF(ri."item"->>'id', ''),
              CONCAT('g-', ri."version_id"::text, '-', ri."root_index"::text)
            ) AS "item_id"
          FROM root_items ri
          WHERE LOWER(COALESCE(ri."item"->>'blockType', ri."item"->>'kind', ri."item"->>'type', ''))
            IN ('groupitem', 'group')
        ),
        group_pages AS (
          SELECT
            gi."item_id" AS "parent_id",
            COALESCE(
              NULLIF(page_row."value"->>'id', ''),
              CONCAT('gp-', gi."item_id", '-', (page_row."ordinality" - 1)::text)
            ) AS "row_id",
            NULLIF(regexp_replace(COALESCE(page_row."value"->>'page', ''), '\D', '', 'g'), '')::integer AS "page_id",
            COALESCE((page_row."value"->>'published')::boolean, true) AS "published",
            (page_row."ordinality" - 1)::integer AS "row_index"
          FROM group_items gi
          CROSS JOIN LATERAL jsonb_array_elements(COALESCE(gi."item"->'pages', '[]'::jsonb))
            WITH ORDINALITY AS page_row("value", "ordinality")
        )
        SELECT
          gp."row_index",
          gp."parent_id",
          gp."row_id",
          gp."page_id",
          gp."published"
        FROM group_pages gp
        WHERE gp."page_id" IS NOT NULL;

        UPDATE "doc_versions" dv
        SET
          "nav_warnings" = NULL,
          "status" = CASE
            WHEN EXISTS (
              SELECT 1
              FROM "doc_versions_blocks_page_item" pi
              WHERE pi."_parent_id" = dv."id"
                AND COALESCE(pi."published", true)
            )
            OR EXISTS (
              SELECT 1
              FROM "doc_versions_blocks_group_item" gi
              JOIN "doc_versions_blocks_group_item_pages" gp
                ON gp."_parent_id" = gi."id"
              WHERE gi."_parent_id" = dv."id"
                AND COALESCE(gp."published", true)
            )
              THEN 'published'::"enum_doc_versions_status"
            ELSE 'draft'::"enum_doc_versions_status"
          END;

        ALTER TABLE "doc_versions" DROP COLUMN IF EXISTS "nav_items";
      END IF;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "doc_versions"
    ADD COLUMN IF NOT EXISTS "nav_items" jsonb DEFAULT '[]'::jsonb NOT NULL;
  `)
}
