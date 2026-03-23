# LB 2

## Installation

### Install dependencies

`npm i`

### Run Docker containers

`docker compose up`

Detached: `docker compose up -d`

### Stop Docker containers

`docker compose down`

## Access project

<http://localhost:80>

## Users

The verification mail may be in the spam folder.

Since there is no default admin user we have added a test route to manage users. This route will be shown if the environment variable `ENVIRONMENT` is set to `dev`.
When it should be removed the files can be found in `src/routes/testRoutes.js` and `src/views/partials/header.js`.