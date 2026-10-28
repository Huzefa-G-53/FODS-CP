#include "models.h"
#include "hashmap.h"
#include "graph.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

static void trim_crlf(char *str) {
    if (!str) return;
    size_t len = strlen(str);
    while (len > 0 && (str[len - 1] == '\r' || str[len - 1] == '\n' || str[len - 1] == ' ')) {
        str[--len] = '\0';
    }
}

static char *unescape_newlines(const char *src) {
    if (!src) return strdup("");
    size_t len = strlen(src);
    char *dst = (char *)malloc(len + 1);
    if (!dst) return strdup("");
    
    size_t j = 0;
    for (size_t i = 0; i < len; i++) {
        if (src[i] == '\\' && src[i + 1] == 'n') {
            dst[j++] = '\n';
            i++;
        } else {
            dst[j++] = src[i];
        }
    }
    dst[j] = '\0';
    return dst;
}

static char **split_comma(const char *str, size_t *out_count) {
    *out_count = 0;
    if (!str || !*str) return NULL;

    // Count commas
    size_t count = 1;
    const char *p = str;
    while (*p) {
        if (*p == ',') count++;
        p++;
    }

    char **arr = (char **)calloc(count, sizeof(char *));
    char *copy = strdup(str);
    char *token = strtok(copy, ",");
    size_t idx = 0;
    while (token) {
        trim_crlf(token);
        if (*token) {
            arr[idx++] = strdup(token);
        }
        token = strtok(NULL, ",");
    }
    free(copy);
    *out_count = idx;
    return arr;
}

static void load_topics(AppState *state, const char *data_dir) {
    char path[512];
    snprintf(path, sizeof(path), "%s/topics.dat", data_dir);
    FILE *f = fopen(path, "r");
    if (!f) return;

    size_t capacity = 64;
    state->topics = (Topic **)calloc(capacity, sizeof(Topic *));
    state->topic_count = 0;

    char line[16384];
    Topic *curr = NULL;

    while (fgets(line, sizeof(line), f)) {
        trim_crlf(line);
        if (strncmp(line, "=== TOPIC ===", 13) == 0) {
            if (state->topic_count >= capacity) {
                capacity *= 2;
                state->topics = (Topic **)realloc(state->topics, sizeof(Topic *) * capacity);
            }
            curr = (Topic *)calloc(1, sizeof(Topic));
            strncpy(curr->status, "Not Started", sizeof(curr->status) - 1);
            state->topics[state->topic_count++] = curr;
            continue;
        }

        if (!curr) continue;

        char *colon = strchr(line, ':');
        if (!colon) continue;
        *colon = '\0';
        char *key = line;
        char *val = colon + 1;
        while (*val == ' ') val++;

        if (strcmp(key, "id") == 0) {
            strncpy(curr->id, val, sizeof(curr->id) - 1);
        } else if (strcmp(key, "title") == 0) {
            strncpy(curr->title, val, sizeof(curr->title) - 1);
        } else if (strcmp(key, "roadmapId") == 0) {
            strncpy(curr->roadmapId, val, sizeof(curr->roadmapId) - 1);
        } else if (strcmp(key, "type") == 0) {
            strncpy(curr->type, val, sizeof(curr->type) - 1);
        } else if (strcmp(key, "targetSubroadmap") == 0) {
            strncpy(curr->targetSubroadmap, val, sizeof(curr->targetSubroadmap) - 1);
        } else if (strcmp(key, "difficulty") == 0) {
            strncpy(curr->difficulty, val, sizeof(curr->difficulty) - 1);
        } else if (strcmp(key, "estimatedMinutes") == 0) {
            curr->estimatedMinutes = atoi(val);
        } else if (strcmp(key, "summary") == 0) {
            curr->summary = unescape_newlines(val);
        } else if (strcmp(key, "explanation") == 0) {
            curr->explanation = unescape_newlines(val);
        } else if (strcmp(key, "codeExample") == 0) {
            curr->codeExample = unescape_newlines(val);
        } else if (strcmp(key, "objective") == 0) {
            curr->objectives = (char **)realloc(curr->objectives, sizeof(char *) * (curr->objectives_count + 1));
            curr->objectives[curr->objectives_count++] = strdup(val);
        } else if (strcmp(key, "pitfall") == 0) {
            curr->commonPitfalls = (char **)realloc(curr->commonPitfalls, sizeof(char *) * (curr->pitfalls_count + 1));
            curr->commonPitfalls[curr->pitfalls_count++] = strdup(val);
        } else if (strcmp(key, "prerequisites") == 0) {
            curr->prerequisites = split_comma(val, &curr->prerequisites_count);
        } else if (strcmp(key, "resource") == 0) {
            curr->resources = (TopicResource *)realloc(curr->resources, sizeof(TopicResource) * (curr->resources_count + 1));
            TopicResource *res = &curr->resources[curr->resources_count++];
            memset(res, 0, sizeof(TopicResource));
            char *bar1 = strchr(val, '|');
            if (bar1) {
                *bar1 = '\0';
                strncpy(res->title, val, sizeof(res->title) - 1);
                char *bar2 = strchr(bar1 + 1, '|');
                if (bar2) {
                    *bar2 = '\0';
                    strncpy(res->url, bar1 + 1, sizeof(res->url) - 1);
                    strncpy(res->type, bar2 + 1, sizeof(res->type) - 1);
                } else {
                    strncpy(res->url, bar1 + 1, sizeof(res->url) - 1);
                    strncpy(res->type, "article", sizeof(res->type) - 1);
                }
            } else {
                strncpy(res->title, val, sizeof(res->title) - 1);
            }
        }
    }
    fclose(f);
}

