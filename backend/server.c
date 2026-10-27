#ifdef _WIN32
  #ifndef WIN32_LEAN_AND_MEAN
  #define WIN32_LEAN_AND_MEAN
  #endif
  #include <winsock2.h>
  #include <ws2tcpip.h>
  #include <windows.h>
  #define close_socket closesocket
  #pragma comment(lib, "ws2_32.lib")
#else
  #include <sys/socket.h>
  #include <netinet/in.h>
  #include <arpa/inet.h>
  #include <unistd.h>
  #include <pthread.h>
  #include <sys/select.h>
  #define SOCKET int
  #define INVALID_SOCKET -1
  #define SOCKET_ERROR -1
  #define close_socket close
#endif

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>
#include <sys/stat.h>

#include "models.h"
#include "graph.h"
#include "api.h"

static volatile int s_running = 1;

#ifdef _WIN32
static BOOL WINAPI console_handler(DWORD signal_evt) {
    if (signal_evt == CTRL_C_EVENT || signal_evt == CTRL_BREAK_EVENT || signal_evt == CTRL_CLOSE_EVENT) {
        s_running = 0;
        return TRUE;
    }
    return FALSE;
}
#else
static void signal_handler(int sig) {
    (void)sig;
    s_running = 0;
}
#endif

typedef struct ClientContext {
    SOCKET client_socket;
    AppState *state;
    char data_dir[256];
    char frontend_dir[256];
} ClientContext;

static const char *get_mime_type(const char *path) {
    const char *ext = strrchr(path, '.');
    if (!ext) return "text/html; charset=utf-8";
    if (strcmp(ext, ".html") == 0 || strcmp(ext, ".htm") == 0) return "text/html; charset=utf-8";
    if (strcmp(ext, ".css") == 0) return "text/css; charset=utf-8";
    if (strcmp(ext, ".js") == 0) return "application/javascript; charset=utf-8";
    if (strcmp(ext, ".json") == 0) return "application/json; charset=utf-8";
    if (strcmp(ext, ".png") == 0) return "image/png";
    if (strcmp(ext, ".jpg") == 0 || strcmp(ext, ".jpeg") == 0) return "image/jpeg";
    if (strcmp(ext, ".svg") == 0) return "image/svg+xml";
    if (strcmp(ext, ".ico") == 0) return "image/x-icon";
    return "text/plain; charset=utf-8";
}

