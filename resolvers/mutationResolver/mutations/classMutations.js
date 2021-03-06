const validators = require("./validateFunctions");
const logger = require("../../../config/winston");

// function classMutations(database, mutation, field, schemaMapping, objectsFromSchemaObjectTree) {
function classMutations(database, schemaMapping, tree, field) {
    return async (args, req) => {
        logger.info("Class mutation was called");
        // console.log(util.inspect(req, false, null, true)); 

        // Add type and inffered types
        updateTypes(req, schemaMapping, field);
        // VALIDATION
        validators.validate(req, schemaMapping, tree, field);
        // db push object
        if(req.type === "PUT"){
            await database.pushObjectToBackend(req.input, schemaMapping, req.source);
        }

        return true;
    };
}

const updateTypes = (req, schemaMapping, field) => { 
    let objectName = field.name.value;
    let uri = schemaMapping["@context"][objectName];
    req.input["_type"] = objectName;
    if(schemaMapping["@graphMap"][uri]){
        let listOfSubTypes = schemaMapping["@graphMap"][uri]["http://www.w3.org/2000/01/rdf-schema#subClassOf"];
        for(let type of listOfSubTypes){
            let typeName = schemaMapping["@revContext"][type["@id"]];
        }
    }
};
 
module.exports = classMutations;