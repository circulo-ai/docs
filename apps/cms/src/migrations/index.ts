import * as migration_20260209_161900 from './20260209_161900';
import * as migration_20260210_232200 from './20260210_232200';
import * as migration_20260212_221000 from './20260212_221000';
import * as migration_20260214_101642_add_docs_settings_extra_nav_links from './20260214_101642_add_docs_settings_extra_nav_links';
import * as migration_20260214_190000_add_doc_versions_admin_label from './20260214_190000_add_doc_versions_admin_label';
import * as migration_20260217_210000_add_service_themes from './20260217_210000_add_service_themes';
import * as migration_20260218_141000_add_service_themes_locked_rels from './20260218_141000_add_service_themes_locked_rels';
import * as migration_20260218_120000_add_doc_version_nav_items from './20260218_120000_add_doc_version_nav_items';
import * as migration_20260218_121000_drop_legacy_page_group_version_fields from './20260218_121000_drop_legacy_page_group_version_fields';
import * as migration_20260218_122000_backfill_doc_version_blocks_from_nav_json from './20260218_122000_backfill_doc_version_blocks_from_nav_json';

export const migrations = [
  {
    up: migration_20260209_161900.up,
    down: migration_20260209_161900.down,
    name: '20260209_161900',
  },
  {
    up: migration_20260210_232200.up,
    down: migration_20260210_232200.down,
    name: '20260210_232200',
  },
  {
    up: migration_20260212_221000.up,
    down: migration_20260212_221000.down,
    name: '20260212_221000',
  },
  {
    up: migration_20260214_101642_add_docs_settings_extra_nav_links.up,
    down: migration_20260214_101642_add_docs_settings_extra_nav_links.down,
    name: '20260214_101642_add_docs_settings_extra_nav_links'
  },
  {
    up: migration_20260214_190000_add_doc_versions_admin_label.up,
    down: migration_20260214_190000_add_doc_versions_admin_label.down,
    name: '20260214_190000_add_doc_versions_admin_label',
  },
  {
    up: migration_20260217_210000_add_service_themes.up,
    down: migration_20260217_210000_add_service_themes.down,
    name: '20260217_210000_add_service_themes',
  },
  {
    up: migration_20260218_141000_add_service_themes_locked_rels.up,
    down: migration_20260218_141000_add_service_themes_locked_rels.down,
    name: '20260218_141000_add_service_themes_locked_rels',
  },
  {
    up: migration_20260218_120000_add_doc_version_nav_items.up,
    down: migration_20260218_120000_add_doc_version_nav_items.down,
    name: '20260218_120000_add_doc_version_nav_items',
  },
  {
    up: migration_20260218_121000_drop_legacy_page_group_version_fields.up,
    down: migration_20260218_121000_drop_legacy_page_group_version_fields.down,
    name: '20260218_121000_drop_legacy_page_group_version_fields',
  },
  {
    up: migration_20260218_122000_backfill_doc_version_blocks_from_nav_json.up,
    down: migration_20260218_122000_backfill_doc_version_blocks_from_nav_json.down,
    name: '20260218_122000_backfill_doc_version_blocks_from_nav_json',
  },
];
