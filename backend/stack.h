#ifndef PATHFORGE_STACK_H
#define PATHFORGE_STACK_H

#include <stddef.h>
#include <stdbool.h>

/**
 * LIFO Stack Implementation
 * 
 * Big-O Complexity:
 * - stack_push:     O(1)
 * - stack_pop:      O(1)
 * - stack_peek:     O(1)
 * - stack_size:     O(1)
 * - stack_is_empty: O(1)
 */

typedef struct StackNode {
    void *data;
    struct StackNode *next;
} StackNode;

typedef struct Stack {
    StackNode *top;
    size_t size;
} Stack;

typedef void (*StackFreeFn)(void *data);

Stack *stack_create(void);
bool stack_push(Stack *stack, void *data);
void *stack_pop(Stack *stack);
void *stack_peek(const Stack *stack);
bool stack_is_empty(const Stack *stack);
size_t stack_size(const Stack *stack);
void stack_free(Stack *stack, StackFreeFn free_fn);

#endif // PATHFORGE_STACK_H
