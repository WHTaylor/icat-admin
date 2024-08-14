# icat-admin

A web application for convenient browsing and editing of ICAT data. See it in action [here](https://icatadmin.netlify.app). Designed as an alternative to [ICAT Manager](https://github.com/icatproject/manager.icat-manager).

## Development

icat-admin uses yarn for dependency management. To run locally, use:

``` bash
# install dependencies to node_modules
yarn install

# serve with hot reload at localhost:8080
yarn dev

# build for production with minification
yarn build

# run the production build locally
yarn preview
```

Alternatively, launch the app with docker:

```
docker build .
docker run --init -p 8080:8080
```

 - There is a small suite of end to end tests which can be run using `yarn e2e`. Use `yarn cypress open` for interactive test running during development.
 - I'd like to keep the main code free of eslint errors and warnings. Run eslint using `yarn eslint src`.
 - Pushes to the `master` branch of https://github.com/wonkySpecs/icat-admin will trigger a netlify deployment to https://icatadmin.netlify.app.
 
