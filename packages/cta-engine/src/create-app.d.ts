import type { Environment, Options } from '@tanstack/cta-core';
export declare function createApp(options: Options, { silent, environment, cwd, appName, }: {
    silent?: boolean;
    environment: Environment;
    cwd?: string;
    name?: string;
    appName?: string;
}): Promise<void>;
