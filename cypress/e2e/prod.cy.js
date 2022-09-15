// Login as anon on the prod ICAT server
beforeEach(() => {
    cy.visit('localhost:8080');
    cy.get('#serverInput').click().type('icatisis.esc.rl.ac.uk');
    cy.contains('Login').click();
})

describe('Investigations are accessible', () => {
  it('passes', () => {
    cy.contains(/^Investigation$/).click();
    let rows = cy.get('[class*="entityRow"]');
    rows.should('have.length', 50);
  })
})

describe('Can open a table by typing the entity name', () => {
  it('passes', () => {
    cy.contains('ICAT tables');
    cy.get('body').type('Facility{enter}');
    cy.contains(/^ISIS$/);
  })
})
