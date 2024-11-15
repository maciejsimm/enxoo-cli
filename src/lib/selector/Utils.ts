export class Utils {
  private static MAX_SOQL_CHARACTER_LIMIT = 100000;

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

  public static splitArrayForQueryBatches<T>(query: string, array: T[]) {
    const batchCount = this.calculateQueryBatchesAmount(query);
    return this.splitArrayIntoParts(array, batchCount);
  }

  public static calculateQueryBatchesAmount(query: string) {
    if (!query) { throw new Error('Query string cannot be empty.') };
    return Math.ceil(query.length / this.MAX_SOQL_CHARACTER_LIMIT);
  }

  public static splitArrayIntoParts<T>(array: T[], numberOfParts: number) {
    if (numberOfParts <= 0) { throw new Error('Number of parts must be greater than zero.'); }
  
    const result: T[][] = [];
    const totalItems = array.length;
    const itemsPerPart = Math.ceil(totalItems / numberOfParts);
  
    for (let i = 0; i < totalItems; i += itemsPerPart) {
      const chunk = array.slice(i, i + itemsPerPart);
      result.push(chunk);
    }
    return result;
  }
}
