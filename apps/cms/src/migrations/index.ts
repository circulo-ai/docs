import * as migration_20260209_161900 from './20260209_161900';
import * as migration_20260210_232200 from './20260210_232200';
import * as migration_20260212_221000 from './20260212_221000';
import * as migration_20260214_101642_add_docs_settings_extra_nav_links from './20260214_101642_add_docs_settings_extra_nav_links';
import * as migration_20260214_190000_add_doc_versions_admin_label from './20260214_190000_add_doc_versions_admin_label';

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
];
