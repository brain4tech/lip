import {BunDbHandler} from "./dbhandler-bun"
import {
    AddressDbSet,
    CreateObject,
    DbHandlerInterface,
    EndpointReturnObject,
    AuthObject,
    RetrieveObject,
    UpdateObject,
    JWTAcquiringObject,
    JWTPayload,
    AuthReturnObject,
    JWTInvalidationObject
} from "./interfaces"
import {isIP} from "net"
import { createHash } from "crypto"
import { RateLimiter } from "limiter"

export {EndpointHandler}

class EndpointHandler {
    private dbHandler: DbHandlerInterface
    private writeJWTs: Map<string, string>
    private genReadTokensLimiter: RateLimiter

    constructor() {
        this.dbHandler = new BunDbHandler()
        this.writeJWTs = new Map<string, string>()
        this.genReadTokensLimiter = new RateLimiter({tokensPerInterval: 6, interval: 'minute', fireImmediately: true})

        if (!this.dbHandler.initSuccessful()) {
            throw new Error("Failed to initialize database.")
        }
    }

    async retrieveAddress(data: RetrieveObject, jwt: any): Promise<EndpointReturnObject> {
        
        // ensure only one authentication method is used
        if (!this.isOneAuthMethod(data)) return this.response("invalid authentication scheme", 400)

        const invalidKey = this.enforceInvalidKeysRemoval(data)
        if (invalidKey !== '') return this.response(`invalid key '${invalidKey}'`, 400)

        const authenticated = await this.authAuthObject(data, jwt, 'read')
        if (authenticated.code != 0){
            let message: string = ""
            switch (authenticated.code){
                case 1: message = "invalid authentication"; break;
                case 2: message = "invalid authentication"; break;
                case 3: message = "invalid token mode"; break;
                case 4: message = "no form of authentication given"; break;
                default: message = "invalid authentication"; break;
            }

            return this.response(message, 401)
        }

        if (!authenticated.id){
            return this.response("invalid authentication", 401)
        }

        const ipAddress = this.dbHandler.retrieveAddress(authenticated.id)
        if (ipAddress == null){
            return this.response("invalid authentication", 401)
        }

        let returnObject: EndpointReturnObject = this.response(ipAddress.ipAddress)
        returnObject.return.last_update = ipAddress.last_update
        return returnObject
    }

    createAddress(data: CreateObject): EndpointReturnObject {

        let id: string = data.id.trim()
        let password: string = data.password.trim()
        
        // TODO validate id (allowed letters, whitespaces, ...)
        if (id === '') return this.response("id cannot be emtpy", 400)

        // validate password
        if (password === '') return this.response("password cannot be emtpy", 400)

        // check if id already exists to prevent unneccessary calculations
        const ipAddress: AddressDbSet | null = this.dbHandler.retrieveAddress(id)
        if (ipAddress != null) {
            return this.response("id already exists", 409)
        }

        // calculate password hashes and store in db
        let hash: string = createHash('sha256').update(password).digest('hex')
        this.dbHandler.createAddress(id, hash)

        return this.response(`created new address '${id}'`)
    }

    async updateAddress(data: UpdateObject, jwt: any): Promise<EndpointReturnObject> {

        // ensure only one authentication method is used
        if (!this.isOneAuthMethod(data)) return this.response("invalid authentication scheme", 400)

        const invalidKey = this.enforceInvalidKeysRemoval(data, ['ip_address'])
        if (invalidKey !== '') return this.response(`invalid key '${invalidKey}'`, 400)

        if (isIP(data.ip_address) == 0) {
            return this.response("invalid ip address", 400)
        }

        const authenticated = await this.authAuthObject(data, jwt, 'write')
        if (authenticated.code != 0){
            let message: string = ""
            switch (authenticated.code){
                case 1: message = "invalid authentication"; break;
                case 2: {

                    // case 2 --> invalid jwt
                    let keyToDelete: string | null = null
                    this.writeJWTs.forEach(
                        (value: string, key: string) => {
                            if (value === data.jwt) keyToDelete = key
                        }
                    )

                    if (keyToDelete) this.writeJWTs.delete(keyToDelete)                    
                    message = "invalid authentication"
                    break
                }
                case 3: message = "invalid token mode"; break;
                case 4: message = "no form of authentication given"; break;
                default: message = "invalid authentication"; break;
            }

            return this.response(message, 401)
        }

        if (!authenticated.id){
            return this.response("invalid authentication", 401)
        }

        // if write token is valid, but not in write mapping
        if (!this.writeJWTs.has(authenticated.id)){
            return this.response("invalid authentication", 401)
        }

        // only allow modification with jwt if jwt for id exists
        if (data.id && this.writeJWTs.has(authenticated.id)){
            return this.response("modification with credentials not allowed when jwt exists", 409)
        }

        const updateTime = Date.now()
        this.dbHandler.updateAddress(authenticated.id, data.ip_address, updateTime)

        let returnObject: EndpointReturnObject = this.response()
        returnObject.return.last_update = updateTime
        return returnObject
    }

