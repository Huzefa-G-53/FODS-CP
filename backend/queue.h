#ifndef PATHFORGE_QUEUE_H
#define PATHFORGE_QUEUE_H

#include <stddef.h>
#include <stdbool.h>

/**
 * FIFO Queue Implementation
 * 
 * Big-O Complexity:
 * - queue_enqueue:  O(1)
 * - queue_dequeue:  O(1)
 * - queue_peek:     O(1)
 * - queue_size:     O(1)
 * - queue_is_empty: O(1)
 */

typedef struct QueueNode {
    void *data;
    struct QueueNode *next;
} QueueNode;

typedef struct Queue {
    QueueNode *head;
    QueueNode *tail;
    size_t size;
} Queue;

typedef void (*QueueFreeFn)(void *data);

Queue *queue_create(void);
bool queue_enqueue(Queue *queue, void *data);
void *queue_dequeue(Queue *queue);
void *queue_peek(const Queue *queue);
bool queue_is_empty(const Queue *queue);
size_t queue_size(const Queue *queue);
void queue_free(Queue *queue, QueueFreeFn free_fn);

#endif // PATHFORGE_QUEUE_H
