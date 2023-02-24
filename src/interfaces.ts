export {DbHandlerInterface, AddressDbSet}
export {RetrieveObject, CreateObject, UpdateObject}
export {JWTAcquiringObject, JWTInvalidationObject, JWTPayload}
export {AuthObject, AuthReturnObject}
export {EndpointReturnObject}

type AddressDbSet = {
    id: string
    passwordHash: string
    ipAddress: string
    createdOn: number
    lastUpdate: number
    lifetime: number
}

type AuthObject =  {
    id?: string
    password?: string
    jwt?: string
}

type AuthReturnObject = {
    code: number
    id?: string
}

type RetrieveObject = AuthObject

type CreateObject = {
    id: string
    password: string
    lifetime?: number | undefined
}

type UpdateObject = AuthObject & {
    ip_address: string
    lifetime?: number | undefined
}

type JWTAcquiringObject = {
    id: string
    password: string
    mode: string
}

type JWTInvalidationObject = {
    id: string
    password: string
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

    createAddress(id: string, passwordHash: string, createdOn: number, lifetime?: number): boolean

    updateAddress(id: string, ip_address: string, timestamp: number, lifetime?: number | null): boolean

    deleteAddress(id: string): boolean
}
