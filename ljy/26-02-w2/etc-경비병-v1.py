# import sys

# sys.stdin = open('security_guard.txt')

T = int(input())

for tc in range(1, T + 1):
    N = int(input())
    first_floor = [list(map(int, input().split())) for _ in range(N)]

    # 상하좌우 방향
    dr = [-1, 1, 0, 0]
    dc = [0, 0, -1, 1]

    # r이랑 c가 고정 -> 이 부분 막혀서 AI 힌트 얻었어요

    # 가드의 위치 찾아 저장할 계획
    guard = []

    # 가드 위치 찾아 저장하는 for문
    for r in range(N):
        for c in range(N):
            if first_floor[r][c] == 2:
                guard.append((r, c))

    # 가드 위치에서 상하좌우 k만큼 이동 위치 탐색
    for gr, gc in guard:
        for i in range(4):
            for k in range(1, N):
                nr = gr + dr[i] * k
                nc = gc + dc[i] * k

                # 범위를 벗어나지 않는 선에서
                if 0 <= nr < N and 0 <= nc < N:
                    # 벽(1)을 만나면 중단
                    if first_floor[nr][nc] == 1:
                        break
                    # 아니라면 3으로 저장해두기 (경비병에게 잡힐 수 있는 공간들 표시)
                    first_floor[nr][nc] = 3

    # print(first_floor)
    # - 확인용, 재밌음

    # first_floor에서 0 세기 -> 2차원 리스트라서 first_floor.count(0)가 안 됨ㅠㅠ
    # 그래서 아래와 같이 for문으로 한 줄 씩 누적합
    result = 0
    for row in first_floor:
        result += row.count(0)  # 각 줄에서 0이 몇 개인지 세어서 더함

    print(f'#{tc} {result}')