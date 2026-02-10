T = int(input())

for _ in range(1,T+1):
    N, M = map(int, input().split())

    arr = []
    for r in range(N):
        row = list(input())
        arr.append(row)

    min_cnt = N*M  # 새로 칠해야 하는 칸의 최솟값 저장할 변수

    # 깃발의 각 행을 색칠하는 모든 경우의 수 탐색
    for i in range(1,N-1):
        for j in range(1,N-i):
            case = ['W'] * i + ['B'] * j + ['R'] * (N-i-j)
            cnt = 0
            for row in range(N):
                for col in range(M):
                    if arr[row][col] != case[row]:
                        cnt += 1
            if min_cnt > cnt:
                min_cnt = cnt
    print(f"#{_} {min_cnt}")