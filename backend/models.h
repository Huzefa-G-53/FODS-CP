#ifndef PATHFORGE_MODELS_H
#define PATHFORGE_MODELS_H

#include <stddef.h>
#include <stdbool.h>

typedef struct TopicResource {
    char title[128];
    char url[256];
    char type[32];
} TopicResource;

typedef struct Topic {
    char id[64];
    char title[128];
    char roadmapId[64];
    char type[32]; // "standard" or "subroadmap"
    char targetSubroadmap[64];
    char difficulty[32]; // "Beginner", "Intermediate", "Advanced"
    int estimatedMinutes;
    char *summary;
    char *explanation;
    char **objectives;
    size_t objectives_count;
    char *codeExample;
    char **commonPitfalls;
    size_t pitfalls_count;
    char **prerequisites;
    size_t prerequisites_count;
    TopicResource *resources;
    size_t resources_count;
    
    // Dynamic user progress state
    char status[32]; // "Not Started", "Familiar", "In Progress", "Completed"
    char updatedAt[64];
} Topic;

typedef struct RoadmapSection {
    char id[64];
    char title[128];
    char **topicIds;
    size_t topic_count;
} RoadmapSection;

typedef struct Roadmap {
    char id[64];
    char type[32]; // "language", "profession", "subroadmap"
    char title[128];
    char description[512];
    char level[32];
    int estimatedHours;
    char icon[32];
    RoadmapSection *sections;
    size_t section_count;
} Roadmap;

typedef struct Concept {
    char id[64];
    char name[128];
    char description[512];
    char **topicIds;
    size_t topic_count;
} Concept;

typedef struct AppState {
    Topic **topics;
    size_t topic_count;
    
    Roadmap **roadmaps;
    size_t roadmap_count;
    
    Concept **concepts;
    size_t concept_count;

    // Fast O(1) hash maps
    struct HashMap *topic_map;      // key: topicId -> Topic*
    struct HashMap *roadmap_map;    // key: roadmapId -> Roadmap*
    struct HashMap *concept_map;    // key: conceptId -> Concept*
    struct HashMap *progress_map;   // key: topicId -> status string

    // Graph structure
    struct Graph *graph;
} AppState;

AppState *models_init(const char *data_dir);
void models_free(AppState *state);
bool models_save_progress(AppState *state, const char *data_dir);
bool models_is_valid_topic_status(const char *status);
bool models_set_topic_status(AppState *state, const char *topic_id, const char *status, const char *data_dir);

#endif // PATHFORGE_MODELS_H
