//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//
require('dotenv').config();

const fs = require('fs');
const govukPrototypeKit = require('govuk-prototype-kit')
const commodities = require('./data/commodities/commodities');
const { default: axios } = require('axios');

const router = govukPrototypeKit.requests.setupRouter()

const descriptions = fs.readFileSync(`${__dirname}/../descriptions.txt`).toString().split("\n");

const searchApiBase = process.env["SEARCH_API_BASE"] || "http://127.0.0.1:5000";
const searchApiSecretKey = process.env["SEARCH_API_SECRET_KEY"]

// Add your routes here
router.get('/new-product', async (request, response) => {
    request.session.data.description = descriptions[Math.floor(Math.random() * descriptions.length)];

    const result = await axios.post(`${searchApiBase}/fpo-code-search`, {
            description: request.session.data.description,
            digits: 8
        }, {
            headers: {
                'X-Api-Key': searchApiSecretKey,
            }
        }
    )

    const searchResults = await result.data;

    if(searchResults["results"].length > 0) {
        const searchResult = searchResults["results"][0];

        const commodity = commodities.findSubheading(searchResult.code);

        request.session.data.searchResult = {
            code: searchResult.code,
            score: searchResult.score.toFixed(1),
            commodity: commodity,
            hierarchy: commodities.expandHierarchy(commodity).filter(c => c.description.toLowerCase() != 'other').reverse(),
        }

        console.log(request.session.data.searchResult)
    } else {
        request.session.data.searchResult = null;
    }

    const result6 = await axios.post(`${searchApiBase}/fpo-code-search`, {
            description: request.session.data.description,
            digits: 8
        }, {
            headers: {
                'X-Api-Key': searchApiSecretKey,
            }
        }
    )

    response.redirect('product')
})

router.post('/product-answer', async (request, response) => {
    const isCodeCorrect = request.session.data.isCodeCorrect;

    if(isCodeCorrect == 'yes') {
        response.redirect('/answer-yes');
    } else if(isCodeCorrect == 'maybe') {
        response.redirect('/answer-maybe');
    } else if(isCodeCorrect == 'no')  {
        response.redirect('/answer-no');
    }
});