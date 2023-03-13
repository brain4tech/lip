import {randomBytes} from "crypto"
import {isIP} from "net";

export {Env, printToStdout, validateIpAddress}

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
 * Generates a string containing random characters.
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


/**
 * Validate a given ip address.
 * @param input Ip address to validate.
 * @returns Validated ip address or null if unsuccessful.
 */
function validateIpAddress(input: string): string | null {

    // use default validator
    const ipVariant: number = isIP(input)

    // return browser and url-ready ipv6 address
    if (ipVariant === 6) return `[${input}]`
    if (ipVariant === 4) return input

    // custom validation if default fails
    let ipAddress: string = ""

    // check for brackets '[' and ']'
    if (input.startsWith('[')) {

        const firstPart = input.slice(1)
        const endingBracket = firstPart.search(']')
        if (endingBracket === -1) return null

        const possibleIpAddress = firstPart.slice(0, endingBracket)
        if (isIP(possibleIpAddress) !== 6) return null
        ipAddress = `[${possibleIpAddress}]`

        // if ending bracket is last char in string
        if (endingBracket === firstPart.length - 1) return ipAddress

        const possiblePortNumber = extractPortNumber(firstPart.slice(endingBracket + 1))
        if (possiblePortNumber === null) return null

        return `${ipAddress}:${possiblePortNumber}`

    }

    const colonPosition = input.search(':')
    if (colonPosition === -1) return null
    const possibleIpAddress = input.slice(0, colonPosition)

    if (isIP(possibleIpAddress) !== 4) return null
    ipAddress = possibleIpAddress

    const possiblePortNumber = extractPortNumber(input)
    if (possiblePortNumber === null) return null

    return `${ipAddress}:${possiblePortNumber}`
}

/**
 * Extract the port number out of a given string.
 * @param input Input string to search for :<port number>.
 * @returns The port number if successful, else null
 */
function extractPortNumber(input: string): number | null {
    const colonPosition = input.search(':')
    if (colonPosition === -1) return null
    if (colonPosition === input.length - 1) return null

    const portString = input.slice(colonPosition + 1)
    const portNumber = Number(portString)

    if (isNaN(portNumber)) return null

    if (portNumber < 0 || portNumber > 65535) return null

    return portNumber
}