static void load_roadmaps(AppState *state, const char *data_dir) {
    char path[512];
    snprintf(path, sizeof(path), "%s/roadmaps.dat", data_dir);
    FILE *f = fopen(path, "r");
    if (!f) return;

    size_t capacity = 16;
    state->roadmaps = (Roadmap **)calloc(capacity, sizeof(Roadmap *));
    state->roadmap_count = 0;

    char line[8192];
    Roadmap *curr = NULL;
    RoadmapSection *curr_sec = NULL;

    while (fgets(line, sizeof(line), f)) {
        trim_crlf(line);
        if (strncmp(line, "=== ROADMAP ===", 15) == 0) {
            if (state->roadmap_count >= capacity) {
                capacity *= 2;
                state->roadmaps = (Roadmap **)realloc(state->roadmaps, sizeof(Roadmap *) * capacity);
            }
            curr = (Roadmap *)calloc(1, sizeof(Roadmap));
            curr_sec = NULL;
            state->roadmaps[state->roadmap_count++] = curr;
            continue;
        }

        if (strncmp(line, "--- SECTION ---", 15) == 0 && curr) {
            curr->sections = (RoadmapSection *)realloc(curr->sections, sizeof(RoadmapSection) * (curr->section_count + 1));
            curr_sec = &curr->sections[curr->section_count++];
            memset(curr_sec, 0, sizeof(RoadmapSection));
            continue;
        }

        char *colon = strchr(line, ':');
        if (!colon) continue;
        *colon = '\0';
        char *key = line;
        char *val = colon + 1;
        while (*val == ' ') val++;

        if (curr_sec) {
            if (strcmp(key, "id") == 0) {
                strncpy(curr_sec->id, val, sizeof(curr_sec->id) - 1);
            } else if (strcmp(key, "title") == 0) {
                strncpy(curr_sec->title, val, sizeof(curr_sec->title) - 1);
            } else if (strcmp(key, "topics") == 0) {
                curr_sec->topicIds = split_comma(val, &curr_sec->topic_count);
            }
        } else if (curr) {
            if (strcmp(key, "id") == 0) {
                strncpy(curr->id, val, sizeof(curr->id) - 1);
            } else if (strcmp(key, "type") == 0) {
                strncpy(curr->type, val, sizeof(curr->type) - 1);
            } else if (strcmp(key, "title") == 0) {
                strncpy(curr->title, val, sizeof(curr->title) - 1);
            } else if (strcmp(key, "description") == 0) {
                strncpy(curr->description, val, sizeof(curr->description) - 1);
            } else if (strcmp(key, "level") == 0) {
                strncpy(curr->level, val, sizeof(curr->level) - 1);
            } else if (strcmp(key, "estimatedHours") == 0) {
                curr->estimatedHours = atoi(val);
            } else if (strcmp(key, "icon") == 0) {
                strncpy(curr->icon, val, sizeof(curr->icon) - 1);
            }
        }
    }
    fclose(f);
}

