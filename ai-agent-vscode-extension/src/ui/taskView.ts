import * as vscode from 'vscode';
import { ExtensionState, InstallationPlan, StepStatus } from '../types';

/**
 * Tree data provider for showing active tasks
 */
export class TaskViewProvider implements vscode.TreeDataProvider<TaskItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TaskItem | undefined | null | void> =
    new vscode.EventEmitter<TaskItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<TaskItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  constructor(private state: ExtensionState) {
    // Refresh view every 2 seconds when there are active plans
    setInterval(() => {
      if (this.state.installationPlans.size > 0) {
        this.refresh();
      }
    }, 2000);
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: TaskItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: TaskItem): Thenable<TaskItem[]> {
    if (!element) {
      // Root level - show all active plans
      const items: TaskItem[] = [];

      for (const [id, plan] of this.state.installationPlans) {
        const completed = plan.steps.filter(s => s.status === StepStatus.COMPLETED).length;
        const total = plan.steps.length;
        const progress = total > 0 ? `${completed}/${total}` : '';

        items.push(
          new TaskItem(
            `Installation ${id.split('-')[1]} (${progress})`,
            vscode.TreeItemCollapsibleState.Expanded,
            { plan }
          )
        );
      }

      if (items.length === 0) {
        items.push(
          new TaskItem(
            'No active tasks',
            vscode.TreeItemCollapsibleState.None,
            {}
          )
        );
      }

      return Promise.resolve(items);
    } else if (element.contextValue?.plan) {
      // Show steps for this plan
      const plan = element.contextValue.plan;
      const items = plan.steps.map(step => {
        const icon = this.getStatusIcon(step.status);
        return new TaskItem(
          `${icon} ${step.action} ${step.tool}`,
          vscode.TreeItemCollapsibleState.None,
          { step }
        );
      });

      return Promise.resolve(items);
    }

    return Promise.resolve([]);
  }

  private getStatusIcon(status: StepStatus): string {
    switch (status) {
      case StepStatus.COMPLETED:
        return '✓';
      case StepStatus.IN_PROGRESS:
        return '⏳';
      case StepStatus.FAILED:
        return '✗';
      case StepStatus.PENDING:
        return '○';
      default:
        return '○';
    }
  }
}

class TaskItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly contextValue?: any
  ) {
    super(label, collapsibleState);
  }
}
