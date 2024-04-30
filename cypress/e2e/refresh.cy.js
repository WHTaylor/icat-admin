describe('Clicking the refresh button fetches the count', () => {
  it('passes', () => {
    cy.login('prod')
    cy.openEntityByTyping('Facility');
    cy.intercept("*count*").as("count");
    cy.get('button[title^=Refresh]').click();
    cy.wait("@count").then(assert.isOk);
  })
})
