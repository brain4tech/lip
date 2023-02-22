export {DbHandlerInterface, AddressDbSet}
export {RetrieveObject, CreateObject, UpdateObject}
export {EndpointReturnObject}

type AddressDbSet = {
    id: string
    passwordHash: string
    ipAddress: string
}

type RetrieveObject = {
    id: string
    password: string
}

type CreateObject = {
    id: string
    password: string
}

type UpdateObject = {
    id: string
    password: string
    ip_address: string
}

type EndpointReturnObject = {
    return: {
        info: string
    }
    code: number
}

interface DbHandlerInterface {
    initSuccessful(): boolean

    retrieveAddress(id: string): AddressDbSet | null

    createAddress(id: string, passwordHash: string): boolean

    updateAddress(id: string, ip_address: string): boolean
}
