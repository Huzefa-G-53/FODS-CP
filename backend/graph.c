#include "graph.h"
#include <stdlib.h>
#include <string.h>
#include <stdio.h>

static void edge_free_internal(void *data) {
    if (data) free(data);
}

static void vertex_free_internal(void *data) {
    if (!data) return;
    GraphVertex *v = (GraphVertex *)data;
    list_free(v->outgoing_edges, edge_free_internal);
    list_free(v->incoming_edges, edge_free_internal);
    free(v);
}

Graph *graph_create(void) {
    Graph *g = (Graph *)malloc(sizeof(Graph));
    if (!g) return NULL;
    g->vertex_map = hashmap_create(128);
    g->vertices = list_create();
    g->vertex_count = 0;
    g->edge_count = 0;
    return g;
}

bool graph_add_vertex(Graph *g, const char *id, const char *label, const char *node_type) {
    if (!g || !id || hashmap_has(g->vertex_map, id)) return false;

    GraphVertex *v = (GraphVertex *)malloc(sizeof(GraphVertex));
    if (!v) return false;

    strncpy(v->id, id, sizeof(v->id) - 1);
    v->id[sizeof(v->id) - 1] = '\0';

    strncpy(v->label, label ? label : id, sizeof(v->label) - 1);
    v->label[sizeof(v->label) - 1] = '\0';

    strncpy(v->node_type, node_type ? node_type : "topic", sizeof(v->node_type) - 1);
    v->node_type[sizeof(v->node_type) - 1] = '\0';

    v->outgoing_edges = list_create();
    v->incoming_edges = list_create();

    hashmap_put(g->vertex_map, id, v, NULL);
    list_push_back(g->vertices, v);
    g->vertex_count++;
    return true;
}

bool graph_add_edge(Graph *g, const char *from_id, const char *to_id, const char *edge_type, double weight) {
    if (!g || !from_id || !to_id) return false;

    GraphVertex *from_v = (GraphVertex *)hashmap_get(g->vertex_map, from_id);
    GraphVertex *to_v = (GraphVertex *)hashmap_get(g->vertex_map, to_id);

    if (!from_v || !to_v) return false;

    // Check if edge already exists in outgoing
    ListNode *curr = from_v->outgoing_edges->head;
    while (curr) {
        GraphEdge *existing = (GraphEdge *)curr->data;
        if (strcmp(existing->target_id, to_id) == 0 && strcmp(existing->edge_type, edge_type) == 0) {
            return true; // Already exists
        }
        curr = curr->next;
    }

    GraphEdge *out_edge = (GraphEdge *)malloc(sizeof(GraphEdge));
    if (!out_edge) return false;
    strncpy(out_edge->target_id, to_id, sizeof(out_edge->target_id) - 1);
    out_edge->target_id[sizeof(out_edge->target_id) - 1] = '\0';
    strncpy(out_edge->edge_type, edge_type ? edge_type : "related", sizeof(out_edge->edge_type) - 1);
    out_edge->edge_type[sizeof(out_edge->edge_type) - 1] = '\0';
    out_edge->weight = weight;
    list_push_back(from_v->outgoing_edges, out_edge);

    GraphEdge *in_edge = (GraphEdge *)malloc(sizeof(GraphEdge));
    if (!in_edge) return false;
    strncpy(in_edge->target_id, from_id, sizeof(in_edge->target_id) - 1);
    in_edge->target_id[sizeof(in_edge->target_id) - 1] = '\0';
    strncpy(in_edge->edge_type, edge_type ? edge_type : "related", sizeof(in_edge->edge_type) - 1);
    in_edge->edge_type[sizeof(in_edge->edge_type) - 1] = '\0';
    in_edge->weight = weight;
    list_push_back(to_v->incoming_edges, in_edge);

    g->edge_count++;
    return true;
}

GraphVertex *graph_get_vertex(const Graph *g, const char *id) {
    if (!g || !id) return NULL;
    return (GraphVertex *)hashmap_get(g->vertex_map, id);
}

