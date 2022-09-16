const urls = {
  prod: 'icatisis.esc.rl.ac.uk',
  dev: 'icat-dev.isis.stfc.ac.uk'
};

const login = env => {
  cy.get('#serverInput').click().type(urls[env]);
  cy.contains('Login').click();
  cy.contains('ICAT tables');
};

Cypress.Commands.add('login', (env) => {
  cy.visit('/');
  login(env);
})

Cypress.Commands.add('loginNewServer', (env) => {
  cy.contains('Add new server').click();
  login(env);
})
