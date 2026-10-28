#include "api.h"
#include "hashmap.h"
#include "graph.h"
#include "queue.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

typedef struct StrBuf {
    char *data;
    size_t len;
    size_t cap;
} StrBuf;

static void sb_init(StrBuf *sb) {
    sb->cap = 1024;
    sb->len = 0;
    sb->data = (char *)malloc(sb->cap);
    if (sb->data) sb->data[0] = '\0';
}

static void sb_append(StrBuf *sb, const char *str) {
    if (!str || !sb->data) return;
    size_t slen = strlen(str);
    while (sb->len + slen + 1 >= sb->cap) {
        sb->cap *= 2;
        sb->data = (char *)realloc(sb->data, sb->cap);
    }
    memcpy(sb->data + sb->len, str, slen);
    sb->len += slen;
    sb->data[sb->len] = '\0';
}

static void sb_append_escaped(StrBuf *sb, const char *str) {
    if (!str) { sb_append(sb, "\"\""); return; }
    sb_append(sb, "\"");
    const char *p = str;
    while (*p) {
        if (*p == '"') sb_append(sb, "\\\"");
        else if (*p == '\\') sb_append(sb, "\\\\");
        else if (*p == '\n') sb_append(sb, "\\n");
        else if (*p == '\r') sb_append(sb, "\\r");
        else if (*p == '\t') sb_append(sb, "\\t");
        else {
            char ch[2] = { *p, '\0' };
            sb_append(sb, ch);
        }
        p++;
    }
    sb_append(sb, "\"");
}

static void set_json_response(ApiResponse *resp, int status, StrBuf *sb) {
    resp->status_code = status;
    strncpy(resp->content_type, "application/json", sizeof(resp->content_type) - 1);
    resp->body = sb->data;
}

static void set_error_response(ApiResponse *resp, int status, const char *msg) {
    StrBuf sb;
    sb_init(&sb);
    sb_append(&sb, "{\"error\":true,\"message\":");
    sb_append_escaped(&sb, msg ? msg : "An error occurred");
    sb_append(&sb, "}");
    set_json_response(resp, status, &sb);
}

void api_response_free(ApiResponse *resp) {
    if (resp && resp->body) {
        free(resp->body);
        resp->body = NULL;
    }
}

static void url_decode_in_place(char *str) {
    char *src = str;
    char *dst = str;
    while (*src) {
        if (*src == '+') {
            *dst++ = ' ';
            src++;
        } else if (*src == '%' && src[1] && src[2]) {
            char hex[3] = { src[1], src[2], '\0' };
            *dst++ = (char)strtol(hex, NULL, 16);
            src += 3;
        } else {
            *dst++ = *src++;
        }
    }
    *dst = '\0';
}

static bool get_query_param(const char *query, const char *key, char *dest, size_t dest_len) {
    if (!query || !key || !dest || dest_len == 0) return false;
    dest[0] = '\0';

    size_t klen = strlen(key);
    const char *p = query;
    while (*p) {
        if ((p == query || *(p - 1) == '&') && strncmp(p, key, klen) == 0 && p[klen] == '=') {
            const char *val_start = p + klen + 1;
            const char *val_end = strchr(val_start, '&');
            size_t vlen = val_end ? (size_t)(val_end - val_start) : strlen(val_start);
            if (vlen >= dest_len) vlen = dest_len - 1;
            strncpy(dest, val_start, vlen);
            dest[vlen] = '\0';
            url_decode_in_place(dest);
            return true;
        }
        p++;
    }
    return false;
}

static bool extract_json_field(const char *json, const char *key, char *out, size_t out_len) {
    if (!json || !key || !out || out_len == 0) return false;
    out[0] = '\0';
    char search[128];
    snprintf(search, sizeof(search), "\"%s\"", key);
    const char *p = strstr(json, search);
    if (!p) return false;
    p += strlen(search);
    while (*p == ' ' || *p == ':') p++;
    if (*p == '"') {
        p++;
        const char *end = strchr(p, '"');
        if (!end) return false;
        size_t len = (size_t)(end - p);
        if (len >= out_len) len = out_len - 1;
        strncpy(out, p, len);
        out[len] = '\0';
        return true;
    }
    return false;
}

