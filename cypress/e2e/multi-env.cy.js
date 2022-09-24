describe('Can login to both envs, and urls are saved', () => {
  it('passes', () => {
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
