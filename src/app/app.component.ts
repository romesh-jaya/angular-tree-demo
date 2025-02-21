import { Component } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { NodeService } from './service/nodeservice';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  files!: TreeNode[];
  title = 'angular-blank-app';

  constructor(private nodeService: NodeService) {}

  ngOnInit() {
    this.nodeService.getFiles().then((data) => (this.files = data));
  }
}
