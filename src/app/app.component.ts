import { Component } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { NodeService } from './service/nodeservice';
import * as OrdersSchema from './orders-schema.json';

const OBJECT_TYPE = 'object';
const ARRAY_TYPE = 'array';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  selectedInputNode!: TreeNode;
  files!: TreeNode[];
  title = 'angular-blank-app';

  constructor(private nodeService: NodeService) {}

  ngOnInit() {
    let treeInput: TreeNode[] = [];
    let rootPropertyIndex = 0;

    const rootProperties = (OrdersSchema as any).default.properties;
    for (let item in rootProperties) {
      if (rootProperties[item].type == OBJECT_TYPE) {
        const objectNode = this.getPropertiesAtFirstLevel(
          rootProperties[item].properties,
          `${rootPropertyIndex}-`
        );
        treeInput.push({
          key: `${rootPropertyIndex}`,
          label: item + ' (object)',
          icon: 'pi pi-fw pi-inbox',
          children: objectNode,
        });
      } else if (rootProperties[item].type == ARRAY_TYPE) {
        if (
          rootProperties[item].items.length > 0 &&
          rootProperties[item].items[0].type == OBJECT_TYPE
        ) {
          const objectNode = this.getPropertiesAtFirstLevel(
            rootProperties[item].items[0].properties,
            `${rootPropertyIndex}-`
          );
          treeInput.push({
            key: `${rootPropertyIndex}`,
            label: item + ' (array)',
            icon: 'pi pi-fw pi-server',
            children: objectNode,
          });
        }
      } else {
        treeInput.push({
          key: `${rootPropertyIndex}`,
          label: item,
          icon: 'pi pi-fw pi-file',
        });
      }
      rootPropertyIndex++;
    }

    this.files = treeInput;
  }

  getPropertiesAtFirstLevel(properties, keyPrefix: string) {
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
        });
        propertyIndex++;
      }
    }
    return treeInput;
  }

  onInputNodeSelect($event) {
    console.log(`${$event.node.key} selected`);
  }
}