GraphPath graph_find_path(const Graph *g, const char *start_id, const char *end_id) {
    GraphPath res = { NULL, 0, false };
    if (!g || !start_id || !end_id) return res;

    GraphVertex *start_v = graph_get_vertex(g, start_id);
    GraphVertex *end_v = graph_get_vertex(g, end_id);
    if (!start_v || !end_v) return res;

    if (strcmp(start_id, end_id) == 0) {
        res.count = 1;
        res.node_ids = (char **)malloc(sizeof(char *));
        res.node_ids[0] = strdup(start_id);
        res.found = true;
        return res;
    }

    // Phase 1: Try direct BFS traversal from start_id to end_id
    HashMap *visited = hashmap_create(64);
    HashMap *parent_map = hashmap_create(64); // child_id -> parent_id
    Queue *q = queue_create();

    hashmap_put(visited, start_id, (void *)1, NULL);
    queue_enqueue(q, (void *)start_id);

    bool direct_found = false;

    while (!queue_is_empty(q)) {
        char *curr_id = (char *)queue_dequeue(q);
        if (strcmp(curr_id, end_id) == 0) {
            direct_found = true;
            break;
        }

        GraphVertex *cv = graph_get_vertex(g, curr_id);
        if (!cv) continue;

        ListNode *edge_node = cv->outgoing_edges->head;
        while (edge_node) {
            GraphEdge *edge = (GraphEdge *)edge_node->data;
            /* Traverse only directed prerequisite relationships for pathfinding */
            if (strcmp(edge->edge_type, "prerequisite") == 0 &&
                !hashmap_has(visited, edge->target_id)) {
                hashmap_put(visited, edge->target_id, (void *)1, NULL);
                hashmap_put(parent_map, edge->target_id, strdup(curr_id), free);
                queue_enqueue(q, edge->target_id);
            }
            edge_node = edge_node->next;
        }
    }

    queue_free(q, NULL);

    if (direct_found) {
        Stack *s = stack_create();
        char *trace = (char *)end_id;
        stack_push(s, strdup(trace));

        while (strcmp(trace, start_id) != 0) {
            char *p = (char *)hashmap_get(parent_map, trace);
            if (!p) break;
            stack_push(s, strdup(p));
            trace = p;
        }

        res.count = stack_size(s);
        res.node_ids = (char **)malloc(sizeof(char *) * res.count);
        size_t idx = 0;
        while (!stack_is_empty(s)) {
            res.node_ids[idx++] = (char *)stack_pop(s);
        }
        stack_free(s, free);
        hashmap_free(visited, NULL);
        hashmap_free(parent_map, free);
        res.found = true;
        return res;
    }

    hashmap_free(visited, NULL);
    hashmap_free(parent_map, free);

    // Phase 2: Prerequisite chain resolution
    Stack *prereq_chain = stack_create();
    HashMap *chain_visited = hashmap_create(64);
    Queue *prereq_q = queue_create();

    hashmap_put(chain_visited, end_id, (void *)1, NULL);
    queue_enqueue(prereq_q, (void *)end_id);

    while (!queue_is_empty(prereq_q)) {
        char *cid = (char *)queue_dequeue(prereq_q);
        stack_push(prereq_chain, strdup(cid));

        GraphVertex *cv = graph_get_vertex(g, cid);
        if (cv) {
            ListNode *curr = cv->incoming_edges->head;
            while (curr) {
                GraphEdge *edge = (GraphEdge *)curr->data;
                if (strcmp(edge->edge_type, "prerequisite") == 0) {
                    if (!hashmap_has(chain_visited, edge->target_id)) {
                        hashmap_put(chain_visited, edge->target_id, (void *)1, NULL);
                        queue_enqueue(prereq_q, edge->target_id);
                    }
                }
                curr = curr->next;
            }
        }
    }
    queue_free(prereq_q, NULL);
    hashmap_free(chain_visited, NULL);

    bool start_in_chain = false;
    StackNode *curr_node = prereq_chain->top;
    while (curr_node) {
        if (strcmp((char *)curr_node->data, start_id) == 0) {
            start_in_chain = true;
            break;
        }
        curr_node = curr_node->next;
    }

    if (start_in_chain) {
        while (!stack_is_empty(prereq_chain)) {
            char *node_id = (char *)stack_pop(prereq_chain);
            if (strcmp(node_id, start_id) == 0) {
                res.count = 1 + stack_size(prereq_chain);
                res.node_ids = (char **)malloc(sizeof(char *) * res.count);
                res.node_ids[0] = node_id;
                size_t idx = 1;
                while (!stack_is_empty(prereq_chain)) {
                    res.node_ids[idx++] = (char *)stack_pop(prereq_chain);
                }
                break;
            }
            free(node_id);
        }
        stack_free(prereq_chain, free);
        res.found = true;
    } else {
        /* start_id has no connection to end_id — do not fabricate a path */
        stack_free(prereq_chain, free);
        res.found = false;
    }
    return res;
}

