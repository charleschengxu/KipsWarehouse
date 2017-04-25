const supertest = require('supertest');
const chai = require('chai');
const utils = require('./utils.js');
const testToken = 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiaWF0IjoxNDg2MzI0NDI3LCJleHAiOjE1MDM2MDQ0Mjd9.gH5F3mxa_TNjgX7sBuTLjxGk0bsjlAHboiPdi0WAnPc'
var expect = chai.expect
var assert = chai.assert
var server = supertest.agent("http://localhost:3000");

const TIMEOUT = 30000 // 30 seconds, for Travis

/**
 * This test might be flaky because multiple API calls are not atomic.
 * To mitigate this issue, test on entries created just for tests
 */
describe('Items API Test', function() {

  it('Create new items and then delete it', function(done) {
    this.timeout(TIMEOUT);
    const itemName = 'itemMock' + Date.now()
    const count = 9999
    // create new item
    server.post('/api/items/' + itemName + '/' + count)
      .set('Authorization', testToken)
      .expect(200)
      .end(function(err, res) {
        expect(res.body.status).to.equal('success')
        expect(res.body.data.id).to.not.be.null
        const itemId = res.body.data.id
        // delete new item
        server.delete('/api/items/' + itemId)
          .set('Authorization', testToken)
          .end(function(err, res) {
            expect(res.body.status).to.equal('success')
            // read again to check it is deleted
            server.get('/api/items/')
              .set('Authorization', testToken)
              .expect(200)
              .end(function(err, res) {
                expect(res.body.status).to.equal('success')
                const item = res.body.data.find(function (o) {
                  return o.id == itemId
                })
                expect(!item).to.equal(true)
                done();
              });
          });
      });
  });

// TODO(cx15) failed tests
  it('Override an item and then read to check update succeeded', function(done) {
    this.timeout(TIMEOUT);
    const itemId = 9999;
    const update = {
      name: 'itemMock' + Date.now(),
      quantity: utils.getRandomInt(1000, 9999),
      model: 'kips favorite model',
      description: 'we love you kip',
      itemStatus: "ACTIVE",
      tags: ['resistor', 'test'],
    }
    // update the item with itemId
    server.put('/api/items/' + itemId)  
      .set('Authorization', testToken)
      .send(update)
      .expect(200)
      .end(function(err, res) {
        expect(res.body.status).to.equal('success')
        // read after write to varify new changes
        server.get('/api/items/?id=' + itemId)
          .set('Authorization', testToken)
          .expect(200)
          .end(function(err, res) {
            expect(res.body.status).to.equal('success')
            const item = res.body.data[0]
            const essense = ['name', 'quantity', 'model', 'description', 'itemStatus', 'tags']
            essense.forEach(function(element) {
              assert.deepEqual(item[element], update[element])
            });
            done();
          });
      });
  });



  it('Delta of quantity should be properly applied', function(done) {
    this.timeout(TIMEOUT);
    const itemId = 9999;
    const itemName = 'itemMock' + Date.now()
    const delta = utils.getRandomInt(10, 20)
    var oldCount = 0, newCount = 0;
    // read old quantity
    server.get('/api/items/')
      .set('Authorization', testToken)
      .expect(200)
      .end(function(err, res) {
        expect(res.body.status).to.equal('success')
        const item = res.body.data.find(function (o) {
          return o.id == itemId
        })
        oldCount = item.quantity
        // apply delta on quantity
        server.put('/api/items/' + itemId + '/' + delta)
          .set('Authorization', testToken)
          .expect(200)
          .end(function(err, res) {
            expect(res.body.status).to.equal('success')
            // read new quantity to varify
            server.get('/api/items/')
              .set('Authorization', testToken)
              .expect(200)
              .end(function(err, res) {
                const item = res.body.data.find(function (o) {
                  return o.id == itemId
                })
                expect(item.quantity).to.equal(Number(oldCount) + Number(delta))
                done();
              });
          })
      });
  });

});
