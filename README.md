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
- [Documentation](#documentation)
  - [Authentication methods](#authentication-methods)
  - [API endpoint reference](#api-endpoint-reference)
    - [`/` (GET)](#-get)
    - [`/create`](#create)
    - [`/update`](#update)
    - [`/retrieve`](#retrieve)
    - [`/jwt`](#jwt)
    - [`/invalidatejwt`](#invalidatejwt)


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

-  [x] protect reading/writing id's using passwords
-  [x] use JWTs for regular address updating
-  [x] add jwt requiring cooldown + modify jwt expire date
-  [ ] use bcrypt password hashing instead of sha256 for improved security and/or password salting
-  [ ] ad lifetime for id to free it after certain amount of time (infinite should also be possible)
-  [ ] overview on existing id's and their lifetime
-  [ ] easy deployment with docker and docker compose
-  [ ] some documentation in the source code

Possible features for post project completion could be:
- a password reset feature, connected to an email
- multiple sdk implementations for both publishing and retrieving ip addresses
- multiplattform cli for application usage from the command line

## A bit on the Why's
Basically *localip-sub* is a text-sharing application, where each text is secured with a pre-known id and password. So when starting a "server" and "client" that should communicate, but are unable to find each other (because of e.g. outer restrictions), they can use the set id and password to publish and retrieve the correct ip addresses.

*Mabye an example explains it better.*
<br>You have an architecture (let's say server-client) that is supposed to be run in a local, dynamic network/environment. Unfortunately, the client cannot find the server through existing solutions (like broadcasts or multicasts) and you don't like typing ip addresses manually or hole punching your network.
<br>This means you need a *small*, *easy to host* web application that is freely accessible on the web by all your architecture participants. But because it's on the open web, you need password protection. And because the application may be moved to another location and clients may vary, you need a fixed id that is reserved and can be shipped to the client.

A tangible example would be a server on a local machine and a web application that requires data from the local machine. The web application needs to directly access the local machine, but is unable to find it's ip address (multicasts are disabled within the browser sandbox). Now you can take a small detour with this application, retrieve the needed ip address and directly communicate with your local server.

## About internal architectures and made decisions
> ToDo

## Documentation

### Authentication methods

**TLDR;**
- password authentication with `id` and `password` is always possible, but more resource intensive
- for regular ip address updates and retrieves, use JWTs
- get a JWT at [`/jwt`](#jwt) by providing credential and a token mode
- possible token modes are *read* (only usable at [`/retrieve`](#retrieve)) and *write* (only usable at [`/update`](#update))
- tokens expire after 6 minutes
- when a *write*-token for an id was acquired, the id can only get updated with the token, not normal credentials
- the creation of *read*-tokens is limited to 6 tokens per minute
- *write*-tokens should be invalidated after usage

When creating a new id, you'll be required to define a password. This is to protect the stored ip from being changed by someone unauthorized. This means that you need to add your credentials for each update an retrieval. This is no problem when updating/retrieving the ip *once*, but as soon as you are planning to update/retrieve the ip regularly, you'll be better using a JWT.

JWTs are an alternate way of authentication. Instead of adding the id and password with every request, you simply add the JWT. By authenticating only once and proving that you already are authenticated by delivering the token, the system skips the (resource intensive) step of hashing and comparing passwords. You'll be able to update and retrieve ip addresses faster.

To create a JWT, use the [`/jwt`](#jwt) endpoint. Authenticate with id and password, and set a JWt mode. There are two available modes: *read* and *write*. *read*-tokens can only be used at [`/retrieve`](#retrieve), and *write*-tokens can only be used at [`/update`](#update). In addition, a *write*-token can be generated only once per id, while there are "infinite" *read*-tokens. Once a *write*-token has been generated, the id can only be updated through the valid jwt. Tokens last for 6 minutes. 

*read*-tokens stay valid over multiple application restarts, while *write*-tokens need to be created after every restart. To invalidate all existing tokens, modify the JWT secret.

### API endpoint reference
Some general things to consider, before going into the details:
- less is more. *localip-pub* tries to minify the amount of endpoints. If not specified, all endpoints are `POST`.
- JSON is the only supported body content type. Make sure to set the `Content-Type`-header to `application/json`, else the application won't work and you'll receive a non-`200` status code
- you'll always get a meaningful status code and response JSON `{"info": "<info here>"}` (specified per endpoint)
- `info` always contains some information in case of an error, `200`'s don't contain more information except when specified

The return JSON examples below are only returned on code `200`.

---

#### `/` (GET)
*Check service availability.*

**Returns:**
```json
{
    "info": "hello localip-pub"
}
```
- `200`, `info` contains 'hello localip-pub'

---

#### `/create`
*Creates a new id to store an ip address.*

**Requires:**
```json
{
    "id": "<new_id>",
    "password": "<password>"
}
```

**Returns:**
```json
{
    "info": "created new address '<new_id>'"
}
```
- `200` on a successful id creation
- `409` if the id already exists

---

#### `/update`
*Updates an id.*

**Requires:**
```json
// password authentication
{
    "id": "<id>",
    "password": "<password>",
    "ip_address": "<ip address>"
}
``` 

```json
// jwt authentication (write)
{
    "jwt": "<jwt>",
    "ip_address": "<ip address>"
}
```

**Returns:**
```json
{
    "info": "",
    "last_update": timestamp    // integer
}
```

- `200` on a successful update
- `400` invalid JSON object, invalid ip address
- `401` invalid authentication (id does not exist, wrong password, invalid jwt, wrong jwt mode)

---

#### `/retrieve`
*Gets the ip address to an id.*

**Requires:**
```json
// password authentication
{
    "id": "<id>",
    "password": "<password>",
}
``` 

```json
// jwt authentication (read)
{
    "jwt": "<jwt>",
}
```

**Returns:**
```json
{
    "info": "<ip address>",
    "last_update": timestamp    // integer
}
```

- `200` on a successful update
- `400` invalid JSON object
- `401` invalid authentication (id does not exist, wrong password, invalid jwt, wrong jwt mode)

---

#### `/jwt`
*Get a JWT for easier long-term updating/retrieving.*

**Requires:**
```json
// password authentication
{
    "id": "<id>",
    "password": "<password>",
    "mode": "<mode>"
}
``` 

**Returns:**
```json
{
    "info": "<jwt>"
}
```

- `200` successful jwt generation
- `400` invalid/unknown mode
- `401` invalid authentication
- `409` write jwt for id already exists

---

#### `/invalidatejwt`
*Invalidates a JWT for updating an id.*

**Requires:**
```json
// password authentication
{
    "id": "<id>",
    "password": "<password>",
    "jwt": "<mode>"
}
``` 

**Returns:**
```json
{
    "info": ""
}
```

- `200` successful jwt invalidation
- `400` jwt invalid, wrong token mode
- `401` invalid authentication

---
