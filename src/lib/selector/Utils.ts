export class Utils {
  public static deduplicateQueryFields(queryFields: Array<String>) {
    let deduplicationSet = new Set()
    let returnedArray = new Array()
    queryFields.forEach(element => {
      deduplicationSet.add(element);
    });
    deduplicationSet.forEach(element => {
      returnedArray.push(element);
    });
    return returnedArray;
  }
}
