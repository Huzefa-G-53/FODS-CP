#ifndef PATHFORGE_API_H
#define PATHFORGE_API_H

#include "models.h"

typedef struct ApiResponse {
    int status_code;
    char content_type[64];
    char *body; // Heap-allocated string, caller must free
} ApiResponse;

ApiResponse api_handle_request(AppState *state, const char *data_dir, const char *method, const char *path, const char *query, const char *body);
void api_response_free(ApiResponse *resp);

#endif // PATHFORGE_API_H
