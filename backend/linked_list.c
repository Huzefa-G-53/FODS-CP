#include "linked_list.h"
#include <stdio.h>
#include <stdlib.h>

// Create a new empty linked list
LinkedList *list_create(void) {
    // Allocate memory for list structure
    LinkedList *list = (LinkedList *)malloc(sizeof(LinkedList));
    if (list == NULL) {
        return NULL;
    }

    // Initialize list head, tail, and size
    list->head = NULL;
    list->tail = NULL;
    list->size = 0;

    return list;
}

// Insert a node at the end of the list
bool list_push_back(LinkedList *list, void *data) {
    if (list == NULL) {
        return false;
    }

    // Create new node
    ListNode *temp = (ListNode *)malloc(sizeof(ListNode));
    if (temp == NULL) {
        return false;
    }

    // Put data in node and set next pointer
    temp->data = data;
    temp->next = NULL;

    // Check if list is empty
    if (list->head == NULL) {
        list->head = temp;
        list->tail = temp;
    } else {
        // Link last node to new node and update tail
        list->tail->next = temp;
        list->tail = temp;
    }

    list->size++;
    return true;
}

// Insert a node at the beginning of the list
bool list_push_front(LinkedList *list, void *data) {
    if (list == NULL) {
        return false;
    }

    // Create new node
    ListNode *temp = (ListNode *)malloc(sizeof(ListNode));
    if (temp == NULL) {
        return false;
    }

    // Put data in node and point next to head
    temp->data = data;
    temp->next = list->head;

    // Update head pointer
    list->head = temp;

    // If list was empty, set tail to temp
    if (list->tail == NULL) {
        list->tail = temp;
    }

    list->size++;
    return true;
}

// Remove and return node data from beginning of list
void *list_pop_front(LinkedList *list) {
    // Check if list is empty
    if (list == NULL || list->head == NULL) {
        return NULL;
    }

    // Store first node and retrieve data
    ListNode *temp = list->head;
    void *data = temp->data;

    // Move head to next node
    list->head = temp->next;

    // If list becomes empty, update tail pointer
    if (list->head == NULL) {
        list->tail = NULL;
    }

    // Free removed node memory
    free(temp);
    list->size--;

    return data;
}

// Delete specified node matching key
bool list_remove(LinkedList *list, const void *key, ListCompareFn cmp_fn, ListFreeFn free_fn) {
    if (list == NULL || list->head == NULL || cmp_fn == NULL) {
        return false;
    }

    ListNode *curr = list->head;
    ListNode *prev = NULL;

    // Search for target node
    while (curr != NULL) {
        if (cmp_fn(curr->data, key) == 0) {
            // Unlink node from list
            if (prev != NULL) {
                prev->next = curr->next;
            } else {
                list->head = curr->next;
            }

            // Update tail if last node deleted
            if (curr == list->tail) {
                list->tail = prev;
            }

            // Free node data if free function provided
            if (free_fn != NULL && curr->data != NULL) {
                free_fn(curr->data);
            }

            free(curr);
            list->size--;
            return true;
        }

        prev = curr;
        curr = curr->next;
    }

    return false;
}

// Find node matching key
void *list_find(const LinkedList *list, const void *key, ListCompareFn cmp_fn) {
    if (list == NULL || cmp_fn == NULL) {
        return NULL;
    }

    ListNode *curr = list->head;

    // Traverse list to find matching node
    while (curr != NULL) {
        if (cmp_fn(curr->data, key) == 0) {
            return curr->data;
        }
        curr = curr->next;
    }

    return NULL;
}

// Get size of list
size_t list_size(const LinkedList *list) {
    if (list == NULL) {
        return 0;
    }
    return list->size;
}

// Clear all elements in list
void list_clear(LinkedList *list, ListFreeFn free_fn) {
    if (list == NULL) {
        return;
    }

    ListNode *curr = list->head;
    ListNode *next_node = NULL;

    // Free elements one by one
    while (curr != NULL) {
        next_node = curr->next;

        if (free_fn != NULL && curr->data != NULL) {
            free_fn(curr->data);
        }

        free(curr);
        curr = next_node;
    }

    list->head = NULL;
    list->tail = NULL;
    list->size = 0;
}

// Free complete list
void list_free(LinkedList *list, ListFreeFn free_fn) {
    if (list == NULL) {
        return;
    }

    list_clear(list, free_fn);
    free(list);
}
