export {DbHandlerInterface, AddressDbSet}
export {RetrieveObject, CreateObject, UpdateObject}
export {JWTAcquiringObject, JWTInvalidationObject, JWTPayload}
export {AuthObject, AuthReturnObject}
export {EndpointReturnObject}

type AddressDbSet = {
    id: string
    passwordHash: string
    ipAddress: string
    last_update: number
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
}

type UpdateObject = AuthObject & {
    ip_address: string
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
    timestamp: number
}

type EndpointReturnObject = {
    return: {
        info: string
        last_update?: number
    }
    code: number
}

interface DbHandlerInterface {
    initSuccessful(): boolean

    retrieveAddress(id: string): AddressDbSet | null

    createAddress(id: string, passwordHash: string): boolean

    updateAddress(id: string, ip_address: string, timestamp: number): boolean
}
