'''
# 재해석
- N개의 일을 N명의 직원에게 분배

# 알고리즘
-> DFS + Backtracking

- idx(depth) : 직원의 수
- task : 선택되지 않은 일 (visited) 중 하나를 선택하고 확률 곱
-> 입력 형식에 유의 (확률값)
--> prob *
'''

import sys
sys.stdin = open('input.txt','r')

T = int(input())

def dfs_task(idx, prob):

    global max_prob

    if prob <= max_prob:                         # 1. 가지치기 : 최대확률(1.0)을 곱해도 낮다면 pass
        return

    if idx == N:
        max_prob = max(prob, max_prob)          # 2. 종료 : 최대 depth 에 도착
        return

    for c in range(N):                          # 3. idx번째 직원에 대해

        if visited[employee[idx][c][0]]:                          # 이미 j 일을 누군가 받았다면 pass
            continue

        visited[employee[idx][c][0]] = True                       # 직원에게 일 분배
        dfs_task(idx + 1, 0.01*(prob * employee[idx][c][1]))   # 성공확률 계산 이후 다음
        visited[employee[idx][c][0]] = False                      # 4. 백트래킹

for tc in range(1, T+1):

    N = int(input())                            # depth (직원의 수)
    employee = [list(tuple(prob for prob in enumerate(list(map(int, input().split())), 1))) for _ in range(N)]
    visited = [False]*(N + 1)   # 직원 인덱스에 맞게 +1
    max_prob = 0

    for row in employee:
        row.sort(key=lambda x:x[1], reverse=True)

    for row in employee:
        print(row)

    dfs_task(0, 100)

    print(f"#{tc} {max_prob:.6f}")  # f-string :.xf - 소수점 x째 자리까지 표기