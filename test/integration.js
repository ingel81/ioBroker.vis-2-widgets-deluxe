const path = require('path');
const { tests } = require('@iobroker/testing');

// Skip integration tests for vis-2 widget adapters
// These adapters don't have a main.js file as they are pure UI widgets
describe('Adapter integration tests', () => {
    it('Integration tests are skipped for vis-2 widget adapters', function() {
        this.skip();
    });
});