# SWEA-4875 미로
# DFS 풀이


T = int(input())

for test_case in range(1, T + 1):
    N = int(input())
    maze = [list(map(int, input())) for _ in range(N)]

    dr = [-1, 1, 0, 0]
    dc = [0, 0, -1, 1]

    visited = [[False] * N for _ in range(N)]  # 방문 여부를 기록할 2차원 리스트
    # [PITFALL] sr = sc = None
    sr = sc = -1  # 출발점 좌표 초기화

    # 미로를 순회하며 출발점(2) 찾기
    for r in range(N):
        for c in range(N):
            if maze[r][c] == 2:
                sr, sc = r, c  # 출발 위치 저장
                break  # 안쪽 for문 탈출
        # [PITFALL] (sr, sc를 None으로 초기화) if sr:
        # >> sr 좌표가 0인 경우 False로 취급되어 첫 번째 행에서 시작점을 찾아도 루프를 탈출하지 못하게 됨
        if sr != -1: break  # 출발점을 찾았다면 바깥쪽 for문도 즉시 탈출

    visited[sr][sc] = True  # 시작 위치 방문 처리
    stack = [(sr, sc)]      # DFS 탐색을 위한 스택 초기화
    result = 0              # 도달 가능 여부 (기본값 0)

    # 스택이 빌 때까지 탐색 반복 (DFS)
    while stack:
        r, c = stack.pop()  # 현재 검사할 좌표 꺼내기
        for d in range(4):  # 4방향 인접 칸 확인
            nr = r + dr[d]
            nc = c + dc[d]

            # 경계선 검사
            if 0 <= nr < N and 0 <= nc < N:
                # 목적지(3)에 도달한 경우
                if maze[nr][nc] == 3:
                    result = 1
                    break  # 방향 탐색 종료
                # 아직 방문하지 않은 통로(0)인 경우
                elif not visited[nr][nc] and maze[nr][nc] == 0:
                    # [TIL] push 시점에 방문 처리하는 이유 >> 메모리 절약
                    # pop 시점에 방문 처리한다면?
                    # >> 스택에 들어있는 동안 다른 경로에서 중복으로 push 될 수 있음
                    visited[nr][nc] = True  # 방문 예약 처리
                    stack.append((nr, nc))  # 스택에 추가

        # 목적지를 찾았다면 while문 즉시 탈출
        if result == 1:
            break

    print(f'#{test_case} {result}')
