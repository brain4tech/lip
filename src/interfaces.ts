export {DbHandlerInterface, AddressDbSet}
export {CredentialAuth, JWTAuthObject, AuthReturnObject}
export {CreateObject, UpdateObject}
export {JWTAcquiringObject, JWTInvalidationObject, JWTPayload}
export {EndpointReturnObject}

/**
 * Return value of abstracted database reading operation.
 */
type AddressDbSet = {
    id: string
    accessPasswordHash: string
    masterPasswordHash: string
    ipAddress: string
    createdOn: number
    lastUpdate: number
    lifetime: number
}

/**
 * Authentication with id and password.
 */
type CredentialAuth = {
    id: string
    password: string
}

/**
 * Authentication with JWT.
 */
type JWTAuthObject = {
    jwt: string
}

/**
 * Return value of JWT authentication process.
 */
type AuthReturnObject = {
    code: number
    id?: string
}

/**
 * Body object for /create endpoint.
 */
type CreateObject = {
    id: string
    master_password: string
    access_password: string
    lifetime?: number | undefined
}

/**
 * Body object for /update endpoint. Uses JWT authentication.
 */
type UpdateObject = JWTAuthObject & {
    ip_address: string
}

/**
 * Body object for /acquire endpoint. Uses credential authentication.
 */
type JWTAcquiringObject = CredentialAuth & {
    mode: string
}

/**
 * Body object for /invalidatejwt endpoint. Uses credential authentication.
 */
type JWTInvalidationObject = CredentialAuth & {
    jwt: string
}

/**
 * Payload of every generated JWT.
 */
type JWTPayload = {
    id: string
    mode: string
    created_on: number
}

/**
 * Returned object by every endpoint.
 */
type EndpointReturnObject = {
    return: {
        info: string
        last_update?: number
        lifetime?: number
    }
    code: number
}

/**
 * Inheritable interface for database handler classes.
 *
 * The original project uses bun as runtime and thus the high performant
 * bun:sqlite package. When switching to another runtime bun:sqlite cannot
 * be used, thus a global declaration of required methods helps set
 * a strict class definition for alternative database handling classes.
 */
interface DbHandlerInterface {
    initSuccessful(): boolean

    retrieveAddress(id: string): AddressDbSet | null

    createAddress(id: string, accessPasswordHash: string, masterPasswordHash: string, createdOn: number, lifetime?: number): boolean

    updateAddress(id: string, ip_address: string, timestamp: number, lifetime?: number | null): boolean

    deleteAddress(id: string): boolean
}
