// Currently skipping these tests because the new ISIS ICAT dev server isn't connected to the internet

describe('Can login to both envs, and urls are saved', () => {
  it.skip('passes', () => {
    cy.login('prod')
    cy.contains('+').click();
    cy.loginNewServer('dev');
    cy.get('[class*="active"]').should('include.text', 'icat-dev');
    cy.get('header nav a').first().click();
    cy.get('[class*="active"]').should('include.text', 'icatisis');
    // Close the two open server tabs
    cy.get('header nav a').then(navLinks => {
      const numLinks = navLinks.length;
      cy.get('header nav a:first-child').trigger('mousedown', {buttons: 4})
        .then(() => {
          cy.get('header nav a:first-child').trigger('mousedown', {buttons: 4})
            .then(() => cy.get('header nav a').should('have.length', numLinks -2));
        });
    })
    cy.get('header nav a:first-child').click();
    cy.get('#serverInput option').should('have.length', 2);
  })
})

// Test for regression of issue fixed by 9b75e77
describe('Opening an entity on one server should not open it on another', () => {
  it.skip('passes', () => {
    cy.login('prod')
    cy.contains('+').click();
    cy.loginNewServer('dev');
    cy.openEntityByTyping('Facility');
    cy.get('header nav a').first().click();
    cy.get('[class*="active"]').should('include.text', 'icatisis');
    const tabs = cy.get('[class*="tabSwitcher"] button')
        .should('have.length', 0);
  })
})
