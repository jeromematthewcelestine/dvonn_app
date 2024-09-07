import { CellState } from "./DvonnGame";


function findIslands(board: CellState[][]): number[][][] {
  // console.log('findIslands');
  if (!board.length) {
    // console.log('no board');
    return [];
  }

  const rows = board.length;
  const cols = board[0].length;
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const islands: number[][][] = [];

  // console.log('rows', rows);
  // console.log('cols', cols);

  const directions: [number, number][] = [
    [-1, 0], [1, 0], [0, -1], [0, 1],   // up, down, left, right
    [1, -1], [-1, 1]  // diagonals
  ];

  function dfs(startRow: number, startCol: number): number[][] {
    const stack: [number, number][] = [[startRow, startCol]];
    const island: number[][] = [];

    while (stack.length) {
      const [row, col] = stack.pop()!;

      if (
        row >= 0 && row < rows &&
        col >= 0 && col < cols &&
        (board[row][col].type === 0 || board[row][col].type === 1 || board[row][col].type === 2) &&
        !visited[row][col]
      ) {
        visited[row][col] = true;
        island.push([row, col]);

        for (const [dx, dy] of directions) {
          stack.push([row + dx, col + dy]);
        }
      }
    }

    return island;
  }

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      // console.log('i', i);
      // console.log('j', j);
      // console.log('board[i][j]', board[i][j]);
      if ((board[i][j].type === 0 || board[i][j].type === 1 || board[i][j].type === 2) && !visited[i][j]) {
        // console.log('new island', i, j);
        const newIsland = dfs(i, j);
        if (newIsland.length) {
          islands.push(newIsland);
        }
      }
    }
  }

  return islands;
}

export { findIslands };
