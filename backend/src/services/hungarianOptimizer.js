/**
 * Kuhn-Munkres (Hungarian) Optimization Algorithm
 * Problem Statement: PS10 - ResQFlow AI (Feature 3)
 * 
 * Solves the global minimum-weight bipartite matching problem in O(N^3).
 * Minimizes total weighted citywide emergency response time.
 */

class HungarianOptimizer {
  /**
   * Solves min-cost assignment on a cost matrix
   * @param {Array<Array<number>>} costMatrix - N x M matrix where costMatrix[i][j] is the cost of assigning task i to agent j
   * @returns {Array<number>} - Array of length N where result[i] is the index of agent assigned to task i (-1 if unassigned)
   */
  solveMinCost(costMatrix) {
    const numRows = costMatrix.length;
    if (numRows === 0) return [];
    const numCols = costMatrix[0].length;
    if (numCols === 0) return Array(numRows).fill(-1);

    const N = Math.max(numRows, numCols);
    const INF = 1e9;

    // Build square cost matrix padded with 0 (dummy agents/tasks)
    const cost = Array.from({ length: N + 1 }, () => Array(N + 1).fill(0));
    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        cost[i + 1][j + 1] = costMatrix[i][j];
      }
    }

    // 1-indexed potential vectors
    const u = Array(N + 1).fill(0);
    const v = Array(N + 1).fill(0);
    const p = Array(N + 1).fill(0);
    const way = Array(N + 1).fill(0);

    for (let i = 1; i <= N; i++) {
      p[0] = i;
      let j0 = 0;
      const minv = Array(N + 1).fill(INF);
      const used = Array(N + 1).fill(false);

      do {
        used[j0] = true;
        const i0 = p[j0];
        let delta = INF;
        let j1 = 0;

        for (let j = 1; j <= N; j++) {
          if (!used[j]) {
            const cur = cost[i0][j] - u[i0] - v[j];
            if (cur < minv[j]) {
              minv[j] = cur;
              way[j] = j0;
            }
            if (minv[j] < delta) {
              delta = minv[j];
              j1 = j;
            }
          }
        }

        for (let j = 0; j <= N; j++) {
          if (used[j]) {
            u[p[j]] += delta;
            v[j] -= delta;
          } else {
            minv[j] -= delta;
          }
        }

        j0 = j1;
      } while (p[j0] !== 0);

      do {
        const j1 = way[j0];
        p[j0] = p[j1];
        j0 = j1;
      } while (j0 !== 0);
    }

    // Extract assignments for the real rows
    const result = Array(numRows).fill(-1);
    for (let j = 1; j <= numCols; j++) {
      const i = p[j];
      if (i > 0 && i <= numRows) {
        // If assigned to an infinite cost edge, treat as unassigned
        if (costMatrix[i - 1][j - 1] >= 1e6) {
          result[i - 1] = -1;
        } else {
          result[i - 1] = j - 1;
        }
      }
    }

    return result;
  }
}

const hungarianOptimizer = new HungarianOptimizer();

module.exports = {
  HungarianOptimizer,
  hungarianOptimizer,
  solveHungarian: (costMatrix) => hungarianOptimizer.solveMinCost(costMatrix)
};
