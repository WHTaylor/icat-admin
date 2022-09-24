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
    cy.openEntityByTyping('Facility');
    cy.contains(/^ISIS$/);
  })
})

describe('Fields can be edited', () => {
  it('passes', () => {
    cy.openEntityByTyping('Facility');
    cy.get('[class*="entityRow"]')
      .contains(/^ISIS$/)
      .click()
      .type('{selectAll}{backspace}changed{enter}');
    cy.get('[class*="entityRow"]')
      .contains(/^changed$/);
  })
})

describe('Read more works', () => {
  it('passes', () => {
    cy.openEntityByTyping('Facility');
    cy.get('[class*="entityRow"]')
      .contains('show more');

    cy.get('[class*="readMoreBtn"]').click();

    cy.get('[class*="entityRow"]')
      .contains('less');
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
