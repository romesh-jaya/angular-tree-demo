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
        console.log(`${item} is object`);
      } else if (rootProperties[item].type == ARRAY_TYPE) {
        console.log(`${item} is array`);
      } else {
        console.log(`${item} is property`);

        treeInput.push({
          key: `${rootPropertyIndex}`,
          label: item,
          icon: 'pi pi-fw pi-file',
        });
        rootPropertyIndex++;
      }
    }

    this.files = treeInput;
  }

  onInputNodeSelect($event) {
    console.log(`${$event.node.key} selected`);
  }
}
