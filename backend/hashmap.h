#ifndef PATHFORGE_HASHMAP_H
#define PATHFORGE_HASHMAP_H

#include "linked_list.h"
#include <stddef.h>
#include <stdbool.h>

/**
 * Separate-Chaining Hash Table Implementation
 * Backed directly by LinkedList for bucket collision chains.
 * 
 * Big-O Complexity:
 * - hashmap_put:    Average O(1), Worst O(N)
 * - hashmap_get:    Average O(1), Worst O(N)
 * - hashmap_remove: Average O(1), Worst O(N)
 */

typedef struct HashEntry {
    char *key;
    void *value;
} HashEntry;

typedef struct HashMap {
    LinkedList **buckets;
    size_t capacity;
    size_t count;
} HashMap;

typedef void (*HashMapValueFreeFn)(void *value);

HashMap *hashmap_create(size_t initial_capacity);
bool hashmap_put(HashMap *map, const char *key, void *value, HashMapValueFreeFn free_fn);
void *hashmap_get(const HashMap *map, const char *key);
bool hashmap_has(const HashMap *map, const char *key);
bool hashmap_remove(HashMap *map, const char *key, HashMapValueFreeFn free_fn);
void hashmap_free(HashMap *map, HashMapValueFreeFn free_fn);

#endif // PATHFORGE_HASHMAP_H
