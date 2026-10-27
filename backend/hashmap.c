#include "hashmap.h"
#include <stdlib.h>
#include <string.h>

#define HASHMAP_DEFAULT_CAPACITY 64
#define HASHMAP_MAX_LOAD_FACTOR 0.75

static unsigned long hash_string(const char *str) {
    unsigned long hash = 5381;
    int c;
    while ((c = (unsigned char)*str++)) {
        hash = ((hash << 5) + hash) + c; /* hash * 33 + c */
    }
    return hash;
}

static int entry_key_cmp(const void *entry_ptr, const void *key_ptr) {
    const HashEntry *entry = (const HashEntry *)entry_ptr;
    const char *key = (const char *)key_ptr;
    if (!entry || !entry->key || !key) return -1;
    return strcmp(entry->key, key);
}

static void free_entry_internal(void *data, HashMapValueFreeFn val_free_fn) {
    if (!data) return;
    HashEntry *entry = (HashEntry *)data;
    if (entry->key) {
        free(entry->key);
    }
    if (val_free_fn && entry->value) {
        val_free_fn(entry->value);
    }
    free(entry);
}

HashMap *hashmap_create(size_t initial_capacity) {
    if (initial_capacity < 8) initial_capacity = HASHMAP_DEFAULT_CAPACITY;
    HashMap *map = (HashMap *)malloc(sizeof(HashMap));
    if (!map) return NULL;

    map->capacity = initial_capacity;
    map->count = 0;
    map->buckets = (LinkedList **)calloc(map->capacity, sizeof(LinkedList *));
    if (!map->buckets) {
        free(map);
        return NULL;
    }
    return map;
}

static void hashmap_rehash(HashMap *map) {
    size_t old_capacity = map->capacity;
    LinkedList **old_buckets = map->buckets;

    size_t new_capacity = old_capacity * 2;
    LinkedList **new_buckets = (LinkedList **)calloc(new_capacity, sizeof(LinkedList *));
    if (!new_buckets) return;

    map->buckets = new_buckets;
    map->capacity = new_capacity;
    map->count = 0;

    for (size_t i = 0; i < old_capacity; i++) {
        LinkedList *bucket = old_buckets[i];
        if (bucket) {
            ListNode *curr = bucket->head;
            while (curr) {
                HashEntry *entry = (HashEntry *)curr->data;
                if (entry) {
                    unsigned long h = hash_string(entry->key);
                    size_t new_idx = h % new_capacity;
                    if (!map->buckets[new_idx]) {
                        map->buckets[new_idx] = list_create();
                    }
                    list_push_back(map->buckets[new_idx], entry);
                    map->count++;
                }
                curr = curr->next;
            }
            list_free(bucket, NULL);
        }
    }
    free(old_buckets);
}

bool hashmap_put(HashMap *map, const char *key, void *value, HashMapValueFreeFn free_fn) {
    if (!map || !key) return false;

    double load = (double)(map->count + 1) / (double)map->capacity;
    if (load > HASHMAP_MAX_LOAD_FACTOR) {
        hashmap_rehash(map);
    }

    unsigned long h = hash_string(key);
    size_t idx = h % map->capacity;

    if (!map->buckets[idx]) {
        map->buckets[idx] = list_create();
    }

    HashEntry *existing = (HashEntry *)list_find(map->buckets[idx], key, entry_key_cmp);
    if (existing) {
        if (free_fn && existing->value && existing->value != value) {
            free_fn(existing->value);
        }
        existing->value = value;
        return true;
    }

    HashEntry *entry = (HashEntry *)malloc(sizeof(HashEntry));
    if (!entry) return false;
    entry->key = strdup(key);
    entry->value = value;

    list_push_back(map->buckets[idx], entry);
    map->count++;
    return true;
}

void *hashmap_get(const HashMap *map, const char *key) {
    if (!map || !key || map->count == 0) return NULL;
    unsigned long h = hash_string(key);
    size_t idx = h % map->capacity;

    if (!map->buckets[idx]) return NULL;
    HashEntry *entry = (HashEntry *)list_find(map->buckets[idx], key, entry_key_cmp);
    return entry ? entry->value : NULL;
}

bool hashmap_has(const HashMap *map, const char *key) {
    return hashmap_get(map, key) != NULL;
}

bool hashmap_remove(HashMap *map, const char *key, HashMapValueFreeFn free_fn) {
    if (!map || !key || map->count == 0) return false;
    unsigned long h = hash_string(key);
    size_t idx = h % map->capacity;

    LinkedList *bucket = map->buckets[idx];
    if (!bucket) return false;

    ListNode *curr = bucket->head;
    ListNode *prev = NULL;
    while (curr) {
        HashEntry *entry = (HashEntry *)curr->data;
        if (entry && entry->key && strcmp(entry->key, key) == 0) {
            if (prev) {
                prev->next = curr->next;
            } else {
                bucket->head = curr->next;
            }
            if (curr == bucket->tail) {
                bucket->tail = prev;
            }
            bucket->size--;

            free_entry_internal(entry, free_fn);
            free(curr);
            map->count--;
            return true;
        }
        prev = curr;
        curr = curr->next;
    }
    return false;
}



void hashmap_free(HashMap *map, HashMapValueFreeFn free_fn) {
    if (!map) return;
    for (size_t i = 0; i < map->capacity; i++) {
        LinkedList *bucket = map->buckets[i];
        if (bucket) {
            ListNode *curr = bucket->head;
            while (curr) {
                free_entry_internal(curr->data, free_fn);
                curr = curr->next;
            }
            list_free(bucket, NULL);
        }
    }
    free(map->buckets);
    free(map);
}
