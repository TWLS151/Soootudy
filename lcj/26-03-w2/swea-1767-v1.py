'''
By ChatGPT

1. 기존의 접근
- DFS + 백트래킹
- 4방향 탐색 후 전선 연결 가능 시 탐색 지속 -> 이게 문제였음

2. 계속 가져갈만한 아이디어
- 내부 영역 prcessor만 따로 관리

3. 오판했던 부분
- core 선택 방식 : 이 문제는 순열이 아니다! '순서 고정 DFS'이다.

4. 핵심 구조

- 4방향에 대해 연결 가능 여부 파악
- 가능 -> 길 깔고 탐색
- 불가능 -> 넘어가기
'''

import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

d = [(-1, 0), (1, 0), (0, -1), (0, 1)]

# 1. 필요 함수 구축

def in_range(x, y):
    return 0 <= x < y

## (1) 전선 연결이 필요한 코어 리스트를 반환하는 함수
def find_cores():
    lst = []

    for r in range(N):
        for c in range(N):

            if arr[r][c]:                   # 코어 발견 시
                visited_grid[r][c] = True   # 방문 처리

                if r == 0 or r == N-1 or c == 0 or c == N-1:    # 이미 전류가 흐른다면 Pass
                    continue

                else: lst.append((r, c))        # 전선 연결이 필요한 core의 좌표를 추가

    return lst

# (2) 연결 가능 여부를 판단하는 함수
def is_connect(coordinate, dr, dc):

    r, c = coordinate
    nr = r + dr
    nc = c + dc

    while in_range(nr, N) and in_range(nc, N): # 범위 내에서 계속 전진 -> True 만나면 False

        if visited_grid[nr][nc]:    # 전선 or 코어를 만나면 연결 불가
            return False

        if nr == N-1 or nr == 0 or nc == N-1 or nc == 0:
            return True             # 끝까지 도달했다면 -> 연결 가능

        nr += dr
        nc += dc


# (3) 전선 연결 & 비용 계산 함수
def connecting_value(coord, dr, dc):

    r, c = coord
    nr = r + dr
    nc = c + dc
    cnt = 0
    visited_grid[nr][nc] = True

    while in_range(nr, N) and in_range(nc, N):  # 범위 내에서 계속 전진 -> True 만나면 False

        if nr == 0 or nr == N - 1 or nc == 0 or nc == N - 1:    # 전류가 흐르는 칸에 도착 시
            cnt += 1                                            # 카운트 증가 후 비용 반환
            return cnt

        nr += dr
        nc += dc
        visited_grid[nr][nc] = True
        cnt += 1

    return cnt

# (4) 전선 연결 백트래킹 (해체) 함수
def disconnecting(coord, dr, dc):

    r, c = coord
    nr = r + dr
    nc = c + dc
    visited_grid[nr][nc] = False

    while in_range(nr, N) and in_range(nc, N):

        if nr == 0 or nr == N - 1 or nc == 0 or nc == N - 1:
            return

        nr += dr
        nc += dc
        visited_grid[nr][nc] = False

def dfs_core(depth, success, total):
    global max_cores
    global min_total

    if success + (M - depth) < max_cores:       # 가지치기 1. 만약 남은 코어를 다 연결해도 연결 수가 모자라면
        return

    if depth == M:                              # 종료 조건

        if max_cores < success:                 # (1) 성공 수가 더 높다면
            max_cores = success
            min_total = total                   # 최소 연결값을 바로 갱신
            return

        elif success == max_cores:              # (2) 성공 수가 같다면
            min_total = min(total, min_total)   # 최소값 비교 후 갱신
            return

        else: return

    core = cores[depth]                         # 3. 연결할 코어 파악

    for dr, dc in d:                            # 4방향 검사

        if is_connect(core, dr, dc):            # (1) 연결 가능

            gain = connecting_value(core, dr, dc)           # 선 연결한 후 비용(gain) 추가
            dfs_core(depth + 1, success + 1, total + gain)  # 다음 탐색
            disconnecting(core, dr, dc)                     # 백트래킹

        else: dfs_core(depth + 1, success, total)     # (2) 연결 불가능 시


for tc in range(1, T+1):

    N = int(input()) # 격자 크기 N
    arr = [list(map(int, input().split())) for _ in range(N)]
    visited_grid = [[False]*N for _ in range(N)]
    min_total = float('inf')

    max_cores = 0           # 최대 연결 코어 수 초기값
    cores = find_cores()    # 1. 전선 연결 필요 코어 확인 및 격자 최신화
    M = len(cores)

    dfs_core(0, 0, 0)

    print(f"#{tc} {max_cores} {min_total}")


