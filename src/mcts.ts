export interface MCTSGameState {
  getNPlayers(): number;
  getCurrentPlayer(): number;
  applyAction(action: any): void;
  getLegalActions(): any[];
  clone(): MCTSGameState;
  isGameOver(): boolean;
  getValues(): number[]; // Array of results, one for each player
}

class MCTSNode {
  state: MCTSGameState;
  parent: MCTSNode | null;
  children: MCTSNode[];
  action: any | null;
  value: number;
  visits: number;

  constructor(state: MCTSGameState, parent: MCTSNode | null = null, action: any | null = null) {
    this.state = state;
    this.parent = parent;
    this.children = [];
    this.action = action;
    this.value = 0;
    this.visits = 0;
  }
}

export function mcts(rootState: MCTSGameState, timeLimitSeconds: number): any {
  const root = new MCTSNode(rootState);

  let i = 0;
  const startTime = Date.now();
  while (Date.now() - startTime < timeLimitSeconds * 1000) {
  // for (let i = 0; i < 100; i++) {
    i++;
    let node = root;
    
    while (!is_leaf(node)) {
      node = select(node);
    }

    if (node.visits === 0) {
      node = expand(node);
    }

    const values = simulate(node.state);
    // console.log(values);

    backpropagate(node, values);
  }
  console.log('MCTS iterations:', i);

  // root.children.forEach(child => console.log(child.action, child.value, child.visits));

  const bestChild = root.children.reduce((a, b) => (a.visits > b.visits ? a : b));
  return bestChild.action;
}

function is_leaf(node: MCTSNode): boolean {
  return node.children.length === 0;
}

function choice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function select(node: MCTSNode): MCTSNode {
  //  if any children are unvisited, return a random unvisited child
  const unvisitedChildren = node.children.filter(child => child.visits === 0);
  if (unvisitedChildren.length > 0) {
    return choice(unvisitedChildren);
  }

  // otherwise, calculate UCB1 for each child and return the child with the highest UCB1 value
  const ucb1Values = node.children.map(child => ucb1(node, child));
  const maxIndex = ucb1Values.indexOf(Math.max(...ucb1Values));
  return node.children[maxIndex];
}

function ucb1(parent: MCTSNode, child: MCTSNode): number {
  const exploitation = child.value / child.visits;
  const exploration = Math.sqrt(2 * Math.log(parent.visits) / child.visits);
  return exploitation + exploration;
}

function expand(node: MCTSNode): MCTSNode {
  const legalActions = node.state.getLegalActions();

  if (legalActions.length === 0 || node.state.isGameOver()) {
    return node;
  }
  
  for (const action of legalActions) {
    const childState = node.state.clone();
    childState.applyAction(action);
    node.children.push(new MCTSNode(childState, node, action));
  }

  return choice(node.children);
}

function simulate(state: MCTSGameState): number[] {
  let childState = state.clone();
  
  while (!childState.isGameOver()) {
    const legalActions = childState.getLegalActions();
    const action = choice(legalActions);
    childState.applyAction(action);
  }
  return childState.getValues();
}

function backpropagate(node: MCTSNode, values: number[]): void {
  let currentNode: MCTSNode | null = node;
  while (currentNode !== null) {
    currentNode.visits++;
    if (currentNode.parent !== null) {
      currentNode.value += values[currentNode.parent.state.getCurrentPlayer()];
    }
    currentNode = currentNode.parent;
  }
}