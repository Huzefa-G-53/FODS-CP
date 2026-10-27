CC      = gcc
CFLAGS  = -Wall -Wextra -O2 -Ibackend

# Detect OS and set platform-specific flags / binary names
ifeq ($(OS),Windows_NT)
    LDFLAGS      = -lws2_32
    SERVER_BIN   = server.exe
    TEST_BIN     = test/test_dsa.exe
    RUN_PREFIX   = 
else
    LDFLAGS      = -lpthread
    SERVER_BIN   = server
    TEST_BIN     = test/test_dsa
    RUN_PREFIX   = ./
endif

SRC_DIR      = backend
DATA_DIR     = data
FRONTEND_DIR = frontend

COMMON_SRCS = $(SRC_DIR)/linked_list.c \
              $(SRC_DIR)/queue.c \
              $(SRC_DIR)/stack.c \
              $(SRC_DIR)/hashmap.c \
              $(SRC_DIR)/graph.c

SERVER_SRCS = $(COMMON_SRCS) \
              $(SRC_DIR)/models.c \
              $(SRC_DIR)/api.c \
              $(SRC_DIR)/server.c

TEST_SRCS = $(COMMON_SRCS) test/test_dsa.c

all: $(SERVER_BIN) $(TEST_BIN)

$(SERVER_BIN): $(SERVER_SRCS)
	$(CC) $(CFLAGS) $(SERVER_SRCS) $(LDFLAGS) -o $(SERVER_BIN)

$(TEST_BIN): $(TEST_SRCS)
	$(CC) $(CFLAGS) $(TEST_SRCS) -o $(TEST_BIN)

test: $(TEST_BIN)
	$(RUN_PREFIX)$(TEST_BIN)

run: $(SERVER_BIN)
	$(RUN_PREFIX)$(SERVER_BIN) --port 8000 --data $(DATA_DIR) --frontend $(FRONTEND_DIR)

clean:
	rm -f $(SERVER_BIN) $(TEST_BIN)

.PHONY: all test run clean