void graph_path_free(GraphPath *path) {
    if (!path) return;
    if (path->node_ids) {
        for (size_t i = 0; i < path->count; i++) {
            if (path->node_ids[i]) free(path->node_ids[i]);
        }
        free(path->node_ids);
        path->node_ids = NULL;
    }
    path->count = 0;
    path->found = false;
}

GraphPath graph_get_prerequisites(const Graph *g, const char *topic_id) {
    GraphPath res = { NULL, 0, false };
    if (!g || !topic_id) return res;
    GraphVertex *v = graph_get_vertex(g, topic_id);
    if (!v) return res;

    size_t count = 0;
    ListNode *curr = v->incoming_edges->head;
    while (curr) {
        GraphEdge *edge = (GraphEdge *)curr->data;
        if (strcmp(edge->edge_type, "prerequisite") == 0) count++;
        curr = curr->next;
    }

    if (count > 0) {
        res.node_ids = (char **)malloc(sizeof(char *) * count);
        res.count = count;
        res.found = true;
        size_t idx = 0;
        curr = v->incoming_edges->head;
        while (curr) {
            GraphEdge *edge = (GraphEdge *)curr->data;
            if (strcmp(edge->edge_type, "prerequisite") == 0) {
                res.node_ids[idx++] = strdup(edge->target_id);
            }
            curr = curr->next;
        }
    } else {
        res.found = true;
    }
    return res;
}

GraphPath graph_get_dependents(const Graph *g, const char *topic_id) {
    GraphPath res = { NULL, 0, false };
    if (!g || !topic_id) return res;
    GraphVertex *v = graph_get_vertex(g, topic_id);
    if (!v) return res;

    size_t count = 0;
    ListNode *curr = v->outgoing_edges->head;
    while (curr) {
        GraphEdge *edge = (GraphEdge *)curr->data;
        if (strcmp(edge->edge_type, "prerequisite") == 0) count++;
        curr = curr->next;
    }

    if (count > 0) {
        res.node_ids = (char **)malloc(sizeof(char *) * count);
        res.count = count;
        res.found = true;
        size_t idx = 0;
        curr = v->outgoing_edges->head;
        while (curr) {
            GraphEdge *edge = (GraphEdge *)curr->data;
            if (strcmp(edge->edge_type, "prerequisite") == 0) {
                res.node_ids[idx++] = strdup(edge->target_id);
            }
            curr = curr->next;
        }
    } else {
        res.found = true;
    }
    return res;
}

size_t graph_propagate_concept(const Graph *g, const char *completed_topic_id, TopicStatusUpdateCallback cb, void *ctx) {
    if (!g || !completed_topic_id || !cb) return 0;
    GraphVertex *topic_v = graph_get_vertex(g, completed_topic_id);
    if (!topic_v) return 0;

    size_t propagated_count = 0;

    ListNode *edge_node = topic_v->outgoing_edges->head;
    while (edge_node) {
        GraphEdge *edge = (GraphEdge *)edge_node->data;
        if (strcmp(edge->edge_type, "concept-link") == 0) {
            GraphVertex *concept_v = graph_get_vertex(g, edge->target_id);
            if (concept_v) {
                ListNode *concept_edge_node = concept_v->outgoing_edges->head;
                while (concept_edge_node) {
                    GraphEdge *to_other = (GraphEdge *)concept_edge_node->data;
                    if (strcmp(to_other->target_id, completed_topic_id) != 0) {
                        cb(ctx, to_other->target_id, "Familiar");
                        propagated_count++;
                    }
                    concept_edge_node = concept_edge_node->next;
                }
            }
        }
        edge_node = edge_node->next;
    }

    return propagated_count;
}

void graph_free(Graph *g) {
    if (!g) return;
    if (g->vertices) {
        ListNode *curr = g->vertices->head;
        while (curr) {
            vertex_free_internal(curr->data);
            curr = curr->next;
        }
        list_free(g->vertices, NULL);
    }
    if (g->vertex_map) {
        hashmap_free(g->vertex_map, NULL);
    }
    free(g);
}
