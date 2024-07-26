const { parse } = require('csv-parse/sync');
const fs = require('fs');

const rawCommodities = parse(fs.readFileSync(__dirname + `/commodities.csv`), {
    columns: true,
    skip_empty_lines: true
  })
  "SID","Commodity code","Product line suffix","Start date","End date","Indentation","End line","Description","Class","ItemIDPlusPLS","Hierarchy"
const commodities = {}

for(rawCode of rawCommodities) {
    const newCode = {
        code: rawCode["Commodity code"],
        suffix: rawCode["Product line suffix"],
        description: rawCode["Description"],
        hierarchy: rawCode["Hierarchy"].split(',').map(ancestor => {
            const [ancestor_code, ancestor_suffix] = ancestor.split('_');
            return { code: ancestor_code, suffix: ancestor_suffix }
        })
    }

    if(commodities[rawCode["Commodity code"]]) {
        commodities[rawCode["Commodity code"]].push(newCode);
    } else {
        commodities[rawCode["Commodity code"]] = [newCode];
    }
}

const findSubheading = (code, suffix) => {
    return findCommodity(`${code}`.padEnd(10, '0'), suffix);
}

const findCommodity = (code, suffix) => {
    const commodity = commodities[code];

    if(suffix) {
        console.log(code, suffix, commodity.find(c => c.suffix == suffix))
        return commodity.find(c => c.suffix == suffix)
    }

    if(commodity && commodity.length > 0) {
        return commodity[0]
    }

    return null;
}

const expandHierarchy = (commodity) => {

    if(!commodity?.hierarchy)
        return []

    return commodity.hierarchy
        .map(ancestor => findCommodity(ancestor.code, ancestor.suffix))
        .filter(ancestor => !!ancestor)
}

module.exports = {
    findSubheading,
    findCommodity,
    expandHierarchy,
}