export type TruthTableMapping = {
  SourceColumn: string;
  DestinationColumn: string;
  DataType: string;
  ComplexType?: ComplexType;
};

export interface MappingRuleConfig {
  TruthTable: TruthTableMapping[];
}

export interface ComplexType {
  TruthTable: TruthTableMapping[];
}
