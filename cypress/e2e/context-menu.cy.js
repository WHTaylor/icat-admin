// Login as anon on the prod ICAT server
beforeEach(() => {
  cy.login('prod')
})

describe('Open one-many related works', () => {
  it('passes', () => {
    cy.openEntityByTyping('Facility');
    cy.get('[class*="entityRow"]').trigger('contextmenu');
    cy.get('div[class*="contextMenu"]').contains('investigations').then(i => i.click());
    // Close the facility tab so we can easily get the filter input of the new tab
    cy.get('[class*="tabSwitcher"] button').first().trigger('mousedown', {buttons: 4});
    cy.get('[class*="filterInput"]').should('have.value', "facility.id = 1");
  })
})

describe('Open many-one related works', () => {
  it('passes', () => {
    cy.openEntityByTyping('Instrument');
    cy.get('[class*="entityRow"]').first().trigger('contextmenu');
    cy.get('div[class*="contextMenu"]').contains('facility').then(i => i.click());
    // Close the instrument tab so we can easily get the filter input of the new tab
    cy.get('[class*="tabSwitcher"] button').first().trigger('mousedown', {buttons: 4});
    cy.get('[class*="filterInput"]').should('have.value', "id = 1");
  })
})

