export {DbHandlerInterface, AddressDbSet}
export {RetrieveObject, CreateObject, UpdateObject}
export {JWTAcquiringObject, JWTPayload}
export {EndpointReturnObject}

type AddressDbSet = {
    id: string
    passwordHash: string
    ipAddress: string
}

type RetrieveObject = {
    id: string
    password: string
    jwt?: string
}

type CreateObject = {
    id: string
    password: string
}

type UpdateObject = {
    id: string
    password: string
    jwt?: string
    ip_address: string
}

type JWTAcquiringObject = {
    id: string
    password: string
    mode: string
}

type JWTPayload = {
    id: string
    mode: string
    timestamp: number
}

type EndpointReturnObject = {
    return: {
        info: string
        timestamp?: string
    }
    code: number
}

interface DbHandlerInterface {
    initSuccessful(): boolean

    retrieveAddress(id: string): AddressDbSet | null

    createAddress(id: string, passwordHash: string): boolean

    updateAddress(id: string, ip_address: string): boolean
}
