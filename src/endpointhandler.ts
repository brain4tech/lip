import {BunDbHandler} from "./dbhandler-bun"
import {
    DbHandlerInterface,
    AddressDbSet,
    CredentialAuth,
    JWTAuthObject,
    AuthReturnObject,
    CreateObject,
    UpdateObject,
    JWTAcquiringObject,
    JWTInvalidationObject,
    JWTPayload,
    EndpointReturnObject
} from "./interfaces"
import {isIP} from "net"
import { createHash } from "crypto"
import { RateLimiter, RateLimiterOpts } from "limiter"

export {EndpointHandler}

const rateLimiterSettings: RateLimiterOpts= {
    tokensPerInterval: 6,
    interval: 'minute',
    fireImmediately: true
}

/**
 * Handler class for abstracted endpoint handling.
 */
class EndpointHandler {

    /**
     * Database abstraction class.
     * @private
     */
    private dbHandler: DbHandlerInterface

    /**
     * Map to store valid JWTs in write mode.
     * @private
     */
    private writeJWTs: Map<string, string>

    /**
     * Read JWT generation limiter per address id.
     * @private
     */
    private readTokenGenLimiter: Map<string, RateLimiter>

    /**
     * Class constructor.
     */
    constructor() {
        this.dbHandler = new BunDbHandler()
        this.writeJWTs = new Map<string, string>()
        this.readTokenGenLimiter = new Map<string, RateLimiter>()

        if (!this.dbHandler.initSuccessful()) {
            throw new Error("Failed to initialize database.")
        }
    }

    /**
     * Create a new address.
     * @param data Request body parsed into an object.
     */
    createAddress(data: CreateObject): EndpointReturnObject {

        // prepare data content
        let id: string = data.id.trim()
        let accessPassword: string = data.access_password.trim()
        let masterPassword: string = data.master_password.trim()
        let lifetime: number = -1
        
        // TODO validate id (allowed letters, whitespaces, ...)
        if (id === '') return this.response("id cannot be emtpy", 400)

        // validate passwords
        if (accessPassword === '') return this.response("access password cannot be emtpy", 400)
        if (masterPassword === '') return this.response("master password cannot be emtpy", 400)

        // validate lifetime
        if (data.lifetime !== undefined){
            if (!this.checkLifetimeNumber(data.lifetime)) return this.response("invalid lifetime setting", 400)
            lifetime = this.calculateLifetime(data.lifetime)
        }

        // check if id already exists to prevent unnecessary calculations
        const ipAddress: AddressDbSet | null = this.dbHandler.retrieveAddress(id)
        if (ipAddress) {
            if (!this.hasLifetimeExceeded(ipAddress.lifetime)) return this.response("id already exists", 409)

            // delete ip if lifetime exceeded
            this.dbHandler.deleteAddress(ipAddress.id)
        }

        // calculate password hashes and store in db
        const success = this.dbHandler.createAddress(id, this.hashString(accessPassword), this.hashString(masterPassword), Date.now(), lifetime)
        if (!success) return this.response(`error creating '${id}'`, 500)

        // instantiate rate limiter
        this.readTokenGenLimiter.set(id, new RateLimiter(rateLimiterSettings))
        return this.response(`created new address '${id}'`)
    }

