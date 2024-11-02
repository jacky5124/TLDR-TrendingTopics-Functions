export const getEnv = (envName: string): string => {
    const envVal = process.env[envName];
    if (!envVal) throw new Error(`${envName} is empty`);
    return envVal;
};