static void topic_to_json(StrBuf *sb, const Topic *t, bool full) {
    if (!t) { sb_append(sb, "null"); return; }
    char num_buf[32];
    sb_append(sb, "{");
    sb_append(sb, "\"id\":"); sb_append_escaped(sb, t->id); sb_append(sb, ",");
    sb_append(sb, "\"title\":"); sb_append_escaped(sb, t->title); sb_append(sb, ",");
    sb_append(sb, "\"roadmapId\":"); sb_append_escaped(sb, t->roadmapId); sb_append(sb, ",");
    sb_append(sb, "\"type\":"); sb_append_escaped(sb, t->type); sb_append(sb, ",");
    if (*t->targetSubroadmap) {
        sb_append(sb, "\"targetSubroadmap\":"); sb_append_escaped(sb, t->targetSubroadmap); sb_append(sb, ",");
    }
    sb_append(sb, "\"difficulty\":"); sb_append_escaped(sb, t->difficulty); sb_append(sb, ",");
    snprintf(num_buf, sizeof(num_buf), "%d", t->estimatedMinutes);
    sb_append(sb, "\"estimatedMinutes\":"); sb_append(sb, num_buf); sb_append(sb, ",");
    sb_append(sb, "\"summary\":"); sb_append_escaped(sb, t->summary ? t->summary : ""); sb_append(sb, ",");
    sb_append(sb, "\"status\":"); sb_append_escaped(sb, t->status);

    if (full) {
        sb_append(sb, ",\"explanation\":"); sb_append_escaped(sb, t->explanation ? t->explanation : "");
        sb_append(sb, ",\"codeExample\":"); sb_append_escaped(sb, t->codeExample ? t->codeExample : "");

        sb_append(sb, ",\"objectives\":[");
        for (size_t i = 0; i < t->objectives_count; i++) {
            if (i > 0) sb_append(sb, ",");
            sb_append_escaped(sb, t->objectives[i]);
        }
        sb_append(sb, "],\"commonPitfalls\":[");
        for (size_t i = 0; i < t->pitfalls_count; i++) {
            if (i > 0) sb_append(sb, ",");
            sb_append_escaped(sb, t->commonPitfalls[i]);
        }
        sb_append(sb, "],\"prerequisites\":[");
        for (size_t i = 0; i < t->prerequisites_count; i++) {
            if (i > 0) sb_append(sb, ",");
            sb_append_escaped(sb, t->prerequisites[i]);
        }
        sb_append(sb, "],\"resources\":[");
        for (size_t i = 0; i < t->resources_count; i++) {
            if (i > 0) sb_append(sb, ",");
            sb_append(sb, "{\"title\":"); sb_append_escaped(sb, t->resources[i].title);
            sb_append(sb, ",\"url\":"); sb_append_escaped(sb, t->resources[i].url);
            sb_append(sb, ",\"type\":"); sb_append_escaped(sb, t->resources[i].type);
            sb_append(sb, "}");
        }
        sb_append(sb, "]");
    }
    sb_append(sb, "}");
}

