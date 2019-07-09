const read_graphy = require('graphy').content.nt.read;
const dataset_tree = require('graphy').util.dataset.tree
const factory = require('@graphy/core.data.factory');
const schemaMapping = require('../schema/schema-mapping');


// IN URI OR LITERAL -> OUT -> Literal or URI or Quad or Boolean
class Database {
    constructor() {
        this.database = dataset_tree();
        this.stampleDataType = "http://staple-api.org/datamodel/type";
    }

    // ---
    create(sub, pred, obj, gra = null) {
        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object") {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);

        let quad = factory.quad(sub, pred, obj, gra);

        this.database.add(quad);
        return true;
    }

    // ---  
    delete(sub, pred, obj, gra = null) {

        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object" && obj !== undefined) {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);

        // remove all objects of specyfic type
        if (obj === undefined) {
            const temp = this.database.match(sub, pred, null);
            var itr = temp.quads();
            var x = itr.next();
            while (!x.done) {
                this.database.delete(x.value);
                x = itr.next();
            }
        }
        // remove one specyfic object of specyfic type
        else {
            let quad = factory.quad(sub, pred, obj, gra)
            this.database.delete(quad);
        }
    }

    // returns boolean 
    deleteID(id) {
        id = factory.namedNode(id);

        let removed = false;
        var temp = this.database.match(id, null, null);
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            this.database.delete(x.value);
            removed = true;
            x = itr.next();
        }

        temp = this.database.match(null, null, id);
        itr = temp.quads();
        x = itr.next();
        while (!x.done) {
            this.database.delete(x.value);
            removed = true;
            x = itr.next();
        }
        return removed;
    }

    // Array of uri
    getObjectsValueArray(sub, pred) {

        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.database.match(sub, pred, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value.object.value);
            x = itr.next();
        }
        return data;
    };

    // Array of uri
    isTripleInDB(sub, pred, obj, gra = null) {

        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);
        if (typeof (obj) !== "object" && obj !== undefined) {
            obj = factory.namedNode(obj);
        }
        gra = factory.namedNode(gra);


        let quad = factory.quad(sub, pred, obj, gra);

        return this.database.has(quad)
    };


    // Array of Quads
    getTriplesBySubject(sub) {

        sub = factory.namedNode(sub);

        const temp = this.database.match(sub, null, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value);
            x = itr.next();
        }
        return data;
    };


    // returns single object value - uri or data
    getSingleStringValue(sub, pred) {

        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.database.match(sub, pred, null);
        var itr = temp.quads();
        var x = itr.next();

        return x.value.object.value;
    };



    // returns single object value - data
    getSingleLiteral(sub, pred) {

        sub = factory.namedNode(sub);
        pred = factory.namedNode(pred);

        const temp = this.database.match(sub, pred, null);
        var itr = temp.quads();
        var x = itr.next();

        return x.value.object;
    };

    // returns array of uri
    getSubjectsByType(type, predicate = "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {

        type = factory.namedNode(type);
        predicate = factory.namedNode(predicate);
        const temp = this.database.match(null, predicate, type);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value.subject.value);
            x = itr.next();
        }
        return data;
    };

    getAllQuads() {
        const temp = this.database.match(null, null, null);
        let data = [];
        var itr = temp.quads();
        var x = itr.next();
        while (!x.done) {
            data.push(x.value);
            x = itr.next();
        }
        return data;
    };

    drop() {
        this.database.clear();
    }


    insertRDF(rdf, ID) {
        //console.log(`inserting rdf data`)
        const constr = (tree, ID) => {
            let data = (y_quad) => {
                if (y_quad.subject.value === ID) {
                    if (y_quad.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                        y_quad.predicate.value = "http://staple-api.org/datamodel/type"
                    }

                    tree.add(y_quad);

                }
            }

            let eof = (h_prefixes) => {
                //console.log("Done");
            }

            read_graphy(rdf, { data, eof, })
        }

        constr(this.database, ID);
    }

    removeRDF(rdf, ID) {
        //console.log(`removing rdf data`);
        const constr = (tree, ID) => {
            let data = (y_quad) => {
                if (y_quad.subject.value === ID) {
                    if (y_quad.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type") {
                        y_quad.predicate.value = "http://staple-api.org/datamodel/type"
                    }

                    tree.delete(y_quad);
                }
            }

            let eof = (h_prefixes) => {
                //console.log("Done");
            }

            read_graphy(rdf, { data, eof, })
        }

        constr(this.database, ID);
    }

    updateInference() {
        // remove all staple : datatype but not Thing 
        // ...

        let temp = this.database.match(null, null, null);
        let itr = temp.quads();
        let itrData = itr.next();
        while (!itrData.done) {
            if (itrData.value.predicate.value === this.stampleDataType && itrData.value.object.value !== schemaMapping["@context"]['Thing']) {
                // console.log(`deleted \n ${x.value}`)
                // console.log(x.value)
                this.database.delete(itrData.value);
            }
            itrData = itr.next();
        }

        // get all quads and foreach type put inferences .... store in array types already putted to db
        temp = this.database.match(null, null, null);
        itr = temp.quads();
        itrData = itr.next();
        let added = []
        let addedQuads = []

        while (!itrData.done) {
            if (itrData.value.predicate.value === "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && added.filter(x => x === itrData.value.object.value).length === 0) {
                let data = schemaMapping["@graph"].filter((x) => { return x['@id'] === itrData.value.object.value })
                
                for (let key in data) {
                    console.log(itrData.value.object.value)
                    let uris = data[key]["http://www.w3.org/2000/01/rdf-schema#subClassOf"];

                    for (let x in uris) {
                        this.create(itrData.value.subject.value, this.stampleDataType, uris[x]['@id'])
                        addedQuads.push(`${itrData.value.subject.value}, ${this.stampleDataType}, ${uris[x]['@id']}`)
                    }

                    added.push(itrData.value.object.value);
                }
            }
            itrData = itr.next();
        }

        console.log(addedQuads)
        console.log("\n\n")

    }
}

module.exports = Database