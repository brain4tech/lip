<h1>localip-pub</h1>

*localip-pub* is a work in progress webservice for publishing and retrieving ip addresses, written in Typescript. It's mainly designed for distributed architectures that run in local networks, but are not able to find each other through local solutions (e.g. multicasts).

It's ...
- **fast** and **lightweight** by using [bun](https://bun.sh/) as its javascript runtime, [ElysiaJS](https://elysiajs.com/) as the [fastest web framework](https://github.com/SaltyAom/bun-http-framework-benchmark) currently available and SQLite for a local database
- **small**, the project only focusses on being what's intended to be
- **extensible**, so alternative web frameworks and runtimes can be used if desired (you will need to rewrite some code tho)
- **easy-to-use** and **straight-forward**, because we don't like complicated APIs

***localip-pub* is currently in development. While the `main` branch can be used in production, not all needed features will be included. Currently, the application starts on `0.0.0.0:3000` by default, this will change in future updates.**

<h2>Table of Contents</h2>

- [How to use it](#how-to-use-it)
- [Missing features and ToDo's](#missing-features-and-todos)
- [A bit on the Why's](#a-bit-on-the-whys)
- [About internal architectures and made decisions](#about-internal-architectures-and-made-decisions)
- [API documentation](#api-documentation)
  - [`/` (GET)](#-get)
  - [`/create`](#create)
  - [`/update`](#update)
  - [`/retrieve`](#retrieve)


## How to use it

Prerequesites:
- working [bun](https://bun.sh/) environment
- this repository

```sh
bun run src/index.ts
```

And you are good to go. *localip-pub* creates a new SQLite database called `db.sqlite` at the directory you started the command from. You can change this by setting the `LOCALIP_PUB_DBNAME` environment variable to the directory and name of your choice.

> You'll be better when using this solution in a closed, project-intern environment. Because of it's small footprint, it can be easily deployed on an existing project server, behind a secure proxy. This way, id's and ip's stay internal and id's do most likely not collide.

## Missing features and ToDo's
*localip-pub* is in early development. The `main` branch will contain stable releases, whereas development takes place in `dev` and features are developed in `feat/<feature-name>` branches.

Currently there are several features missing for the project to be "completed":

-  [ ] protect reading/writing id's using passwords and JWT's
-  [ ] set lifetime of an id to free up id after usage (infinite should also be possible)
-  [ ] overview on existing id's and their lifetime
-  [ ] easy deployment with docker and docker compose
-  [ ] some documentation in the source code

Possible features for post project completion could be:
- a password reset feature, connected to an email
- multiple sdk implementations for both publishing and retrieving ip addresses


## A bit on the Why's
Basically *localip-sub* is a text-sharing application, where each text is secured with a pre-known id and password. So when starting a "server" and "client" that should communicate, but are unable to find each other (because of e.g. outer restrictions), they can use the set id and password to publish and retrieve the correct ip addresses.

*Mabye an example explains it better.*
<br>You have an architecture (let's say server-client) that is supposed to be run in a local, dynamic network/environment. Unfortunately, the client cannot find the server through existing solutions (like broadcasts or multicasts) and you don't like typing ip addresses manually or hole punching your network.
<br>This means you need a *small*, *easy to host* web application that is freely accessible on the web by all your architecture participants. But because it's on the open web, you need password protection. And because the application may be moved to another location and clients may vary, you need a fixed id that is reserved and can be shipped to the client.

A tangible example would be a server on a local machine and a web application that requires data from the local machine. The web application needs to directly access the local machine, but is unable to find it's ip address (multicasts are disabled within the browser sandbox). Now you can take a small detour with this application, retrieve the needed ip address and directly communicate with your local server.

## About internal architectures and made decisions
> ToDo

## API documentation

Some general things to consider, before going into the details:
- less is more. *localip-pub* tries to minify the amount of endpoints. If not specified, all endpoints are `POST`.
- JSON is the only supported body content type. Make sure to set the `Content-Type`-header to `application/json`, else the application won't work and you'll receive a `400` status code

Speaking of return values, you'll always get a meaningful status code and response JSON `{"info": "<info here>"}`, which are specified per endpoint below. The info always contains a string in case an error code occurs, `200`'s don't contain more information except when specified.

---

### `/` (GET)
*Check service availability.*

**Returns:**
- `200`, `info` contains 'hello localip-pub'

---

### `/create`
*Creates a new id to store an ip address.*

**Requires:**
```json
{
    "id": "<new_id>"
}
```

**Returns:**
- `200` on a successful id creation
- `409` if the id already exists

---

### `/update`
*Updates an id.*

**Requires:**
```json
{
    "id": "<id>",
    "ip_address": "<ip address>"
}
```

**Returns:**
- `200` on a successful update
- `400` if the passed ip address is not an ip address (both IPv4 and IPv6 are supported)
- `404` if the id does not exist

---

### `/retrieve`
*Gets the ip address to an id.*

**Requires:**
```json
{
    "id": "<id>"
}
```

**Returns:**
- `200` on a successful update, `info` contains the ip address
- `400` if the id does not exist

---