#ifdef _WIN32
static DWORD WINAPI handle_client(LPVOID arg)
#else
static void *handle_client(void *arg)
#endif
{
    ClientContext *ctx = (ClientContext *)arg;
    SOCKET s = ctx->client_socket;

    char buffer[8192];
    int total_read = 0;
    int header_end = -1;

    while (total_read < (int)sizeof(buffer) - 1) {
        int bytes = recv(s, buffer + total_read, (int)sizeof(buffer) - 1 - total_read, 0);
        if (bytes <= 0) break;
        total_read += bytes;
        buffer[total_read] = '\0';

        char *p = strstr(buffer, "\r\n\r\n");
        if (p) {
            header_end = (int)(p - buffer) + 4;
            break;
        }
    }

    if (header_end <= 0) {
        close_socket(s);
        free(ctx);
        return 0;
    }

    char method[16] = "";
    char full_uri[512] = "";
    sscanf(buffer, "%15s %511s", method, full_uri);

    char path[512] = "";
    char query[512] = "";
    char *qmark = strchr(full_uri, '?');
    if (qmark) {
        size_t plen = (size_t)(qmark - full_uri);
        if (plen >= sizeof(path)) plen = sizeof(path) - 1;
        strncpy(path, full_uri, plen);
        path[plen] = '\0';
        strncpy(query, qmark + 1, sizeof(query) - 1);
        query[sizeof(query) - 1] = '\0';
    } else {
        strncpy(path, full_uri, sizeof(path) - 1);
        path[sizeof(path) - 1] = '\0';
    }

    int content_length = 0;
    char *cl_header = strstr(buffer, "Content-Length:");
    if (!cl_header) cl_header = strstr(buffer, "content-length:");
    if (cl_header) {
        content_length = atoi(cl_header + 15);
    }

    char *body = NULL;
    if (content_length > 0) {
        body = (char *)malloc(content_length + 1);
        if (body) {
            int body_already_read = total_read - header_end;
            if (body_already_read > content_length) body_already_read = content_length;
            if (body_already_read > 0) {
                memcpy(body, buffer + header_end, body_already_read);
            }
            int remaining = content_length - body_already_read;
            int offset = body_already_read;
            while (remaining > 0) {
                int bytes = recv(s, body + offset, remaining, 0);
                if (bytes <= 0) break;
                offset += bytes;
                remaining -= bytes;
            }
            body[offset] = '\0';
        }
    }

    if (strncmp(path, "/api/", 5) == 0 || strcmp(path, "/api") == 0) {
        ApiResponse resp = api_handle_request(ctx->state, ctx->data_dir, method, path, query, body ? body : "");

        /* Map status code to standard HTTP reason phrase */
        const char *reason;
        switch (resp.status_code) {
            case 200: reason = "OK";                    break;
            case 201: reason = "Created";               break;
            case 204: reason = "No Content";            break;
            case 400: reason = "Bad Request";           break;
            case 404: reason = "Not Found";             break;
            case 500: reason = "Internal Server Error"; break;
            default:  reason = "OK";                    break;
        }

        char response_header[1024];
        int body_len = resp.body ? (int)strlen(resp.body) : 0;
        int hlen = snprintf(response_header, sizeof(response_header),
            "HTTP/1.1 %d %s\r\n"
            "Content-Type: %s\r\n"
            "Content-Length: %d\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS\r\n"
            "Access-Control-Allow-Headers: Content-Type\r\n"
            "Connection: close\r\n\r\n",
            resp.status_code, reason,
            resp.content_type[0] ? resp.content_type : "application/json", body_len);

        send(s, response_header, hlen, 0);
        if (body_len > 0) {
            send(s, resp.body, body_len, 0);
        }
        api_response_free(&resp);
    } else {
        if (strstr(path, "..")) {
            const char *err400 = "HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\nConnection: close\r\n\r\n";
            send(s, err400, (int)strlen(err400), 0);
        } else {
            char filepath[1024];
            snprintf(filepath, sizeof(filepath), "%s%s", ctx->frontend_dir, strcmp(path, "/") == 0 ? "/index.html" : path);

            FILE *f = fopen(filepath, "rb");
            if (!f && !strchr(path, '.')) {
                snprintf(filepath, sizeof(filepath), "%s/index.html", ctx->frontend_dir);
                f = fopen(filepath, "rb");
            }

            if (f) {
                fseek(f, 0, SEEK_END);
                long flen = ftell(f);
                fseek(f, 0, SEEK_SET);

                const char *mime = get_mime_type(filepath);
                char header[512];
                int hlen = snprintf(header, sizeof(header),
                    "HTTP/1.1 200 OK\r\n"
                    "Content-Type: %s\r\n"
                    "Content-Length: %ld\r\n"
                    "Access-Control-Allow-Origin: *\r\n"
                    "Connection: close\r\n\r\n",
                    mime, flen);
                send(s, header, hlen, 0);

                char filebuf[4096];
                size_t n;
                while ((n = fread(filebuf, 1, sizeof(filebuf), f)) > 0) {
                    send(s, filebuf, (int)n, 0);
                }
                fclose(f);
            } else {
                const char *err404 = "HTTP/1.1 404 Not Found\r\nContent-Length: 9\r\nConnection: close\r\n\r\nNot Found";
                send(s, err404, (int)strlen(err404), 0);
            }
        }
    }

    if (body) free(body);
    close_socket(s);
    free(ctx);
    return 0;
}

