'''
# 구현 설계

목표 지점까지 도달하는 모든 경우의 수 중 최선을 찾는다.
-> 1. 순열, 조합 문제
-> 2. (선택, 비선택) DFS로 접근할 수 있을듯

자료구조 : 재귀 함수((다음 좌표 리스트), 몬스터 방문 리스트, 토탈 이동거리), 방문 리스트 (몬스터 수 + 1),
- 이동 좌표 리스트 - 행열을 순회하며 0이 아닐 경우 (좌표, 정보)를 append
- 어디로 이동하는 가에 따라 좌표 리스트를 갱신
- 재귀 함수 안에서 이동거리를 합산해준 후 다음 목적지를 설정

- 좌표 간의 차이로 이동거리를 계산해 합산
'''

import sys
sys.stdin = open('input.txt', 'r')

T = int(input())

# <1> 필요 함수 구축

## 1. 목적지(몬스터, 손님) 좌표를 반환, 방문 딕셔너리를 만드는 함수
def find_destination(list, N):

    global depth_limit

    for r in range(N):      # 2차원 배열을 순회하면서
        for c in range(N):

            if arr[r][c] != 0:                  # 정보가 있는 땅에 왔다면
                list.append((arr[r][c], r, c))  # (1) 목적지 좌표를 추가
                visited[arr[r][c]] = False      # (2) 방문 딕셔너리에 (몬스터/주민 - False) 쌍을 추가

                if depth_limit < arr[r][c]:     # 잡아야 할 몬스터(+)의 최대 번호를 구하는 이유?
                    depth_limit = arr[r][c]     # (몬스터 최대 번호)*2 = 이번 탐색의 깊이가 되기 때문 (종료 조건에 활용하기 위함)

    depth_limit *= 2  # 탐색 깊이 계산

    return list

## 2. 좌표 간 이동거리를 계산하는 함수
def distance(dist1, dist2):
    return (abs(dist1[0] - dist2[0]) + abs(dist1[1] - dist2[1]))

## 3. dfs 탐색 함수
def dfs(now, depth, total):

    global min_total

    if total > min_total:                   # 1. 가지치기 - (1) 만약 현재 이동거리가 최소보다 길다면 skip
        return

    if depth == depth_limit:                # 2. 종료 조건 - 모든 탐색을 마쳤을 때
        min_total = min(total, min_total)
        return

    for i in range(len(destination)):       # # 3. 탐색 및 백트래킹 - 다음 목적지들에 대해

        next_info, r, c = destination[i]    # (1) 목적지 정보를 확인
        next_dest = (r, c)

        if visited[next_info]:              # (2) 이미 방문했던 곳이라면 넘어가기
            continue

        if next_info < 0 and not visited[abs(next_info)]:      # (3) <<가지치기>> 주민을 방문했는데 이어진 몬스터를 잡지 않았다면 -> skip
            continue                                           # 부모 함수에서 아예 이 경우의 수를 배제하는 식의 가지치기?

        visited[next_info] = True                               # (4) 방문 처리

        dfs(next_dest, depth + 1, total + distance(next_dest, now))   # (5) 다음 탐색 진행

        visited[next_info] = False                              # (6) 백트래킹


for tc in range(1, T+1):

    N = int(input())                                            # 배열 NxN
    arr = [list(map(int, input().split())) for _ in range(N)]   # 지도 입력
    visited = dict()                                            # 방문 딕셔너리 (key : 주민 or 몬스터)
    min_total = float('inf')                                    # 전역 최소거리의 초기값
    depth_limit = 0                                             # 전역 탐색 깊이의 초기값

    destination = find_destination([], N)                       # find_destination 함수
    # print(destination, visited, depth_limit)                  # (1) 목적지의 좌표 리스트 구성
                                                                # (2) 방문 딕셔너리 추가
                                                                # (3) 탐색 최대 깊이 계산

    dfs((0, 0), 0, 0)                                           # (0,0)에서 깊이(탐색 수) 0, 이동거리 0에서 시작
                                                                # -> 함수 종료 후 : 최소 거리가 min_total에 저장됨
    print(f"#{tc} {min_total}")