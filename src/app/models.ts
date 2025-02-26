export type TruthTableMapping = {
  SourceColumn: string;
  DestinationColumn: string;
  DataType: string;
  ComplexType?: ComplexType;
};

export interface MappingRuleConfig {
  DestinationType: string;
  TruthTable: TruthTableMapping[];
}

export interface ComplexType {
  DestinationType: string;
  TruthTable: TruthTableMapping[];
}
