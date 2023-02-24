import {AddressDbSet, DbHandlerInterface} from "./interfaces"
import {Database} from "bun:sqlite";

export {BunDbHandler}

class BunDbHandler implements DbHandlerInterface {

    private db: Database
    private readonly dbName: string
    private readonly dbInitSuccessful: boolean

    constructor() {
        // default init status to false
        const dbEnvName = Bun.env['LOCALIP_PUB_DBNAME']
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

    initSuccessful(): boolean {
        return this.dbInitSuccessful
    }

    retrieveAddress(id: string): AddressDbSet | null {

        let dbResult = this.db.query("SELECT * FROM addresses WHERE id = ?").get(id);
        if (dbResult == null) return null

        return {
            id: dbResult.id,
            passwordHash: dbResult.password_hash,
            ipAddress: dbResult.ip_address,
            createdOn: dbResult.created_on,
            lastUpdate: dbResult.last_update,
            lifetime: dbResult.lifetime
        };
    }

    createAddress(id: string, passwordHash: string, createdOn: number, lifetime: number = -1): boolean {

        try {
            this.db.run("INSERT INTO addresses (id, password_hash, ip_address, created_on, last_update, lifetime) VALUES (?, ?, '', ?, -1, ?)", id, passwordHash, createdOn.toString(), lifetime.toString());
        } catch (error) {
            return false
        }
        return true
    }

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

    deleteAddress(id: string): boolean {

        const queryStmt = this.db.query("SELECT * FROM addresses WHERE id = ?")
        if (queryStmt.get(id) === null) return false

        this.db.run("DELETE FROM addresses WHERE id = ?", id);
        return true
    }

    private initDb(): void {
        this.db.run("CREATE TABLE IF NOT EXISTS addresses (id TEXT PRIMARY KEY NOT NULL UNIQUE, password_hash TEXT, ip_address TEXT, created_on INTEGER, last_update INTEGER, lifetime INTEGER)")
    }

    private fillDb(): void {
        this.db.run("INSERT INTO addresses (id, ip_address) VALUES (?, ?)", "test_1", "192.168.1.1");
        this.db.run("INSERT INTO addresses (id, ip_address) VALUES (?, ?)", "test_2", "192.168.1.2");
    }
}
