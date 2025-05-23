// Login as anon on the prod ICAT server
beforeEach(() => {
  cy.login('prod')
})

describe('Open one-many related works', () => {
  it('passes', () => {
    cy.openEntityByTyping('Facility');
    cy.get('[class*="entityRow"]').trigger('contextmenu');
    cy.get('div[class*="contextMenu"]').contains('investigations').click();
    // Close the facility tab so we can easily get the filter input of the new tab
    cy.get('[class*="entityTab"] button').first().trigger('mousedown', {buttons: 4});
    cy.get('[class*="filterInput"]').should('have.value', "facility.id = 1");
  })
});

describe('Open many-one related works', () => {
  it('passes', () => {
    cy.openEntityByTyping('Instrument');
    cy.get('[class*="entityRow"]').first().trigger('contextmenu');
    cy.get('div[class*="contextMenu"]').contains('facility').click();
    // Close the instrument tab so we can easily get the filter input of the new tab
    cy.get('[class*="entityTab"] button').first().trigger('mousedown', {buttons: 4});
    cy.get('[class*="filterInput"]').should('have.value', "id = 1");
  })
});

// The data publication related entities have inconsistent names. Check that
// all links work.
describe('Data publication links work', () => {
  it('passes', () => {
    cy.openEntityByTyping('DataPublication');
    cy.get('[class*="entityRow"]').first().trigger('contextmenu');
    cy.get('li[class*="contextMenuRow"]')
      .then(rows => {
        const numRows = rows.length;
        cy.get("body").click(); // close context menu

        for (let i = 0; i < numRows; i++) {
          cy.get('[class*="entityRow"]').first().trigger('contextmenu', {force: true})
            .get('li[class*="contextMenuRow"]')
            .eq(i).click({force: true});
          cy.get('[class*="entityTab"]')
            .should('have.length', 2)
            .last().trigger('mousedown')
            .then(_ => {
              cy.get('.mainContentAndRightColumn')
                // TODO: We no longer display 'Loading', this needs to change
                .should('not.include.text', 'Loading')
                .last()
                .should('not.include.text', 'xception');
              cy.get('[class*="entityTab"] button').last().trigger('mousedown', {buttons: 4})
            });
        }
      });
  })
});