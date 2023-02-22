import {BunDbHandler} from "./dbhandler-bun"
import {
    AddressDbSet,
    CreateObject,
    DbHandlerInterface,
    EndpointReturnObject,
    RetrieveObject,
    UpdateObject,
    JWTAcquiringObject,
    JWTPayload
} from "./interfaces"
import {isIP} from "net"
import { createHash } from "crypto"

export {EndpointHandler}

class EndpointHandler {
    private dbHandler: DbHandlerInterface
    private writeJWTs: Map<string, string>

    constructor() {
        this.dbHandler = new BunDbHandler()
        this.writeJWTs = new Map<string, string>()

        if (!this.dbHandler.initSuccessful()) {
            throw new Error("Failed to initialize database.")
        }
    }

    retrieveAddress(data: RetrieveObject): EndpointReturnObject {

        const ipAddress: AddressDbSet | null = this.dbHandler.retrieveAddress(data.id)
        if (ipAddress == null) {
            // technically 'id does not exist' would be enough, but is prone to attacks
            return this.response("invalid combination of id and password", 401)
        }

        // check if passwords match
        const passwordHash = createHash('sha256').update(data.password).digest('hex')
        if (passwordHash != ipAddress.passwordHash) {
            return this.response("invalid combination of id and password", 401)
        }

        return this.response(ipAddress.ipAddress)
    }

    createAddress(data: CreateObject): EndpointReturnObject {

        // TODO validate id name (allowed letters, whitespaces, ...)

        // check if id already exists to prevent unneccessary calculations
        const ipAddress: AddressDbSet | null = this.dbHandler.retrieveAddress(data.id)
        if (ipAddress != null) {
            return this.response("id already exists", 409)
        }

        // calculate password hashes and store in db
        let hash: string = createHash('sha256').update(data.password).digest('hex')
        this.dbHandler.createAddress(data.id, hash)

        return this.response(`created new address '${data.id}'`)
    }

    updateAddress(data: UpdateObject): EndpointReturnObject {

        if (isIP(data.ip_address) == 0) {
            return this.response("invalid ip address", 400)
        }

        // check if id exists to prevent unneccessary calculations
        const ipAddress: AddressDbSet | null = this.dbHandler.retrieveAddress(data.id)
        if (ipAddress == null) {
            return this.response("invalid combination of id and password", 401)
        }

        // check if passwords match
        const passwordHash = createHash('sha256').update(data.password).digest('hex')
        if (passwordHash != ipAddress.passwordHash) {
            return this.response("invalid combination of id and password", 401)
        }

        this.dbHandler.updateAddress(data.id, data.ip_address)

        return this.response("")
    }

    async acquireJWT(data: JWTAcquiringObject, jwt: any): Promise<EndpointReturnObject>{

        // check if valid modes
        if (data.mode != 'write' && data.mode != 'read'){
            return this.response("invalid jwt mode", 400)
        }

        // check if id exists
        const ipAddress: AddressDbSet | null = this.dbHandler.retrieveAddress(data.id)
        if (ipAddress == null) {
            return this.response("invalid combination of id and password", 401)
        }

        // check if passwords match
        const passwordHash = createHash('sha256').update(data.password).digest('hex')
        if (passwordHash != ipAddress.passwordHash) {
            return this.response("invalid combination of id and password", 401)
        }

        // prevent multiple write tokens
        if (data.mode === 'write' && this.writeJWTs.has(data.id)){
            if (await jwt.verify(this.writeJWTs.get(data.id))){
                return this.response("write jwt already exists", 409)
            } else {
                this.writeJWTs.delete(data.id)
            }
        }

        // generate jwt
        const tokenPayload: JWTPayload = {id: data.id, mode: data.mode, timestamp: Date.now()}
        const token: string = await jwt.sign(tokenPayload)

        // register write token
        if (data.mode == 'write') this.writeJWTs.set(data.id, token)

        return this.response(token)
    }

    private response(message: string = "", code: number = 200): EndpointReturnObject {
        return {return: {info: message}, code: code}
    }
}