static void load_concepts(AppState *state, const char *data_dir) {
    char path[512];
    snprintf(path, sizeof(path), "%s/concepts.dat", data_dir);
    FILE *f = fopen(path, "r");
    if (!f) return;

    size_t capacity = 16;
    state->concepts = (Concept **)calloc(capacity, sizeof(Concept *));
    state->concept_count = 0;

    char line[4096];
    Concept *curr = NULL;

    while (fgets(line, sizeof(line), f)) {
        trim_crlf(line);
        if (strncmp(line, "=== CONCEPT ===", 15) == 0) {
            if (state->concept_count >= capacity) {
                capacity *= 2;
                state->concepts = (Concept **)realloc(state->concepts, sizeof(Concept *) * capacity);
            }
            curr = (Concept *)calloc(1, sizeof(Concept));
            state->concepts[state->concept_count++] = curr;
            continue;
        }

        if (!curr) continue;

        char *colon = strchr(line, ':');
        if (!colon) continue;
        *colon = '\0';
        char *key = line;
        char *val = colon + 1;
        while (*val == ' ') val++;

        if (strcmp(key, "id") == 0) {
            strncpy(curr->id, val, sizeof(curr->id) - 1);
        } else if (strcmp(key, "name") == 0) {
            strncpy(curr->name, val, sizeof(curr->name) - 1);
        } else if (strcmp(key, "description") == 0) {
            strncpy(curr->description, val, sizeof(curr->description) - 1);
        } else if (strcmp(key, "topics") == 0) {
            curr->topicIds = split_comma(val, &curr->topic_count);
        }
    }
    fclose(f);
}

static void load_progress(AppState *state, const char *data_dir) {
    char path[512];
    snprintf(path, sizeof(path), "%s/progress.dat", data_dir);
    FILE *f = fopen(path, "r");
    if (!f) return;

    char line[512];
    while (fgets(line, sizeof(line), f)) {
        trim_crlf(line);
        char *eq = strchr(line, '=');
        if (!eq) continue;
        *eq = '\0';
        char *tid = line;
        char *status = eq + 1;

        Topic *t = (Topic *)hashmap_get(state->topic_map, tid);
        if (t) {
            strncpy(t->status, status, sizeof(t->status) - 1);
        }
        hashmap_put(state->progress_map, tid, strdup(status), free);
    }
    fclose(f);
}

bool models_save_progress(AppState *state, const char *data_dir) {
    if (!state || !data_dir) return false;
    char path[512];
    snprintf(path, sizeof(path), "%s/progress.dat", data_dir);
    FILE *f = fopen(path, "w");
    if (!f) return false;

    for (size_t i = 0; i < state->topic_count; i++) {
        Topic *t = state->topics[i];
        if (strcmp(t->status, "Not Started") != 0) {
            fprintf(f, "%s=%s\n", t->id, t->status);
        }
    }
    fclose(f);
    return true;
}

static void on_concept_propagated(void *ctx, const char *topic_id, const char *new_status) {
    AppState *state = (AppState *)ctx;
    Topic *t = (Topic *)hashmap_get(state->topic_map, topic_id);
    if (t && strcmp(t->status, "Not Started") == 0) {
        strncpy(t->status, new_status, sizeof(t->status) - 1);
        time_t now = time(NULL);
        struct tm *tm_info = gmtime(&now);
        strftime(t->updatedAt, sizeof(t->updatedAt), "%Y-%m-%dT%H:%M:%SZ", tm_info);
        hashmap_put(state->progress_map, topic_id, strdup(new_status), free);
    }
}

bool models_is_valid_topic_status(const char *status) {
    return status &&
        (strcmp(status, "Not Started") == 0 ||
         strcmp(status, "Familiar") == 0 ||
         strcmp(status, "In Progress") == 0 ||
         strcmp(status, "Completed") == 0);
}

bool models_set_topic_status(AppState *state, const char *topic_id, const char *status, const char *data_dir) {
    if (!state || !topic_id || !models_is_valid_topic_status(status)) return false;

    Topic *t = (Topic *)hashmap_get(state->topic_map, topic_id);
    if (!t) return false;

    strncpy(t->status, status, sizeof(t->status) - 1);
    time_t now = time(NULL);
    struct tm *tm_info = gmtime(&now);
    strftime(t->updatedAt, sizeof(t->updatedAt), "%Y-%m-%dT%H:%M:%SZ", tm_info);

    hashmap_put(state->progress_map, topic_id, strdup(status), free);

    if (strcmp(status, "Completed") == 0) {
        graph_propagate_concept(state->graph, topic_id, on_concept_propagated, state);
    }

    models_save_progress(state, data_dir);
    return true;
}

