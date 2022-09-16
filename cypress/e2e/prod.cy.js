// Login as anon on the prod ICAT server
beforeEach(() => {
  cy.login('prod')
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
    cy.contains(/^Facility$/);
    // Typing too fast makes this flaky, so delay between characters (default is 10).
    // Seems like cypress has some heisenbugs with this kind of thing, ie.
    // https://github.com/cypress-io/cypress/issues/5480
    cy.get('body').type('Facility{enter}', {delay: 50});
    cy.contains(/^ISIS$/);
  })
})

// We don't test opening _all_ tables, because around the 80% mark they get quite slow
describe('Can open many tables at once', () => {
    it('passes', () => {
      const buttons = cy.get('.leftColumn ul li:nth-child(odd) button');
      buttons.should('have.length.greaterThan', 0);
      const numButtons = buttons.click({multiple: true})
        .then($b => {
          const tabs = cy.get('[class*="tabSwitcher"] button');
          tabs.should('have.length', $b.length);
        });
    })
})
