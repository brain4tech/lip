import {randomBytes} from "crypto"

export {Env, printToStdout}

class Env {
    public static hostname: string
    public static port: number
    public static dbName: string
    public static jwtSecret: string
    public static toStdout: boolean

    /**
     * Reevaluate all environment variables.
     */
    public static reevaluate(): void {
        Env.hostname = this.getHostname()
        Env.port = this.getPort()
        Env.dbName = this.getDbName()
        Env.jwtSecret = this.getJwtSecret()
        Env.toStdout = this.getToStdout()
    }

    /**
     * Convert static variables into an object.
     * @returns An object containing all read environment variables.
     */
    public static toObject(): object {
        return {
            hostname: Env.hostname,
            port: Env.port,
            dbName: Env.dbName,
            jwtSecret: Env.jwtSecret,
            toStdout: Env.toStdout
        }
    }

    /**
     * Read hostname from environment variables.
     * @returns Hostname.
     */
    static getHostname(): string {
        return getFromEnv('LIP_HOSTNAME', '0.0.0.0')
    }

    /**
     * Read port number from environment variables.
     * @returns Port number.
     */
    static getPort(): number {
        const env = getFromEnv('LIP_PORT', '8080')
        return Number(env)
    }

    /**
     * Read database name from environment variables.
     * @returns Database name.
     */
    static getDbName(): string {
        return getFromEnv('LIP_DB_NAME', 'lip.sqlite')
    }

    /**
     * Read JWT secret from environment variables.
     * @returns JWT secret.
     */
    static getJwtSecret(): string {
        return getFromEnv('LIP_JWT_SECRET', generateRandomString(40))
    }

    /**
     * Read setting to print to stdout from environment variables.
     * @returns Whether to print to stdout or not.
     */
    static getToStdout(): boolean {
        const env = getFromEnv('LIP_TO_STDOUT', 'true')
        // return always true, except when set to 'false'
        return (!env || env !== 'false')
    }
}

/**
 * Read a value from environment variables.
 * @param name Name to read from environment variables.
 * @param other Alternative value if variable does not exist.
 * @returns Environment variable or default value.
 */
function getFromEnv(name: string, other: string): string {
    let env: string | undefined = Bun.env[name]
    return (env === undefined) ? other : env
}

/**
 * Generates a string containg random characters.
 * @param length Amount of characters in generated string.
 * @returns String containing random characters.
 */
function generateRandomString(length: number): string {
    return randomBytes(Math.floor(length / 2)).toString('hex')
}

/**
 * console.log information if Env.toStdout is true.
 * @param data Data to pass on to console.log.
 */
function printToStdout(...data: any[]): void {
    if (Env.toStdout)
        console.log(...data)
}
