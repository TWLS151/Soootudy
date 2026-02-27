'''
문제 접근

1. 방문처리가 필요한가? YES - 중복 방문은 막아야된다.

2. 범위, 벽 체크에 유의

3. (TIL) 계속해서 헷갈리는 지점

"반환값의 역할을 명확히 정의하지 않은 채 코드를 짜고 있다"

내가 반환하고자 하는 값이 정확히 무엇인가?
- 도달 여부 판단?
- 경로 개수 계산? (이번 문제에 해당)
-> 그런데 계속해서 도달했는가?에 집착, 두 가지를 한꺼번에 하려고 함.

이번 문제에서의 반환값은
"현재 위치에서 도착지까지 갈 수 있는 경로의 개수"

-> 이 관점으로 볼 경우, 왜 도착 시에 return이 1이 되어야 하는지를 이해할 수 있다.
'''

import sys
sys.stdin = open('input.txt','r')

# 1. 환경설정
d = [(-1, 0), (0, 1), (1, 0), (0, -1)]

T = int(input())

def in_range(x, y):
    return 0 <= x < y

def dfs_recursive(r, c):

    if arr[r][c] == 3:  # 도착지에 도착했다면 돌아가기
        return 0

    visited[r][c] = True    # 방문처리
    distance = float('inf')

    for dr, dc in d:    # 다음 가능한 선택지에 대해 탐색
        nr = r + dr
        nc = c + dc

        if in_range(nr, N) and in_range(nc, N):             # 범위 내에 있고
            if arr[nr][nc] != 1 and not visited[nr][nc]:    # 벽이거나 방문한 곳이 아니면

                distance = dfs_recursive(nr, nc)

                if distance != float('inf'):    # 도착지에 도달한 경우가 존재한다면 -> distance는 inf가 아닌 값이 됨
                    distance += 1               # 아니면 -> 아무 작업도 일어나지 않은 초기 distance가 그대로 넘어오기 때문에 갱신이 일어나지 않음

                visited[nr][nc] = False         # 방문처리 취소

            if distance != float('inf'):        # <핵심> 다음 경로로 가기 이전에 도착지점을 찾은 경우 -> 탐색을 조기에 종료해야 함
                return distance                 # 이후 도착지가 없는 경로로 가 최종값이 0이 되는 것을 방지하기 위함

    return distance

for tc in range(1, T+1):

    N = int(input())
    arr = [list(map(int, list(input()))) for _ in range(N)]
    visited = [[False]*N for _ in range(N)]

    for i in range(N):
        for j in range(N):
            if arr[i][j] == 2: # 출발지를 만나면 탐색 시작

                result = dfs_recursive(i, j) # 탐색 시작

                if result != float('inf'):
                    print(f"#{tc} {result-1}") # 출발지점에서 더해지는 값은 제외
                else:
                    print(f"#{tc} 0")