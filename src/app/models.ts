export type TruthTable = {
  SourcePath: string;
  DestinationPath: string;
  DataType: string;
};

export interface MappingRuleConfig {
  DestinationType: string;
  TruthTable: TruthTable[];
}
