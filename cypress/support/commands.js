const urls = {
  prod: 'icatisis.esc.rl.ac.uk',
  dev: 'icat-dev.isis.stfc.ac.uk'
};

const login = env => {
  cy.get('#serverInput').click().type(urls[env]);
  cy.contains('Login').click();
  cy.contains('ICAT tables');
};

Cypress.Commands.add('login', env => {
  cy.visit('/');
  login(env);
})

Cypress.Commands.add('loginNewServer', env => {
  cy.contains('Add new server').click();
  login(env);
})

Cypress.Commands.add('openEntityByTyping', entity => {
    // Typing too fast makes this flaky, so delay between characters (default is 10).
    // Seems like cypress has some heisenbugs with this kind of thing, ie.
    // https://github.com/cypress-io/cypress/issues/5480
    cy.get('body').type(`${entity}{enter}`, {delay: 50});
})
