#include "stack.h"
#include <stdlib.h>

Stack *stack_create(void) {
    Stack *s = (Stack *)malloc(sizeof(Stack));
    if (!s) return NULL;
    s->top = NULL;
    s->size = 0;
    return s;
}

bool stack_push(Stack *stack, void *data) {
    if (!stack) return false;
    StackNode *node = (StackNode *)malloc(sizeof(StackNode));
    if (!node) return false;
    node->data = data;
    node->next = stack->top;
    stack->top = node;
    stack->size++;
    return true;
}

void *stack_pop(Stack *stack) {
    if (!stack || !stack->top) return NULL;
    StackNode *node = stack->top;
    void *data = node->data;
    stack->top = node->next;
    free(node);
    stack->size--;
    return data;
}

void *stack_peek(const Stack *stack) {
    if (!stack || !stack->top) return NULL;
    return stack->top->data;
}

bool stack_is_empty(const Stack *stack) {
    return !stack || stack->size == 0;
}

size_t stack_size(const Stack *stack) {
    return stack ? stack->size : 0;
}

void stack_free(Stack *stack, StackFreeFn free_fn) {
    if (!stack) return;
    while (!stack_is_empty(stack)) {
        void *data = stack_pop(stack);
        if (free_fn && data) {
            free_fn(data);
        }
    }
    free(stack);
}
