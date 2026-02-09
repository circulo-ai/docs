import * as migration_20260209_161900 from './20260209_161900';

export const migrations = [
  {
    up: migration_20260209_161900.up,
    down: migration_20260209_161900.down,
    name: '20260209_161900'
  },
];
