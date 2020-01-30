var appRoot = require("app-root-path");
const logger = require(`${appRoot}/config/winston`);
const util = require("util");

async function loadQueryData(database, queryInfo, uri, page, inferred, tree) {
    database.dbCallCounter = 0; // debug only
    database.drop(); // clear db before new query.


    let coreIds = [];
    let resolverName = database.schemaMapping["@revContext"][uri];
    if (resolverName === undefined) {
        return;
    }

    let coreSelectionSet = queryInfo["selectionSet"];


    for (let coreSelection in coreSelectionSet["selections"]) {
        let selectionSet = coreSelectionSet["selections"][coreSelection];
        if (coreSelectionSet["selections"][0].name.value === "_OBJECT") {
            await database.loadCoreQueryDataFromDB(uri, page, selectionSet, inferred, tree);
            coreIds = await database.getSubjectsByType(uri, database.stampleDataType, inferred, page);
        }
        else if (resolverName == coreSelectionSet["selections"][coreSelection].name.value) {
            await database.loadCoreQueryDataFromDB(uri, page, selectionSet, inferred, tree);
            coreIds = await database.getSubjectsByType(uri, "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", inferred, page);
            await searchForDataRecursively(database, coreSelectionSet["selections"][coreSelection]["selectionSet"], coreIds, tree, false, resolverName);
        }
    }

    return coreIds;
}

async function searchForDataRecursively(database, selectionSet, uri, tree, reverse = false, parentName = undefined) {

    logger.info("searchForDataRecursively was called");
    logger.debug(`Started function searchForDataRecursively with args:
        \tselectionSet: ${selectionSet}
        \turi: ${util.inspect(uri, false, null, true /* enable colors */)}
        \ttree: ${tree}
        \treverse: ${reverse}
        \tQUADS : ${database.database.size}
        \tObjects : ${database.countObjects()}
        `);

    let name = undefined;
    for (let selection of selectionSet["selections"]) {


        if (selection.kind === "InlineFragment") {
            await searchForDataRecursively(database, selection["selectionSet"], uri, tree, false, parentName);
        }
        else if (selection["selectionSet"] !== undefined && selection.name !== undefined) {

            logger.debug("Looking for:");
            logger.debug(selection.kind);
            logger.debug(util.inspect(selection.name, false, null, true));

            name = selection.name.value;
            let newUris = [];
            let type = database.schemaMapping["@context"][name];

            if (type === "@reverse") {
                await searchForDataRecursively(database, selection["selectionSet"], uri, tree, true, parentName);
            }
            else {
                for (let id of uri) {
                    let data = [];
                    if (reverse) {
                        data = await database.getSubjectsValueArray(type, id);
                    }
                    else {

                        data = await database.getObjectsValueArray(id, type);
                        logger.debug("Asked for ID TYPE");
                        logger.debug(util.inspect(id, false, null, true));
                        logger.debug(util.inspect(type, false, null, true));
                    }

                    for (let x of data) {
                        // eslint-disable-next-line no-useless-escape
                        var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
                        if (pattern.test(x)) {
                            newUris.push(x);
                        }
                    }
                }

                newUris = [...new Set(newUris)];

                if (newUris.length > 0) {
                    await database.loadChildObjectsFromDBForUnion(newUris, selection, tree, parentName);

                    let newParentName = tree[parentName].data[name];
                    if (newParentName === undefined) {
                        newParentName = {};
                    }
                    if (newParentName.kind === "ListType") {
                        newParentName = newParentName.data.name;
                    }
                    else {
                        newParentName = newParentName.name;
                    }

                    await searchForDataRecursively(database, selection["selectionSet"], newUris, tree, false, newParentName);
                }

            }
        }
        else {
            logger.debug("Skiped object from query");
            logger.debug(selection.kind);
            logger.debug(util.inspect(selection.name, false, null, true));
        }
    }
}


module.exports = {
    loadQueryData,
    searchForDataRecursively,
};