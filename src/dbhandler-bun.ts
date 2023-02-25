import {AddressDbSet, DbHandlerInterface} from "./interfaces"
import {Database} from "bun:sqlite";

export {BunDbHandler}

/**
 * Database handler/wrapper class for bun:sqlite.
 */
class BunDbHandler implements DbHandlerInterface {

    /**
     * Database connection.
     * @private
     */
    private db: Database

    /**
     * Database name.
     * @private
     */
    private readonly dbName: string

    /**
     * Whether a database initialization has been successful or not.
     * @private
     */
    private readonly dbInitSuccessful: boolean

    /**
     * Class constructor.
     */
    constructor() {
        // default init status to false
        const dbEnvName = Bun.env['LIP_DBNAME']
        this.dbName = ((dbEnvName == null) ? 'db.sqlite' : dbEnvName)
        this.dbInitSuccessful = false

        // init database
        this.db = new Database(this.dbName)
        this.initDb()
        try {
            // this.fillDb()
        } catch (e) {
            console.log("Filling database caused an error, ignoring it...")
        }

        // set init status to true
        this.dbInitSuccessful = true
    }

    /**
     * Whether a database initialization has been successful or not.
     */
    initSuccessful(): boolean {
        return this.dbInitSuccessful
    }

    /**
     * Create a new address in the database.
     * @param id Identifier of address.
     * @param accessPasswordHash Hash value of access password.
     * @param masterPasswordHash Hash value of master password.
     * @param createdOn Timestamp of id creation.
     * @param lifetime Lifetime of address.
     */
    createAddress(id: string, accessPasswordHash: string, masterPasswordHash: string, createdOn: number, lifetime: number = -1): boolean {

        try {
            this.db.run("INSERT INTO addresses (id, access_password_hash, master_password_hash, ip_address, created_on, last_update, lifetime) VALUES (?, ?, ?, '', ?, -1, ?)", id, accessPasswordHash, masterPasswordHash, createdOn.toString(), lifetime.toString());
        } catch (error) {
            return false
        }
        return true
    }

    /**
     * Update an address in the database.
     * @param id Address to be updated.
     * @param ip_address Value id should be set to.
     * @param timestamp Timestamp of id update.
     * @param lifetime New lifetime of address.
     */
    updateAddress(id: string, ip_address: string, timestamp: number, lifetime: number | null): boolean {

        const queryStmt = this.db.query("SELECT * FROM addresses WHERE id = ?")
        if (queryStmt.get(id) === null) return false

        if (lifetime) {
            this.db.run("UPDATE addresses SET ip_address = ?, last_update = ?, lifetime = ? WHERE id = ?", ip_address, timestamp.toString(), lifetime.toString(), id);
        } else {
            this.db.run("UPDATE addresses SET ip_address = ?, last_update = ? WHERE id = ?", ip_address, timestamp.toString(), id);
        }

        return true
    }

    /**
     * Get a complete address dataset of id in the db.
     * @param id Id of address to return.
     */
    retrieveAddress(id: string): AddressDbSet | null {

        let dbResult = this.db.query("SELECT * FROM addresses WHERE id = ?").get(id);
        if (dbResult == null) return null

        return {
            id: dbResult.id,
            accessPasswordHash: dbResult.access_password_hash,
            masterPasswordHash: dbResult.master_password_hash,
            ipAddress: dbResult.ip_address,
            createdOn: dbResult.created_on,
            lastUpdate: dbResult.last_update,
            lifetime: dbResult.lifetime
        };
    }

    /**
     * Delete an address from the database.
     * @param id Id to delete.
     */
    deleteAddress(id: string): boolean {

        const queryStmt = this.db.query("SELECT * FROM addresses WHERE id = ?")
        if (queryStmt.get(id) === null) return false

        this.db.run("DELETE FROM addresses WHERE id = ?", id);
        return true
    }

    /**
     * Initialize database.
     * @private
     */
    private initDb(): void {
        this.db.run("CREATE TABLE IF NOT EXISTS addresses (id TEXT PRIMARY KEY NOT NULL UNIQUE, access_password_hash TEXT, master_password_hash TEXT, ip_address TEXT, created_on INTEGER, last_update INTEGER, lifetime INTEGER)")
    }
}