    /**
     * Update an existent ip address.
     * @param data Request body parsed into an object.
     * @param jwt JWT handling instance.
     */
    async updateAddress(data: UpdateObject, jwt: any): Promise<EndpointReturnObject> {

        if (isIP(data.ip_address) == 0) {
            return this.response("invalid ip address", 400)
        }

        const authenticated = await this.authJWT(jwt, data.jwt, 'write')
        if (authenticated.code != 0){
            let message: string = ""
            switch (authenticated.code){
                case 5: message = "invalid token mode"; break;
                default: {
                    // invalid jwt (either expired or too old)
                    // remove from jwt mapping
                    let idToDelete: string | null = null
                    this.writeJWTs.forEach(
                        (value: string, key: string) => {
                            if (value === data.jwt) idToDelete = key
                        }
                    )

                    if (idToDelete) this.writeJWTs.delete(idToDelete)                  
                    message = "invalid authentication"
                    break
                }
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

        // if write token is valid, but id not in write mapping
        if (!this.writeJWTs.has(authenticated.id)){
            return this.response("invalid authentication", 401)
        }

        // token value is in mapping
        let tokenInMapping: boolean = false
        this.writeJWTs.forEach( (value, key) => {
            if (value !== data.jwt) return
            if (key !== authenticated.id) return
            tokenInMapping = true            
        })
        if (!tokenInMapping) return this.response("invalid authentication", 401)

        const updateTime = Date.now()
        let newLifetime: number | null = null

        if (ipAddress.lifetime != -1){
            newLifetime = this.calculateLifetime(ipAddress.lifetime - Math.floor(ipAddress.lastUpdate / 1000))
        }

        this.dbHandler.updateAddress(authenticated.id, data.ip_address, updateTime, newLifetime)

        let returnObject: EndpointReturnObject = this.response()
        returnObject.return.last_update = updateTime
        return returnObject
    }

    /**
     * Get an ip address.
     * @param data Request body parsed into an object.
     * @param jwt JWT handling instance.
     */
    async retrieveAddress(data: JWTAuthObject, jwt: any): Promise<EndpointReturnObject> {
        
        const authenticated = await this.authJWT(jwt, data.jwt, 'read')
        if (authenticated.code != 0){
            let message: string = ""
            switch (authenticated.code){
                case 5: message = "invalid token mode"; break;
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
        returnObject.return.last_update = ipAddress.lastUpdate
        returnObject.return.lifetime = ipAddress.lifetime
        return returnObject
    }

    /**
     * Delete an ip address.
     * @param data Request body parsed into an object.
     */
    deleteAddress(data: CredentialAuth): EndpointReturnObject {

        if (!this.authCredentials(data.id, data.password, 'master')){
            return this.response("invalid combination of id and password", 401)
        }

        // delete id from token mapping
        if (this.writeJWTs.has(data.id)) this.writeJWTs.delete(data.id)

        // delete id from db
        this.dbHandler.deleteAddress(data.id)

        return this.response(`deleted address '${data.id}'`)
    }

    /**
     * Create a JWT for id.
     * @param data Request body parsed into an object.
     * @param jwt JWT handling instance.
     */
    async acquireJWT(data: JWTAcquiringObject, jwt: any): Promise<EndpointReturnObject>{

        // check if valid modes
        if (data.mode != 'write' && data.mode != 'read'){
            return this.response("invalid jwt mode", 400)
        }

        if (!this.authCredentials(data.id, data.password, 'access')){
            return this.response("invalid combination of id and password", 401)
        }

        // set rate limiter for acquiring read tokens
        if (data.mode === 'read'){

            const rateLimiter = this.readTokenGenLimiter.get(data.id)

            if (rateLimiter){
                const remainingRequests: number = await rateLimiter.removeTokens(1)
                if (remainingRequests < 0) return this.response("too many acquiring requests", 429)
            } else {
                // create rate limiter
                const newRateLimiter = new RateLimiter(rateLimiterSettings)
                newRateLimiter.removeTokens(1)
                this.readTokenGenLimiter.set(data.id, newRateLimiter)
            }
        }

        // prevent multiple write tokens
        if (data.mode === 'write' && this.writeJWTs.has(data.id)){
            const authenticated = await this.authJWT(jwt, this.writeJWTs.get(data.id), 'write')
            if (authenticated.code == 0) {
                return this.response("write jwt already exists", 409)
            } else {
                this.writeJWTs.delete(data.id)
            }
        }

        // generate jwt
        const tokenPayload: JWTPayload = {id: data.id, mode: data.mode, created_on: Date.now()}
        const token: string = await jwt.sign(tokenPayload)

        // register write token
        if (data.mode == 'write') this.writeJWTs.set(data.id, token)

        return this.response(token)
    }

    /**
     * Invalidate a previously created JWT with write access.
     *
     * @param data Request body parsed into an object.
     * @param jwt JWT handling instance.
     */
    async invalidateJWT(data: JWTInvalidationObject, jwt: any): Promise<EndpointReturnObject>{

        let token: string = data.jwt.trim()

        // check if valid modes
        if (token === '') return this.response("invalid jwt", 400)
        
        /*

        // technically, jwt validity should be checked before authentication
        // (just like mode at /create) but does not achieve wanted goal of
        // this endpoint (i.e. it cancels the jwt authentication step afterwards)

        if (!jwt.validate(token)) return this.response("invalid jwt", 400)
        
        */

        // authenticate user before modifying internal states
        if (!this.authCredentials(data.id, data.password, 'access')){
            return this.response("invalid combination of id and password", 401)
        }

        const validJWT = await this.authJWT(jwt, token, 'write')

        if (validJWT.id === undefined) return this.response("invalid jwt", 400)

        // ids do not match
        if (validJWT.id !== data.id) return this.response("invalid jwt", 400)

        // mapping does not contain id
        if (!this.writeJWTs.has(validJWT.id)) return this.response("invalid jwt", 400)

        // token is in mapping
        let tokenInMapping: boolean = false
        this.writeJWTs.forEach( (value, key) => {
            if (value !== token) return
            this.writeJWTs.delete(key)
            tokenInMapping = true            
        })
        if (tokenInMapping) return this.response()

        return this.response("invalid jwt", 400)
    }

    stop(): void {
        this.dbHandler.close()
    }

    /**
     * Authenticate passed credentials by comparing them with the database.
     * @param id Id of address.
     * @param password Password to address id.
     * @param type Password type. Either 'master' or 'access'.
     * @private
     */
    private authCredentials(id: string, password: string, type: string): boolean {
        // check if id exists
        const ipAddress: AddressDbSet | null = this.dbHandler.retrieveAddress(id)
        if (ipAddress == null) {
            return false
        }

        let passwordsMatch: boolean = false
        switch (type){
            case 'access': passwordsMatch = this.comparePasswordWithHash(password, ipAddress.accessPasswordHash); break;
            case 'master': passwordsMatch = this.comparePasswordWithHash(password, ipAddress.masterPasswordHash); break;
            default: break;
        }

        if (!passwordsMatch) return false

        // lifetime expired
        if (ipAddress.lifetime != -1 && Math.floor(Date.now() / 1000) > ipAddress.lifetime){
            this.dbHandler.deleteAddress(ipAddress.id)
            this.readTokenGenLimiter.delete(ipAddress.id)
            return false
        }

        return true
    }

    /**
     * Authenticate passed JWT.
     * @param verifier JWT handling instance.
     * @param jwt JWT to authenticate.
     * @param requiredTokenMode Access mode of token. Either 'read' or 'write'.
     * @private
     */
    private async authJWT(verifier: any, jwt: string | undefined, requiredTokenMode: string): Promise<AuthReturnObject> {
        
        if (!jwt) return {code: 1}

        const token: JWTPayload = await verifier.verify(jwt)
        if (!token) return {code: 1}

        const address = this.dbHandler.retrieveAddress(token.id)
        
        // id in token does not exist
        if (!address) return {code: 2}

        // date of token is before date of address (prevents token reuse on new ips with same id)
        if (address.createdOn > token.created_on) return {code: 3}

        // lifetime expired
        if (address.lifetime != -1 && Math.floor(Date.now() / 1000) > address.lifetime){
            this.dbHandler.deleteAddress(address.id)
            this.readTokenGenLimiter.delete(address.id)
            return {code: 4}
        }

        // invalid token mode
        if (token.mode !== requiredTokenMode) return {code: 5}

        return {code: 0, id: token.id}
    }

    /**
     * Hashes a given input.
     * @param input String to hash.
     * @private
     */
    private hashString(input: string): string {
        return createHash('sha256').update(input).digest('hex')
    }

    /**
     * Compares a plain password to a hashed password.
     * @param password Password to compare.
     * @param passwordHash Already hashed password.
     * @private
     */
    private comparePasswordWithHash(password: string, passwordHash: string): boolean {
        const hash = createHash('sha256').update(password).digest('hex')
        if (hash !== passwordHash) {
            return false
        }

        return true
    }

    /**
     * Calculate lifetime by adding lifetime delta to current time.
     * @param addedLifetime Lifetime to add onto current time.
     * @private
     */
    private calculateLifetime(addedLifetime: number): number {

        if (addedLifetime == -1) return -1

        return Math.floor(Date.now() / 1000) + addedLifetime
    }

    /**
     * Validate passed lifetime.
     * @param lifetime Integer to validate.
     * @private
     */
    private checkLifetimeNumber(lifetime: number): boolean {

        // below 'infinite' (-1)
        if (lifetime < -1) return false

        // more than one year
        if (lifetime > 31536000) return false

        return true
    }

    /**
     * Check if passed lifetime is expired.
     * @param lifetime Integer to validate.
     * @private
     */
    private hasLifetimeExceeded(lifetime: number): boolean {
        // lifetime is infinite
        if (lifetime == -1) return false

        // lifetime is finite but not exceeded
        if (Math.floor(Date.now() / 1000) < lifetime) return false

        return true
    }

    /**
     * Return a universal response object containing a return body and status code.
     * @param message Message to write into the body.
     * @param code HTTP return code.
     * @private
     */
    private response(message: string = "", code: number = 200): EndpointReturnObject {
        return {return: {info: message}, code: code}
    }
}
