describe('Can login to both envs, and urls are saved', () => {
  it('passes', () => {
    cy.login('prod')
    cy.contains('ICAT tables');
    cy.contains('+').click();
    cy.loginNewServer('dev');
    cy.contains('ICAT tables');
    cy.get('[class*="active"]').should('include.text', 'icat-dev');
    cy.get('header nav a').first().click();
    cy.get('[class*="active"]').should('include.text', 'icatisis');

    cy.get('header nav a').first().trigger('mousedown', {buttons: 4});
    cy.get('header nav a').first().trigger('mousedown', {buttons: 4});
    cy.get('header nav a').first().click();
    cy.get('#serverInput option').should('have.length', 2);
  })
})
