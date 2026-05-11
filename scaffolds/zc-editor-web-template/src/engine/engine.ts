import {Table} from "./model";
// import {model2} from "./mock2"
import {genCrud} from "./crud";

export function genSchema(model: Table[], tableId: string) {
  const table = model?.filter(i => i.id == tableId)[0]
  if (table == null) {
    return { type: "page" }
  }
  // const table = model2[4] as Table;
  // console.log(table)
  const schema = {
    type: "page",
    title: table.name,
    body: genCrud(table, model, {})
    // body: genCrud(table, model2)
  };
  console.log(schema);
  return schema;
}
