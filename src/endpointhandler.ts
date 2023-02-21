import {BunDbHandler} from "./dbhandler-bun"
import {
    AddressDbSet,
    CreateObject,
    DbHandlerInterface,
    EndpointReturnObject,
    RetrieveObject,
    UpdateObject
} from "./interfaces"
import {isIP} from "net"

export {EndpointHandler}

class EndpointHandler {
    private dbHandler: DbHandlerInterface

    constructor() {
        this.dbHandler = new BunDbHandler()

        if (!this.dbHandler.initSuccessful()) {
            throw new Error("Failed to initialize database.")
        }

    }

    retrieveAddress(data: RetrieveObject): EndpointReturnObject {

        const ipAddress: AddressDbSet | null = this.dbHandler.retrieveAddress(data.id)
        if (ipAddress == null) {
            // technically 'id does not exist' would be enough, but is prone to attacks
            return this.response("invalid combination of id and password", 400)
        }

        // check if passwords match
        let match: boolean = true
        if (!match) {
            return this.response("invalid combination of id and password", 400)
        }

        return this.response(ipAddress.ipAddress)
    }

    createAddress(data: CreateObject): EndpointReturnObject {

        // TODO validate id name (allowed letters, whitespaces, ...)

        const ok = this.dbHandler.createAddress(data.id)
        if (!ok) {
            return this.response("id already exists", 409)
        }

        return this.response(`created new address '${data.id}'`)
    }

    updateAddress(data: UpdateObject): EndpointReturnObject {

        if (isIP(data.ip_address) == 0) {
            return this.response("invalid ip address", 400)
        }

        const ok = this.dbHandler.updateAddress(data.id, data.ip_address)
        if (!ok) {
            return this.response("id and password do not match", 404)
        }

        return this.response("")
    }

    private response(message: string = "", code: number = 200): EndpointReturnObject {
        return {return: {info: message}, code: code}
    }
}
