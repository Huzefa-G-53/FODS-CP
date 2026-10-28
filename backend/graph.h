#ifndef PATHFORGE_GRAPH_H
#define PATHFORGE_GRAPH_H

#include "linked_list.h"
#include "queue.h"
#include "stack.h"
#include "hashmap.h"
#include <stddef.h>
#include <stdbool.h>

/**
 * Directed Graph with Adjacency Lists
 * Backed by LinkedList for outgoing edges and HashMap for O(1) vertex lookups.
 * 
 * Big-O Complexity:
 * - graph_add_vertex: O(1)
 * - graph_add_edge:   O(1)
 * - graph_bfs:        O(V + E)
 * - graph_dfs:        O(V + E)
 * - graph_find_path:  O(V + E)
 */

typedef struct GraphEdge {
    char target_id[64];
    char edge_type[32]; // "prerequisite", "subroadmap", "concept-link", "stage-next", "related"
    double weight;
} GraphEdge;

typedef struct GraphVertex {
    char id[64];
    char label[128];
    char node_type[32]; // "topic", "section", "roadmap", "stage", "concept"
    LinkedList *outgoing_edges; // LinkedList of GraphEdge*
    LinkedList *incoming_edges; // LinkedList of GraphEdge* (for prerequisite/dependent queries)
} GraphVertex;

typedef struct Graph {
    HashMap *vertex_map;    // key: id -> GraphVertex*
    LinkedList *vertices;   // All vertices in insertion order
    size_t vertex_count;
    size_t edge_count;
} Graph;

typedef struct GraphPath {
    char **node_ids;
    size_t count;
    bool found;
} GraphPath;

Graph *graph_create(void);
bool graph_add_vertex(Graph *g, const char *id, const char *label, const char *node_type);
bool graph_add_edge(Graph *g, const char *from_id, const char *to_id, const char *edge_type, double weight);
GraphVertex *graph_get_vertex(const Graph *g, const char *id);

// Shortest path between two nodes using BFS with parent backtracking
GraphPath graph_find_path(const Graph *g, const char *start_id, const char *end_id);
GraphPath graph_get_prerequisite_chain(const Graph *g, const char *topic_id);
void graph_path_free(GraphPath *path);

// Prerequisite and Dependent lookups
GraphPath graph_get_prerequisites(const Graph *g, const char *topic_id);
GraphPath graph_get_dependents(const Graph *g, const char *topic_id);

// Concept propagation:
// 1-hop traversal: Topic -> Concept -> All other linked Topics
// Updates them to "Familiar" if currently "Not Started"
typedef void (*TopicStatusUpdateCallback)(void *ctx, const char *topic_id, const char *new_status);
size_t graph_propagate_concept(const Graph *g, const char *completed_topic_id, TopicStatusUpdateCallback cb, void *ctx);

void graph_free(Graph *g);

#endif // PATHFORGE_GRAPH_H
