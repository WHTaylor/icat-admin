const urls = {
  prod: 'icatisis.esc.rl.ac.uk',
  dev: 'icat-dev.isis.stfc.ac.uk'
};

const login = env => {
  cy.get('#serverInput').click().type(urls[env]);
  cy.contains('Login').click();
};

Cypress.Commands.add('login', (env) => {
  cy.visit('localhost:8080');
  login(env);
})

Cypress.Commands.add('loginNewServer', (env) => {
  cy.contains('Add new server').click();
  login(env);
})
