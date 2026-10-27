#include "linked_list.h"
#include "stack.h"
#include "queue.h"
#include "hashmap.h"
#include "graph.h"
#include "models.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <assert.h>

static int int_cmp(const void *a, const void *b) {
    int va = *(const int *)a;
    int vb = *(const int *)b;
    return va - vb;
}

static void test_linked_list(void) {
    printf("[*] Testing Linked List...\n");
    LinkedList *list = list_create();
    assert(list != NULL);
    assert(list_size(list) == 0);

    int v1 = 10, v2 = 20, v3 = 30;
    list_push_back(list, &v1);
    list_push_back(list, &v2);
    list_push_front(list, &v3);

    assert(list_size(list) == 3);
    assert(*(int *)list->head->data == 30);
    assert(*(int *)list->tail->data == 20);

    int target = 20;
    int *found = (int *)list_find(list, &target, int_cmp);
    assert(found != NULL && *found == 20);

    bool removed = list_remove(list, &target, int_cmp, NULL);
    assert(removed == true);
    assert(list_size(list) == 2);
    assert(list_find(list, &target, int_cmp) == NULL);

    void *popped = list_pop_front(list);
    assert(popped == &v3);
    assert(list_size(list) == 1);

    list_free(list, NULL);
    printf("[+] Linked List tests passed!\n");
}

static void test_stack(void) {
    printf("[*] Testing Stack (LIFO)...\n");
    Stack *s = stack_create();
    assert(s != NULL);
    assert(stack_is_empty(s) == true);

    int a = 1, b = 2, c = 3;
    stack_push(s, &a);
    stack_push(s, &b);
    stack_push(s, &c);

    assert(stack_size(s) == 3);
    assert(*(int *)stack_peek(s) == 3);

    // LIFO ordering: 3, then 2, then 1
    assert(*(int *)stack_pop(s) == 3);
    assert(*(int *)stack_pop(s) == 2);
    assert(*(int *)stack_pop(s) == 1);
    assert(stack_is_empty(s) == true);

    stack_free(s, NULL);
    printf("[+] Stack tests passed!\n");
}

static void test_queue(void) {
    printf("[*] Testing Queue (FIFO)...\n");
    Queue *q = queue_create();
    assert(q != NULL);
    assert(queue_is_empty(q) == true);

    int a = 100, b = 200, c = 300;
    queue_enqueue(q, &a);
    queue_enqueue(q, &b);
    queue_enqueue(q, &c);

    assert(queue_size(q) == 3);
    assert(*(int *)queue_peek(q) == 100);

    // FIFO ordering: 100, then 200, then 300
    assert(*(int *)queue_dequeue(q) == 100);
    assert(*(int *)queue_dequeue(q) == 200);
    assert(*(int *)queue_dequeue(q) == 300);
    assert(queue_is_empty(q) == true);

    queue_free(q, NULL);
    printf("[+] Queue tests passed!\n");
}

static void test_hashmap(void) {
    printf("[*] Testing Separate-Chaining Hashmap...\n");
    HashMap *map = hashmap_create(8); // Small capacity to deliberately induce collisions
    assert(map != NULL);

    int val1 = 111, val2 = 222, val3 = 333, val4 = 444;
    hashmap_put(map, "alpha", &val1, NULL);
    hashmap_put(map, "beta", &val2, NULL);
    hashmap_put(map, "gamma", &val3, NULL);
    hashmap_put(map, "delta", &val4, NULL);

    assert(*(int *)hashmap_get(map, "alpha") == 111);
    assert(*(int *)hashmap_get(map, "beta") == 222);
    assert(*(int *)hashmap_get(map, "gamma") == 333);
    assert(*(int *)hashmap_get(map, "delta") == 444);
    assert(hashmap_get(map, "missing") == NULL);

    // Overwrite existing key
    int val_new = 999;
    hashmap_put(map, "alpha", &val_new, NULL);
    assert(*(int *)hashmap_get(map, "alpha") == 999);

    bool removed = hashmap_remove(map, "beta", NULL);
    assert(removed == true);
    assert(hashmap_get(map, "beta") == NULL);

    hashmap_free(map, NULL);
    printf("[+] Hashmap tests passed!\n");
}

static void test_graph_and_pathfinding(void) {
    printf("[*] Testing Graph, BFS/DFS & Shortest Path...\n");
    Graph *g = graph_create();
    assert(g != NULL);

    graph_add_vertex(g, "A", "Node A", "topic");
    graph_add_vertex(g, "B", "Node B", "topic");
    graph_add_vertex(g, "C", "Node C", "topic");
    graph_add_vertex(g, "D", "Node D", "topic");

    // A -> B -> D, and A -> C -> D
    graph_add_edge(g, "A", "B", "prerequisite", 1.0);
    graph_add_edge(g, "B", "D", "prerequisite", 1.0);
    graph_add_edge(g, "A", "C", "prerequisite", 1.0);

    GraphPath path = graph_find_path(g, "A", "D");
    assert(path.found == true);
    assert(path.count == 3); // A -> B -> D
    assert(strcmp(path.node_ids[0], "A") == 0);
    assert(strcmp(path.node_ids[1], "B") == 0);
    assert(strcmp(path.node_ids[2], "D") == 0);
    graph_path_free(&path);

    graph_free(g);
    printf("[+] Graph & Pathfinding tests passed!\n");
}

int main(void) {
    printf("===========================================\n");
    printf("  PathForge Core C DSA Unit Test Suite\n");
    printf("===========================================\n");

    test_linked_list();
    test_stack();
    test_queue();
    test_hashmap();
    test_graph_and_pathfinding();

    printf("===========================================\n");
    printf("  ALL 5 DSA TEST SUITES PASSED CLEANLY!\n");
    printf("===========================================\n");
    return 0;
}
