#include "queue.h"
#include <stdlib.h>

Queue *queue_create(void) {
    Queue *q = (Queue *)malloc(sizeof(Queue));
    if (!q) return NULL;
    q->head = NULL;
    q->tail = NULL;
    q->size = 0;
    return q;
}

bool queue_enqueue(Queue *queue, void *data) {
    if (!queue) return false;
    QueueNode *node = (QueueNode *)malloc(sizeof(QueueNode));
    if (!node) return false;
    node->data = data;
    node->next = NULL;

    if (queue->tail) {
        queue->tail->next = node;
        queue->tail = node;
    } else {
        queue->head = node;
        queue->tail = node;
    }
    queue->size++;
    return true;
}

void *queue_dequeue(Queue *queue) {
    if (!queue || !queue->head) return NULL;
    QueueNode *node = queue->head;
    void *data = node->data;

    queue->head = node->next;
    if (!queue->head) {
        queue->tail = NULL;
    }
    free(node);
    queue->size--;
    return data;
}

void *queue_peek(const Queue *queue) {
    if (!queue || !queue->head) return NULL;
    return queue->head->data;
}

bool queue_is_empty(const Queue *queue) {
    return !queue || queue->size == 0;
}

size_t queue_size(const Queue *queue) {
    return queue ? queue->size : 0;
}

void queue_free(Queue *queue, QueueFreeFn free_fn) {
    if (!queue) return;
    while (!queue_is_empty(queue)) {
        void *data = queue_dequeue(queue);
        if (free_fn && data) {
            free_fn(data);
        }
    }
    free(queue);
}