AppState *models_init(const char *data_dir) {
    AppState *state = (AppState *)calloc(1, sizeof(AppState));
    if (!state) return NULL;

    state->topic_map = hashmap_create(256);
    state->roadmap_map = hashmap_create(32);
    state->concept_map = hashmap_create(32);
    state->progress_map = hashmap_create(256);
    state->graph = graph_create();

    load_roadmaps(state, data_dir);
    for (size_t i = 0; i < state->roadmap_count; i++) {
        Roadmap *r = state->roadmaps[i];
        hashmap_put(state->roadmap_map, r->id, r, NULL);
        graph_add_vertex(state->graph, r->id, r->title, "roadmap");
    }

    load_topics(state, data_dir);
    for (size_t i = 0; i < state->topic_count; i++) {
        Topic *t = state->topics[i];
        hashmap_put(state->topic_map, t->id, t, NULL);
        graph_add_vertex(state->graph, t->id, t->title, "topic");
    }

    load_concepts(state, data_dir);
    for (size_t i = 0; i < state->concept_count; i++) {
        Concept *c = state->concepts[i];
        hashmap_put(state->concept_map, c->id, c, NULL);
        graph_add_vertex(state->graph, c->id, c->name, "concept");
        for (size_t j = 0; j < c->topic_count; j++) {
            graph_add_edge(state->graph, c->id, c->topicIds[j], "concept-link", 1.0);
            graph_add_edge(state->graph, c->topicIds[j], c->id, "concept-link", 1.0);
        }
    }

    // Build Roadmap & Section graph edges
    for (size_t i = 0; i < state->roadmap_count; i++) {
        Roadmap *r = state->roadmaps[i];
        char prev_topic_id[64] = "";

        for (size_t s = 0; s < r->section_count; s++) {
            RoadmapSection *sec = &r->sections[s];
            graph_add_vertex(state->graph, sec->id, sec->title, "section");
            graph_add_edge(state->graph, r->id, sec->id, "stage-next", 1.0);

            for (size_t t = 0; t < sec->topic_count; t++) {
                const char *tid = sec->topicIds[t];
                graph_add_edge(state->graph, sec->id, tid, "stage-next", 1.0);

                if (prev_topic_id[0]) {
                    graph_add_edge(state->graph, prev_topic_id, tid, "stage-next", 1.0);
                }
                strncpy(prev_topic_id, tid, sizeof(prev_topic_id) - 1);
            }
        }
    }

    // Build Prerequisite graph edges
    for (size_t i = 0; i < state->topic_count; i++) {
        Topic *t = state->topics[i];
        for (size_t j = 0; j < t->prerequisites_count; j++) {
            graph_add_edge(state->graph, t->prerequisites[j], t->id, "prerequisite", 1.0);
        }
        if (strcmp(t->type, "subroadmap") == 0 && *t->targetSubroadmap) {
            graph_add_edge(state->graph, t->id, t->targetSubroadmap, "subroadmap", 1.0);
        }
    }

    load_progress(state, data_dir);
    return state;
}

void models_free(AppState *state) {
    if (!state) return;

    if (state->topics) {
        for (size_t i = 0; i < state->topic_count; i++) {
            Topic *t = state->topics[i];
            if (!t) continue;
            if (t->summary) free(t->summary);
            if (t->explanation) free(t->explanation);
            if (t->codeExample) free(t->codeExample);
            if (t->objectives) {
                for (size_t j = 0; j < t->objectives_count; j++) free(t->objectives[j]);
                free(t->objectives);
            }
            if (t->commonPitfalls) {
                for (size_t j = 0; j < t->pitfalls_count; j++) free(t->commonPitfalls[j]);
                free(t->commonPitfalls);
            }
            if (t->prerequisites) {
                for (size_t j = 0; j < t->prerequisites_count; j++) free(t->prerequisites[j]);
                free(t->prerequisites);
            }
            if (t->resources) free(t->resources);
            free(t);
        }
        free(state->topics);
    }

    if (state->roadmaps) {
        for (size_t i = 0; i < state->roadmap_count; i++) {
            Roadmap *r = state->roadmaps[i];
            if (!r) continue;
            if (r->sections) {
                for (size_t s = 0; s < r->section_count; s++) {
                    RoadmapSection *sec = &r->sections[s];
                    if (sec->topicIds) {
                        for (size_t t = 0; t < sec->topic_count; t++) free(sec->topicIds[t]);
                        free(sec->topicIds);
                    }
                }
                free(r->sections);
            }
            free(r);
        }
        free(state->roadmaps);
    }

    if (state->concepts) {
        for (size_t i = 0; i < state->concept_count; i++) {
            Concept *c = state->concepts[i];
            if (!c) continue;
            if (c->topicIds) {
                for (size_t j = 0; j < c->topic_count; j++) free(c->topicIds[j]);
                free(c->topicIds);
            }
            free(c);
        }
        free(state->concepts);
    }

    if (state->topic_map) hashmap_free(state->topic_map, NULL);
    if (state->roadmap_map) hashmap_free(state->roadmap_map, NULL);
    if (state->concept_map) hashmap_free(state->concept_map, NULL);
    if (state->progress_map) hashmap_free(state->progress_map, free);
    if (state->graph) graph_free(state->graph);

    free(state);
}
