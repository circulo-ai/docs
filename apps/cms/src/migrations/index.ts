import * as migration_20260209_161900 from './20260209_161900';
import * as migration_20260210_232200 from './20260210_232200';
import * as migration_20260212_221000 from './20260212_221000';

export const migrations = [
  {
    up: migration_20260209_161900.up,
    down: migration_20260209_161900.down,
    name: '20260209_161900'
  },
  {
    up: migration_20260210_232200.up,
    down: migration_20260210_232200.down,
    name: '20260210_232200'
  },
  {
    up: migration_20260212_221000.up,
    down: migration_20260212_221000.down,
    name: '20260212_221000'
  },
];
