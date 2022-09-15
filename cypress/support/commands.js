const urls = {
    prod: 'icatisis.esc.rl.ac.uk',
    dev: 'icat-dev.isis.stfc.ac.uk'
};

Cypress.Commands.add('login', (env) => {
    cy.visit('localhost:8080');
    cy.get('#serverInput').click().type(urls[env]);
    cy.contains('Login').click();
})