int main(int argc, char *argv[]) {
    int port = 8000;
    const char *data_dir = "data";
    const char *frontend_dir = "frontend";

    for (int i = 1; i < argc; i++) {
        if (strcmp(argv[i], "--port") == 0 && i + 1 < argc) {
            port = atoi(argv[++i]);
        } else if (strcmp(argv[i], "--data") == 0 && i + 1 < argc) {
            data_dir = argv[++i];
        } else if (strcmp(argv[i], "--frontend") == 0 && i + 1 < argc) {
            frontend_dir = argv[++i];
        }
    }

    printf("====================================================\n");
    printf("  PathForge C DSA HTTP Server (Cross-Platform)\n");
    printf("====================================================\n");
    printf("[*] Loading Data Structures from '%s'...\n", data_dir);

    AppState *state = models_init(data_dir);
    if (!state) {
        fprintf(stderr, "[-] Fatal Error: Failed to initialize application state.\n");
        return 1;
    }

    printf("[+] Loaded %zu roadmaps, %zu topics, %zu concepts.\n",
           state->roadmap_count, state->topic_count, state->concept_count);
    printf("[+] Directed Graph initialized with %zu vertices, %zu edges.\n",
           state->graph->vertex_count, state->graph->edge_count);

#ifdef _WIN32
    WSADATA wsaData;
    if (WSAStartup(MAKEWORD(2, 2), &wsaData) != 0) {
        fprintf(stderr, "[-] WSAStartup failed.\n");
        models_free(state);
        return 1;
    }
    SetConsoleCtrlHandler(console_handler, TRUE);
#else
    signal(SIGINT, signal_handler);
    signal(SIGTERM, signal_handler);
#endif

    SOCKET listen_sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (listen_sock == INVALID_SOCKET) {
        fprintf(stderr, "[-] Socket creation failed.\n");
#ifdef _WIN32
        WSACleanup();
#endif
        models_free(state);
        return 1;
    }

    int opt = 1;
    setsockopt(listen_sock, SOL_SOCKET, SO_REUSEADDR, (const char *)&opt, sizeof(opt));

    struct sockaddr_in server_addr;
    memset(&server_addr, 0, sizeof(server_addr));
    server_addr.sin_family = AF_INET;
    server_addr.sin_addr.s_addr = INADDR_ANY;
    server_addr.sin_port = htons((u_short)port);

    if (bind(listen_sock, (struct sockaddr *)&server_addr, sizeof(server_addr)) == SOCKET_ERROR) {
        fprintf(stderr, "[-] Bind failed on port %d.\n", port);
        close_socket(listen_sock);
#ifdef _WIN32
        WSACleanup();
#endif
        models_free(state);
        return 1;
    }

    if (listen(listen_sock, SOMAXCONN) == SOCKET_ERROR) {
        fprintf(stderr, "[-] Listen failed.\n");
        close_socket(listen_sock);
#ifdef _WIN32
        WSACleanup();
#endif
        models_free(state);
        return 1;
    }

    printf("[*] Starting HTTP server on http://0.0.0.0:%d...\n", port);
    printf("[*] Serving Web UI from '%s'...\n", frontend_dir);
    printf("[+] PathForge Server is online!\n");
    printf("    -> Frontend: http://localhost:%d\n", port);
    printf("    -> REST API: http://localhost:%d/api/roadmaps\n", port);
    printf("====================================================\n");

    while (s_running) {
        fd_set readfds;
        FD_ZERO(&readfds);
        FD_SET(listen_sock, &readfds);

        struct timeval tv;
        tv.tv_sec = 1;
        tv.tv_usec = 0;

        int max_fd = (int)listen_sock;
        int activity = select(max_fd + 1, &readfds, NULL, NULL, &tv);
        if (activity > 0 && FD_ISSET(listen_sock, &readfds)) {
            SOCKET client_sock = accept(listen_sock, NULL, NULL);
            if (client_sock != INVALID_SOCKET) {
                ClientContext *ctx = (ClientContext *)malloc(sizeof(ClientContext));
                if (ctx) {
                    ctx->client_socket = client_sock;
                    ctx->state = state;
                    strncpy(ctx->data_dir, data_dir, sizeof(ctx->data_dir) - 1);
                    strncpy(ctx->frontend_dir, frontend_dir, sizeof(ctx->frontend_dir) - 1);

#ifdef _WIN32
                    HANDLE hThread = CreateThread(NULL, 0, handle_client, ctx, 0, NULL);
                    if (hThread) {
                        CloseHandle(hThread);
                    } else {
                        close_socket(client_sock);
                        free(ctx);
                    }
#else
                    pthread_t thread_id;
                    if (pthread_create(&thread_id, NULL, handle_client, ctx) == 0) {
                        pthread_detach(thread_id);
                    } else {
                        close_socket(client_sock);
                        free(ctx);
                    }
#endif
                } else {
                    close_socket(client_sock);
                }
            }
        }
    }

    printf("\n[*] Graceful shutdown initiated...\n");
    close_socket(listen_sock);
#ifdef _WIN32
    WSACleanup();
#endif
    models_free(state);
    printf("[+] Clean shutdown complete. Goodbye!\n");
    return 0;
}
