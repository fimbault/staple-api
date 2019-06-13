const express = require('express');
const bodyParser = require('body-parser');
const jsonld = require('jsonld');
const N3 = require('n3');
const graphqlHttp = require('express-graphql');
const { makeExecutableSchema } = require('graphql-tools');

const { DataFactory } = N3;
const { namedNode } = DataFactory;
const store = new N3.Store();

const app = express();

app.use(bodyParser.json());


async function getObjs(sub, pred) {
        const res = await store.getQuads(namedNode(sub), namedNode(pred), null);
        const list = await res.map(data => data.object.value);
        // console.log("getObjs")
        // console.log(list);
        if(list === []){
            return null;
        }
        return list;
};

async function getSingleStringValue(sub, pred) {
        const res = await store.getQuads(namedNode(sub), namedNode(pred), null);
        const list = await res.map(data => data.object.value);
        // console.log("getSingleStringValue")
        // console.log(list);
        const quoted_val = list[0];
        const val = quoted_val.replace('"', '').replace('"', '');
        if(val === ''){
            return null;
        }
        return val;
};


async function getSubs(type) {
    const predicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
        const res = await store.getQuads(null, namedNode(predicate), namedNode(type));
        const list = await res.map(data => data.subject.value);
        // console.log("getSubs")
        // console.log(list);
        if(list === []){
            return null;
        }
        return list;
};


// resolvers


var rootResolver = {
    Query: {
        Person_GET: () =>{
            return getSubs("http://schema.org/Person");
        },
        Organization_GET: () =>{
            return getSubs("http://schema.org/Organization");
        }
    },
    Person: {
        _id: (parent) => {return parent},
        name: (parent) => { return getSingleStringValue(parent, "http://schema.org/name") },
        affiliation: (parent) => { return getObjs(parent, "http://schema.org/affiliation") }
        },
    Organization: {
        _id: (parent) => {return parent},
        legalName: (parent) => { return getSingleStringValue(parent, "http://schema.org/legalName") },
        employee: (parent) => { return getObjs(parent, "http://schema.org/employee") }
        }
    }


// schema

schemaString = `
        type Query {
            Person_GET: [Person]
            Organization_GET: [Organization]
        }
        type Organization {
            _id: ID!
            legalName: String
            employee: [Person]
        }
        type Person {
            _id: ID!
            name: String
            affiliation: [Organization]
        }
        `

//initGraphQL server with makeExecutableSchema() which is the critical bit 
//istnieja pewnie inne sposoby inicjalizacji serwera i moze bedziemy szukac innych, ale ten dziala jak na chwilowe potrzeby ;)

const schema = makeExecutableSchema({
  typeDefs:schemaString,
  resolvers:rootResolver,
});

app.use('/graphql', graphqlHttp({
    schema: schema,
    graphiql: true,
}));



app.get('/', async (req,res,next) => {
    const mickey = await store.getQuads(namedNode('http://data/bluesB'), null, null);
    const list = await mickey.map(data => data.object.value);

    res.send("FOUND: " + list.length + " records<br><br>" + JSON.stringify(list))
})


app.post('/api/upload',async (req, res) => {
    try {
        const todo = req.body;
        const rdf = await jsonld.toRDF(todo, {format: 'application/n-quads'});
        console.log(rdf);
        const parser = new N3.Parser();
        const quads = parser.parse(rdf);
        await quads.forEach( quad => store.addQuad(quad))

    } catch (error) {
        return res.status(500).send({
            success: 'false',
            message:  error
        })
    }
    return res.status(201).send({
        success: 'true',
        message: 'added successfully'
    })
});

app.listen(3000);

module.exports = {
    app
};