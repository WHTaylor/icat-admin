beforeEach(() => {
  cy.login('prod')
})

describe('Changing field marks it as modified, changing it back unmarks it', () => {
  it('passes', () => {
    cy.contains(/^Instrument$/).click();
    cy.contains("NIMROD").click().type("{backspace}{enter}");
    cy.get('td[class*=modified]').should('have.length', 1);
    cy.contains("NIMRO").click().type("D{enter}");
    cy.get('td[class*=modified]').should('have.length', 0);
  })
})

// Regression test for modifications being global, not per tab
describe('Changing field only affects active tab', () => {
  it('passes', () => {
    cy.contains(/^Instrument$/).click();
    cy.contains(/^Instrument$/).click();
    cy.contains("NIMROD").click().type("{backspace}{enter}");
    cy.get('td[class*=modified]').should('have.length', 1);
    cy.get('[class*="entityTab"] button').first().click();
    cy.get('td[class*=modified]').should('have.length', 0);
  })
})