static void roadmap_to_json(StrBuf *sb, const Roadmap *r, bool include_sections) {
    if (!r) { sb_append(sb, "null"); return; }
    char num_buf[32];
    sb_append(sb, "{");
    sb_append(sb, "\"id\":"); sb_append_escaped(sb, r->id); sb_append(sb, ",");
    sb_append(sb, "\"type\":"); sb_append_escaped(sb, r->type); sb_append(sb, ",");
    sb_append(sb, "\"title\":"); sb_append_escaped(sb, r->title); sb_append(sb, ",");
    sb_append(sb, "\"description\":"); sb_append_escaped(sb, r->description); sb_append(sb, ",");
    sb_append(sb, "\"level\":"); sb_append_escaped(sb, r->level); sb_append(sb, ",");
    snprintf(num_buf, sizeof(num_buf), "%d", r->estimatedHours);
    sb_append(sb, "\"estimatedHours\":"); sb_append(sb, num_buf); sb_append(sb, ",");
    sb_append(sb, "\"icon\":"); sb_append_escaped(sb, r->icon);

    if (include_sections) {
        sb_append(sb, ",\"sections\":[");
        for (size_t i = 0; i < r->section_count; i++) {
            if (i > 0) sb_append(sb, ",");
            sb_append(sb, "{\"id\":"); sb_append_escaped(sb, r->sections[i].id);
            sb_append(sb, ",\"title\":"); sb_append_escaped(sb, r->sections[i].title);
            sb_append(sb, ",\"topicIds\":[");
            for (size_t j = 0; j < r->sections[i].topic_count; j++) {
                if (j > 0) sb_append(sb, ",");
                sb_append_escaped(sb, r->sections[i].topicIds[j]);
            }
            sb_append(sb, "]}");
        }
        sb_append(sb, "]");
    }
    sb_append(sb, "}");
}

static void get_gemini_api_key(char *out_key, size_t max_len) {
    out_key[0] = '\0';
    const char *env_val = getenv("GEMINI_API_KEY");
    if (env_val && strlen(env_val) > 0) {
        strncpy(out_key, env_val, max_len - 1);
        out_key[max_len - 1] = '\0';
        return;
    }
    FILE *f = fopen(".env", "r");
    if (!f) return;
    char line[512];
    while (fgets(line, sizeof(line), f)) {
        char *p = line;
        while (*p == ' ' || *p == '\t') p++;
        if (strncmp(p, "GEMINI_API_KEY=", 15) == 0) {
            char *val = p + 15;
            while (*val == '"' || *val == '\'' || *val == ' ' || *val == '\t') val++;
            size_t vlen = strlen(val);
            while (vlen > 0 && (val[vlen - 1] == '\r' || val[vlen - 1] == '\n' || val[vlen - 1] == '"' || val[vlen - 1] == '\'' || val[vlen - 1] == ' ')) {
                val[--vlen] = '\0';
            }
            strncpy(out_key, val, max_len - 1);
            out_key[max_len - 1] = '\0';
            break;
        }
    }
    fclose(f);
}

