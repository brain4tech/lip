export {DbHandlerInterface, AddressDbSet}
export {CredentialAuth, JWTAuthObject, AuthReturnObject}
export {CreateObject, UpdateObject}
export {JWTAcquiringObject, JWTInvalidationObject, JWTPayload}
export {EndpointReturnObject}

type AddressDbSet = {
    id: string
    accessPasswordHash: string
    masterPasswordHash: string
    ipAddress: string
    createdOn: number
    lastUpdate: number
    lifetime: number
}

type CredentialAuth = {
    id: string
    password: string
}

type JWTAuthObject = {
    jwt: string
}

type AuthReturnObject = {
    code: number
    id?: string
}

type CreateObject = {
    id: string
    master_password: string
    access_password: string
    lifetime?: number | undefined
}

type UpdateObject = JWTAuthObject & {
    ip_address: string
}

type JWTAcquiringObject = CredentialAuth & {
    mode: string
}

type JWTInvalidationObject = CredentialAuth & {
    jwt: string
}

type JWTPayload = {
    id: string
    mode: string
    created_on: number
}

type EndpointReturnObject = {
    return: {
        info: string
        last_update?: number
        lifetime?: number
    }
    code: number
}

interface DbHandlerInterface {
    initSuccessful(): boolean

    retrieveAddress(id: string): AddressDbSet | null

    createAddress(id: string, accessPasswordHash: string, masterPasswordHash: string, createdOn: number, lifetime?: number): boolean

    updateAddress(id: string, ip_address: string, timestamp: number, lifetime?: number | null): boolean

    deleteAddress(id: string): boolean
}
