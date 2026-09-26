// Simplified mock graph for demo purposes
// In a real application, this would be a PostGIS database query or OSRM instance.
// This represents a graph of locations and the roads connecting them.
const nodes = {
  "DM-001": { id: "DM-001", name: "Dehradun", lat: 30.3165, lng: 78.0322, risk: 35 },
  "DM-002": { id: "DM-002", name: "Mussoorie", lat: 30.4598, lng: 78.0644, risk: 58 },
  "DM-003": { id: "DM-003", name: "Chamoli", lat: 30.401, lng: 79.322, risk: 76 },
  "DM-004": { id: "DM-004", name: "Joshimath", lat: 30.555, lng: 79.565, risk: 91 },
  "DM-005": { id: "DM-005", name: "Pithoragarh", lat: 29.5829, lng: 80.2182, risk: 72 },
  "DM-006": { id: "DM-006", name: "Gangtok", lat: 27.3389, lng: 88.6065, risk: 84 },
  "DM-007": { id: "DM-007", name: "Shimla", lat: 31.1048, lng: 77.1734, risk: 55 },
  "DM-008": { id: "DM-008", name: "Darjeeling", lat: 27.041, lng: 88.2663, risk: 67 },
  "SHELTER-1": { id: "SHELTER-1", name: "Rishikesh Safe Zone", lat: 30.0869, lng: 78.2676, risk: 10 },
  "SHELTER-2": { id: "SHELTER-2", name: "Haldwani Relief Camp", lat: 29.2183, lng: 79.5130, risk: 15 }
};

const edges = [
  { from: "DM-001", to: "DM-002", distance: 30 },
  { from: "DM-001", to: "SHELTER-1", distance: 45 },
  { from: "DM-002", to: "DM-003", distance: 200 },
  { from: "DM-003", to: "DM-004", distance: 50 },
  { from: "DM-004", to: "SHELTER-1", distance: 250 },
  { from: "DM-005", to: "SHELTER-2", distance: 100 },
  { from: "DM-003", to: "SHELTER-2", distance: 180 }
];

// Bidirectional edges
const graph = {};
for (const node of Object.keys(nodes)) {
  graph[node] = [];
}
for (const edge of edges) {
  if(graph[edge.from] && graph[edge.to]) {
    graph[edge.from].push({ to: edge.to, distance: edge.distance });
    graph[edge.to].push({ to: edge.from, distance: edge.distance });
  }
}

// A* or Dijkstra implementation
export async function findEvacuationRoute(startId, destinationId) {
  if (!nodes[startId] || !nodes[destinationId]) return null;

  const distances = {};
  const previous = {};
  const unvisited = new Set(Object.keys(nodes));

  for (const node of unvisited) {
    distances[node] = Infinity;
  }
  distances[startId] = 0;

  while (unvisited.size > 0) {
    // Get node with minimum distance
    let current = null;
    let minDistance = Infinity;
    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      }
    }

    if (current === null || current === destinationId) break;

    unvisited.delete(current);

    for (const neighbor of graph[current]) {
      if (!unvisited.has(neighbor.to)) continue;

      // Cost function: distance * (1 + risk_penalty)
      // If a node has high risk, traversing through it costs much more.
      const riskPenalty = nodes[neighbor.to].risk > 70 ? 5 : (nodes[neighbor.to].risk > 40 ? 2 : 0);
      const cost = neighbor.distance * (1 + riskPenalty);

      const alternative = distances[current] + cost;
      if (alternative < distances[neighbor.to]) {
        distances[neighbor.to] = alternative;
        previous[neighbor.to] = current;
      }
    }
  }

  // Backtrack to build path
  const path = [];
  let curr = destinationId;
  if (previous[curr] !== undefined || curr === startId) {
    while (curr !== undefined) {
      path.unshift(nodes[curr]);
      curr = previous[curr];
    }
  }

  if (path.length === 0 || path[0].id !== startId) return null;

  return {
    start: nodes[startId],
    destination: nodes[destinationId],
    routePath: path,
    totalCost: distances[destinationId],
    estimatedTimeMin: distances[destinationId] * 1.5,
    hazardsAvoided: path.filter(p => p.risk < 50).length,
    timestamp: new Date().toISOString()
  };
}
