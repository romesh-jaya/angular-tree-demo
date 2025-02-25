export type TruthTable = {
  SourceColumn: string;
  DestinationColumn: string;
  DataType: string;
};

export interface MappingRuleConfig {
  DestinationType: string;
  TruthTable: TruthTable[];
}
