const supertest = require('supertest');
const chai = require('chai');
const utils = require('./utils.js');
const testToken = 'JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OSwiaWF0IjoxNDg2MzI0NDI3LCJleHAiOjE1MDM2MDQ0Mjd9.gH5F3mxa_TNjgX7sBuTLjxGk0bsjlAHboiPdi0WAnPc'
var expect = chai.expect
var assert = chai.assert
var server = supertest.agent("http://localhost:3000");

const TIMEOUT = 60000 // 60 seconds, for Travis

describe('Custom Fields on Items API Test', function() {

	it('Create new custom field, update it, put values onto items, then delete them all', function(done) {
		this.timeout(TIMEOUT);
		const fieldName = 'mock' + Date.now()
		const type = 'SHORT'
		const visibility = 'PRIVATE'
		//create new field
		server.post('/api/items/customFields/' + fieldName + '/' + type + '/' + visibility)
			.set('Authorization', testToken)
	    .expect(200)
	    .end(function(err, res) {
	    	expect(res.body.status).to.equal('success')
	    	expect(res.body.data.name).to.equal(fieldName)
	    	expect(res.body.data.type).to.equal(type)
	    	expect(res.body.data.visibility).to.equal(visibility)
	    	// write into the field just created
	    	const itemId = 9999
	    	let update = {}
	    	update[fieldName] = 'some crazy field value'
	    	server.put('/api/items/' + itemId)
	    		.set('Authorization', testToken)
	    		.send(update)
	    		.expect(200)
	    		.end(function(err, res) {
	    			expect(res.body.status).to.equal('success')
	    			expect(res.body.data[fieldName]).to.equal(update[fieldName])
	    			const anotherField = 'restock_info'
	    			update[anotherField] = 'some crazy field value 2'
	    			server.put('/api/items/' + itemId)
			    		.set('Authorization', testToken)
			    		.send(update)
			    		.expect(200)
			    		.end(function(err, res) {
			    			expect(res.body.status).to.equal('success')
			    			expect(res.body.data[fieldName]).to.equal(update[fieldName]) // prev value must persist
			    			expect(res.body.data[anotherField]).to.equal(update[anotherField])
								const newType = 'LONG'
								const newVisibility = 'PUBLIC'
									// update the field we just created
								server.put('/api/items/customFields/' + fieldName + '/' + newVisibility)
									.set('Authorization', testToken)
									.end(function(err, res) {
										expect(res.body.data.type).to.equal(type) //type cannot be updated
										expect(res.body.data.visibility).to.equal(newVisibility)
											// delete the field
										server.delete('/api/items/customFields/' + fieldName)
											.set('Authorization', testToken)
											.end(function(err, res) {
												done();
											})
									})
			    		})
	    		})
	    })
	})

})