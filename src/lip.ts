import Elysia from "elysia"
import {Env, printToStdout} from "./utils"

export {lipController}

class lipController {
    public hostname: string
    public port: number | string
    private app: Elysia
    private hasStarted: boolean

    constructor(app: Elysia) {
        this.app = app
        this.hasStarted = false

        Env.reevaluate()
        this.hostname = Env.hostname
        this.port = Env.port
    }

    start(): void {
        if (this.hasStarted) return

        const start = this.app.listen({
            hostname: this.hostname,
            port: this.port
        })
        Promise.resolve(start)

        printToStdout(`Started lip on ${this.app.server?.hostname}:${this.app.server?.port}.`)
    }

    stop(): void {
        if (!this.hasStarted) return
        Promise.resolve(this.app.stop())
        printToStdout("Stopped lip.")
    }
}
