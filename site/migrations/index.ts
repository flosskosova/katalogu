import * as migration_20260406_190058_initial from './20260406_190058_initial';

export const migrations = [
  {
    up: migration_20260406_190058_initial.up,
    down: migration_20260406_190058_initial.down,
    name: '20260406_190058_initial'
  },
];
