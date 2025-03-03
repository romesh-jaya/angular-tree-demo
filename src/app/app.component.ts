import { Component } from '@angular/core';
import { TreeNode } from 'primeng/api';
import * as OrdersInputSchema from './samples/orders-schema-input.json';
import * as OrdersSchemaExpectedOutput from './samples/orders-schema-expected-output.json';
import { MappingRuleConfig, TruthTableMapping } from './models';
import { HttpClient } from '@angular/common/http';
import {
  FileUploadControl,
  FileUploadValidators,
} from '@iplab/ngx-file-upload';

const OBJECT_TYPE = 'object';
const ARRAY_TYPE = 'array';
const JARRAY_TYPE = 'jarray';

type Connection = {
  inputSchemaAttribute: string;
  outputSchemaAttribute: string;
  type: string;
  inputSchemaParent: string;
  outputSchemaParent: string;
  outputSchemaParentNode?: TreeNode;
};

type DatatypeMap = {
  inputType: string;
  outputType: string;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  inputSchemaTreeData!: TreeNode[];
  expectedOutputSchemaTreeData!: TreeNode[];
  selectedPathInputSchema!: string;
  selectedPathExpectedOutputSchema!: string;
  selectedNodeExpectedOutputSchema?: TreeNode;
  selectedNodeExpectedInputSchema?: TreeNode;
  connections: Connection[] = [];
  mappingRuleConfigString = '';
  allowedMimeTypes = ['application/json'];
  datatypeMap: DatatypeMap[] = [
    { inputType: 'integer', outputType: 'int' },
    { inputType: 'number', outputType: 'long' },
    { inputType: 'boolean', outputType: 'bool' },
  ];
  inputJsonUploadControl = new FileUploadControl(
    {
      listVisible: true,
      discardInvalid: true,
      multiple: false,
      accept: this.allowedMimeTypes,
    },
    [FileUploadValidators.accept(this.allowedMimeTypes)]
  );

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.inputSchemaTreeData = this.populateTreeControl(OrdersInputSchema);
    this.expectedOutputSchemaTreeData = this.populateTreeControl(
      OrdersSchemaExpectedOutput
    );
  }

  populateTreeControl(schema) {
    let treeInput: TreeNode[] = [];
    let rootPropertyIndex = 0;

    const rootProperties = (schema as any).default.properties;
    for (let item in rootProperties) {
      if (rootProperties[item].type == OBJECT_TYPE) {
        const objectNode = this.getPropertiesAtFirstLevel(
          rootProperties[item].properties,
          `${rootPropertyIndex}-`,
          item
        );
        treeInput.push({
          key: `${rootPropertyIndex}`,
          label: item + ` (${OBJECT_TYPE})`,
          icon: 'pi pi-fw pi-inbox',
          data: item,
          children: objectNode,
          selectable: false,
        });
      } else if (rootProperties[item].type == ARRAY_TYPE) {
        if (
          rootProperties[item].items.length > 0 &&
          rootProperties[item].items[0].type == OBJECT_TYPE
        ) {
          const objectNode = this.getPropertiesAtFirstLevel(
            rootProperties[item].items[0].properties,
            `${rootPropertyIndex}-`,
            item
          );
          treeInput.push({
            key: `${rootPropertyIndex}`,
            label: item + ` (${ARRAY_TYPE})`,
            data: item,
            icon: 'pi pi-fw pi-server',
            children: objectNode,
            selectable: false,
          });
        }
      } else {
        treeInput.push({
          key: `${rootPropertyIndex}`,
          label: item,
          icon: 'pi pi-fw pi-file',
          data: item,
          type: rootProperties[item].type,
        });
      }
      rootPropertyIndex++;
    }

    return treeInput;
  }

  getPropertiesAtFirstLevel(properties, keyPrefix: string, pathPrefix: string) {
    let treeInput: TreeNode[] = [];
    let propertyIndex = 0;
    for (let item in properties) {
      if (
        properties[item].type != OBJECT_TYPE &&
        properties[item].type != ARRAY_TYPE
      ) {
        treeInput.push({
          key: `${keyPrefix}${propertyIndex}`,
          label: item,
          icon: 'pi pi-fw pi-file',
          data: `${pathPrefix} -> ${item}`,
          type: properties[item].type,
        });
        propertyIndex++;
      }
    }
    return treeInput;
  }

  onInputNodeSelect($event, isInputTree: boolean) {
    if (isInputTree) {
      this.selectedPathInputSchema = $event.node.data;
      this.selectedNodeExpectedInputSchema = $event.node;
    } else {
      this.selectedPathExpectedOutputSchema = $event.node.data;
      this.selectedNodeExpectedOutputSchema = $event.node;
    }
  }

  isConnectionValid() {
    let isInputParentOfArrayType = this.selectedNodeExpectedInputSchema?.parent
      ? this.isParentNodeOfGivenType(
          this.selectedNodeExpectedInputSchema?.parent,
          ARRAY_TYPE
        )
      : false;

    let isOutputParentOfArrayType = this.selectedNodeExpectedOutputSchema
      ?.parent
      ? this.isParentNodeOfGivenType(
          this.selectedNodeExpectedOutputSchema?.parent,
          ARRAY_TYPE
        )
      : false;

    if (
      (isInputParentOfArrayType && !isOutputParentOfArrayType) ||
      (!isInputParentOfArrayType && isOutputParentOfArrayType)
    ) {
      alert('Cannot connect Array type with non-Array type');
      return false;
    }

    return true;
  }

  onConnectClicked() {
    let sourcePathArray = this.selectedPathInputSchema.split(' -> ');
    let sourcePath = sourcePathArray[sourcePathArray.length - 1];
    let destinationPathArray =
      this.selectedPathExpectedOutputSchema.split(' -> ');
    let destinationPath = destinationPathArray[destinationPathArray.length - 1];

    // validations
    if (!this.isConnectionValid()) {
      return;
    }

    this.connections.push({
      inputSchemaAttribute: sourcePath,
      outputSchemaAttribute: destinationPath,
      type: this.selectedNodeExpectedOutputSchema?.type || '',
      inputSchemaParent:
        this.selectedNodeExpectedInputSchema?.parent?.data || '',
      outputSchemaParent:
        this.selectedNodeExpectedOutputSchema?.parent?.data || '',
      outputSchemaParentNode: this.selectedNodeExpectedOutputSchema?.parent,
    });

    // sort by Output Schema Parent
    this.connections.sort((a, b) =>
      a.outputSchemaParent.localeCompare(b.outputSchemaParent)
    );

    this.selectedPathExpectedOutputSchema = '';
    this.selectedPathInputSchema = '';
    if (this.selectedNodeExpectedOutputSchema) {
      // Don't allow the same output node to be selected again
      this.selectedNodeExpectedOutputSchema.selectable = false;
      this.selectedNodeExpectedOutputSchema.icon = 'pi pi-fw pi-check';
    }

    this.generateMappingRuleConfig();
  }

  onClearClicked() {
    this.connections = [];
    this.inputSchemaTreeData = this.populateTreeControl(OrdersInputSchema);
    this.expectedOutputSchemaTreeData = this.populateTreeControl(
      OrdersSchemaExpectedOutput
    );
    this.selectedPathExpectedOutputSchema = '';
    this.selectedPathInputSchema = '';
    this.selectedNodeExpectedInputSchema = undefined;
    this.selectedNodeExpectedOutputSchema = undefined;
  }

  isParentNodeOfGivenType(node: TreeNode, type: string) {
    return (node?.label?.indexOf(type) ?? -1) > -1;
  }

  generateMappingRuleConfig() {
    let retVal: { MappingRuleConfig: MappingRuleConfig } = {
      MappingRuleConfig: {
        TruthTable: [],
      },
    };

    // get connections grouped by output schema parent
    const groupedResults = this.groupBy(
      this.connections,
      (item) => item.outputSchemaParent
    );

    const keys = Object.keys(groupedResults);
    keys.forEach((key) => {
      let connectionsForKey = groupedResults[key];
      let childTruthTable: TruthTableMapping[] = [];
      // Find a sample connection to get the parent node type
      let sampleConnection = connectionsForKey[0];
      let isParentOfObjectType = sampleConnection.outputSchemaParentNode
        ? this.isParentNodeOfGivenType(
            sampleConnection.outputSchemaParentNode,
            OBJECT_TYPE
          )
        : false;
      let isParentOfArrayType = sampleConnection.outputSchemaParentNode
        ? this.isParentNodeOfGivenType(
            sampleConnection.outputSchemaParentNode,
            ARRAY_TYPE
          )
        : false;

      childTruthTable = this.populateChildTruthTable(
        connectionsForKey,
        isParentOfArrayType
      );

      // push the truth table at root level or nested level
      if (!key) {
        console.log('Mapping for root level: ', childTruthTable);
        retVal.MappingRuleConfig.TruthTable = childTruthTable;
      } else {
        console.log('Mapping for key: ', key, childTruthTable);

        let sourceColumnParent = '';

        if (isParentOfObjectType) {
          // purposely left empty to allow selecting nodes from any level
          sourceColumnParent = '';
        } else if (isParentOfArrayType) {
          sourceColumnParent = `$.${sampleConnection.inputSchemaParent}[*]`;
        } else {
          sourceColumnParent = `$.${sampleConnection.inputSchemaParent}`;
        }

        retVal.MappingRuleConfig.TruthTable.push({
          SourceColumn: sourceColumnParent,
          DestinationColumn: key,
          DataType: isParentOfObjectType ? OBJECT_TYPE : JARRAY_TYPE,
          ComplexType: {
            TruthTable: childTruthTable,
            ...(isParentOfArrayType && { Node: sourceColumnParent }),
            ...(isParentOfArrayType && { DataType: JARRAY_TYPE }),
          },
        });
      }
    });

    this.mappingRuleConfigString = JSON.stringify(retVal, null, 2);
  }

  populateChildTruthTable(
    connections: Connection[],
    isParentOfArrayType: boolean
  ) {
    let truthTable: TruthTableMapping[] = [];
    connections.forEach((connection) => {
      let sourceColumnChild = '';

      if (isParentOfArrayType) {
        sourceColumnChild = `$.${connection.inputSchemaAttribute}`;
      } else {
        sourceColumnChild =
          (connection.inputSchemaParent
            ? `$.${connection.inputSchemaParent}.`
            : '$.') + connection.inputSchemaAttribute;
      }

      truthTable.push({
        SourceColumn: sourceColumnChild,
        DestinationColumn: connection.outputSchemaAttribute,
        DataType: this.getMappedDataType(connection.type) ?? connection.type,
      });
    });

    return truthTable;
  }

  getMappedDataType(inputType: string) {
    let mappedType = this.datatypeMap.find(
      (item) => item.inputType == inputType
    );
    return mappedType?.outputType;
  }

  async onTestClicked() {
    let fileContent = '';
    if (this.inputJsonUploadControl.value.length > 0) {
      const documenturl = await this.readDocument(
        this.inputJsonUploadControl.value[0]
      );
      fileContent = <string>documenturl.url;
    }

    this.http
      .post('https://localhost:44358/api/HtApifuncconfig/TestTransformation', {
        mapperConfig: this.mappingRuleConfigString,
        inputJson: fileContent,
      })
      .subscribe(
        (val) => {
          console.log('TestTransformation', val);
        },
        (response) => {
          alert(response.error);
        }
      );
  }

  async readDocument(
    file: File
  ): Promise<{ file: any; url: string | ArrayBuffer }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({ file, url: reader.result || '' });
      };
      reader.onerror = (error: any) => {
        alert('unknownerrorwhilereadingfile');
        reject(error);
      };
      reader.readAsText(file);
    });
  }

  groupBy<T>(
    array: T[],
    keyGetter: (item: T) => string
  ): { [key: string]: T[] } {
    const map: { [key: string]: T[] } = {};
    array.forEach((item) => {
      const key = keyGetter(item);
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    });
    return map;
  }
}
