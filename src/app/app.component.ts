import { Component } from '@angular/core';
import { TreeNode } from 'primeng/api';
import * as OrdersInputSchema from './orders-schema-input.json';
import * as OrdersSchemaExpectedOutput from './orders-schema-expected-output.json';
import { MappingRuleConfig } from './models';
import { HttpClient } from '@angular/common/http';
import {
  FileUploadControl,
  FileUploadValidators,
} from '@iplab/ngx-file-upload';

const OBJECT_TYPE = 'object';
const ARRAY_TYPE = 'array';

type Connection = {
  inputPath: string;
  outputPath: string;
  type: string;
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
          label: item + ' (object)',
          icon: 'pi pi-fw pi-inbox',
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
            label: item + ' (array)',
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

    console.log('treeInput', treeInput);

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

  onInputNodeSelect($event, isInput: boolean) {
    if (isInput) {
      this.selectedPathInputSchema = $event.node.data;
    } else {
      this.selectedPathExpectedOutputSchema = $event.node.data;
      this.selectedNodeExpectedOutputSchema = $event.node;
    }
  }

  onConnectClicked() {
    this.connections.push({
      inputPath: this.selectedPathInputSchema,
      outputPath: this.selectedPathExpectedOutputSchema,
      type: this.selectedNodeExpectedOutputSchema?.type || '',
    });
    this.selectedPathExpectedOutputSchema = '';
    this.selectedPathInputSchema = '';
    if (this.selectedNodeExpectedOutputSchema) {
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
    this.selectedNodeExpectedOutputSchema = undefined;
  }

  generateMappingRuleConfig() {
    let retVal: { MappingRuleConfig: MappingRuleConfig } = {
      MappingRuleConfig: {
        DestinationType: 'HT.Shared.Models.JsonToJson.CustomerOrder',
        TruthTable: [],
      },
    };

    this.connections.forEach((connection) => {
      let sourcePath = connection.inputPath.split(' -> ').join('.');
      let destinationPath = connection.outputPath.split(' -> ').join('.');

      retVal.MappingRuleConfig.TruthTable.push({
        SourceColumn: '$.' + sourcePath,
        DestinationColumn: destinationPath,
        DataType: this.getMappedDataType(connection.type) ?? connection.type,
      });
    });

    this.mappingRuleConfigString = JSON.stringify(retVal, null, 2);
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
          console.log('POST call successful value returned in body', val);
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
}