ApiResponse api_handle_request(AppState *state, const char *data_dir, const char *method, const char *path, const char *query, const char *body) {
    ApiResponse resp = { 404, "application/json", NULL };

    if (!state || !method || !path) {
        set_error_response(&resp, 400, "Invalid request context");
        return resp;
    }

    // CORS preflight
    if (strcmp(method, "OPTIONS") == 0) {
        resp.status_code = 204;
        strncpy(resp.content_type, "text/plain", sizeof(resp.content_type) - 1);
        resp.body = strdup("");
        return resp;
    }

    // --- GET /api/config ---
    if (strcmp(method, "GET") == 0 && strcmp(path, "/api/config") == 0) {
        char api_key[256] = "";
        get_gemini_api_key(api_key, sizeof(api_key));
        StrBuf sb;
        sb_init(&sb);
        sb_append(&sb, "{\"geminiApiKey\":");
        sb_append_escaped(&sb, api_key);
        sb_append(&sb, "}");
        set_json_response(&resp, 200, &sb);
        return resp;
    }

    // --- GET /api/stats ---
    if (strcmp(method, "GET") == 0 && strcmp(path, "/api/stats") == 0) {
        size_t completed = 0, familiar = 0, in_progress = 0;
        for (size_t i = 0; i < state->topic_count; i++) {
            if (strcmp(state->topics[i]->status, "Completed") == 0) completed++;
            else if (strcmp(state->topics[i]->status, "Familiar") == 0) familiar++;
            else if (strcmp(state->topics[i]->status, "In Progress") == 0) in_progress++;
        }
        double progress_pct = state->topic_count ? (double)completed * 100.0 / state->topic_count : 0.0;

        StrBuf sb;
        sb_init(&sb);
        char buf[512];
        snprintf(buf, sizeof(buf),
            "{\"roadmaps\":%zu,\"topics\":%zu,\"concepts\":%zu,\"graphVertices\":%zu,\"graphEdges\":%zu,"
            "\"completedTopics\":%zu,\"familiarTopics\":%zu,\"inProgressTopics\":%zu,\"progressPercentage\":%.2f}",
            state->roadmap_count, state->topic_count, state->concept_count,
            state->graph->vertex_count, state->graph->edge_count,
            completed, familiar, in_progress, progress_pct);
        sb_append(&sb, buf);
        set_json_response(&resp, 200, &sb);
        return resp;
    }

    // --- GET /api/roadmaps or /api/careers ---
    if (strcmp(method, "GET") == 0 && (strcmp(path, "/api/roadmaps") == 0 || strcmp(path, "/api/careers") == 0)) {
        bool is_careers = (strcmp(path, "/api/careers") == 0);
        StrBuf sb;
        sb_init(&sb);
        sb_append(&sb, "[");
        bool first = true;
        for (size_t i = 0; i < state->roadmap_count; i++) {
            if (is_careers && strcmp(state->roadmaps[i]->type, "profession") != 0) continue;
            if (!first) sb_append(&sb, ",");
            roadmap_to_json(&sb, state->roadmaps[i], true);
            first = false;
        }
        sb_append(&sb, "]");
        set_json_response(&resp, 200, &sb);
        return resp;
    }

    // --- GET /api/roadmaps/:id or /api/careers/:id ---
    if (strcmp(method, "GET") == 0 && (strncmp(path, "/api/roadmaps/", 14) == 0 || strncmp(path, "/api/careers/", 13) == 0)) {
        const char *id = strncmp(path, "/api/roadmaps/", 14) == 0 ? path + 14 : path + 13;
        char clean_id[64];
        strncpy(clean_id, id, sizeof(clean_id) - 1);
        clean_id[sizeof(clean_id) - 1] = '\0';
        char *slash = strchr(clean_id, '/');
        if (slash) *slash = '\0';

        Roadmap *r = (Roadmap *)hashmap_get(state->roadmap_map, clean_id);
        if (!r) {
            set_error_response(&resp, 404, "Roadmap not found");
            return resp;
        }

        StrBuf sb;
        sb_init(&sb);
        roadmap_to_json(&sb, r, true);
        set_json_response(&resp, 200, &sb);
        return resp;
    }

    // --- GET /api/topics ---
    if (strcmp(method, "GET") == 0 && strcmp(path, "/api/topics") == 0) {
        StrBuf sb;
        sb_init(&sb);
        sb_append(&sb, "[");
        for (size_t i = 0; i < state->topic_count; i++) {
            if (i > 0) sb_append(&sb, ",");
            topic_to_json(&sb, state->topics[i], false);
        }
        sb_append(&sb, "]");
        set_json_response(&resp, 200, &sb);
        return resp;
    }

    // --- GET /api/topics/:id[/subpath] ---
    if (strcmp(method, "GET") == 0 && strncmp(path, "/api/topics/", 12) == 0) {
        const char *sub = path + 12;
        char topic_id[64] = "";
        char action[32] = "";

        const char *slash = strchr(sub, '/');
        if (slash) {
            size_t id_len = (size_t)(slash - sub);
            if (id_len >= sizeof(topic_id)) id_len = sizeof(topic_id) - 1;
            strncpy(topic_id, sub, id_len);
            topic_id[id_len] = '\0';
            strncpy(action, slash + 1, sizeof(action) - 1);
        } else {
            strncpy(topic_id, sub, sizeof(topic_id) - 1);
        }

        Topic *t = (Topic *)hashmap_get(state->topic_map, topic_id);
        if (!t) {
            set_error_response(&resp, 404, "Topic not found");
            return resp;
        }

        if (strcmp(action, "resources") == 0) {
            StrBuf sb;
            sb_init(&sb);
            sb_append(&sb, "[");
            for (size_t i = 0; i < t->resources_count; i++) {
                if (i > 0) sb_append(&sb, ",");
                sb_append(&sb, "{\"title\":"); sb_append_escaped(&sb, t->resources[i].title);
                sb_append(&sb, ",\"url\":"); sb_append_escaped(&sb, t->resources[i].url);
                sb_append(&sb, ",\"type\":"); sb_append_escaped(&sb, t->resources[i].type);
                sb_append(&sb, "}");
            }
            sb_append(&sb, "]");
            set_json_response(&resp, 200, &sb);
            return resp;
        } else if (strcmp(action, "prerequisites") == 0) {
            GraphPath gp = graph_get_prerequisites(state->graph, topic_id);
            StrBuf sb;
            sb_init(&sb);
            sb_append(&sb, "[");
            for (size_t i = 0; i < gp.count; i++) {
                if (i > 0) sb_append(&sb, ",");
                sb_append_escaped(&sb, gp.node_ids[i]);
            }
            sb_append(&sb, "]");
            graph_path_free(&gp);
            set_json_response(&resp, 200, &sb);
            return resp;
        } else if (strcmp(action, "dependents") == 0) {
            GraphPath gp = graph_get_dependents(state->graph, topic_id);
            StrBuf sb;
            sb_init(&sb);
            sb_append(&sb, "[");
            for (size_t i = 0; i < gp.count; i++) {
                if (i > 0) sb_append(&sb, ",");
                sb_append_escaped(&sb, gp.node_ids[i]);
            }
            sb_append(&sb, "]");
            graph_path_free(&gp);
            set_json_response(&resp, 200, &sb);
            return resp;
        } else if (strcmp(action, "subroadmap") == 0) {
            if (strcmp(t->type, "subroadmap") == 0 && *t->targetSubroadmap) {
                Roadmap *sr = (Roadmap *)hashmap_get(state->roadmap_map, t->targetSubroadmap);
                if (sr) {
                    StrBuf sb;
                    sb_init(&sb);
                    roadmap_to_json(&sb, sr, true);
                    set_json_response(&resp, 200, &sb);
                    return resp;
                }
            }
            set_error_response(&resp, 404, "Topic has no associated subroadmap");
            return resp;
        } else {
            StrBuf sb;
            sb_init(&sb);
            topic_to_json(&sb, t, true);
            set_json_response(&resp, 200, &sb);
            return resp;
        }
    }

    // --- GET /api/path?from=X&to=Y ---
    if (strcmp(method, "GET") == 0 && strcmp(path, "/api/path") == 0) {
        char from_id[64] = "";
        char to_id[64] = "";
        get_query_param(query, "from", from_id, sizeof(from_id));
        get_query_param(query, "to", to_id, sizeof(to_id));

        if (!*from_id || !*to_id) {
            set_error_response(&resp, 400, "Parameters 'from' and 'to' are required");
            return resp;
        }

        GraphPath gp = graph_find_path(state->graph, from_id, to_id);
        bool suggested = false;
        if (!gp.found) {
            graph_path_free(&gp);
            GraphPath preparation = graph_get_prerequisite_chain(state->graph, to_id);
            if (preparation.found && preparation.count > 1) {
                gp = preparation;
                suggested = true;
            } else {
                graph_path_free(&preparation);
            }
        }

        StrBuf sb;
        sb_init(&sb);
        sb_append(&sb, "{\"from\":"); sb_append_escaped(&sb, from_id);
        sb_append(&sb, ",\"to\":"); sb_append_escaped(&sb, to_id);
        sb_append(&sb, ",\"found\":"); sb_append(&sb, (!suggested && gp.found) ? "true" : "false");
        sb_append(&sb, ",\"suggested\":"); sb_append(&sb, suggested ? "true" : "false");
        char hops_buf[32];
        snprintf(hops_buf, sizeof(hops_buf), "%zu", (!suggested && gp.found && gp.count > 0) ? gp.count - 1 : 0);
        sb_append(&sb, ",\"hops\":"); sb_append(&sb, hops_buf);
        sb_append(&sb, ",\"path\":[");

        for (size_t i = 0; i < gp.count; i++) {
            if (i > 0) sb_append(&sb, ",");
            Topic *t = (Topic *)hashmap_get(state->topic_map, gp.node_ids[i]);
            if (t) {
                topic_to_json(&sb, t, false);
            } else {
                sb_append(&sb, "{\"id\":"); sb_append_escaped(&sb, gp.node_ids[i]); sb_append(&sb, "}");
            }
        }
        sb_append(&sb, "]}");

        graph_path_free(&gp);
        set_json_response(&resp, 200, &sb);
        return resp;
    }

    // --- GET /api/recommendations ---
    if (strcmp(method, "GET") == 0 && strcmp(path, "/api/recommendations") == 0) {
        Queue *q = queue_create();

        for (size_t i = 0; i < state->topic_count; i++) {
            Topic *t = state->topics[i];
            if (strcmp(t->status, "Completed") == 0) continue;

            bool all_prereqs_satisfied = true;
            for (size_t j = 0; j < t->prerequisites_count; j++) {
                Topic *pre = (Topic *)hashmap_get(state->topic_map, t->prerequisites[j]);
                if (!pre || strcmp(pre->status, "Completed") != 0) {
                    all_prereqs_satisfied = false;
                    break;
                }
            }

            if (all_prereqs_satisfied) {
                queue_enqueue(q, t);
            }
        }

        StrBuf sb;
        sb_init(&sb);
        sb_append(&sb, "{\"recommendations\":[");
        bool first = true;
        while (!queue_is_empty(q)) {
            Topic *t = (Topic *)queue_dequeue(q);
            if (!first) sb_append(&sb, ",");
            topic_to_json(&sb, t, false);
            first = false;
        }
        sb_append(&sb, "]}");
        queue_free(q, NULL);

        set_json_response(&resp, 200, &sb);
        return resp;
    }

    // --- GET /api/progress ---
    if (strcmp(method, "GET") == 0 && strcmp(path, "/api/progress") == 0) {
        StrBuf sb;
        sb_init(&sb);
        sb_append(&sb, "{\"topics\":{");
        size_t completed = 0;
        bool first = true;

        for (size_t i = 0; i < state->topic_count; i++) {
            Topic *t = state->topics[i];
            if (strcmp(t->status, "Not Started") != 0) {
                if (!first) sb_append(&sb, ",");
                sb_append_escaped(&sb, t->id);
                sb_append(&sb, ":{\"status\":");
                sb_append_escaped(&sb, t->status);
                sb_append(&sb, ",\"updatedAt\":");
                sb_append_escaped(&sb, t->updatedAt[0] ? t->updatedAt : "2026-09-15T00:00:00Z");
                sb_append(&sb, "}");
                first = false;
            }
            if (strcmp(t->status, "Completed") == 0) completed++;
        }

        char buf[256];
        double pct = state->topic_count ? (double)completed * 100.0 / state->topic_count : 0.0;
        snprintf(buf, sizeof(buf), "},\"totalTopics\":%zu,\"completedCount\":%zu,\"percentage\":%.2f}",
                 state->topic_count, completed, pct);
        sb_append(&sb, buf);

        set_json_response(&resp, 200, &sb);
        return resp;
    }

    // --- POST /api/progress ---
    if (strcmp(method, "POST") == 0 && strcmp(path, "/api/progress") == 0) {
        char topic_id[64] = "";
        char status[32] = "";

        if (!extract_json_field(body, "topicId", topic_id, sizeof(topic_id)) ||
            !extract_json_field(body, "status", status, sizeof(status))) {
            set_error_response(&resp, 400, "Missing 'topicId' or 'status' field");
            return resp;
        }

        bool ok = models_set_topic_status(state, topic_id, status, data_dir);
        if (!ok) {
            set_error_response(&resp, 404, "Failed to update status (invalid topicId)");
            return resp;
        }

        Topic *t = (Topic *)hashmap_get(state->topic_map, topic_id);
        StrBuf sb;
        sb_init(&sb);
        sb_append(&sb, "{\"success\":true,\"topicId\":");
        sb_append_escaped(&sb, topic_id);
        sb_append(&sb, ",\"status\":");
        sb_append_escaped(&sb, t ? t->status : status);
        sb_append(&sb, "}");
        set_json_response(&resp, 200, &sb);
        return resp;
    }

    // --- DELETE /api/progress/:topicId ---
    if (strcmp(method, "DELETE") == 0 && strncmp(path, "/api/progress/", 14) == 0) {
        const char *tid = path + 14;
        bool ok = models_set_topic_status(state, tid, "Not Started", data_dir);
        if (!ok) {
            set_error_response(&resp, 404, "Topic not found");
            return resp;
        }
        StrBuf sb;
        sb_init(&sb);
        sb_append(&sb, "{\"success\":true,\"topicId\":");
        sb_append_escaped(&sb, tid);
        sb_append(&sb, ",\"status\":\"Not Started\"}");
        set_json_response(&resp, 200, &sb);
        return resp;
    }

    // --- GET /api/graph ---
    if (strcmp(method, "GET") == 0 && strcmp(path, "/api/graph") == 0) {
        StrBuf sb;
        sb_init(&sb);
        sb_append(&sb, "{\"nodes\":[");

        if (state->graph && state->graph->vertices) {
            ListNode *v_node = state->graph->vertices->head;
            bool first_node = true;
            while (v_node) {
                GraphVertex *v = (GraphVertex *)v_node->data;
                if (!first_node) sb_append(&sb, ",");
                sb_append(&sb, "{\"id\":"); sb_append_escaped(&sb, v->id);
                sb_append(&sb, ",\"label\":"); sb_append_escaped(&sb, v->label);
                sb_append(&sb, ",\"type\":"); sb_append_escaped(&sb, v->node_type);
                sb_append(&sb, "}");
                first_node = false;
                v_node = v_node->next;
            }
        }

        sb_append(&sb, "],\"edges\":[");

        if (state->graph && state->graph->vertices) {
            ListNode *v_node = state->graph->vertices->head;
            bool first_edge = true;
            while (v_node) {
                GraphVertex *v = (GraphVertex *)v_node->data;
                ListNode *e_node = v->outgoing_edges->head;
                while (e_node) {
                    GraphEdge *e = (GraphEdge *)e_node->data;
                    if (!first_edge) sb_append(&sb, ",");
                    char wbuf[32];
                    snprintf(wbuf, sizeof(wbuf), "%.1f", e->weight);
                    sb_append(&sb, "{\"source\":"); sb_append_escaped(&sb, v->id);
                    sb_append(&sb, ",\"target\":"); sb_append_escaped(&sb, e->target_id);
                    sb_append(&sb, ",\"type\":"); sb_append_escaped(&sb, e->edge_type);
                    sb_append(&sb, ",\"weight\":"); sb_append(&sb, wbuf);
                    sb_append(&sb, "}");
                    first_edge = false;
                    e_node = e_node->next;
                }
                v_node = v_node->next;
            }
        }

        char count_buf[128];
        snprintf(count_buf, sizeof(count_buf), "],\"vertexCount\":%zu,\"edgeCount\":%zu}",
                 state->graph ? state->graph->vertex_count : 0,
                 state->graph ? state->graph->edge_count : 0);
        sb_append(&sb, count_buf);

        set_json_response(&resp, 200, &sb);
        return resp;
    }

    set_error_response(&resp, 404, "Endpoint not found");
    return resp;
}