    async acquireJWT(data: JWTAcquiringObject, jwt: any): Promise<EndpointReturnObject>{

        // check if valid modes
        if (data.mode != 'write' && data.mode != 'read'){
            return this.response("invalid jwt mode", 400)
        }

        if (!this.authId(data.id, data.password)){
            return this.response("invalid combination of id and password", 401)
        }

        // set rate limiter for acquiring read tokens
        if (data.mode === 'read'){
            const remainingRequests: number = await this.genReadTokensLimiter.removeTokens(1)
            if (remainingRequests < 0) return this.response("too many acquiring requests", 429)
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

    async invalidateJWT(data: JWTInvalidationObject, jwt: any): Promise<EndpointReturnObject>{

        // check if correct id and password
        if (!this.authId(data.id, data.password)){
            return this.response("invalid authentication", 401)
        }

        // check if jwt is valid
        const token: JWTPayload = await jwt.verify(data.jwt)

        // jwt already invalid (due to time or non-existance)
        if (!token){
            return this.response("jwt already invalid", 400)
        }

        // id in jwt does not match credential id
        if (token.id !== data.id){
            return this.response("invalid authentication", 401)
        }

        // jwt token mode is invalid
        if (token.mode !== 'write'){
            return this.response("jwt already invalid", 400)
        }

        if (!this.writeJWTs.has(token.id)){
            return this.response("jwt already invalid", 400)
        }

        this.writeJWTs.delete(token.id)
        return this.response()
    }



    private authId(id: string, password: string): boolean {
        // check if id exists
        const ipAddress: AddressDbSet | null = this.dbHandler.retrieveAddress(id)
        if (ipAddress == null) {
            return false
        }

        // check if passwords match
        const passwordHash = createHash('sha256').update(password).digest('hex')
        if (passwordHash != ipAddress.passwordHash) {
            return false
        }

        return true
    }

    private authDataset(dataset: AddressDbSet | null, password: string): boolean {
        if (dataset == null) {
            // technically 'id does not exist' would be enough, but is prone to attacks
            return false
        }

        // check if passwords match
        const passwordHash = createHash('sha256').update(password).digest('hex')
        if (passwordHash != dataset.passwordHash) {
            return false
        }

        return true
    }

    private isOneAuthMethod(authObject: AuthObject): boolean{
 
        if (authObject.jwt){
            if (authObject.id || authObject.password) return false
        }

        // scheme checker ensures both id and password are required

        return true
    }

    private enforceInvalidKeysRemoval(dataObject: object, otherEnforcedKeys: string[] = []): string | null {

        // single auth method is already ensured by this.isOneAuthMethod and scheme checking

        const objectKeys = Object.keys(dataObject)

        // check if jwt, prioritize jwts
        if ('jwt' in dataObject){
            objectKeys.splice(objectKeys.indexOf('jwt'), 1)
        }

        // id and password keys
        if ('id' in dataObject){
            objectKeys.splice(objectKeys.indexOf('id'), 1)
        }

        if ('password' in dataObject){
            objectKeys.splice(objectKeys.indexOf('password'), 1)
        }

        // check enforced key
        otherEnforcedKeys.forEach( (v) => {
            if (v in dataObject) {
                objectKeys.splice(objectKeys.indexOf(v), 1)
            } else {
                return v
            }
        })

        if (objectKeys.length != 0){
            // invalid data in dataObject, return first one
            return objectKeys[0]
        }        

        return ""
    }

    private async authAuthObject(authObject: AuthObject, jwt: any, requiredTokenMode: string): Promise<AuthReturnObject>{

        // prioritize jwt
        if (authObject.jwt){

            const token: JWTPayload = await jwt.verify(authObject.jwt)

            if (!token){
                return {code: 2}
            }

            if (token.mode !== requiredTokenMode){
                return {code: 3}
            }

            return {code: 0, id: token.id}

        }

        // missing form of authentication
        if (!authObject.id || !authObject.password) return {code: 4}
        

        // authenticate with id and password
        if (!this.authId(authObject.id, authObject.password)) return {code: 1}

        return {code: 0, id: authObject.id}
    }

    private response(message: string = "", code: number = 200): EndpointReturnObject {
        return {return: {info: message}, code: code}
    }
}
