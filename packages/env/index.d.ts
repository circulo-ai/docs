export type EnvMap = Record<string, string | undefined>;

export type ReadEnvOptions = {
  env?: EnvMap;
  defaultValue?: string;
  load?: boolean;
};

export type ReadBooleanEnvOptions = {
  env?: EnvMap;
  defaultValue?: boolean;
  load?: boolean;
};

export type ReadMultilineEnvOptions = {
  env?: EnvMap;
  defaultValue?: string;
  load?: boolean;
};

export declare const loadRootEnv: () => void;

export declare function readEnv(
  name: string,
  options?: Omit<ReadEnvOptions, "defaultValue">,
): string | undefined;

export declare function readEnv(
  name: string,
  options: ReadEnvOptions & { defaultValue: string },
): string;

export declare function readBooleanEnv(
  name: string,
  options?: ReadBooleanEnvOptions,
): boolean;

export declare function readMultilineEnv(
  name: string,
  options?: Omit<ReadMultilineEnvOptions, "defaultValue">,
): string | undefined;

export declare function readMultilineEnv(
  name: string,
  options: ReadMultilineEnvOptions & { defaultValue: string },
): string;
