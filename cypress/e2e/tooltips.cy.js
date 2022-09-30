beforeEach(() => {
  cy.login('prod')
})

describe('Error tooltip on unauthorized update', () => {
  it('passes', () => {
    cy.contains(/^Facility$/).click();
    cy.contains(/^ISIS$/)
      .click()
      .type('{selectall}changed{enter}');
    cy.get('button[title="Save changes"]').click();
    cy.contains("❌").trigger('mousemove');
    cy.contains("Forbidden");
  })
})
