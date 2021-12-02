# icat-admin

A web application for convenient browsing and editing of ICAT data. See it in action [here](https://vigorous-lamarr-7b3487.netlify.app/login). Designed as an alternative to [ICAT Manager](https://github.com/icatproject/manager.icat-manager).

Still a WIP, but closing in on feature parity with ICAT Manager. Incoming things:

 - Show feedback to user after saving an edit, either successful or failure
 - Make filtering on >1 criteria work without having to know internals to prepend `e.`s
 - Validation and suggestions for editing
 - Ability to log in to multiple servers/as multiple users at the same time
 - Prefecthing next page of data
 - Prefetching on table button hover
 - Make 'type to open table' feature visible

## CLI Commands

Created with preact-cli, so uses the same set of commands to build/run.

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# build for production with minification
npm run build

# test the production build locally
npm run serve
```

For detailed explanation on how things work, checkout the [CLI Readme](https://github.com/developit/preact-cli/blob/master/README.md).
