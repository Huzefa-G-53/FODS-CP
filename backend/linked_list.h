#ifndef PATHFORGE_LINKED_LIST_H
#define PATHFORGE_LINKED_LIST_H

#include <stddef.h>
#include <stdbool.h>

/**
 * Singly-Linked List Implementation
 * 
 * Big-O Complexity:
 * - list_push_front: O(1)
 * - list_push_back:  O(1) (using maintained tail pointer)
 * - list_find:       O(N)
 * - list_remove:     O(N)
 * - list_size:       O(1)
 */

typedef struct ListNode {
    void *data;
    struct ListNode *next;
} ListNode;

typedef struct LinkedList {
    ListNode *head;
    ListNode *tail;
    size_t size;
} LinkedList;

typedef int (*ListCompareFn)(const void *a, const void *b);
typedef void (*ListFreeFn)(void *data);

LinkedList *list_create(void);
bool list_push_back(LinkedList *list, void *data);
bool list_push_front(LinkedList *list, void *data);
void *list_pop_front(LinkedList *list);
bool list_remove(LinkedList *list, const void *key, ListCompareFn cmp_fn, ListFreeFn free_fn);
void *list_find(const LinkedList *list, const void *key, ListCompareFn cmp_fn);
size_t list_size(const LinkedList *list);
void list_clear(LinkedList *list, ListFreeFn free_fn);
void list_free(LinkedList *list, ListFreeFn free_fn);

#endif // PATHFORGE_LINKED_LIST_H
