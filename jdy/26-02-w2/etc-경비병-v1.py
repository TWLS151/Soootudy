# 델타 배열(상하좌우)
dr = [-1, 1, 0, 0]
dc = [0, 0, -1, 1]

T = int(input())
for _ in range(1, T+1):
    N = int(input())  # 배열의 크기 및 경비병 시야

    # 배열 생성(0: 빈 공간, 1: 기둥, 2: 경비병)
    arr = []
    for r in range(N):
        row = list(map(int, input().split()))
        arr.append(row)

    # 경비병 위치 찾기
    for i in range(N):
        for j in range(N):
            if arr[i][j] == 2:
                r, c = i , j  # 경비병이 있는 곳을 인덱스로 저장
                break

    # 4방향 델타 탐색
    for k in range(4):
        pillar = False
        for l in range(1, N+1):  # 경비병 시야
            rr = r + dr[k] * l
            cc = c + dc[k] * l
            # 인덱스 범위 내에 있으면
            if 0 <= rr < N and 0 <= cc < N:
                # 기둥을 만나면 break 걸기
                if arr[rr][cc] == 1:
                    pillar = True
                    break
                # 기둥이 없었다면 시야가 닿는 곳이므로 X로 표시
                if pillar == False:
                    arr[rr][cc] = 'X'

    # 경비병의 시야가 닿지 않는 곳 카운트
    cnt = 0
    for i in range(N):
        cnt += arr[i].count(0)

    print(f"#{_} {cnt}")