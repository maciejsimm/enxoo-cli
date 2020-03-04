export interface Query{
    sObjectName: string;
    countQuery?: string;
    finalQuery?: String;
    numberOfRecords?: Number;
    queryBegining?: string;
    queryConditions?: string;
    objectsList?: Set<String>;
}